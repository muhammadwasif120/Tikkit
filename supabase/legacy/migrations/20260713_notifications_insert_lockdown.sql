-- ════════════════════════════════════════════════════════════════
-- SEC-04: Lock down the notifications INSERT policy
-- ════════════════════════════════════════════════════════════════
-- The previous policy allowed ANY authenticated user to insert a notification
-- row with an arbitrary user_id, title, and body:
--
--   WITH CHECK (auth.role() = 'authenticated')
--
-- Since notifications render in-app and trigger push, this was a spam/phishing
-- surface: an attacker could send "Payment failed — re-enter your details at …"
-- to any other user.
--
-- New rule: an authenticated client may only create notifications addressed to
-- ITSELF (user_id = auth.uid()). All cross-user notifications (organizer→guest,
-- guest→organizer, etc.) are created by trusted server code via the service-role
-- client, which bypasses RLS and decides the recipient — never the client.

DROP POLICY IF EXISTS "notifications_insert" ON notifications;

CREATE POLICY "notifications_insert"
  ON notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);
