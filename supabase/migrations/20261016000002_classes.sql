-- TIKKIT X modules 2/5: classes, workshops and pass packs (v1.1)
-- A class series repeats on chosen weekdays. Sessions are generated ahead of time.
-- Attendees book a session with a drop in payment or with a pass (pack or monthly).
-- Paid bookings and passes use product_payments (proof, then organizer approval).

begin;

create type public.series_status  as enum ('draft', 'published', 'paused', 'ended');
create type public.session_status as enum ('scheduled', 'cancelled', 'completed');
create type public.pass_kind      as enum ('pack', 'monthly');
create type public.pass_status    as enum (
  'awaiting_payment', 'payment_submitted', 'active', 'exhausted', 'expired', 'cancelled', 'rejected'
);

-- ---------------------------------------------------------------------------
-- Series and sessions
-- ---------------------------------------------------------------------------
create table public.class_series (
  id                  uuid primary key default gen_random_uuid(),
  organizer_id        uuid not null references public.profiles (id) on delete cascade,
  slug                text unique,
  title               text not null check (length(trim(title)) > 0),
  description         text,
  cover_image_url     text,
  category_id         uuid references public.event_categories (id) on delete set null,
  tags                text[] not null default '{}',
  city                text,
  area_label          text,
  venue_name          text,
  venue_address       text,
  instructor_name     text,
  weekdays            smallint[] not null default '{}' check (weekdays <@ array[0, 1, 2, 3, 4, 5, 6]::smallint[]),  -- 0 = Sunday, Pakistan local days
  start_time          time not null,
  duration_minutes    integer not null default 60 check (duration_minutes between 15 and 600),
  starts_on           date not null,
  ends_on             date,
  interval_weeks      integer not null default 1 check (interval_weeks between 1 and 8),
  capacity            integer check (capacity is null or capacity > 0),
  drop_in_price_pkr   integer not null default 0 check (drop_in_price_pkr >= 0),
  status              public.series_status not null default 'draft',
  visibility          public.event_visibility not null default 'public',
  admin_status        public.admin_status not null default 'live',
  published_at        timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  check (ends_on is null or ends_on >= starts_on)
);
create index class_series_org_idx on public.class_series (organizer_id, created_at desc);
create index class_series_listing_idx on public.class_series (city)
  where status = 'published' and visibility = 'public' and admin_status = 'live';

create table public.class_sessions (
  id         uuid primary key default gen_random_uuid(),
  series_id  uuid not null references public.class_series (id) on delete cascade,
  starts_at  timestamptz not null,
  ends_at    timestamptz not null,
  capacity   integer check (capacity is null or capacity > 0),   -- overrides the series capacity
  status     public.session_status not null default 'scheduled',
  notes      text,
  cancel_reason text,
  created_at timestamptz not null default now(),
  unique (series_id, starts_at),
  check (ends_at > starts_at)
);
create index class_sessions_upcoming_idx on public.class_sessions (starts_at) where status = 'scheduled';

-- ---------------------------------------------------------------------------
-- Pass products and purchases
-- ---------------------------------------------------------------------------
create table public.pass_products (
  id            uuid primary key default gen_random_uuid(),
  organizer_id  uuid not null references public.profiles (id) on delete cascade,
  series_id     uuid references public.class_series (id) on delete cascade,   -- null = works for every series of the organizer
  name          text not null check (length(trim(name)) > 0),
  kind          public.pass_kind not null,
  sessions_count integer check (sessions_count is null or sessions_count > 1),
  validity_days integer not null default 90 check (validity_days between 1 and 730),
  price_pkr     integer not null check (price_pkr >= 0),
  is_active     boolean not null default true,
  sort          integer not null default 0,
  created_at    timestamptz not null default now(),
  check ((kind = 'pack' and sessions_count is not null) or (kind = 'monthly' and sessions_count is null))
);
create index pass_products_org_idx on public.pass_products (organizer_id);
create index pass_products_series_idx on public.pass_products (series_id);

