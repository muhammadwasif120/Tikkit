-- ============================================================
-- Security Audit Fixes — 2026-05-18
-- Covers: C3, H6, M3, L2
-- ============================================================

-- ─── C3: event_chats INSERT policy (role forgery) ────────────────────────────
-- The original policy only checked auth.uid() = user_id, allowing any
-- authenticated user to insert messages with any role value (e.g. 'organizer').
-- Replace with two narrow policies: one for guests (only for events they're
-- registered for) and one for organizers/staff (only for their own events).

DROP POLICY IF EXISTS "event_chats_user_insert"      ON event_chats;
DROP POLICY IF EXISTS "event_chats_guest_insert"     ON event_chats;
DROP POLICY IF EXISTS "event_chats_organizer_insert" ON event_chats;

CREATE POLICY "event_chats_guest_insert"
  ON event_chats FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND role = 'guest'
    AND event_id IN (
      SELECT event_id FROM public_registrations
      WHERE email = (auth.jwt() ->> 'email')
        AND status IN ('approved', 'checked_in', 'attended', 'registered', 'payment_pending', 'pending')
    )
  );

CREATE POLICY "event_chats_organizer_insert"
  ON event_chats FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND role IN ('organizer', 'staff')
    AND event_id IN (SELECT id FROM events WHERE organizer_id = auth.uid())
  );

-- ─── H6: Add 'rejected' to payment_status CHECK constraint ───────────────────
-- rejectPaymentSubmission() sets payment_status = 'rejected' but the existing
-- CHECK constraint did not include this value, causing a runtime constraint
-- violation on every payment rejection.

ALTER TABLE public_registrations
  DROP CONSTRAINT IF EXISTS public_registrations_payment_status_check;

ALTER TABLE public_registrations
  ADD CONSTRAINT public_registrations_payment_status_check
  CHECK (payment_status IN ('not_required', 'pending', 'submitted', 'confirmed', 'rejected'));

-- ─── M3: Enable RLS on offline_checkin_queue ─────────────────────────────────
-- The table was created without ENABLE ROW LEVEL SECURITY, leaving all rows
-- readable and writable by any authenticated user via the anon/service keys.

ALTER TABLE offline_checkin_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "offline_checkin_organizer" ON offline_checkin_queue;

CREATE POLICY "offline_checkin_organizer"
  ON offline_checkin_queue FOR ALL
  USING  (event_id IN (SELECT id FROM events WHERE organizer_id = auth.uid()))
  WITH CHECK (event_id IN (SELECT id FROM events WHERE organizer_id = auth.uid()));

-- ─── L2: notifications table — CREATE IF NOT EXISTS + RLS ────────────────────
-- The table is referenced throughout the codebase but was created manually
-- in the DB with no tracked migration and no RLS policies. This migration
-- ensures the table exists and is protected.

CREATE TABLE IF NOT EXISTS notifications (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type       TEXT        NOT NULL,
  title      TEXT        NOT NULL,
  body       TEXT,
  metadata   JSONB       DEFAULT '{}',
  read       BOOLEAN     NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_insert"     ON notifications;
DROP POLICY IF EXISTS "notifications_own_read"   ON notifications;
DROP POLICY IF EXISTS "notifications_own_update" ON notifications;

-- Any authenticated user may insert (organizers notify guests and vice-versa;
-- exposure risk is in SELECT, not INSERT).
CREATE POLICY "notifications_insert"
  ON notifications FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Users may only read their own notifications.
CREATE POLICY "notifications_own_read"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Users may mark their own notifications as read.
CREATE POLICY "notifications_own_update"
  ON notifications FOR UPDATE
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
