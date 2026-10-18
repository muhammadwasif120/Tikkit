-- TIKKIT X: demo account hardening
--
-- The demo accounts are shared and signed into by anyone. These rules, enforced in the database so a hand made
-- request cannot get around the app, stop a visitor from using them to put content on the public site,
-- host files, rename the public profile, or fill the database.
-- Every check is keyed to the demo flag in the session token (private.is_demo()), so normal accounts are untouched.

begin;

-- Policies below run as the signed in user, so the flag reader must be callable by them.
grant usage on schema private to authenticated;
grant execute on function private.is_demo() to authenticated;

-- ---------------------------------------------------------------------------
-- 1. Demo content is never public: events, classes and spaces are forced to unlisted.
-- ---------------------------------------------------------------------------
create or replace function private.demo_force_private()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if private.is_demo() then new.visibility := 'private'; end if;
  return new;
end;
$$;

drop trigger if exists events_demo_private on public.events;
create trigger events_demo_private before insert or update on public.events
  for each row execute function private.demo_force_private();
drop trigger if exists class_series_demo_private on public.class_series;
create trigger class_series_demo_private before insert or update on public.class_series
  for each row execute function private.demo_force_private();
drop trigger if exists spaces_demo_private on public.spaces;
create trigger spaces_demo_private before insert or update on public.spaces
  for each row execute function private.demo_force_private();

-- ---------------------------------------------------------------------------
-- 2. Public identity is locked: no username, avatar or public organizer page edits.
-- ---------------------------------------------------------------------------
create or replace function private.demo_lock_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if private.is_demo() and (new.username is distinct from old.username or new.avatar_url is distinct from old.avatar_url) then
    raise exception 'DEMO: this is not available in the demo workspace.' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create or replace function private.demo_lock_org_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if private.is_demo() then
    raise exception 'DEMO: this is not available in the demo workspace.' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_demo_lock on public.profiles;
create trigger profiles_demo_lock before update on public.profiles
  for each row execute function private.demo_lock_profile();
drop trigger if exists organizer_profiles_demo_lock on public.organizer_profiles;
create trigger organizer_profiles_demo_lock before update on public.organizer_profiles
  for each row execute function private.demo_lock_org_profile();

-- ---------------------------------------------------------------------------
-- 3. Row caps, so the demo cannot be filled with junk. "Reset data" restores it.
-- ---------------------------------------------------------------------------
create or replace function private.demo_cap()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare n integer;
begin
  if private.is_demo() then
    execute format('select count(*) from public.%I where organizer_id = $1', tg_table_name) into n using new.organizer_id;
    if n >= tg_argv[0]::integer then
      raise exception 'DEMO: the demo workspace is full. Use Reset data in the top bar.' using errcode = 'check_violation';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists events_demo_cap on public.events;
create trigger events_demo_cap before insert on public.events for each row execute function private.demo_cap(40);
drop trigger if exists referrers_demo_cap on public.referrers;
create trigger referrers_demo_cap before insert on public.referrers for each row execute function private.demo_cap(20);
drop trigger if exists organizer_vendors_demo_cap on public.organizer_vendors;
create trigger organizer_vendors_demo_cap before insert on public.organizer_vendors for each row execute function private.demo_cap(30);
drop trigger if exists class_series_demo_cap on public.class_series;
create trigger class_series_demo_cap before insert on public.class_series for each row execute function private.demo_cap(12);
drop trigger if exists spaces_demo_cap on public.spaces;
create trigger spaces_demo_cap before insert on public.spaces for each row execute function private.demo_cap(12);
drop trigger if exists retreats_demo_cap on public.retreats;
create trigger retreats_demo_cap before insert on public.retreats for each row execute function private.demo_cap(6);
drop trigger if exists payment_accounts_demo_cap on public.payment_accounts;
create trigger payment_accounts_demo_cap before insert on public.payment_accounts for each row execute function private.demo_cap(5);
drop trigger if exists gate_staff_links_demo_cap on public.gate_staff_links;
create trigger gate_staff_links_demo_cap before insert on public.gate_staff_links for each row execute function private.demo_cap(10);

-- ---------------------------------------------------------------------------
-- 4. Files: a demo session may only upload payment receipts (private bucket, size and type limited).
--    Event covers, logos and every other bucket are closed to it. A restrictive policy is ANDed with the
--    existing ones, so it can only narrow access.
-- ---------------------------------------------------------------------------
drop policy if exists demo_upload_limits on storage.objects;
create policy demo_upload_limits on storage.objects as restrictive for insert to authenticated
  with check (bucket_id = 'payment-proofs' or not private.is_demo());
drop policy if exists demo_update_limits on storage.objects;
create policy demo_update_limits on storage.objects as restrictive for update to authenticated
  using (bucket_id = 'payment-proofs' or not private.is_demo());

-- ---------------------------------------------------------------------------
-- 5. Organizer links: only http(s) websites can be stored, so a javascript: link can never be shown to guests.
-- ---------------------------------------------------------------------------
update public.organizer_profiles set website = null where website is not null and website !~* '^https?://[^[:space:]]+$';
alter table public.organizer_profiles drop constraint if exists organizer_profiles_website_http;
alter table public.organizer_profiles add constraint organizer_profiles_website_http
  check (website is null or website ~* '^https?://[^[:space:]]+$');

commit;
