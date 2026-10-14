-- TIKKIT X baseline 5/10: referrals, registrations, payments, door (scans, gate staff links)

begin;

-- ---------------------------------------------------------------------------
-- Referrals and coupons
-- ---------------------------------------------------------------------------
create table public.referrers (
  id                uuid primary key default gen_random_uuid(),
  organizer_id      uuid not null references public.profiles (id) on delete cascade,
  name              text not null,
  phone             text,
  email             text,
  access_token_hash text unique,          -- promoter dashboard link, shown once
  is_active         boolean not null default true,
  created_at        timestamptz not null default now()
);
create index referrers_org_idx on public.referrers (organizer_id);

create table public.organizer_commission_defaults (
  organizer_id uuid primary key references public.profiles (id) on delete cascade,
  mode         public.commission_mode not null default 'none',
  value        integer not null default 0 check (value >= 0),
  tiers        jsonb,   -- [{"upto":20,"value":5},{"value":10}] value = percent or PKR per mode
  updated_at   timestamptz not null default now()
);

create table public.referral_links (
  id                   uuid primary key default gen_random_uuid(),
  event_id             uuid not null references public.events (id) on delete cascade,
  referrer_id          uuid not null references public.referrers (id) on delete cascade,
  code                 text not null check (code ~ '^[A-Za-z0-9_-]{3,24}$'),
  commission_mode      public.commission_mode,      -- null = inherit organizer default
  commission_value     integer check (commission_value is null or commission_value >= 0),
  commission_tiers     jsonb,
  buyer_discount_type  public.discount_type,
  buyer_discount_value integer check (buyer_discount_value is null or buyer_discount_value >= 0),
  discount_funded_by   public.discount_funder not null default 'organizer',
  max_uses             integer check (max_uses is null or max_uses > 0),
  uses                 integer not null default 0,
  expires_at           timestamptz,
  is_active            boolean not null default true,
  created_at           timestamptz not null default now()
);
create unique index referral_links_event_code_uq on public.referral_links (event_id, lower(code));
create index referral_links_referrer_idx on public.referral_links (referrer_id);

create table public.coupons (
  id             uuid primary key default gen_random_uuid(),
  event_id       uuid not null references public.events (id) on delete cascade,
  code           text not null check (code ~ '^[A-Za-z0-9_-]{3,24}$'),
  discount_type  public.discount_type not null,
  discount_value integer not null check (discount_value > 0),
  max_uses       integer check (max_uses is null or max_uses > 0),
  uses           integer not null default 0,
  expires_at     timestamptz,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now()
);
create unique index coupons_event_code_uq on public.coupons (event_id, lower(code));

