-- Collapse the 3-way theme system (noir/corporate/pulse) down to light/dark.
-- noir and corporate (both dark) collapse to 'dark'; pulse (light) collapses
-- to 'light'. Existing accounts keep whichever mode they were already
-- effectively using — nobody's screen flips color on this migration.

UPDATE profiles
SET ui_theme = CASE WHEN ui_theme = 'pulse' THEN 'light' ELSE 'dark' END;

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_ui_theme_check;

ALTER TABLE profiles
  ALTER COLUMN ui_theme SET DEFAULT 'dark',
  ADD CONSTRAINT profiles_ui_theme_check CHECK (ui_theme IN ('light', 'dark'));
