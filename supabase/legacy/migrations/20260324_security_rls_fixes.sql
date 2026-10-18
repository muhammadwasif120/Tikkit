-- 20260324_security_rls_fixes.sql
-- Fixes critical vulnerability allowing users to elevate their own role
CREATE OR REPLACE FUNCTION protect_profile_role() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    -- Block standard authenticated/anon users from elevating their role via the API
    IF auth.role() IN ('authenticated', 'anon') THEN
      RAISE EXCEPTION 'Unauthorized: Role modification is prohibited.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_protect_profile_role ON profiles;
CREATE TRIGGER trg_protect_profile_role
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION protect_profile_role();

-- Fixes critical vulnerability allowing guests to self-approve registrations
DROP POLICY IF EXISTS "public_registrations_insert" ON public_registrations;

CREATE POLICY "public_registrations_insert" ON public_registrations
  FOR INSERT WITH CHECK (
    status = 'pending' AND 
    payment_status IN ('not_required', 'pending')
  );
