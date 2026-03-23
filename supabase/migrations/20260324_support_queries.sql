-- Support queries / disputes table for master admin
CREATE TABLE IF NOT EXISTS support_queries (
  id          TEXT PRIMARY KEY DEFAULT 'Q-' || LPAD(nextval('support_queries_seq')::TEXT, 3, '0'),
  from_name   TEXT NOT NULL,
  from_type   TEXT NOT NULL CHECK (from_type IN ('organizer', 'attendee')),
  from_id     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  subject     TEXT NOT NULL,
  body        TEXT,
  status      TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
  priority    TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  resolved_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE SEQUENCE IF NOT EXISTS support_queries_seq START 1;

ALTER TABLE support_queries ENABLE ROW LEVEL SECURITY;

-- Only service role (admin server actions) can read/write
CREATE POLICY "service only" ON support_queries
  USING (false)
  WITH CHECK (false);

CREATE INDEX IF NOT EXISTS idx_support_queries_status ON support_queries(status);
CREATE INDEX IF NOT EXISTS idx_support_queries_created_at ON support_queries(created_at DESC);
