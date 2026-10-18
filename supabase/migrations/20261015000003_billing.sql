-- TIKKIT X baseline 3/9: organizer subscription (plans, limits, payments, invoices)

begin;

create table public.plans (
  id               text primary key,   -- 'trial', 'starter', 'growth', 'pro'
  name             text not null,
  price_pkr_month  integer not null default 0,
  price_pkr_year   integer not null default 0,
  sort             integer not null default 0,
  is_purchasable   boolean not null default true
);

-- Limits are data, not code. -1 means unlimited. Booleans are stored as true/false.
create table public.plan_limits (
  plan_id text not null references public.plans (id) on delete cascade,
  key     text not null,
  value   jsonb not null,
  primary key (plan_id, key)
);

create table public.organizer_subscriptions (
  organizer_id         uuid primary key references public.profiles (id) on delete cascade,
  plan_id              text not null references public.plans (id),
  status               public.subscription_status not null default 'trial',
  billing_period       public.billing_period,
  trial_ends_at        timestamptz,
  current_period_start timestamptz,
  current_period_end   timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create trigger organizer_subscriptions_updated_at before update on public.organizer_subscriptions
  for each row execute function private.set_updated_at();

-- Manual payment (transfer to the Two Bit Digital account), approved by admin.
create table public.subscription_payments (
  id              uuid primary key default gen_random_uuid(),
  organizer_id    uuid not null references public.profiles (id) on delete cascade,
  plan_id         text not null references public.plans (id),
  period          public.billing_period not null,
  amount_pkr      integer not null check (amount_pkr >= 0),
  screenshot_path text,
  reference       text,
  status          public.review_status not null default 'submitted',
  reviewed_by     uuid references public.profiles (id),
  reviewed_at     timestamptz,
  reject_reason   text,
  created_at      timestamptz not null default now()
);
create index subscription_payments_org_idx on public.subscription_payments (organizer_id, created_at desc);
create index subscription_payments_status_idx on public.subscription_payments (status) where status = 'submitted';

create sequence public.subscription_invoice_seq start 1001;

create table public.subscription_invoices (
  id           uuid primary key default gen_random_uuid(),
  number       text not null unique,        -- e.g. TKX-2026-1001
  organizer_id uuid not null references public.profiles (id) on delete cascade,
  payment_id   uuid not null unique references public.subscription_payments (id) on delete cascade,
  plan_id      text not null references public.plans (id),
  period       public.billing_period not null,
  amount_pkr   integer not null,
  issued_at    timestamptz not null default now(),
  period_start timestamptz not null,
  period_end   timestamptz not null
);
create index subscription_invoices_org_idx on public.subscription_invoices (organizer_id, issued_at desc);

-- ---------------------------------------------------------------------------
-- Effective subscription state. The stored status is a hint; dates decide.
--   trial     : within trial_ends_at
--   active    : within current_period_end
--   grace     : up to 7 days after current_period_end (still allowed to publish)
--   expired   : read-only until upgrade
-- ---------------------------------------------------------------------------
create or replace function private.subscription_state(uid uuid)
returns public.subscription_status
language plpgsql
stable
security definer
set search_path = public
as $$
declare s public.organizer_subscriptions;
begin
  select * into s from public.organizer_subscriptions where organizer_id = uid;
  if not found then return 'expired'; end if;

  if s.status = 'trial' then
    return case when s.trial_ends_at is not null and s.trial_ends_at > now() then 'trial' else 'expired' end;
  end if;

  if s.status in ('active', 'cancelled') then
    if s.current_period_end is not null and s.current_period_end > now() then
      return case when s.status = 'cancelled' then 'cancelled' else 'active' end;
    elsif s.current_period_end is not null and s.current_period_end + interval '7 days' > now()
          and s.status = 'active' then
      return 'grace';
    end if;
    return 'expired';
  end if;

  return s.status;
end;
$$;

-- True when the organizer may create and publish (trial, active, grace).
create or replace function private.can_publish(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select private.subscription_state(uid) in ('trial', 'active', 'grace')
$$;

-- Limit lookup for the organizer's current plan. Returns null if no limit row.
create or replace function private.plan_limit(uid uuid, k text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select l.value
  from public.organizer_subscriptions s
  join public.plan_limits l on l.plan_id = s.plan_id and l.key = k
  where s.organizer_id = uid
$$;

-- Integer limit with unlimited = -1 mapped to a very large number, missing = 0.
create or replace function private.plan_limit_int(uid uuid, k text)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select case
    when v is null then 0
    when (v #>> '{}')::int = -1 then 2147483647
    else (v #>> '{}')::int
  end
  from (select private.plan_limit(uid, k) as v) x
$$;

create or replace function private.plan_allows(uid uuid, k text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((private.plan_limit(uid, k) #>> '{}')::boolean, false)
$$;

-- New organizers get a 14 day trial at trial-plan limits.
create or replace function private.start_trial()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.organizer_subscriptions (organizer_id, plan_id, status, trial_ends_at)
  values (new.id, 'trial', 'trial', now() + interval '14 days')
  on conflict (organizer_id) do nothing;
  return new;
end;
$$;

create trigger organizer_profiles_start_trial after insert on public.organizer_profiles
  for each row execute function private.start_trial();

commit;
