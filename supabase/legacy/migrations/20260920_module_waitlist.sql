-- Waitlist for gated modules (Vendor X, Venues & Experiences, Artist Management)
-- that are built but not open yet — separate from platform_waitlist, which is
-- the whole-app pre-launch waitlist behind /coming-soon. Unlike platform_waitlist,
-- the same email may join more than one module's list.

CREATE TABLE IF NOT EXISTS module_waitlist (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  module      TEXT        NOT NULL CHECK (module IN ('vendor', 'venue', 'artist')),
  full_name   TEXT        NOT NULL,
  email       TEXT        NOT NULL,
  phone       TEXT,
  source      TEXT        DEFAULT 'module_home',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS module_waitlist_email_module_idx ON module_waitlist(email, module);

ALTER TABLE module_waitlist ENABLE ROW LEVEL SECURITY;

-- Anyone can join the waitlist (unauthenticated INSERT allowed)
CREATE POLICY "module_waitlist_insert"
  ON module_waitlist FOR INSERT
  WITH CHECK (true);

-- Only service role can read (admin use only)
CREATE POLICY "module_waitlist_admin_select"
  ON module_waitlist FOR SELECT
  USING (false);
