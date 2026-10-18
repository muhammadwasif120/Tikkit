-- TIKKIT X: follow-ups from the live security audit (supabase/tests/05_security_audit.sql)
--
-- 1. Functions in the private schema are internal. Nobody but the signed-in app and the service role may run them,
--    and the demo seeders and reseed are service-role only.
-- 2. get_registrant_scores refuses anonymous callers inside the function; it is now also not executable by them.
-- 3. The leftover payment-screenshots bucket gets the same size and type limits as the live receipts bucket.

begin;

revoke execute on all functions in schema private from public, anon;
grant execute on all functions in schema private to authenticated, service_role;
alter default privileges in schema private revoke execute on functions from public, anon;
alter default privileges in schema private grant execute on functions to authenticated, service_role;

revoke execute on function private.seed_demo() from authenticated;
revoke execute on function private.seed_demo_attendee() from authenticated;
revoke execute on function private.seed_demo_catalogue() from authenticated;

revoke execute on function public.get_registrant_scores(uuid) from public, anon;
grant execute on function public.get_registrant_scores(uuid) to authenticated;

update storage.buckets
set file_size_limit = 10485760,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
where id = 'payment-screenshots';

commit;
