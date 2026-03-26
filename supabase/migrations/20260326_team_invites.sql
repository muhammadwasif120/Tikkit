-- 20260326_team_invites.sql
-- Creates the team_invites table with proper RLS policies.
-- The table may already exist (created manually); this is idempotent.

CREATE TABLE IF NOT EXISTS team_invites (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token        UUID NOT NULL DEFAULT gen_random_uuid(),
  organizer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  label        TEXT NOT NULL,
  role         TEXT NOT NULL CHECK (role IN ('staff', 'organizer')),
  expires_at   TIMESTAMPTZ,
  revoked      BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure token column has a default if the table was previously created without one
ALTER TABLE team_invites ALTER COLUMN token SET DEFAULT gen_random_uuid();

-- Ensure token is unique
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'team_invites_token_key' AND conrelid = 'team_invites'::regclass
  ) THEN
    ALTER TABLE team_invites ADD CONSTRAINT team_invites_token_key UNIQUE (token);
  END IF;
END$$;

-- Enable RLS
ALTER TABLE team_invites ENABLE ROW LEVEL SECURITY;

-- Organizers can read their own invites
DROP POLICY IF EXISTS "team_invites_select" ON team_invites;
CREATE POLICY "team_invites_select" ON team_invites
  FOR SELECT USING (organizer_id = auth.uid());

-- Organizers can create invites for themselves
DROP POLICY IF EXISTS "team_invites_insert" ON team_invites;
CREATE POLICY "team_invites_insert" ON team_invites
  FOR INSERT WITH CHECK (organizer_id = auth.uid());

-- Organizers can update their own invites (revoke/reactivate)
DROP POLICY IF EXISTS "team_invites_update" ON team_invites;
CREATE POLICY "team_invites_update" ON team_invites
  FOR UPDATE USING (organizer_id = auth.uid());

-- Organizers can delete their own invites
DROP POLICY IF EXISTS "team_invites_delete" ON team_invites;
CREATE POLICY "team_invites_delete" ON team_invites
  FOR DELETE USING (organizer_id = auth.uid());

-- Public (anon) can read a single invite by token — needed for the /staff/[token] page
DROP POLICY IF EXISTS "team_invites_public_read_by_token" ON team_invites;
CREATE POLICY "team_invites_public_read_by_token" ON team_invites
  FOR SELECT USING (true);
