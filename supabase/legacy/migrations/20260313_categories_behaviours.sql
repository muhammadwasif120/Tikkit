-- ============================================================
-- TIKKIT — Event Categories & Behaviour Engine
-- Migration: 20260313_categories_behaviours
-- ============================================================

-- ── Event Categories ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS event_categories (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         TEXT NOT NULL UNIQUE,
  slug         TEXT NOT NULL UNIQUE,
  icon         TEXT NOT NULL DEFAULT '🎉',
  color        TEXT NOT NULL DEFAULT '#818CF8',
  description  TEXT,
  sort_order   INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- RLS (public read, admins write)
ALTER TABLE event_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read categories" ON event_categories FOR SELECT USING (TRUE);

-- Seed categories
INSERT INTO event_categories (name, slug, icon, color, sort_order) VALUES
  ('Music',            'music',            '🎵', '#8B5CF6',  1),
  ('Tech',             'tech',             '💻', '#06B6D4',  2),
  ('Art & Culture',    'art-culture',      '🎨', '#F59E0B',  3),
  ('Sports',           'sports',           '⚽', '#10B981',  4),
  ('Food & Drink',     'food-drink',       '🍔', '#EF4444',  5),
  ('Business',         'business',         '💼', '#1E5EFF',  6),
  ('Fashion',          'fashion',          '👗', '#EC4899',  7),
  ('Networking',       'networking',       '🤝', '#6366F1',  8),
  ('Education',        'education',        '📚', '#14B8A6',  9),
  ('Gaming',           'gaming',           '🎮', '#7C3AED', 10),
  ('Health & Wellness','health-wellness',  '💪', '#84CC16', 11),
  ('Comedy',           'comedy',           '😂', '#F97316', 12),
  ('Social',           'social',           '🥳', '#FB7185', 13),
  ('Charity',          'charity',          '❤️', '#F43F5E', 14)
ON CONFLICT (slug) DO NOTHING;

-- ── Add category_id to events ─────────────────────────────────
ALTER TABLE events ADD COLUMN IF NOT EXISTS
  category_id UUID REFERENCES event_categories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_events_category_id ON events(category_id);

-- ── Organizer Favourites ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS organizer_favourites (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organizer_id UUID NOT NULL REFERENCES profiles(id)   ON DELETE CASCADE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, organizer_id)
);

ALTER TABLE organizer_favourites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own organizer favourites"
  ON organizer_favourites FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_organizer_favourites_user_id
  ON organizer_favourites(user_id);
CREATE INDEX IF NOT EXISTS idx_organizer_favourites_organizer_id
  ON organizer_favourites(organizer_id);

-- ── User Behaviour Log ────────────────────────────────────────
-- Tracks every meaningful signal: event views, registrations,
-- organizer visits, favouriting. Used to compute interest scores.
CREATE TABLE IF NOT EXISTS user_behaviour_log (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES auth.users(id)      ON DELETE CASCADE,
  event_id     UUID           REFERENCES events(id)          ON DELETE SET NULL,
  organizer_id UUID           REFERENCES profiles(id)        ON DELETE SET NULL,
  category_id  UUID           REFERENCES event_categories(id) ON DELETE SET NULL,
  action       TEXT NOT NULL CHECK (
    action IN ('view_event','register','organizer_visit','favourite_organizer','unfavourite_organizer')
  ),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_behaviour_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own behaviour"
  ON user_behaviour_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own behaviour"
  ON user_behaviour_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_ubl_user_id    ON user_behaviour_log(user_id);
CREATE INDEX IF NOT EXISTS idx_ubl_category   ON user_behaviour_log(category_id);
CREATE INDEX IF NOT EXISTS idx_ubl_created_at ON user_behaviour_log(created_at DESC);

-- ── User Category Interest Scores ─────────────────────────────
-- Aggregated, incrementally updated score per (user, category).
-- Higher score = stronger preference for that category.
CREATE TABLE IF NOT EXISTS user_category_scores (
  user_id     UUID    NOT NULL REFERENCES auth.users(id)      ON DELETE CASCADE,
  category_id UUID    NOT NULL REFERENCES event_categories(id) ON DELETE CASCADE,
  score       NUMERIC(10,2) NOT NULL DEFAULT 0,
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, category_id)
);

ALTER TABLE user_category_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own category scores"
  ON user_category_scores FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── RPC: get_top_organizers ────────────────────────────────────
-- Returns organizers who have upcoming published events,
-- ranked by event count. Optionally includes is_favourite flag
-- for the requesting user.
CREATE OR REPLACE FUNCTION get_top_organizers(
  p_limit   INT  DEFAULT 10,
  p_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id                   UUID,
  full_name            TEXT,
  company_name         TEXT,
  username             TEXT,
  logo_url             TEXT,
  cover_image_url      TEXT,
  upcoming_event_count BIGINT,
  is_favourite         BOOLEAN
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    p.full_name,
    p.company_name,
    p.username,
    p.logo_url,
    p.cover_image_url,
    COUNT(e.id)                                          AS upcoming_event_count,
    COALESCE((
      SELECT TRUE FROM organizer_favourites f
      WHERE f.user_id = p_user_id AND f.organizer_id = p.id
      LIMIT 1
    ), FALSE)                                            AS is_favourite
  FROM profiles p
  INNER JOIN events e
    ON  e.organizer_id = p.id
    AND e.status       = 'published'
    AND e.is_private   = FALSE
    AND e.date_start  >= NOW()
  WHERE p.role = 'organizer'
  GROUP BY p.id, p.full_name, p.company_name,
           p.username, p.logo_url, p.cover_image_url
  ORDER BY upcoming_event_count DESC,
           COALESCE(p.company_name, p.full_name) ASC
  LIMIT p_limit;
$$;

GRANT EXECUTE ON FUNCTION get_top_organizers TO authenticated, anon;

-- ── RPC: upsert_category_score ─────────────────────────────────
-- Atomically increments (or decrements) a user's category score.
-- Called by the behaviour-logging server action.
CREATE OR REPLACE FUNCTION upsert_category_score(
  p_user_id     UUID,
  p_category_id UUID,
  p_delta       NUMERIC DEFAULT 1
)
RETURNS VOID
LANGUAGE sql SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO user_category_scores (user_id, category_id, score, updated_at)
  VALUES (p_user_id, p_category_id, GREATEST(0, p_delta), NOW())
  ON CONFLICT (user_id, category_id) DO UPDATE
    SET score      = GREATEST(0, user_category_scores.score + p_delta),
        updated_at = NOW();
$$;

GRANT EXECUTE ON FUNCTION upsert_category_score TO authenticated;
