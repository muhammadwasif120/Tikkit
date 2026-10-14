-- ============================================================
-- TIKKIT — Public Organizer Profile RPC
-- Migration: 20260314_public_organizer_profile_rpc
-- ============================================================

-- Allows unauthenticated guests to fetch an organizer's public
-- profile by username slug OR organizer UUID.
-- SECURITY DEFINER bypasses the profiles_self RLS policy.

CREATE OR REPLACE FUNCTION get_public_organizer_profile(p_lookup TEXT)
RETURNS TABLE (
  id              UUID,
  full_name       TEXT,
  email           TEXT,
  company_name    TEXT,
  phone_number    TEXT,
  logo_url        TEXT,
  cover_image_url TEXT,
  username        TEXT,
  created_at      TIMESTAMPTZ
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    id, full_name, email, company_name, phone_number,
    logo_url, cover_image_url, username, created_at
  FROM profiles
  WHERE role = 'organizer'
    AND (username = p_lookup OR id::text = p_lookup)
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION get_public_organizer_profile TO authenticated, anon;
