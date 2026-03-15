-- ============================================================
-- TIKKIT — Event Favourites (Saved Events)
-- Migration: 20260315_event_favourites
-- ============================================================

CREATE TABLE IF NOT EXISTS event_favourites (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id   UUID NOT NULL REFERENCES events(id)     ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, event_id)
);

ALTER TABLE event_favourites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own event favourites"
  ON event_favourites FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_event_favourites_user_id  ON event_favourites(user_id);
CREATE INDEX IF NOT EXISTS idx_event_favourites_event_id ON event_favourites(event_id);
