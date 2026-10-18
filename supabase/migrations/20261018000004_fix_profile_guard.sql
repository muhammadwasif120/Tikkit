-- TIKKIT X: fix for "We could not save your details"
--
-- private.guard_profile_trust() is attached to both profiles and profile_private. It read new.role (profiles only) and
-- new.id_status (profile_private only) inside conditions. PostgreSQL resolves the field when it evaluates the condition, even
-- when the table-name test in front of it is false, so every update to either table by a signed-in user failed with
--   record "new" has no field "id_status"   (on profiles)
--   record "new" has no field "role"        (on profile_private)
-- Service-role writes skip the check, which is why imports, seeds and tests passed. Signing up was unaffected (an insert),
-- but anyone with an existing account could not complete or edit their profile.
--
-- Same rules as before, read through to_jsonb() so the missing field is simply null on the other table.

begin;

create or replace function private.guard_profile_trust()
returns trigger
language plpgsql
as $$
declare
  n jsonb := to_jsonb(new);
  o jsonb := to_jsonb(old);
begin
  if auth.role() in ('anon', 'authenticated') then
    if tg_table_name = 'profiles' and (n -> 'role') is distinct from (o -> 'role') then
      raise exception 'role cannot be changed' using errcode = '42501';
    end if;
    if tg_table_name = 'profile_private' and (
         (n -> 'id_status')        is distinct from (o -> 'id_status')
      or (n -> 'id_reviewed_by')   is distinct from (o -> 'id_reviewed_by')
      or (n -> 'id_reviewed_at')   is distinct from (o -> 'id_reviewed_at')
      or (n -> 'id_reject_reason') is distinct from (o -> 'id_reject_reason')
    ) then
      raise exception 'verification fields are managed by TIKKIT X' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

commit;
