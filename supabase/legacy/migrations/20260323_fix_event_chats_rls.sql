-- Fix: expand event_chats SELECT policy so all registered guests
-- (any valid status, not just 'approved') receive realtime updates.

DROP POLICY IF EXISTS "event_chats_user_read" ON event_chats;

CREATE POLICY "event_chats_user_read"
  ON event_chats FOR SELECT
  USING (
    auth.uid() = user_id
    OR event_id IN (SELECT id FROM events WHERE organizer_id = auth.uid())
    OR event_id IN (
      SELECT event_id FROM public_registrations
      WHERE email = (auth.jwt() ->> 'email')
        AND status IN (
          'confirmed', 'checked_in', 'attended', 'registered', 'approved',
          'eoi_submitted', 'eoi_approved', 'payment_pending', 'pending'
        )
    )
  );
