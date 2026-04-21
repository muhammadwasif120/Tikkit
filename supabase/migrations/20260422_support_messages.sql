-- Support messages: bidirectional chat between users and master admin
CREATE TABLE IF NOT EXISTS support_messages (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name  TEXT        NOT NULL,
  user_type  TEXT        NOT NULL CHECK (user_type IN ('organizer', 'attendee')),
  message    TEXT        NOT NULL CHECK (char_length(message) > 0),
  sender     TEXT        NOT NULL CHECK (sender IN ('user', 'admin')) DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

-- Users can read only their own messages
CREATE POLICY "Users see own support messages"
  ON support_messages FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only insert their own messages (sender must be 'user')
CREATE POLICY "Users insert own support messages"
  ON support_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id AND sender = 'user');

-- Index for fast per-user lookups
CREATE INDEX IF NOT EXISTS support_messages_user_id_idx ON support_messages(user_id, created_at DESC);
