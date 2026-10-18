-- ============================================================
-- Fix all profile roles that don't match auth metadata
-- Run in Supabase SQL Editor (executes as service_role, bypasses trigger)
-- ============================================================

-- Step 1: Fix all accounts where auth metadata has the correct role
-- but profiles table has the wrong one (covers organizer, admin, staff)
UPDATE public.profiles p
SET role = (u.raw_user_meta_data->>'role')
FROM auth.users u
WHERE p.id = u.id
  AND u.raw_user_meta_data->>'role' IS NOT NULL
  AND u.raw_user_meta_data->>'role' IN ('organizer', 'guest', 'admin', 'staff')
  AND p.role != (u.raw_user_meta_data->>'role');

-- Step 2: Fix the handle_new_user trigger so all NEW signups get the right role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'organizer')
  )
  ON CONFLICT (id) DO UPDATE
    SET role = COALESCE(NEW.raw_user_meta_data->>'role', public.profiles.role);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger exists on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