-- ---------------------------------------------------------------------------
-- Registrations: the single record of an attendee's relationship to an event
-- ---------------------------------------------------------------------------
create table public.registrations (
  id                    uuid primary key default gen_random_uuid(),
  event_id              uuid not null references public.events (id) on delete cascade,
  attendee_id           uuid references public.profiles (id) on delete set null,
  ticket_type_id        uuid references public.ticket_types (id) on delete set null,
  source                public.registration_source not null default 'self',
  status                public.registration_status not null default 'requested',
  status_reason         text,
  full_name             text not null,
  phone                 text,
  email                 text,
  gender                public.gender,
  ticket_days           date[],
  plus_one              boolean not null default false,
  plus_one_name         text,
  is_vip                boolean not null default false,
  notes                 text,
  price_due_pkr         integer not null default 0 check (price_due_pkr >= 0),
  discount_pkr          integer not null default 0 check (discount_pkr >= 0),
  price_paid_pkr        integer check (price_paid_pkr is null or price_paid_pkr >= 0),
  referrer_id           uuid references public.referrers (id) on delete set null,
  referral_link_id      uuid references public.referral_links (id) on delete set null,
  coupon_id             uuid references public.coupons (id) on delete set null,
  reference_code_entered text,
  qr_token              text not null unique default private.new_token(),
  approved_at           timestamptz,
  checked_in_at         timestamptz,
  cancelled_at          timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create unique index registrations_event_attendee_uq on public.registrations (event_id, attendee_id)
  where attendee_id is not null and status not in ('rejected', 'cancelled');
create index registrations_event_status_idx on public.registrations (event_id, status);
create index registrations_attendee_idx on public.registrations (attendee_id);
create index registrations_referrer_idx on public.registrations (referrer_id) where referrer_id is not null;
create trigger registrations_updated_at before update on public.registrations
  for each row execute function private.set_updated_at();

alter table public.score_events
  add constraint score_events_registration_fk foreign key (registration_id)
  references public.registrations (id) on delete set null;

create table public.commissions (
  id              uuid primary key default gen_random_uuid(),
  registration_id uuid not null unique references public.registrations (id) on delete cascade,
  event_id        uuid not null references public.events (id) on delete cascade,
  organizer_id    uuid not null references public.profiles (id) on delete cascade,
  referrer_id     uuid not null references public.referrers (id) on delete cascade,
  amount_pkr      integer not null check (amount_pkr >= 0),
  status          public.commission_status not null default 'accrued',
  paid_at         timestamptz,
  note            text,
  created_at      timestamptz not null default now()
);
create index commissions_org_idx on public.commissions (organizer_id, status);
create index commissions_referrer_idx on public.commissions (referrer_id);

-- ---------------------------------------------------------------------------
-- Manual payments (screenshots), unchanged model from the live product
-- ---------------------------------------------------------------------------
create table public.payment_accounts (
  id             uuid primary key default gen_random_uuid(),
  organizer_id   uuid not null references public.profiles (id) on delete cascade,
  method         public.payment_method not null default 'bank',
  label          text,
  account_title  text not null,
  account_number text not null,
  bank_name      text,
  iban           text,
  instructions   text,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now()
);
create index payment_accounts_org_idx on public.payment_accounts (organizer_id);

create table public.event_payment_accounts (
  event_id           uuid not null references public.events (id) on delete cascade,
  payment_account_id uuid not null references public.payment_accounts (id) on delete cascade,
  primary key (event_id, payment_account_id)
);

create table public.payment_submissions (
  id              uuid primary key default gen_random_uuid(),
  registration_id uuid not null references public.registrations (id) on delete cascade,
  screenshot_path text,
  reference       text,
  amount_pkr      integer check (amount_pkr is null or amount_pkr >= 0),
  status          public.review_status not null default 'submitted',
  reviewed_by     uuid references public.profiles (id),
  reviewed_at     timestamptz,
  reason          text,
  created_at      timestamptz not null default now()
);
create index payment_submissions_reg_idx on public.payment_submissions (registration_id);
create index payment_submissions_open_idx on public.payment_submissions (status) where status = 'submitted';

-- ---------------------------------------------------------------------------
-- Door: gate staff links and scan log
-- ---------------------------------------------------------------------------
create table public.gate_staff_links (
  id           uuid primary key default gen_random_uuid(),
  organizer_id uuid not null references public.profiles (id) on delete cascade,
  label        text not null,
  event_ids    uuid[] not null check (cardinality(event_ids) > 0),
  token_hash   text not null unique,
  expires_at   timestamptz not null,         -- set to event end plus a buffer
  revoked_at   timestamptz,
  last_used_at timestamptz,
  created_at   timestamptz not null default now()
);
create index gate_staff_links_org_idx on public.gate_staff_links (organizer_id);

create table public.scan_logs (
  id              uuid primary key default gen_random_uuid(),
  event_id        uuid not null references public.events (id) on delete cascade,
  registration_id uuid references public.registrations (id) on delete set null,
  scanned_by      uuid references public.profiles (id),
  gate_link_id    uuid references public.gate_staff_links (id) on delete set null,
  result          public.scan_result not null,
  offline_synced  boolean not null default false,
  note            text,
  scanned_at      timestamptz not null default now()
);
create index scan_logs_event_idx on public.scan_logs (event_id, scanned_at desc);
create index scan_logs_registration_idx on public.scan_logs (registration_id);

commit;
