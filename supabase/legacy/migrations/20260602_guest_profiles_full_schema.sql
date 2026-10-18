-- Document and ensure all guest_profiles extended columns exist.
-- These columns are actively used by the guest credit system and profile pages
-- but were never captured in migration files (added directly via dashboard).
-- All statements use ADD COLUMN IF NOT EXISTS so this is safe to re-run.

ALTER TABLE public.guest_profiles
  ADD COLUMN IF NOT EXISTS credit_score        INTEGER   NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_attended      INTEGER   NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_no_shows      INTEGER   NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_vip_events    INTEGER   NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS attendance_streak   INTEGER   NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS longest_streak      INTEGER   NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS username            TEXT,
  ADD COLUMN IF NOT EXISTS is_discoverable     BOOLEAN   NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS instagram_handle    TEXT,
  ADD COLUMN IF NOT EXISTS city                TEXT;

-- Indexes for common lookup patterns
CREATE INDEX IF NOT EXISTS idx_guest_profiles_username    ON public.guest_profiles(username) WHERE username IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_guest_profiles_credit      ON public.guest_profiles(credit_score);
CREATE INDEX IF NOT EXISTS idx_guest_profiles_discoverable ON public.guest_profiles(is_discoverable);
