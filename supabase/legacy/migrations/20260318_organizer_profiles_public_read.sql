-- ============================================================
-- TIKKIT — Allow public read of organizer profiles
-- Migration: 20260318_organizer_profiles_public_read
-- ============================================================
-- Organizer profiles are public-facing (events show organizer
-- name, public profile page /organizer/[username] is guest-accessible).
-- Add a SELECT policy so guests + anon can read organizer rows.

CREATE POLICY "organizer_profiles_public_read" ON profiles
  FOR SELECT USING (role = 'organizer');
