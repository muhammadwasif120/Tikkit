-- ============================================================
-- TIKKIT — Add branding + username columns to profiles
-- Migration: 20260318_profiles_branding_columns
-- ============================================================
-- Adds cover_image_url, logo_url, and username columns that
-- are present in schema.sql but were not yet migrated to the
-- existing live database.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
  ADD COLUMN IF NOT EXISTS logo_url        TEXT,
  ADD COLUMN IF NOT EXISTS username        TEXT UNIQUE;