create table public.pass_purchases (
  id             uuid primary key default gen_random_uuid(),
  product_id     uuid not null references public.pass_products (id) on delete restrict,
  organizer_id   uuid not null references public.profiles (id) on delete cascade,
  attendee_id    uuid not null references public.profiles (id) on delete cascade,
  status         public.pass_status not null default 'awaiting_payment',
  sessions_total integer,                  -- copy of the product at purchase; null = unlimited (monthly)
  sessions_used  integer not null default 0 check (sessions_used >= 0),
  price_due_pkr  integer not null default 0 check (price_due_pkr >= 0),
  price_paid_pkr integer check (price_paid_pkr is null or price_paid_pkr >= 0),
  valid_from     timestamptz,
  valid_until    timestamptz,
  qr_token       text not null unique default private.new_token(),
  approved_at    timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index pass_purchases_attendee_idx on public.pass_purchases (attendee_id, created_at desc);
create index pass_purchases_org_idx on public.pass_purchases (organizer_id, status);

-- ---------------------------------------------------------------------------
-- Bookings and redemptions
-- ---------------------------------------------------------------------------
create table public.class_bookings (
  id               uuid primary key default gen_random_uuid(),
  session_id       uuid not null references public.class_sessions (id) on delete cascade,
  series_id        uuid not null references public.class_series (id) on delete cascade,
  organizer_id     uuid not null references public.profiles (id) on delete cascade,
  attendee_id      uuid not null references public.profiles (id) on delete cascade,
  pass_purchase_id uuid references public.pass_purchases (id) on delete set null,
  status           public.registration_status not null default 'awaiting_payment',
  price_due_pkr    integer not null default 0 check (price_due_pkr >= 0),
  price_paid_pkr   integer check (price_paid_pkr is null or price_paid_pkr >= 0),
  qr_token         text not null unique default private.new_token(),
  approved_at      timestamptz,
  checked_in_at    timestamptz,
  cancelled_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create unique index class_bookings_session_attendee_uq on public.class_bookings (session_id, attendee_id)
  where status not in ('rejected', 'cancelled');
create index class_bookings_attendee_idx on public.class_bookings (attendee_id, created_at desc);
create index class_bookings_series_idx on public.class_bookings (series_id, status);
create index class_bookings_pass_idx on public.class_bookings (pass_purchase_id) where pass_purchase_id is not null;

create table public.pass_redemptions (
  id               uuid primary key default gen_random_uuid(),
  pass_purchase_id uuid not null references public.pass_purchases (id) on delete cascade,
  booking_id       uuid not null unique references public.class_bookings (id) on delete cascade,
  redeemed_at      timestamptz not null default now()
);
create index pass_redemptions_pass_idx on public.pass_redemptions (pass_purchase_id);

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------
create trigger class_series_updated_at before update on public.class_series
  for each row execute function private.set_updated_at();
create trigger pass_purchases_updated_at before update on public.pass_purchases
  for each row execute function private.set_updated_at();
create trigger class_bookings_updated_at before update on public.class_bookings
  for each row execute function private.set_updated_at();

create or replace function private.class_seat_statuses()
returns public.registration_status[]
language sql
immutable
as $$
  select array['requested', 'awaiting_payment', 'payment_submitted', 'confirmed', 'checked_in', 'no_show']::public.registration_status[]
$$;

create or replace function private.manages_series(p_series uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.class_series s where s.id = p_series and private.manages_org(s.organizer_id))
$$;

-- Expands the weekly pattern into concrete sessions for the next p_weeks weeks.
create or replace function private.generate_class_sessions(p_series uuid, p_weeks integer default 12)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  s public.class_series;
  d date;
  last_day date;
  base date;
  today date := private.pk_date(now());
  n integer := 0;
  v_start timestamptz;
begin
  select * into s from public.class_series where id = p_series;
  if not found or cardinality(s.weekdays) = 0 or s.status <> 'published' then return 0; end if;

  base := date_trunc('week', s.starts_on::timestamp)::date;
  d := greatest(s.starts_on, today);
  last_day := least(coalesce(s.ends_on, today + p_weeks * 7), today + p_weeks * 7);

  while d <= last_day loop
    if extract(dow from d)::int = any (s.weekdays) and ((d - base) / 7) % s.interval_weeks = 0 then
      v_start := (d + s.start_time) at time zone 'Asia/Karachi';
      insert into public.class_sessions (series_id, starts_at, ends_at)
      values (s.id, v_start, v_start + make_interval(mins => s.duration_minutes))
      on conflict (series_id, starts_at) do nothing;
      if found then n := n + 1; end if;
    end if;
    d := d + 1;
  end loop;
  return n;
end;
$$;

create or replace function private.class_series_before_write()
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
    lim := private.plan_limit_int(new.organizer_id, 'classes');
    select count(*) into n from public.class_series c
      where c.organizer_id = new.organizer_id and c.status = 'published' and c.id <> new.id;
    if n >= lim then
      raise exception 'PLAN_LIMIT:classes: your plan allows % active class series.', lim using errcode = 'check_violation';
    end if;
    new.published_at := coalesce(new.published_at, now());
  end if;
  return new;
end;
$$;
create trigger class_series_before_write before insert or update on public.class_series
  for each row execute function private.class_series_before_write();

create or replace function private.class_series_after_publish()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'published' then perform private.generate_class_sessions(new.id, 12); end if;
  return new;
end;
$$;
create trigger class_series_after_write after insert or update of status, weekdays, start_time, starts_on, ends_on, interval_weeks, duration_minutes
  on public.class_series for each row execute function private.class_series_after_publish();

-- A pass product may only point at a series owned by the same organizer.
create or replace function private.pass_product_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.series_id is not null and not exists
     (select 1 from public.class_series s where s.id = new.series_id and s.organizer_id = new.organizer_id) then
    raise exception 'SERIES_MISMATCH: that class belongs to another organizer.' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;
create trigger pass_products_guard before insert or update on public.pass_products
  for each row execute function private.pass_product_guard();

-- ---------------------------------------------------------------------------
-- Public projections
-- ---------------------------------------------------------------------------
create or replace view public.public_class_series as
select
  s.id, s.slug, s.title, s.description, s.cover_image_url, s.category_id, s.tags, s.city, s.area_label,
  s.venue_name, s.venue_address, s.instructor_name, s.weekdays, s.start_time, s.duration_minutes,
  s.starts_on, s.ends_on, s.interval_weeks, s.capacity, s.drop_in_price_pkr, s.organizer_id,
  (select min(x.starts_at) from public.class_sessions x
     where x.series_id = s.id and x.status = 'scheduled' and x.starts_at > now()) as next_session_at
from public.class_series s
where s.status = 'published' and s.visibility = 'public' and s.admin_status = 'live';

create or replace view public.public_class_sessions as
select
  x.id, x.series_id, x.starts_at, x.ends_at, x.notes,
  case when coalesce(x.capacity, s.capacity) is null then null
       else greatest(coalesce(x.capacity, s.capacity) - (
              select count(*) from public.class_bookings b
              where b.session_id = x.id and b.status = any (private.class_seat_statuses())), 0)::int
  end as seats_left
from public.class_sessions x
join public.class_series s on s.id = x.series_id
where x.status = 'scheduled' and x.starts_at > now()
  and s.status = 'published' and s.admin_status = 'live';

create or replace view public.public_pass_products as
select p.id, p.series_id, p.organizer_id, p.name, p.kind, p.sessions_count, p.validity_days, p.price_pkr, p.sort
from public.pass_products p
join public.organizer_profiles op on op.id = p.organizer_id
where p.is_active
  and (p.series_id is null or exists (
        select 1 from public.class_series s
        where s.id = p.series_id and s.status = 'published' and s.admin_status = 'live'));

-- One series by slug, including unlisted ones reached by link.
create or replace function public.get_class_series(p_slug text)
returns table (
  id uuid, slug text, title text, description text, cover_image_url text, category_id uuid, tags text[],
  city text, area_label text, venue_name text, venue_address text, instructor_name text,
  weekdays smallint[], start_time time, duration_minutes integer, starts_on date, ends_on date,
  interval_weeks integer, capacity integer, drop_in_price_pkr integer, organizer_id uuid
)
language sql
stable
security definer
set search_path = public
as $$
  select s.id, s.slug, s.title, s.description, s.cover_image_url, s.category_id, s.tags, s.city, s.area_label,
         s.venue_name, s.venue_address, s.instructor_name, s.weekdays, s.start_time, s.duration_minutes,
         s.starts_on, s.ends_on, s.interval_weeks, s.capacity, s.drop_in_price_pkr, s.organizer_id
  from public.class_series s
  where s.slug = p_slug and s.status = 'published' and s.admin_status = 'live'
$$;

-- ---------------------------------------------------------------------------
-- Organizer functions
-- ---------------------------------------------------------------------------
create or replace function public.generate_class_sessions(p_series uuid, p_weeks integer default 12)
returns integer
language plpgsql
security definer
set search_path = public
as $$
begin
  if not private.manages_series(p_series) then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
  return private.generate_class_sessions(p_series, least(greatest(coalesce(p_weeks, 12), 1), 26));
end;
$$;

-- Releases a booking and gives the pass session back when there is enough notice.
create or replace function private.release_class_booking(p_booking uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare b public.class_bookings; v_start timestamptz;
begin
  select * into b from public.class_bookings where id = p_booking for update;
  if not found or b.status in ('cancelled', 'rejected', 'checked_in', 'no_show') then return; end if;
  select starts_at into v_start from public.class_sessions where id = b.session_id;

  update public.class_bookings set status = 'cancelled', cancelled_at = now() where id = b.id;

  if b.pass_purchase_id is not null and v_start - now() >= interval '2 hours' then
    update public.pass_purchases
       set sessions_used = greatest(sessions_used - 1, 0),
           status = case when status = 'exhausted' and (valid_until is null or valid_until > now()) then 'active'::public.pass_status else status end
     where id = b.pass_purchase_id;
  end if;

  update public.product_payments set status = 'rejected', reject_reason = coalesce(p_reason, 'Booking cancelled'), reviewed_at = now()
   where kind = 'class_booking' and subject_id = b.id and status = 'submitted';
end;
$$;

create or replace function public.cancel_class_session(p_session uuid, p_reason text default null)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  se public.class_sessions;
  sr public.class_series;
  b record;
  n integer := 0;
begin
  select * into se from public.class_sessions where id = p_session for update;
  if not found then raise exception 'NOT_FOUND' using errcode = 'P0002'; end if;
  if not private.manages_series(se.series_id) then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
  select * into sr from public.class_series where id = se.series_id;

  update public.class_sessions set status = 'cancelled', cancel_reason = p_reason where id = se.id;

  for b in select id, attendee_id from public.class_bookings
           where session_id = se.id and status not in ('cancelled', 'rejected', 'checked_in', 'no_show') loop
    -- the organizer cancelled, so the pass session always goes back
    update public.pass_purchases
       set sessions_used = greatest(sessions_used - 1, 0),
           status = case when status = 'exhausted' and (valid_until is null or valid_until > now()) then 'active'::public.pass_status else status end
     where id = (select pass_purchase_id from public.class_bookings where id = b.id);
    update public.class_bookings set status = 'cancelled', cancelled_at = now() where id = b.id;
    perform private.notify(b.attendee_id, null, 'class_cancelled', 'Class cancelled',
      sr.title || ' on ' || to_char(se.starts_at at time zone 'Asia/Karachi', 'DD Mon HH12:MI AM') || ' has been cancelled.'
        || coalesce(' ' || p_reason, ''), jsonb_build_object('session_id', se.id, 'series_id', sr.id));
    n := n + 1;
  end loop;
  return n;
end;
$$;

-- ---------------------------------------------------------------------------
-- Attendee functions
-- ---------------------------------------------------------------------------
create or replace function private.activate_pass(p_pass uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare p public.pass_purchases; v_days integer;
begin
  select * into p from public.pass_purchases where id = p_pass for update;
  select validity_days into v_days from public.pass_products where id = p.product_id;
  update public.pass_purchases
     set status = 'active', approved_at = now(), valid_from = now(),
         valid_until = now() + make_interval(days => v_days), price_paid_pkr = price_due_pkr
   where id = p.id;
end;
$$;

create or replace function public.purchase_pass(p_product uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  p public.pass_products;
  v_id uuid;
begin
  if uid is null or private.my_role() is distinct from 'attendee' then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
  select * into p from public.pass_products where id = p_product and is_active;
  if not found then raise exception 'PRODUCT_NOT_FOUND: that pass is not available.' using errcode = 'P0002'; end if;
  if not private.can_publish(p.organizer_id) then
    raise exception 'UNAVAILABLE: this organizer is not selling passes right now.' using errcode = 'check_violation';
  end if;

  insert into public.pass_purchases (product_id, organizer_id, attendee_id, status, sessions_total, price_due_pkr)
  values (p.id, p.organizer_id, uid, 'awaiting_payment', p.sessions_count, p.price_pkr)
  returning id into v_id;

  if p.price_pkr = 0 then
    perform private.activate_pass(v_id);
  else
    perform private.notify(p.organizer_id, null, 'pass_purchase', 'New pass purchase',
      p.name || ' is waiting for payment.', jsonb_build_object('pass_purchase_id', v_id));
  end if;
  return v_id;
end;
$$;

create or replace function public.book_class_session(p_session uuid, p_pass uuid default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  se public.class_sessions;
  sr public.class_series;
  pp public.pass_purchases;
  v_cap integer;
  v_taken integer;
  v_price integer := 0;
  v_status public.registration_status;
  v_id uuid;
begin
  if uid is null or private.my_role() is distinct from 'attendee' then raise exception 'FORBIDDEN' using errcode = '42501'; end if;

  select * into se from public.class_sessions where id = p_session for update;
  if not found or se.status <> 'scheduled' or se.starts_at <= now() then
    raise exception 'SESSION_UNAVAILABLE: that class is not open for booking.' using errcode = 'check_violation';
  end if;
  select * into sr from public.class_series where id = se.series_id;
  if sr.status <> 'published' or sr.admin_status <> 'live' then
    raise exception 'SESSION_UNAVAILABLE: that class is not open for booking.' using errcode = 'check_violation';
  end if;
  if exists (select 1 from public.class_bookings b
             where b.session_id = se.id and b.attendee_id = uid and b.status not in ('rejected', 'cancelled')) then
    raise exception 'ALREADY_BOOKED: you already have a place in this class.' using errcode = 'unique_violation';
  end if;

  v_cap := coalesce(se.capacity, sr.capacity);
  if v_cap is not null then
    select count(*) into v_taken from public.class_bookings b
      where b.session_id = se.id and b.status = any (private.class_seat_statuses());
    if v_taken >= v_cap then
      raise exception 'SESSION_FULL: this class is full.' using errcode = 'check_violation';
    end if;
  end if;

  if p_pass is not null then
    select * into pp from public.pass_purchases where id = p_pass and attendee_id = uid for update;
    if not found or pp.status <> 'active' or pp.organizer_id <> sr.organizer_id
       or (pp.valid_until is not null and pp.valid_until < se.starts_at) then
      raise exception 'PASS_INVALID: that pass cannot be used for this class.' using errcode = 'check_violation';
    end if;
    if exists (select 1 from public.pass_products pr
               where pr.id = pp.product_id and pr.series_id is not null and pr.series_id <> sr.id) then
      raise exception 'PASS_SCOPE: that pass is for a different class.' using errcode = 'check_violation';
    end if;
    if pp.sessions_total is not null and pp.sessions_used >= pp.sessions_total then
      raise exception 'PASS_EMPTY: that pass has no sessions left.' using errcode = 'check_violation';
    end if;
    update public.pass_purchases
       set sessions_used = sessions_used + 1,
           status = case when sessions_total is not null and sessions_used + 1 >= sessions_total
                         then 'exhausted'::public.pass_status else status end
     where id = pp.id;
    v_status := 'confirmed';
  else
    v_price := sr.drop_in_price_pkr;
    v_status := case when v_price = 0 then 'confirmed'::public.registration_status
                     else 'awaiting_payment'::public.registration_status end;
  end if;

  insert into public.class_bookings (session_id, series_id, organizer_id, attendee_id, pass_purchase_id,
                                     status, price_due_pkr, approved_at)
  values (se.id, sr.id, sr.organizer_id, uid, p_pass, v_status, v_price,
          case when v_status = 'confirmed' then now() end)
  returning id into v_id;

  perform private.notify(sr.organizer_id, null, 'class_booking', 'New class booking',
    sr.title || ' on ' || to_char(se.starts_at at time zone 'Asia/Karachi', 'DD Mon HH12:MI AM'),
    jsonb_build_object('booking_id', v_id, 'series_id', sr.id));
  return v_id;
end;
$$;

create or replace function public.cancel_class_booking(p_booking uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare b public.class_bookings;
begin
  select * into b from public.class_bookings where id = p_booking;
  if not found then raise exception 'NOT_FOUND' using errcode = 'P0002'; end if;
  if b.attendee_id <> auth.uid() and not private.manages_series(b.series_id) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  perform private.release_class_booking(b.id, 'Booking cancelled');
end;
$$;

-- ---------------------------------------------------------------------------
-- Scheduled work (called by pg_cron, service role only)
-- ---------------------------------------------------------------------------
create or replace function public.process_class_sessions()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare b record; n integer := 0; s record;
begin
  -- 1. Look ahead: keep 12 weeks of sessions for every published series.
  for s in select id from public.class_series where status = 'published' and admin_status = 'live' loop
    perform private.generate_class_sessions(s.id, 12);
  end loop;

  -- 2. Confirmed bookings for sessions that ended more than an hour ago become no shows.
  for b in
    select cb.id, cb.attendee_id from public.class_bookings cb
    join public.class_sessions x on x.id = cb.session_id
    where cb.status = 'confirmed' and x.ends_at < now() - interval '1 hour'
  loop
    update public.class_bookings set status = 'no_show' where id = b.id;
    perform private.award_score(b.attendee_id, null, null, -10, 'Missed class', false, true);
    n := n + 1;
  end loop;

  -- 3. Unpaid bookings for sessions that already started are cancelled.
  for b in
    select cb.id from public.class_bookings cb
    join public.class_sessions x on x.id = cb.session_id
    where cb.status in ('awaiting_payment', 'payment_submitted') and x.starts_at < now()
  loop
    perform private.release_class_booking(b.id, 'Payment not received before class');
  end loop;

  -- 4. Close out sessions and expire passes.
  update public.class_sessions set status = 'completed' where status = 'scheduled' and ends_at < now();
  update public.pass_purchases set status = 'expired'
   where status in ('active', 'exhausted') and valid_until is not null and valid_until < now();
  update public.class_series set status = 'ended'
   where status = 'published' and ends_on is not null and ends_on < private.pk_date(now());

  return n;
end;
$$;

commit;
