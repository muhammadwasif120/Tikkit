-- ════════════════════════════════════════════════════════════════
-- Fix: guest_profiles is missing date_of_birth / gender
-- ════════════════════════════════════════════════════════════════
-- supabase/migrations/20260423_guest_profile_schema.sql adds these columns,
-- but the regenerated database.types.ts (pulled directly from the live
-- schema) shows guest_profiles WITHOUT them — meaning that migration was
-- never actually applied to the live database, even though it's sitting in
-- the repo as if it were.
--
-- Consequence: every guest signup's `guest_profiles.upsert({ date_of_birth,
-- gender })` call has been failing (unknown column) on every single signup,
-- silently, because the call wasn't error-checked. Guests filled these
-- fields in on the signup form and they were silently discarded every time.
--
-- This migration is idempotent (IF NOT EXISTS) so it's safe to run whether or
-- not 20260423_guest_profile_schema.sql was partially applied.

ALTER TABLE public.guest_profiles
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS gender        VARCHAR;

-- Verify after applying:
--   SELECT column_name FROM information_schema.columns
--     WHERE table_name = 'guest_profiles' AND column_name IN ('date_of_birth','gender');
--   -- expect both rows back
