-- TIKKIT X modules 1/5: shared platform extras
-- Team access, saved events, generic product payments, door scans for classes,
-- spaces and retreats, and gate link scope for those modules.
-- Additive only. Nothing in the 20261015 baseline is dropped or renamed.

begin;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.team_role     as enum ('manager');
create type public.product_kind  as enum ('pass_purchase', 'class_booking', 'space_booking');
create type public.scan_kind     as enum ('class', 'space', 'retreat');

-- ---------------------------------------------------------------------------
-- Slug helper shared by the new modules (same shape as events: title slug plus short id)
-- ---------------------------------------------------------------------------
create or replace function private.make_slug(p_text text, p_id uuid)
returns text
language sql
immutable
as $$
  select coalesce(nullif(
           lower(trim(both '-' from regexp_replace(regexp_replace(
             replace(lower(coalesce(p_text, 'item')), ' ', '-'), '[^a-z0-9-]', '', 'g'), '-+', '-', 'g'))), ''), 'item')
         || '-' || replace(substr(p_id::text, 1, 8), '-', '')
$$;

-- ---------------------------------------------------------------------------
-- Team access: an organizer can invite managers who work inside their account.
-- ---------------------------------------------------------------------------
create table public.organizer_team_members (
  id           uuid primary key default gen_random_uuid(),
  organizer_id uuid not null references public.profiles (id) on delete cascade,
  user_id      uuid references public.profiles (id) on delete cascade,
  email        text not null check (position('@' in email) > 1),
  role         public.team_role not null default 'manager',
  status       text not null default 'invited' check (status in ('invited', 'active', 'removed')),
  invited_by   uuid references public.profiles (id),
  invited_at   timestamptz not null default now(),
  accepted_at  timestamptz
);
create unique index organizer_team_members_email_uq on public.organizer_team_members (organizer_id, lower(email))
  where status <> 'removed';
create index organizer_team_members_user_idx on public.organizer_team_members (user_id) where status = 'active';

create or replace function private.is_team_manager(p_org uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.organizer_team_members m
    where m.organizer_id = p_org and m.user_id = auth.uid() and m.status = 'active' and m.role = 'manager'
  )
$$;

