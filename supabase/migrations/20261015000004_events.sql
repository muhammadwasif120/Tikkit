-- TIKKIT X baseline 4/9: events, secrets, ticket types, announcements

begin;

create table public.event_categories (
  id    uuid primary key default gen_random_uuid(),
  name  text not null,
  slug  text not null unique,
  icon  text,
  color text,
  sort  integer not null default 0
);

create table public.events (
  id                  uuid primary key default gen_random_uuid(),
  organizer_id        uuid not null references public.profiles (id) on delete cascade,
  slug                text unique,
  title               text not null check (length(trim(title)) > 0),
  description         text,
  cover_image_url     text,
  category_id         uuid references public.event_categories (id) on delete set null,
  tags                text[] not null default '{}',
  city                text,
  area_label          text,                 -- public, e.g. "DHA Phase 6"
  venue_name          text,                 -- public unless is_secret_venue
  venue_address       text,                 -- public address; always null when is_secret_venue (see event_secrets)
  is_secret_venue     boolean not null default false,
  starts_at           timestamptz not null,
  ends_at             timestamptz,
  capacity            integer check (capacity is null or capacity > 0),
  status              public.event_status not null default 'draft',
  visibility          public.event_visibility not null default 'public',
  registration_mode   public.registration_mode not null default 'open',
  require_id_verified boolean not null default false,
  male_ratio_max      integer check (male_ratio_max is null or male_ratio_max between 0 and 100),
  female_ratio_max    integer check (female_ratio_max is null or female_ratio_max between 0 and 100),
  admin_status        public.admin_status not null default 'live',
  published_at        timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  check (ends_at is null or ends_at >= starts_at)
);
create index events_organizer_idx on public.events (organizer_id, starts_at desc);
create index events_listing_idx   on public.events (starts_at)
  where status = 'published' and visibility = 'public' and admin_status = 'live';
create index events_city_idx      on public.events (city);
create index events_category_idx  on public.events (category_id);

-- Secrets: the venue address and the private invite code. Never exposed by views.
create table public.event_secrets (
  event_id              uuid primary key references public.events (id) on delete cascade,
  venue_address         text,
  venue_notes           text,
  reveal_at             timestamptz,         -- null = never auto reveal (organizer announces)
  reveal_notified_at    timestamptz,
  require_reference_code boolean not null default false,
  reference_code        text
);

create table public.ticket_types (
  id                 uuid primary key default gen_random_uuid(),
  event_id           uuid not null references public.events (id) on delete cascade,
  name               text not null,
  price_pkr          integer not null default 0 check (price_pkr >= 0),
  original_price_pkr integer check (original_price_pkr is null or original_price_pkr >= 0),
  quantity           integer check (quantity is null or quantity > 0),   -- null = unlimited
  is_vip             boolean not null default false,
  sales_start        timestamptz,
  sales_end          timestamptz,                                        -- early bird cutoff
  sort               integer not null default 0,
  created_at         timestamptz not null default now(),
  check (sales_end is null or sales_start is null or sales_end > sales_start)
);
create index ticket_types_event_idx on public.ticket_types (event_id);

create table public.event_announcements (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references public.events (id) on delete cascade,
  author_id  uuid not null references public.profiles (id),
  body       text not null check (length(trim(body)) between 1 and 1000),
  send_email boolean not null default false,
  created_at timestamptz not null default now()
);
create index event_announcements_event_idx on public.event_announcements (event_id, created_at desc);

create table public.organizer_favourites (
  user_id      uuid not null references public.profiles (id) on delete cascade,
  organizer_id uuid not null references public.profiles (id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (user_id, organizer_id)
);

-- score_events can now reference events
alter table public.score_events
  add constraint score_events_event_fk foreign key (event_id) references public.events (id) on delete set null;

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------
create trigger events_updated_at before update on public.events
  for each row execute function private.set_updated_at();

create or replace function private.event_before_write()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_slug text;
  published_this_month integer;
  cap_limit integer;
begin
  if new.is_secret_venue then new.venue_address := null; end if;

  -- slug: title slug plus a short id, set once. Imports (service role) may supply their own.
  if tg_op = 'INSERT' then
    if new.id is null then new.id := gen_random_uuid(); end if;
    base_slug := lower(trim(both '-' from regexp_replace(regexp_replace(
                   replace(lower(coalesce(new.title, 'event')), ' ', '-'),
                   '[^a-z0-9-]', '', 'g'), '-+', '-', 'g')));
    if new.slug is null then
      new.slug := coalesce(nullif(base_slug, ''), 'event') || '-' || replace(substr(new.id::text, 1, 8), '-', '');
    end if;
  else
    new.slug := old.slug;
  end if;

  -- Only service role and the organizer's own session reach here via RLS, but the
  -- subscription rule must hold regardless of client.
  if tg_op = 'INSERT' and auth.role() in ('anon', 'authenticated') then
    if not private.can_publish(new.organizer_id) then
      raise exception 'SUBSCRIPTION_REQUIRED: your trial or plan has ended. Upgrade to create events.'
        using errcode = 'check_violation';
    end if;
  end if;

  -- publish prerequisites
  if new.status = 'published' and (tg_op = 'INSERT' or old.status is distinct from 'published') then
    if not exists (select 1 from public.profile_private pp
                   where pp.id = new.organizer_id and pp.id_status = 'verified') then
      raise exception 'ID_VERIFICATION_REQUIRED: verify your identity before publishing an event.'
        using errcode = 'check_violation';
    end if;

    if not private.can_publish(new.organizer_id) then
      raise exception 'SUBSCRIPTION_REQUIRED: your trial or plan has ended. Upgrade to publish.'
        using errcode = 'check_violation';
    end if;

    select count(*) into published_this_month
    from public.events e
    where e.organizer_id = new.organizer_id
      and e.id <> new.id
      and e.published_at >= date_trunc('month', now());
    if published_this_month >= private.plan_limit_int(new.organizer_id, 'events_per_month') then
      raise exception 'PLAN_LIMIT:events_per_month: your plan allows % published events per month.',
        private.plan_limit_int(new.organizer_id, 'events_per_month')
        using errcode = 'check_violation';
    end if;

    cap_limit := private.plan_limit_int(new.organizer_id, 'registrations_per_event');
    if cap_limit < 2147483647 and (new.capacity is null or new.capacity > cap_limit) then
      raise exception 'PLAN_LIMIT:registrations_per_event: set a capacity of % or fewer on your plan.', cap_limit
        using errcode = 'check_violation';
    end if;

    if new.require_id_verified and not private.plan_allows(new.organizer_id, 'id_required_events') then
      raise exception 'PLAN_LIMIT:id_required_events: ID-verified-only events need the Growth or Pro plan.'
        using errcode = 'check_violation';
    end if;

    new.published_at := coalesce(new.published_at, now());
  end if;

  return new;
end;
$$;

create trigger events_before_write before insert or update on public.events
  for each row execute function private.event_before_write();

-- Every event gets a secrets row so joins are simple.
create or replace function private.event_after_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.event_secrets (event_id) values (new.id) on conflict do nothing;
  return new;
end;
$$;
create trigger events_after_insert after insert on public.events
  for each row execute function private.event_after_insert();

commit;
