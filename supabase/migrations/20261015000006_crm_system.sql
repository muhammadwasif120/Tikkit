-- TIKKIT X baseline 6/10: organizer CRM extras and system tables

begin;

-- Vendor contacts and invoices: kept from the live product.
create table public.organizer_vendors (
  id            uuid primary key default gen_random_uuid(),
  organizer_id  uuid not null references public.profiles (id) on delete cascade,
  name          text not null,
  category      text,
  contact_name  text,
  contact_email text,
  contact_phone text,
  notes         text,
  event_ids     uuid[] not null default '{}',
  created_at    timestamptz not null default now()
);
create index organizer_vendors_org_idx on public.organizer_vendors (organizer_id);

create table public.organizer_vendor_invoices (
  id             uuid primary key default gen_random_uuid(),
  organizer_id   uuid not null references public.profiles (id) on delete cascade,
  vendor_id      uuid not null references public.organizer_vendors (id) on delete cascade,
  event_id       uuid references public.events (id) on delete set null,
  invoice_number text,
  amount_pkr     integer not null check (amount_pkr >= 0),
  due_date       date,
  status         text not null default 'pending' check (status in ('pending', 'paid')),
  description    text,
  document_path  text,
  paid_at        timestamptz,
  created_at     timestamptz not null default now()
);
create index organizer_vendor_invoices_org_idx on public.organizer_vendor_invoices (organizer_id, status);
create index organizer_vendor_invoices_vendor_idx on public.organizer_vendor_invoices (vendor_id);

-- In-app notifications (announcements, approvals, location reveals). Written by functions only.
create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  event_id   uuid references public.events (id) on delete cascade,
  type       text not null,
  title      text not null,
  body       text,
  metadata   jsonb not null default '{}'::jsonb,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, created_at desc);
create index notifications_unread_idx on public.notifications (user_id) where read_at is null;

-- Push tokens for the frozen mobile app.
create table public.push_tokens (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  token      text not null unique,
  platform   text,
  created_at timestamptz not null default now()
);
create index push_tokens_user_idx on public.push_tokens (user_id);

-- Email queue. A server route sends queued rows through Resend.
create table public.email_outbox (
  id         uuid primary key default gen_random_uuid(),
  to_email   text not null,
  template   text not null,
  payload    jsonb not null default '{}'::jsonb,
  status     text not null default 'queued' check (status in ('queued', 'sent', 'failed')),
  attempts   integer not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  sent_at    timestamptz
);
create index email_outbox_queued_idx on public.email_outbox (created_at) where status = 'queued';

create table public.admin_audit_log (
  id         uuid primary key default gen_random_uuid(),
  actor_id   uuid references public.profiles (id),
  action     text not null,
  entity     text,
  entity_id  text,
  details    jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index admin_audit_log_created_idx on public.admin_audit_log (created_at desc);

commit;
