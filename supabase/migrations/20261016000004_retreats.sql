-- TIKKIT X modules 4/5: retreats (multi day itineraries for companies), Pro plan
-- An organizer plans a multi day trip for a client company: days, itinerary items
-- (activities, meals, transport, stays, sessions), participants with QR tokens,
-- a budget, a planning checklist and updates. A retreat can be shared as an
-- interactive read only itinerary through a private link, and participants can
-- check in to individual items with their QR token.

begin;

create type public.retreat_status      as enum ('planning', 'confirmed', 'in_progress', 'completed', 'cancelled');
create type public.retreat_item_kind   as enum ('activity', 'meal', 'transport', 'stay', 'session', 'free_time', 'milestone');
create type public.retreat_item_status as enum ('planned', 'confirmed', 'in_progress', 'done', 'skipped');
create type public.participant_status  as enum ('invited', 'confirmed', 'declined');

create table public.retreats (
  id               uuid primary key default gen_random_uuid(),
  organizer_id     uuid not null references public.profiles (id) on delete cascade,
  slug             text unique,
  title            text not null check (length(trim(title)) > 0),
  client_company   text,
  description      text,
  destination      text,
  city             text,
  cover_image_url  text,
  accent_color     text check (accent_color is null or accent_color ~ '^#[0-9A-Fa-f]{6}$'),
  starts_on        date not null,
  ends_on          date not null,
  status           public.retreat_status not null default 'planning',
  headcount_target integer check (headcount_target is null or headcount_target > 0),
  budget_pkr       integer check (budget_pkr is null or budget_pkr >= 0),
  share_token      text unique,                 -- null = sharing off. Anyone with the token can read the public itinerary.
  notes            text,                        -- internal, never shared
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  check (ends_on >= starts_on)
);
create index retreats_org_idx on public.retreats (organizer_id, starts_on desc);

create table public.retreat_days (
  id         uuid primary key default gen_random_uuid(),
  retreat_id uuid not null references public.retreats (id) on delete cascade,
  day_number integer not null check (day_number > 0),
  day_date   date not null,
  title      text,
  summary    text,
  unique (retreat_id, day_number),
  unique (retreat_id, id)
);

create table public.retreat_items (
  id               uuid primary key default gen_random_uuid(),
  retreat_id       uuid not null,
  day_id           uuid not null,
  kind             public.retreat_item_kind not null default 'activity',
  title            text not null check (length(trim(title)) > 0),
  description      text,
  starts_at        timestamptz,
  ends_at          timestamptz,
  location_name    text,
  location_address text,
  latitude         numeric(9, 6) check (latitude is null or latitude between -90 and 90),
  longitude        numeric(9, 6) check (longitude is null or longitude between -180 and 180),
  cost_pkr         integer not null default 0 check (cost_pkr >= 0),
  status           public.retreat_item_status not null default 'planned',
  vendor_id        uuid references public.organizer_vendors (id) on delete set null,
  assignee         text,
  is_internal      boolean not null default false,       -- hidden from the shared itinerary and participants
  requires_checkin boolean not null default false,
  sort             integer not null default 0,
  notes            text,                                 -- internal
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  foreign key (retreat_id, day_id) references public.retreat_days (retreat_id, id) on delete cascade,
  check (ends_at is null or starts_at is null or ends_at >= starts_at)
);
create index retreat_items_day_idx on public.retreat_items (day_id, starts_at nulls last, sort);
create index retreat_items_retreat_idx on public.retreat_items (retreat_id);

create table public.retreat_participants (
  id                uuid primary key default gen_random_uuid(),
  retreat_id        uuid not null references public.retreats (id) on delete cascade,
  attendee_id       uuid references public.profiles (id) on delete set null,
  full_name         text not null check (length(trim(full_name)) > 0),
  email             text,
  phone             text,
  department        text,
  dietary           text,
  accessibility     text,
  room_label        text,
  emergency_contact text,
  status            public.participant_status not null default 'invited',
  qr_token          text not null unique default private.new_token(),
  created_at        timestamptz not null default now()
);
create unique index retreat_participants_email_uq on public.retreat_participants (retreat_id, lower(email))
  where email is not null;
create index retreat_participants_retreat_idx on public.retreat_participants (retreat_id, status);
create index retreat_participants_attendee_idx on public.retreat_participants (attendee_id) where attendee_id is not null;

