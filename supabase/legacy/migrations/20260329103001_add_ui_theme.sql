-- Add UI theme preference to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS ui_theme TEXT NOT NULL DEFAULT 'noir'
    CHECK (ui_theme IN ('noir', 'corporate', 'pulse'));
