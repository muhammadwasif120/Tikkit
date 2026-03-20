-- Platform waitlist: captures early-access interest for the Tikkit platform itself
-- (separate from the per-event waitlist table)

CREATE TABLE IF NOT EXISTS platform_waitlist (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name   TEXT        NOT NULL,
  email       TEXT        NOT NULL,
  phone       TEXT,
  role        TEXT        NOT NULL DEFAULT 'organizer'
                          CHECK (role IN ('organizer', 'guest', 'both')),
  source      TEXT        DEFAULT 'coming_soon',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS platform_waitlist_email_idx ON platform_waitlist(email);

ALTER TABLE platform_waitlist ENABLE ROW LEVEL SECURITY;

-- Anyone can join the waitlist (unauthenticated INSERT allowed)
CREATE POLICY "platform_waitlist_insert"
  ON platform_waitlist FOR INSERT
  WITH CHECK (true);

-- Only service role can read (admin use only)
CREATE POLICY "platform_waitlist_admin_select"
  ON platform_waitlist FOR SELECT
  USING (false);