create table public.retreat_checkins (
  id             uuid primary key default gen_random_uuid(),
  retreat_id     uuid not null references public.retreats (id) on delete cascade,
  item_id        uuid not null references public.retreat_items (id) on delete cascade,
  participant_id uuid not null references public.retreat_participants (id) on delete cascade,
  checked_in_by  uuid references public.profiles (id),
  checked_in_at  timestamptz not null default now(),
  unique (item_id, participant_id)
);
create index retreat_checkins_retreat_idx on public.retreat_checkins (retreat_id);

create table public.retreat_budget_lines (
  id            uuid primary key default gen_random_uuid(),
  retreat_id    uuid not null references public.retreats (id) on delete cascade,
  category      text not null default 'other',
  label         text not null check (length(trim(label)) > 0),
  estimated_pkr integer not null default 0 check (estimated_pkr >= 0),
  actual_pkr    integer check (actual_pkr is null or actual_pkr >= 0),
  is_paid       boolean not null default false,
  vendor_id     uuid references public.organizer_vendors (id) on delete set null,
  item_id       uuid references public.retreat_items (id) on delete set null,
  notes         text,
  created_at    timestamptz not null default now()
);
create index retreat_budget_lines_retreat_idx on public.retreat_budget_lines (retreat_id);

create table public.retreat_tasks (
  id            uuid primary key default gen_random_uuid(),
  retreat_id    uuid not null references public.retreats (id) on delete cascade,
  title         text not null check (length(trim(title)) > 0),
  due_date      date,
  assignee_name text,
  is_done       boolean not null default false,
  done_at       timestamptz,
  sort          integer not null default 0,
  created_at    timestamptz not null default now()
);
create index retreat_tasks_retreat_idx on public.retreat_tasks (retreat_id, is_done, due_date);

create table public.retreat_updates (
  id         uuid primary key default gen_random_uuid(),
  retreat_id uuid not null references public.retreats (id) on delete cascade,
  author_id  uuid not null references public.profiles (id),
  body       text not null check (length(trim(body)) between 1 and 1500),
  created_at timestamptz not null default now()
);
create index retreat_updates_retreat_idx on public.retreat_updates (retreat_id, created_at desc);

create table public.retreat_documents (
  id           uuid primary key default gen_random_uuid(),
  retreat_id   uuid not null references public.retreats (id) on delete cascade,
  item_id      uuid references public.retreat_items (id) on delete set null,
  name         text not null,
  storage_path text not null,          -- bucket retreat-files, folder <organizer_id>/<retreat_id>/
  is_shared    boolean not null default false,
  created_at   timestamptz not null default now()
);
create index retreat_documents_retreat_idx on public.retreat_documents (retreat_id);

create trigger retreats_updated_at before update on public.retreats
  for each row execute function private.set_updated_at();
create trigger retreat_items_updated_at before update on public.retreat_items
  for each row execute function private.set_updated_at();

create or replace function private.manages_retreat(p_retreat uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.retreats r where r.id = p_retreat and private.manages_org(r.organizer_id))
$$;

-- ---------------------------------------------------------------------------
-- Guard: Pro plan feature, limited by plan_limits.retreats (0 = not included).
-- ---------------------------------------------------------------------------
create or replace function private.retreats_before_write()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare lim integer; n integer;
begin
  if tg_op = 'INSERT' then
    if new.id is null then new.id := gen_random_uuid(); end if;
    if new.slug is null then new.slug := private.make_slug(new.title, new.id); end if;

    if coalesce(auth.role(), '') <> 'service_role' then
      if not private.can_publish(new.organizer_id) then
        raise exception 'SUBSCRIPTION_REQUIRED: your trial or plan has ended. Upgrade to plan retreats.' using errcode = 'check_violation';
      end if;
      lim := private.plan_limit_int(new.organizer_id, 'retreats');
      if lim = 0 then
        raise exception 'PLAN_LIMIT:retreats: retreat planning is part of the Pro plan.' using errcode = 'check_violation';
      end if;
      select count(*) into n from public.retreats x
        where x.organizer_id = new.organizer_id and x.status in ('planning', 'confirmed', 'in_progress');
      if n >= lim then
        raise exception 'PLAN_LIMIT:retreats: your plan allows % active retreats.', lim using errcode = 'check_violation';
      end if;
    end if;
  else
    new.slug := old.slug;
  end if;
  return new;
