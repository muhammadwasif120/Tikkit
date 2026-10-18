-- ════════════════════════════════════════════════════════════════
-- SEC-01: Close profile-role privilege-escalation paths
-- ════════════════════════════════════════════════════════════════
-- Admin/staff authorization now verifies against profiles.role (the
-- trigger-protected source of truth) instead of the user-writable
-- user_metadata.role. This migration hardens profiles.role itself so it
-- cannot be self-assigned to a privileged value.
--
-- The original protect_profile_role() trigger only fired on UPDATE and only
-- blocked *changing* an existing role. That left a gap: a caller could INSERT
-- their own profiles row (RLS policy "profiles_self" permits auth.uid() = id)
-- with role = 'admin' — for accounts not yet provisioned, this self-grants
-- admin at creation time. We extend the trigger to also fire on INSERT and
-- reject privileged roles from authenticated/anon callers.
--
-- Legitimate self-service only ever creates 'guest' / 'organizer' rows, so
-- those are still allowed. 'admin' / 'staff' may only be set by the service
-- role (SQL / server bootstrap by a human).

CREATE OR REPLACE FUNCTION protect_profile_role() RETURNS TRIGGER AS $$
BEGIN
  -- Block non-service callers from CHANGING a role on UPDATE.
  IF TG_OP = 'UPDATE' AND NEW.role IS DISTINCT FROM OLD.role THEN
    IF auth.role() IN ('authenticated', 'anon') THEN
      RAISE EXCEPTION 'Unauthorized: Role modification is prohibited.';
    END IF;
  END IF;

  -- Block non-service callers from SELF-ASSIGNING a privileged role on INSERT.
  IF TG_OP = 'INSERT' AND NEW.role IN ('admin', 'staff') THEN
    IF auth.role() IN ('authenticated', 'anon') THEN
      RAISE EXCEPTION 'Unauthorized: Cannot self-assign a privileged role.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_protect_profile_role ON profiles;
CREATE TRIGGER trg_protect_profile_role
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION protect_profile_role();

-- ── Verification helper ──────────────────────────────────────────────────────
-- After applying, confirm your admin account(s) still have profiles.role = 'admin':
--
--   SELECT id, email, role FROM profiles WHERE role = 'admin';
--
-- If a legitimate admin is missing (e.g. it previously relied on the old
-- metadata fallback in the /master layout), restore it explicitly:
--
--   UPDATE profiles SET role = 'admin' WHERE email = 'you@example.com';
