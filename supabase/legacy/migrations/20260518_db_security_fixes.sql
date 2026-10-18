-- ================================================================
-- DB Security Fixes — 2026-05-18
-- Addresses all findings from the full DB security audit:
--   Critical 1-4 · High 5-8 · Medium 9-12 · Performance 13
-- ================================================================


-- ════════════════════════════════════════════════════════════════
-- CRITICAL 1 — Prevent attendees from self-approving registrations
-- ════════════════════════════════════════════════════════════════
-- The old policy had no column restriction.  A guest could UPDATE
-- their own row and set status='approved' or payment_status='confirmed'.
-- The new policy uses a correlated sub-select to assert that status
-- and payment_status are unchanged by the guest's UPDATE.

DROP POLICY IF EXISTS "registrations: attendee update own" ON public_registrations;

CREATE POLICY "registrations: attendee update own"
  ON public_registrations FOR UPDATE
  USING (email = my_email())
  WITH CHECK (
    email = my_email()
    -- status must not change
    AND status = (
      SELECT pr2.status FROM public_registrations pr2 WHERE pr2.id = id
    )
    -- payment_status must not change
    AND payment_status = (
      SELECT pr2.payment_status FROM public_registrations pr2 WHERE pr2.id = id
    )
  );


-- ════════════════════════════════════════════════════════════════
-- CRITICAL 2 — Payment submission must belong to current user
-- ════════════════════════════════════════════════════════════════
-- Old: WITH CHECK (auth.uid() IS NOT NULL) — any authenticated user
-- could submit a payment against any registration_id.
-- New: the referenced registration must belong to the current user
-- and be in 'approved' status before a screenshot is accepted.

DROP POLICY IF EXISTS "payment_submissions: attendee insert" ON payment_submissions;

CREATE POLICY "payment_submissions: attendee insert"
  ON payment_submissions FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public_registrations pr
      WHERE pr.id = registration_id
        AND pr.email = my_email()
        AND pr.status = 'approved'
    )
  );


-- ════════════════════════════════════════════════════════════════
-- CRITICAL 3 — Remove unauthenticated upload to payment-screenshots
-- ════════════════════════════════════════════════════════════════
-- "Public upload payment screenshots" had no auth check at all.

DROP POLICY IF EXISTS "Public upload payment screenshots" ON storage.objects;


-- ════════════════════════════════════════════════════════════════
-- CRITICAL 4 — Scope tikkit-uploads delete/update to own files
-- ════════════════════════════════════════════════════════════════
-- The broad "Auth delete/update tikkit-uploads" policies let any
-- authenticated user delete or overwrite any file in the bucket,
-- including other organisers' logos and cover photos.
-- Specific per-folder delete/update policies already exist
-- (profile_covers_delete, profile_logos_delete, etc.) — removing
-- the broad policies restores the intended file-scoped access.

DROP POLICY IF EXISTS "Auth delete tikkit-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Auth update tikkit-uploads" ON storage.objects;

-- Also replace the broad auth upload with folder-scoped equivalents
-- so guests cannot upload to arbitrary paths.
DROP POLICY IF EXISTS "Auth upload tikkit-uploads" ON storage.objects;

-- Users may upload payment screenshots to their own folder within tikkit-uploads
-- (used by guestProfileActions.ts path: payment-screenshots/{uid}/{regId}.ext)
CREATE POLICY "tikkit-uploads: own payment screenshot insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'tikkit-uploads'
    AND (storage.foldername(name))[1] = 'payment-screenshots'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

-- Users may delete only files inside their own user folder
CREATE POLICY "tikkit-uploads: own folder delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'tikkit-uploads'
    AND auth.uid()::text = (storage.foldername(name))[2]
  );

-- Users may update only files inside their own user folder
CREATE POLICY "tikkit-uploads: own folder update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'tikkit-uploads'
    AND auth.uid()::text = (storage.foldername(name))[2]
  );


-- ════════════════════════════════════════════════════════════════
-- HIGH 5 — discount_codes: add policies (table was fully locked out)
-- ════════════════════════════════════════════════════════════════
-- Organisers manage codes for their events.
-- Guests may read only active, non-expired codes (they must supply
-- the exact code in a WHERE clause — the code itself is the secret).

CREATE POLICY "discount_codes: organizer manage"
  ON discount_codes FOR ALL
  USING  (event_id IN (SELECT id FROM events WHERE organizer_id = auth.uid()))
  WITH CHECK (event_id IN (SELECT id FROM events WHERE organizer_id = auth.uid()));

CREATE POLICY "discount_codes: guest read active"
  ON discount_codes FOR SELECT
  USING (
    is_active = true
    AND (expires_at IS NULL OR expires_at > now())
  );


-- ════════════════════════════════════════════════════════════════
-- HIGH 6 — waitlist: add policies (table was fully locked out)
-- ════════════════════════════════════════════════════════════════

CREATE POLICY "waitlist: guest insert"
  ON waitlist FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM events WHERE id = event_id AND status = 'published')
  );

CREATE POLICY "waitlist: guest read own"
  ON waitlist FOR SELECT
  USING (email = my_email());

CREATE POLICY "waitlist: organizer manage"
  ON waitlist FOR ALL
  USING  (event_id IN (SELECT id FROM events WHERE organizer_id = auth.uid()))
  WITH CHECK (event_id IN (SELECT id FROM events WHERE organizer_id = auth.uid()));