end;
$$;
create trigger retreats_before_write before insert or update on public.retreats
  for each row execute function private.retreats_before_write();

-- Every new retreat gets one empty day per calendar day so the builder starts populated.
create or replace function private.retreats_after_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare d date; n integer := 1;
begin
  d := new.starts_on;
  while d <= new.ends_on and n <= 60 loop
    insert into public.retreat_days (retreat_id, day_number, day_date, title)
    values (new.id, n, d, 'Day ' || n);
    d := d + 1;
    n := n + 1;
  end loop;
  return new;
end;
$$;
create trigger retreats_after_insert after insert on public.retreats
  for each row execute function private.retreats_after_insert();

-- ---------------------------------------------------------------------------
-- Sharing: a private link to a read only, interactive itinerary.
-- ---------------------------------------------------------------------------
create or replace function public.enable_retreat_sharing(p_retreat uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare v_token text;
begin
  if not private.manages_retreat(p_retreat) then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
  update public.retreats set share_token = coalesce(share_token, private.new_token())
   where id = p_retreat returning share_token into v_token;
  return v_token;
end;
$$;

create or replace function public.disable_retreat_sharing(p_retreat uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not private.manages_retreat(p_retreat) then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
  update public.retreats set share_token = null where id = p_retreat;
end;
$$;

-- Days and public items for one retreat as json. Internal items, costs and notes never leave here.
create or replace function private.retreat_itinerary_json(p_retreat uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', d.id, 'day_number', d.day_number, 'date', d.day_date, 'title', d.title, 'summary', d.summary,
      'items', coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', i.id, 'kind', i.kind, 'title', i.title, 'description', i.description,
          'starts_at', i.starts_at, 'ends_at', i.ends_at,
          'location_name', i.location_name, 'location_address', i.location_address,
          'latitude', i.latitude, 'longitude', i.longitude, 'status', i.status)
          order by i.starts_at nulls last, i.sort, i.created_at)
        from public.retreat_items i where i.day_id = d.id and not i.is_internal
      ), '[]'::jsonb)
    ) order by d.day_number), '[]'::jsonb)
  from public.retreat_days d where d.retreat_id = p_retreat
$$;

create or replace function public.get_shared_retreat(p_token text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'title', r.title, 'client_company', r.client_company, 'description', r.description,
    'destination', r.destination, 'city', r.city, 'cover_image_url', r.cover_image_url,
    'accent_color', r.accent_color, 'starts_on', r.starts_on, 'ends_on', r.ends_on, 'status', r.status,
    'organizer', (select jsonb_build_object(
                    'name', coalesce(op.company_name, p.full_name), 'logo_url', op.logo_url,
                    'whatsapp', case when op.public_contact then op.whatsapp end)
                  from public.profiles p join public.organizer_profiles op on op.id = p.id
                  where p.id = r.organizer_id),
    'days', private.retreat_itinerary_json(r.id),
    'documents', coalesce((select jsonb_agg(jsonb_build_object('id', x.id, 'name', x.name) order by x.created_at)
                           from public.retreat_documents x where x.retreat_id = r.id and x.is_shared), '[]'::jsonb)
  )
  from public.retreats r
  where r.share_token = p_token and r.share_token is not null and r.status <> 'cancelled'
$$;

-- A participant opens their own schedule with the token on their QR pass.
create or replace function public.get_participant_itinerary(p_token text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'participant', jsonb_build_object('name', pa.full_name, 'room_label', pa.room_label, 'dietary', pa.dietary, 'status', pa.status),
    'retreat', jsonb_build_object(
      'title', r.title, 'client_company', r.client_company, 'destination', r.destination,
      'starts_on', r.starts_on, 'ends_on', r.ends_on, 'status', r.status, 'cover_image_url', r.cover_image_url),
    'days', private.retreat_itinerary_json(r.id),
    'checked_in_item_ids', coalesce((select jsonb_agg(c.item_id) from public.retreat_checkins c where c.participant_id = pa.id), '[]'::jsonb),
    'updates', coalesce((select jsonb_agg(jsonb_build_object('body', u.body, 'created_at', u.created_at) order by u.created_at desc)
                         from (select * from public.retreat_updates where retreat_id = r.id order by created_at desc limit 20) u), '[]'::jsonb)
  )
  from public.retreat_participants pa
  join public.retreats r on r.id = pa.retreat_id
  where pa.qr_token = p_token and r.status <> 'cancelled' and pa.status <> 'declined'
