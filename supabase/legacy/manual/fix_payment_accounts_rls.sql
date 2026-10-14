-- Run these in Supabase SQL Editor (Dashboard → SQL Editor)

-- 1. Allow authenticated guests (and all authenticated users) to read
--    payment accounts that are linked to a published event.
--    This is the junction table.
CREATE POLICY "Guests can view payment accounts for published events"
ON event_payment_accounts
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM events
    WHERE events.id = event_payment_accounts.event_id
      AND events.status = 'published'
  )
);

-- 2. Allow authenticated users to read the actual payment_accounts rows
--    that are linked to at least one published event.
CREATE POLICY "Guests can read payment accounts linked to published events"
ON payment_accounts
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM event_payment_accounts epa
    JOIN events e ON e.id = epa.event_id
    WHERE epa.payment_account_id = payment_accounts.id
      AND e.status = 'published'
  )
);
