-- Fix "permission denied for table users" on mobile profile fetch.
-- The "profiles: organizer read registered guests" policy joined auth.users
-- directly, which the authenticated role cannot access. Replace it with a
-- join on profiles.email (which is stored on the profiles row itself).

DROP POLICY IF EXISTS "profiles: organizer read registered guests" ON profiles;

CREATE POLICY "profiles: organizer read registered guests"
  ON profiles FOR SELECT
  USING (
    get_my_role() = 'organizer'
    AND EXISTS (
      SELECT 1
      FROM public_registrations pr
      JOIN events e ON e.id = pr.event_id
      WHERE e.organizer_id = auth.uid()
        AND pr.email = profiles.email
    )
  );