$$;

-- Retreats the signed in person has been added to.
create or replace function public.my_retreats()
returns table (retreat_id uuid, title text, destination text, starts_on date, ends_on date, status public.retreat_status, qr_token text)
language sql
stable
security definer
set search_path = public
as $$
  select r.id, r.title, r.destination, r.starts_on, r.ends_on, r.status, pa.qr_token
  from public.retreat_participants pa
  join public.retreats r on r.id = pa.retreat_id
  where pa.attendee_id = auth.uid() and r.status <> 'cancelled' and pa.status <> 'declined'
  order by r.starts_on
$$;

-- Link participants added by email to the account that signs in with that email.
create or replace function public.claim_retreat_invites()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare v_email text; v_n integer;
begin
  select lower(pp.email) into v_email from public.profile_private pp where pp.id = auth.uid();
  if v_email is null then return 0; end if;
  update public.retreat_participants set attendee_id = auth.uid()
   where lower(email) = v_email and attendee_id is null;
  get diagnostics v_n = row_count;
  return v_n;
end;
$$;

-- ---------------------------------------------------------------------------
-- Item check in. Shared by organizer, gate link and the unified scanner.
-- ---------------------------------------------------------------------------
create or replace function private.do_retreat_check_in(p_item uuid, p_token text, p_by uuid, p_gate uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  it public.retreat_items;
  pa public.retreat_participants;
  r public.retreats;
  v_result public.scan_result;
  v_rows integer := 0;
begin
  select * into it from public.retreat_items where id = p_item;
  if not found then return jsonb_build_object('result', 'invalid'); end if;
  select * into r from public.retreats where id = it.retreat_id;
  select * into pa from public.retreat_participants where qr_token = p_token and retreat_id = it.retreat_id;

  if not found then
    v_result := 'invalid';
  elsif pa.status = 'declined' then
    v_result := 'not_approved';
  elsif r.status in ('cancelled', 'completed') then
    v_result := 'wrong_day';
  else
    insert into public.retreat_checkins (retreat_id, item_id, participant_id, checked_in_by)
    values (r.id, it.id, pa.id, p_by)
    on conflict (item_id, participant_id) do nothing;
    get diagnostics v_rows = row_count;
    v_result := case when v_rows > 0 then 'admitted'::public.scan_result else 'duplicate'::public.scan_result end;
  end if;

  insert into public.door_scans (kind, subject_id, organizer_id, scanned_by, gate_link_id, result)
  values ('retreat', pa.id, r.organizer_id, p_by, p_gate, v_result);

  return jsonb_build_object('result', v_result, 'kind', 'retreat', 'name', pa.full_name, 'item', it.title,
                            'room_label', pa.room_label, 'dietary', pa.dietary);
end;
$$;

create or replace function public.retreat_check_in(p_item uuid, p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_retreat uuid;
begin
  select retreat_id into v_retreat from public.retreat_items where id = p_item;
  if v_retreat is null or not private.manages_retreat(v_retreat) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  return private.do_retreat_check_in(p_item, p_token, auth.uid(), null);
end;
$$;

-- ---------------------------------------------------------------------------
-- Updates to everyone on the retreat
-- ---------------------------------------------------------------------------
create or replace function public.post_retreat_update(p_retreat uuid, p_body text, p_send_email boolean default false)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare r public.retreats; v_id uuid; pa record;
begin
  if not private.manages_retreat(p_retreat) then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
  select * into r from public.retreats where id = p_retreat;

  insert into public.retreat_updates (retreat_id, author_id, body) values (r.id, auth.uid(), trim(p_body))
  returning id into v_id;

  for pa in select attendee_id, email, full_name from public.retreat_participants
            where retreat_id = r.id and status <> 'declined' loop
    perform private.notify(pa.attendee_id, null, 'retreat_update', r.title, left(trim(p_body), 200),
                           jsonb_build_object('retreat_id', r.id));
    if p_send_email and pa.email is not null then
      insert into public.email_outbox (to_email, template, payload)
      values (pa.email, 'retreat_update',
              jsonb_build_object('retreat_id', r.id, 'title', r.title, 'name', pa.full_name, 'body', trim(p_body)));
    end if;
  end loop;
  return v_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Copy a retreat to a new start date (repeat offsites). Participants are not copied.
-- ---------------------------------------------------------------------------
create or replace function public.duplicate_retreat(p_retreat uuid, p_new_start date)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.retreats;
  v_new uuid;
  v_shift integer;
  d record;
  v_day uuid;
begin
  if not private.manages_retreat(p_retreat) then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
  select * into r from public.retreats where id = p_retreat;
  v_shift := p_new_start - r.starts_on;

  -- the after insert trigger creates blank days, which we replace with copies below
  insert into public.retreats (organizer_id, title, client_company, description, destination, city, cover_image_url,
                               accent_color, starts_on, ends_on, headcount_target, budget_pkr, notes)
  values (r.organizer_id, r.title || ' (copy)', r.client_company, r.description, r.destination, r.city, r.cover_image_url,
          r.accent_color, r.starts_on + v_shift, r.ends_on + v_shift, r.headcount_target, r.budget_pkr, r.notes)
  returning id into v_new;
  delete from public.retreat_days where retreat_id = v_new;

  for d in select * from public.retreat_days where retreat_id = p_retreat order by day_number loop
    insert into public.retreat_days (retreat_id, day_number, day_date, title, summary)
    values (v_new, d.day_number, d.day_date + v_shift, d.title, d.summary)
    returning id into v_day;

    insert into public.retreat_items (retreat_id, day_id, kind, title, description, starts_at, ends_at, location_name,
                                      location_address, latitude, longitude, cost_pkr, vendor_id, assignee,
                                      is_internal, requires_checkin, sort, notes)
    select v_new, v_day, i.kind, i.title, i.description, i.starts_at + make_interval(days => v_shift),
           i.ends_at + make_interval(days => v_shift), i.location_name, i.location_address, i.latitude, i.longitude,
           i.cost_pkr, i.vendor_id, i.assignee, i.is_internal, i.requires_checkin, i.sort, i.notes
    from public.retreat_items i where i.day_id = d.id;
  end loop;

  insert into public.retreat_budget_lines (retreat_id, category, label, estimated_pkr, vendor_id, notes)
  select v_new, category, label, estimated_pkr, vendor_id, notes from public.retreat_budget_lines where retreat_id = p_retreat;

  insert into public.retreat_tasks (retreat_id, title, due_date, assignee_name, sort)
  select v_new, title, due_date + v_shift, assignee_name, sort from public.retreat_tasks where retreat_id = p_retreat;

  return v_new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Dashboard numbers for one retreat
-- ---------------------------------------------------------------------------
create or replace function public.retreat_summary(p_retreat uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare r public.retreats;
begin
  if not private.manages_retreat(p_retreat) then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
  select * into r from public.retreats where id = p_retreat;
  return jsonb_build_object(
    'budget_pkr', r.budget_pkr,
    'estimated_pkr', coalesce((select sum(estimated_pkr) from public.retreat_budget_lines where retreat_id = r.id), 0),
    'actual_pkr', coalesce((select sum(actual_pkr) from public.retreat_budget_lines where retreat_id = r.id), 0),
    'paid_pkr', coalesce((select sum(coalesce(actual_pkr, estimated_pkr)) from public.retreat_budget_lines where retreat_id = r.id and is_paid), 0),
    'items_total', (select count(*) from public.retreat_items where retreat_id = r.id),
    'items_done', (select count(*) from public.retreat_items where retreat_id = r.id and status = 'done'),
    'items_unconfirmed', (select count(*) from public.retreat_items where retreat_id = r.id and status = 'planned'),
    'tasks_total', (select count(*) from public.retreat_tasks where retreat_id = r.id),
    'tasks_done', (select count(*) from public.retreat_tasks where retreat_id = r.id and is_done),
    'tasks_overdue', (select count(*) from public.retreat_tasks where retreat_id = r.id and not is_done and due_date < private.pk_date(now())),
    'participants_total', (select count(*) from public.retreat_participants where retreat_id = r.id),
    'participants_confirmed', (select count(*) from public.retreat_participants where retreat_id = r.id and status = 'confirmed'),
    'participants_declined', (select count(*) from public.retreat_participants where retreat_id = r.id and status = 'declined'),
    'checkins', (select count(*) from public.retreat_checkins where retreat_id = r.id)
  );
end;
$$;

commit;
