-- TIKKIT X modules 3/5: spaces and reservations (v1.2)
-- An organizer lists bookable spaces (room, court, studio, table area). Opening
-- hours define a slot grid. Attendees reserve a slot, pay by proof if the space
-- charges, and receive a QR token for the door. Double booking is prevented by
-- locking the space row inside book_space().

begin;

create type public.space_kind   as enum ('room', 'court', 'studio', 'desk', 'table', 'other');
create type public.space_status as enum ('draft', 'published', 'paused');

create table public.spaces (
  id                   uuid primary key default gen_random_uuid(),
  organizer_id         uuid not null references public.profiles (id) on delete cascade,
  slug                 text unique,
  name                 text not null check (length(trim(name)) > 0),
  kind                 public.space_kind not null default 'room',
  description          text,
  photos               text[] not null default '{}',
  amenities            text[] not null default '{}',
  city                 text,
  area_label           text,
  address              text,
  capacity             integer check (capacity is null or capacity > 0),
  price_pkr_per_slot   integer not null default 0 check (price_pkr_per_slot >= 0),
  slot_minutes         integer not null default 60 check (slot_minutes between 15 and 480),
  buffer_minutes       integer not null default 0 check (buffer_minutes between 0 and 240),
  min_notice_hours     integer not null default 2 check (min_notice_hours between 0 and 168),
  max_advance_days     integer not null default 60 check (max_advance_days between 1 and 365),
  requires_approval    boolean not null default false,
  status               public.space_status not null default 'draft',
  visibility           public.event_visibility not null default 'public',
  admin_status         public.admin_status not null default 'live',
  published_at         timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index spaces_org_idx on public.spaces (organizer_id, created_at desc);
create index spaces_listing_idx on public.spaces (city)
  where status = 'published' and visibility = 'public' and admin_status = 'live';

-- Weekly opening hours. Several rows per weekday allow a lunch break. Local Pakistan time.
create table public.space_hours (
  id        uuid primary key default gen_random_uuid(),
  space_id  uuid not null references public.spaces (id) on delete cascade,
  weekday   smallint not null check (weekday between 0 and 6),   -- 0 = Sunday
  opens     time not null,
  closes    time not null,
  check (closes > opens),
  unique (space_id, weekday, opens)
);
create index space_hours_space_idx on public.space_hours (space_id);

create table public.space_blackouts (
  id        uuid primary key default gen_random_uuid(),
  space_id  uuid not null references public.spaces (id) on delete cascade,
  starts_at timestamptz not null,
  ends_at   timestamptz not null,
  reason    text,
  check (ends_at > starts_at)
);
create index space_blackouts_space_idx on public.space_blackouts (space_id, starts_at);

create table public.space_bookings (
  id             uuid primary key default gen_random_uuid(),
  space_id       uuid not null references public.spaces (id) on delete cascade,
  organizer_id   uuid not null references public.profiles (id) on delete cascade,
  attendee_id    uuid not null references public.profiles (id) on delete cascade,
  starts_at      timestamptz not null,
  ends_at        timestamptz not null,
  blocked_until  timestamptz not null,           -- ends_at plus the space buffer
  party_size     integer not null default 1 check (party_size > 0),
  status         public.registration_status not null default 'requested',
  status_reason  text,
  price_due_pkr  integer not null default 0 check (price_due_pkr >= 0),
  price_paid_pkr integer check (price_paid_pkr is null or price_paid_pkr >= 0),
  notes          text,
  qr_token       text not null unique default private.new_token(),
  approved_at    timestamptz,
  checked_in_at  timestamptz,
  cancelled_at   timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  check (ends_at > starts_at),
  check (blocked_until >= ends_at)
);
create index space_bookings_space_time_idx on public.space_bookings (space_id, starts_at);
create index space_bookings_attendee_idx on public.space_bookings (attendee_id, starts_at desc);
create index space_bookings_org_idx on public.space_bookings (organizer_id, status);

create trigger spaces_updated_at before update on public.spaces
  for each row execute function private.set_updated_at();
create trigger space_bookings_updated_at before update on public.space_bookings
  for each row execute function private.set_updated_at();

-- Statuses that hold a slot.
create or replace function private.slot_statuses()
returns public.registration_status[]
language sql
immutable
as $$
  select array['requested', 'awaiting_payment', 'payment_submitted', 'confirmed', 'checked_in']::public.registration_status[]
$$;

create or replace function private.manages_space(p_space uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.spaces s where s.id = p_space and private.manages_org(s.organizer_id))
$$;

create or replace function private.spaces_before_write()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare lim integer; n integer;
begin
  if tg_op = 'INSERT' then
    if new.id is null then new.id := gen_random_uuid(); end if;
    if new.slug is null then new.slug := private.make_slug(new.name, new.id); end if;
  else
    new.slug := old.slug;
  end if;

  if new.status = 'published' and (tg_op = 'INSERT' or old.status is distinct from 'published')
     and coalesce(auth.role(), '') <> 'service_role' then
    if not exists (select 1 from public.profile_private pp where pp.id = new.organizer_id and pp.id_status = 'verified') then
      raise exception 'ID_VERIFICATION_REQUIRED: verify your identity before publishing.' using errcode = 'check_violation';
    end if;
    if not private.can_publish(new.organizer_id) then
      raise exception 'SUBSCRIPTION_REQUIRED: your trial or plan has ended. Upgrade to publish.' using errcode = 'check_violation';
    end if;
    lim := private.plan_limit_int(new.organizer_id, 'spaces');
    select count(*) into n from public.spaces x
      where x.organizer_id = new.organizer_id and x.status = 'published' and x.id <> new.id;
    if n >= lim then
      raise exception 'PLAN_LIMIT:spaces: your plan allows % published spaces.', lim using errcode = 'check_violation';
    end if;
    new.published_at := coalesce(new.published_at, now());
  end if;
  return new;
end;
$$;
create trigger spaces_before_write before insert or update on public.spaces
  for each row execute function private.spaces_before_write();

-- ---------------------------------------------------------------------------
-- Public projections
-- ---------------------------------------------------------------------------
create or replace view public.public_spaces as
select
  s.id, s.slug, s.name, s.kind, s.description, s.photos, s.amenities, s.city, s.area_label, s.address,
  s.capacity, s.price_pkr_per_slot, s.slot_minutes, s.min_notice_hours, s.max_advance_days,
  s.requires_approval, s.organizer_id
from public.spaces s
where s.status = 'published' and s.visibility = 'public' and s.admin_status = 'live';

create or replace view public.public_space_hours as
select h.space_id, h.weekday, h.opens, h.closes
from public.space_hours h
join public.spaces s on s.id = h.space_id
where s.status = 'published' and s.admin_status = 'live';

create or replace function public.get_space(p_slug text)
returns setof public.public_spaces
language sql
stable
security definer
set search_path = public
as $$
  select s.id, s.slug, s.name, s.kind, s.description, s.photos, s.amenities, s.city, s.area_label, s.address,
         s.capacity, s.price_pkr_per_slot, s.slot_minutes, s.min_notice_hours, s.max_advance_days,
         s.requires_approval, s.organizer_id
  from public.spaces s
  where s.slug = p_slug and s.status = 'published' and s.admin_status = 'live'
$$;

-- ---------------------------------------------------------------------------
-- Slot grid for one local date
-- ---------------------------------------------------------------------------
create or replace function public.space_open_slots(p_space uuid, p_date date)
returns table (slot_start timestamptz, slot_end timestamptz, is_available boolean)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  sp public.spaces;
  v_step interval;
  v_today date := private.pk_date(now());
begin
  select * into sp from public.spaces x where x.id = p_space and x.status = 'published' and x.admin_status = 'live';
  if not found then return; end if;
  if p_date < v_today or p_date > v_today + sp.max_advance_days then return; end if;

  v_step := make_interval(mins => sp.slot_minutes + sp.buffer_minutes);

  return query
  with grid as (
    select (g.gs at time zone 'Asia/Karachi') as s_at
    from public.space_hours h
    cross join lateral generate_series(
      p_date + h.opens,
      p_date + h.closes - make_interval(mins => sp.slot_minutes),
      v_step
    ) as g(gs)
    where h.space_id = sp.id and h.weekday = extract(dow from p_date)::int
  )
  select
    gr.s_at,
    gr.s_at + make_interval(mins => sp.slot_minutes),
    (
      gr.s_at >= now() + make_interval(hours => sp.min_notice_hours)
      and not exists (
        select 1 from public.space_blackouts bo
        where bo.space_id = sp.id and bo.starts_at < gr.s_at + make_interval(mins => sp.slot_minutes)
          and bo.ends_at > gr.s_at)
      and not exists (
        select 1 from public.space_bookings b
        where b.space_id = sp.id and b.status = any (private.slot_statuses())
          and b.starts_at < gr.s_at + make_interval(mins => sp.slot_minutes + sp.buffer_minutes)
          and b.blocked_until > gr.s_at)
    )
  from grid gr
  order by gr.s_at;
end;
$$;

-- ---------------------------------------------------------------------------
-- Attendee: reserve, cancel
-- ---------------------------------------------------------------------------
create or replace function public.book_space(
  p_space uuid, p_starts_at timestamptz, p_party_size integer default 1, p_notes text default null
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  sp public.spaces;
  v_ok boolean;
  v_end timestamptz;
  v_status public.registration_status;
  v_id uuid;
begin
  if uid is null or private.my_role() is distinct from 'attendee' then raise exception 'FORBIDDEN' using errcode = '42501'; end if;

  -- The row lock serializes every booking for this space, so two people cannot take the same slot.
  select * into sp from public.spaces where id = p_space for update;
  if not found or sp.status <> 'published' or sp.admin_status <> 'live' then
    raise exception 'SPACE_UNAVAILABLE: this space is not open for booking.' using errcode = 'check_violation';
  end if;
  if not private.can_publish(sp.organizer_id) then
    raise exception 'SPACE_UNAVAILABLE: this space is not open for booking.' using errcode = 'check_violation';
  end if;
  if coalesce(p_party_size, 1) < 1 or (sp.capacity is not null and p_party_size > sp.capacity) then
    raise exception 'PARTY_SIZE: this space fits up to % people.', coalesce(sp.capacity, 1) using errcode = 'check_violation';
  end if;

  select o.is_available into v_ok
  from public.space_open_slots(sp.id, private.pk_date(p_starts_at)) o
  where o.slot_start = p_starts_at;
  if v_ok is distinct from true then
    raise exception 'SLOT_UNAVAILABLE: that time is no longer available.' using errcode = 'check_violation';
  end if;

  v_end := p_starts_at + make_interval(mins => sp.slot_minutes);
  v_status := case
    when sp.requires_approval then 'requested'::public.registration_status
    when sp.price_pkr_per_slot > 0 then 'awaiting_payment'::public.registration_status
    else 'confirmed'::public.registration_status end;

  insert into public.space_bookings (space_id, organizer_id, attendee_id, starts_at, ends_at, blocked_until,
                                     party_size, status, price_due_pkr, notes, approved_at)
  values (sp.id, sp.organizer_id, uid, p_starts_at, v_end, v_end + make_interval(mins => sp.buffer_minutes),
          coalesce(p_party_size, 1), v_status, sp.price_pkr_per_slot, left(p_notes, 500),
          case when v_status = 'confirmed' then now() end)
  returning id into v_id;

  perform private.notify(sp.organizer_id, null, 'space_booking',
    case when sp.requires_approval then 'New reservation request' else 'New reservation' end,
    sp.name || ' on ' || to_char(p_starts_at at time zone 'Asia/Karachi', 'DD Mon HH12:MI AM'),
    jsonb_build_object('booking_id', v_id, 'space_id', sp.id));
  return v_id;
end;
$$;

create or replace function public.cancel_space_booking(p_booking uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare b public.space_bookings;
begin
  select * into b from public.space_bookings where id = p_booking for update;
  if not found then raise exception 'NOT_FOUND' using errcode = 'P0002'; end if;
  if b.attendee_id <> auth.uid() and not private.manages_space(b.space_id) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if b.status not in ('requested', 'awaiting_payment', 'payment_submitted', 'confirmed') then
    raise exception 'NOT_CANCELLABLE: this booking can no longer be cancelled.' using errcode = 'check_violation';
  end if;
  update public.space_bookings set status = 'cancelled', cancelled_at = now() where id = b.id;
  update public.product_payments set status = 'rejected', reject_reason = 'Booking cancelled', reviewed_at = now()
   where kind = 'space_booking' and subject_id = b.id and status = 'submitted';
  if b.attendee_id <> auth.uid() then
    perform private.notify(b.attendee_id, null, 'space_cancelled', 'Reservation cancelled',
      'Your reservation on ' || to_char(b.starts_at at time zone 'Asia/Karachi', 'DD Mon HH12:MI AM') || ' was cancelled.',
      jsonb_build_object('booking_id', b.id));
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Organizer: approve or decline a request
-- ---------------------------------------------------------------------------
create or replace function public.review_space_booking(p_booking uuid, p_approve boolean, p_reason text default null)
returns public.registration_status
language plpgsql
security definer
set search_path = public
as $$
declare b public.space_bookings; v_new public.registration_status; sp_name text;
begin
  select * into b from public.space_bookings where id = p_booking for update;
  if not found then raise exception 'NOT_FOUND' using errcode = 'P0002'; end if;
  if not private.manages_space(b.space_id) then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
  if b.status <> 'requested' then
    raise exception 'NOT_PENDING: this request was already handled.' using errcode = 'check_violation';
  end if;
  select name into sp_name from public.spaces where id = b.space_id;

  if p_approve then
    v_new := case when b.price_due_pkr > 0 then 'awaiting_payment'::public.registration_status
                  else 'confirmed'::public.registration_status end;
    update public.space_bookings
       set status = v_new, approved_at = case when v_new = 'confirmed' then now() end
     where id = b.id;
    perform private.notify(b.attendee_id, null, 'space_approved', 'Reservation approved',
      sp_name || case when v_new = 'awaiting_payment' then ' is approved. Send your payment to confirm it.' else ' is confirmed.' end,
      jsonb_build_object('booking_id', b.id));
  else
    v_new := 'rejected';
    update public.space_bookings set status = 'rejected', status_reason = left(p_reason, 300) where id = b.id;
    perform private.notify(b.attendee_id, null, 'space_rejected', 'Reservation declined',
      sp_name || ' could not be booked.' || coalesce(' ' || p_reason, ''), jsonb_build_object('booking_id', b.id));
  end if;
  return v_new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Scheduled work (service role only)
-- ---------------------------------------------------------------------------
create or replace function public.process_space_bookings()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare n integer := 0;
begin
  update public.space_bookings set status = 'no_show'
   where status = 'confirmed' and ends_at < now() - interval '30 minutes';
  get diagnostics n = row_count;

  -- unpaid or unreviewed bookings for slots that already started are released
  update public.space_bookings set status = 'cancelled', cancelled_at = now(), status_reason = 'Not completed before start'
   where status in ('requested', 'awaiting_payment', 'payment_submitted') and starts_at < now();
  return n;
end;
$$;

commit;
