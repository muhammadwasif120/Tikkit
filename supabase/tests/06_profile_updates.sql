-- Regression test: a normal signed-in user must be able to update their own profile and private details,
-- and must NOT be able to change their role or their ID verification status.
-- (A trigger once broke every such update with: record "new" has no field "id_status".)
-- Run: supabase db query --linked -f supabase/tests/06_profile_updates.sql
-- Nothing is changed: every statement is a no-op update and the whole thing ends by raising an error, which rolls back.
-- Read the "PROFILE UPDATE TEST" report in the error text. Every line should start with PASS.

do $$
declare
  uid uuid;
  rep text := '';
begin
  select id into uid from public.profiles where role = 'attendee' order by created_at limit 1;
  if uid is null then raise exception 'PROFILE UPDATE TEST: no attendee found to test with'; end if;

  perform set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';

  begin update public.profiles set city = city where id = uid; rep := rep || E'PASS own profile can be updated\n';
  exception when others then rep := rep || 'FAIL own profile update: ' || sqlerrm || E'\n'; end;

  begin update public.profile_private set phone = phone where id = uid; rep := rep || E'PASS own private details can be updated\n';
  exception when others then rep := rep || 'FAIL own private details update: ' || sqlerrm || E'\n'; end;

  begin update public.profiles set role = 'admin' where id = uid; rep := rep || E'FAIL role change was allowed\n';
  exception when others then rep := rep || E'PASS role change is blocked\n'; end;

  begin update public.profile_private set id_status = 'verified' where id = uid; rep := rep || E'FAIL ID status change was allowed\n';
  exception when others then rep := rep || E'PASS ID status change is blocked\n'; end;

  execute 'reset role';
  raise exception E'PROFILE UPDATE TEST\n%', rep;
end $$;