-- The caller runs this organizer's account: the owner, an active team manager, or an admin.
create or replace function private.manages_org(p_org uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select p_org = auth.uid() or private.is_team_manager(p_org) or private.is_admin()
$$;

-- Team managers can now do everything on an event that the owner can do through
-- functions and read policies. Direct writes still need ownership (see policies).
create or replace function private.manages_event(p_event uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select private.is_admin() or exists (
    select 1 from public.events e
    where e.id = p_event and (e.organizer_id = auth.uid() or private.is_team_manager(e.organizer_id))
  )
$$;

create or replace function public.invite_team_member(p_email text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_email text := lower(trim(p_email));
  v_count integer;
  v_id uuid;
begin
  if not private.is_organizer() then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
  if v_email is null or position('@' in v_email) < 2 then
    raise exception 'EMAIL_INVALID: enter a valid email address.' using errcode = 'check_violation';
  end if;
  if not private.can_publish(v_uid) then
    raise exception 'SUBSCRIPTION_REQUIRED: upgrade to add team members.' using errcode = 'check_violation';
  end if;

  select count(*) into v_count from public.organizer_team_members
    where organizer_id = v_uid and status <> 'removed';
  if v_count >= private.plan_limit_int(v_uid, 'team_members') then
    raise exception 'PLAN_LIMIT:team_members: your plan allows % team members.',
      private.plan_limit_int(v_uid, 'team_members') using errcode = 'check_violation';
  end if;

  insert into public.organizer_team_members (organizer_id, email, invited_by)
  values (v_uid, v_email, v_uid)
  returning id into v_id;

  insert into public.email_outbox (to_email, template, payload)
  values (v_email, 'team_invite', jsonb_build_object('organizer_id', v_uid, 'member_id', v_id));

  return v_id;
exception when unique_violation then
  raise exception 'ALREADY_INVITED: that email is already on your team.' using errcode = 'unique_violation';
end;
$$;

-- Called by the invited person after sign in. Matches on the verified sign in email.
create or replace function public.claim_team_invites()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
  v_n integer;
begin
  select lower(pp.email) into v_email from public.profile_private pp where pp.id = auth.uid();
  if v_email is null then return 0; end if;
  update public.organizer_team_members
     set user_id = auth.uid(), status = 'active', accepted_at = now()
   where lower(email) = v_email and status = 'invited' and organizer_id <> auth.uid();
  get diagnostics v_n = row_count;
  return v_n;
end;
$$;

create or replace function public.remove_team_member(p_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.organizer_team_members set status = 'removed'
   where id = p_id and organizer_id = auth.uid()
$$;

-- ---------------------------------------------------------------------------
-- Saved events (attendee wishlist)
-- ---------------------------------------------------------------------------
create table public.event_favourites (
  user_id    uuid not null references public.profiles (id) on delete cascade,
  event_id   uuid not null references public.events (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, event_id)
);
create index event_favourites_event_idx on public.event_favourites (event_id);

-- ---------------------------------------------------------------------------
-- Generic proof of payment for passes, class drop ins and space bookings.
-- (Event tickets keep payment_submissions.) Written only by functions.
-- ---------------------------------------------------------------------------
create table public.product_payments (
  id              uuid primary key default gen_random_uuid(),
  kind            public.product_kind not null,
  subject_id      uuid not null,
  payer_id        uuid not null references public.profiles (id) on delete cascade,
  organizer_id    uuid not null references public.profiles (id) on delete cascade,
  amount_pkr      integer not null check (amount_pkr >= 0),
  screenshot_path text not null,
  reference       text,
  status          public.review_status not null default 'submitted',
  reviewed_by     uuid references public.profiles (id),
  reviewed_at     timestamptz,
  reject_reason   text,
  created_at      timestamptz not null default now()
);
create unique index product_payments_open_uq on public.product_payments (kind, subject_id) where status = 'submitted';
create index product_payments_org_idx on public.product_payments (organizer_id, status, created_at desc);
create index product_payments_payer_idx on public.product_payments (payer_id);

-- ---------------------------------------------------------------------------
-- Door scans for classes, spaces and retreats (events keep scan_logs).
-- ---------------------------------------------------------------------------
create table public.door_scans (
  id           uuid primary key default gen_random_uuid(),
  kind         public.scan_kind not null,
  subject_id   uuid,
  organizer_id uuid not null references public.profiles (id) on delete cascade,
  scanned_by   uuid references public.profiles (id),
  gate_link_id uuid,
  result       public.scan_result not null,
  note         text,
  scanned_at   timestamptz not null default now()
);
create index door_scans_org_idx on public.door_scans (organizer_id, scanned_at desc);
create index door_scans_subject_idx on public.door_scans (kind, subject_id);

-- ---------------------------------------------------------------------------
-- Gate links can now cover classes, spaces and retreats as well as events.
-- ---------------------------------------------------------------------------
alter table public.gate_staff_links
  add column class_series_ids uuid[] not null default '{}',
  add column space_ids        uuid[] not null default '{}',
  add column retreat_ids      uuid[] not null default '{}';

do $$
declare c text;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.gate_staff_links'::regclass and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%cardinality(event_ids) > 0%'
  loop
    execute format('alter table public.gate_staff_links drop constraint %I', c);
  end loop;
end $$;

alter table public.gate_staff_links add constraint gate_staff_links_scope_check
  check (cardinality(event_ids) + cardinality(class_series_ids) + cardinality(space_ids) + cardinality(retreat_ids) > 0);

alter table public.door_scans
  add constraint door_scans_gate_link_fk foreign key (gate_link_id) references public.gate_staff_links (id) on delete set null;

commit;