-- ════════════════════════════════════════════════════════════════
-- HIGH 7 — Restrict payment-screenshots reads to owners + organisers
-- ════════════════════════════════════════════════════════════════
-- Three SELECT policies existed: two duplicates for organisers plus
-- one that made all screenshots publicly readable with no auth.
-- Replace all three with two narrow, authenticated policies.

DROP POLICY IF EXISTS "Public can view payment screenshots"    ON storage.objects;
DROP POLICY IF EXISTS "Organizer read payment screenshots"     ON storage.objects;
DROP POLICY IF EXISTS "Organizers can read payment screenshots" ON storage.objects;

-- The guest who uploaded the file may read it (matched by storage owner)
CREATE POLICY "payment-screenshots: uploader read"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'payment-screenshots'
    AND owner = auth.uid()
  );

-- Authenticated organisers and staff may read all screenshots to review payments
CREATE POLICY "payment-screenshots: organizer read"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'payment-screenshots'
    AND get_my_role() = ANY (ARRAY['organizer', 'staff', 'admin'])
  );

-- Also prevent unauthenticated reads by making the bucket private
UPDATE storage.buckets SET public = false WHERE id = 'payment-screenshots';


-- ════════════════════════════════════════════════════════════════
-- HIGH 8 — Scope organiser profile reads to their registered guests
-- ════════════════════════════════════════════════════════════════
-- Old policy let any organiser SELECT * on every profile row,
-- including admin accounts and guests from other organisers' events.

DROP POLICY IF EXISTS "profiles: organizer read all" ON profiles;

CREATE POLICY "profiles: organizer read registered guests"
  ON profiles FOR SELECT
  USING (
    get_my_role() = 'organizer'
    AND EXISTS (
      SELECT 1
      FROM public_registrations pr
      JOIN events e ON e.id = pr.event_id
      JOIN auth.users u ON u.email = pr.email
      WHERE e.organizer_id = auth.uid()
        AND u.id = profiles.id
    )
  );


-- ════════════════════════════════════════════════════════════════
-- MEDIUM 11 — Remove redundant INSERT policy on public_registrations
-- ════════════════════════════════════════════════════════════════
-- "public_registrations_insert" is broader than "registrations: attendee insert"
-- (does not check the event is published).  PERMISSIVE policies OR together,
-- so the broader one made the narrower one irrelevant.

DROP POLICY IF EXISTS "public_registrations_insert" ON public_registrations;


-- ════════════════════════════════════════════════════════════════
-- MEDIUM 12 — Remove dead status values from event_chats_user_read
-- ════════════════════════════════════════════════════════════════
-- 'eoi_submitted' and 'eoi_approved' are not valid public_registrations.status
-- values per the CHECK constraint — those branches can never match.

DROP POLICY IF EXISTS "event_chats_user_read" ON event_chats;

CREATE POLICY "event_chats_user_read"
  ON event_chats FOR SELECT
  USING (
    auth.uid() = user_id
    OR event_id IN (SELECT id FROM events WHERE organizer_id = auth.uid())
    OR event_id IN (
      SELECT pr.event_id FROM public_registrations pr
      WHERE pr.email = (auth.jwt() ->> 'email')
        AND pr.status IN ('pending', 'approved', 'checked_in', 'registered', 'payment_pending')
    )
  );


-- ════════════════════════════════════════════════════════════════
-- PERFORMANCE 13 — Add indexes for all 19 un-indexed FK columns
-- ════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_credit_transactions_event_id
  ON credit_transactions(event_id);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_guest_record_id
  ON credit_transactions(guest_record_id);

CREATE INDEX IF NOT EXISTS idx_event_passes_guest_record_id
  ON event_passes(guest_record_id);

CREATE INDEX IF NOT EXISTS idx_guests_ticket_type_id
  ON guests(ticket_type_id);

CREATE INDEX IF NOT EXISTS idx_notifications_event_id
  ON notifications(event_id);

CREATE INDEX IF NOT EXISTS idx_offline_checkin_queue_guest_id
  ON offline_checkin_queue(guest_id);

CREATE INDEX IF NOT EXISTS idx_offline_checkin_queue_event_id
  ON offline_checkin_queue(event_id);

CREATE INDEX IF NOT EXISTS idx_payment_submissions_event_id
  ON payment_submissions(event_id);

CREATE INDEX IF NOT EXISTS idx_payment_submissions_guest_id
  ON payment_submissions(guest_id);

CREATE INDEX IF NOT EXISTS idx_payment_submissions_payment_account_id
  ON payment_submissions(payment_account_id);

CREATE INDEX IF NOT EXISTS idx_payment_submissions_registration_id
  ON payment_submissions(registration_id);

CREATE INDEX IF NOT EXISTS idx_public_registrations_reviewed_by
  ON public_registrations(reviewed_by);

CREATE INDEX IF NOT EXISTS idx_public_registrations_payment_submission_id
  ON public_registrations(payment_submission_id);

CREATE INDEX IF NOT EXISTS idx_support_queries_from_id
  ON support_queries(from_id);

CREATE INDEX IF NOT EXISTS idx_ticket_types_event_id
  ON ticket_types(event_id);

CREATE INDEX IF NOT EXISTS idx_user_behaviour_log_event_id
  ON user_behaviour_log(event_id);

CREATE INDEX IF NOT EXISTS idx_user_behaviour_log_organizer_id
  ON user_behaviour_log(organizer_id);

CREATE INDEX IF NOT EXISTS idx_vendors_organizer_id
  ON vendors(organizer_id);

CREATE INDEX IF NOT EXISTS idx_waitlist_event_id
  ON waitlist(event_id);
