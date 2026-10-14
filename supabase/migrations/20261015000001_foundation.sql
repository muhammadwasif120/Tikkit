-- TIKKIT X baseline 1/9: foundation (schemas, enums, shared helpers)
-- See docs/SCHEMA_DESIGN.md. Replayable on an empty Supabase project.

begin;

-- Internal helpers live in schema "private", which is not exposed through the API.
create schema if not exists private;
grant usage on schema private to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.user_role            as enum ('organizer', 'attendee', 'admin');
create type public.gender               as enum ('male', 'female', 'other');
create type public.id_type              as enum ('cnic', 'passport');
create type public.id_status            as enum ('none', 'pending', 'verified', 'rejected');
create type public.score_tier           as enum ('new', 'reliable', 'regular', 'trusted');

create type public.event_status         as enum ('draft', 'published', 'completed', 'cancelled', 'archived');
create type public.event_visibility     as enum ('public', 'private');
create type public.registration_mode    as enum ('open', 'approval');
create type public.admin_status         as enum ('live', 'flagged', 'suspended');

create type public.registration_source  as enum ('self', 'invited', 'manual');
create type public.registration_status  as enum (
  'requested', 'awaiting_payment', 'payment_submitted', 'confirmed',
  'checked_in', 'rejected', 'cancelled', 'waitlisted', 'no_show'
);
create type public.review_status        as enum ('submitted', 'approved', 'rejected');
create type public.payment_method       as enum ('bank', 'jazzcash', 'easypaisa', 'other');
create type public.scan_result          as enum ('admitted', 'duplicate', 'not_approved', 'wrong_day', 'invalid');

create type public.discount_type        as enum ('percent', 'fixed');
create type public.discount_funder      as enum ('organizer', 'referrer', 'split');
create type public.commission_mode      as enum ('none', 'percent', 'fixed', 'tiered');
create type public.commission_status    as enum ('accrued', 'approved', 'paid', 'void');

create type public.subscription_status  as enum ('trial', 'active', 'grace', 'expired', 'cancelled');
create type public.billing_period       as enum ('month', 'year');

-- ---------------------------------------------------------------------------
-- Shared trigger: keep updated_at fresh
-- ---------------------------------------------------------------------------
create or replace function private.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Role helpers. SECURITY DEFINER so policies can call them without needing
-- read access to profiles. They read only the caller's own role.
-- ---------------------------------------------------------------------------
-- plpgsql so the body is not validated until first call (profiles is created next migration).
create or replace function private.my_role()
returns public.user_role
language plpgsql
stable
security definer
set search_path = public
as $$
declare r public.user_role;
begin
  select p.role into r from public.profiles p where p.id = auth.uid();
  return r;
end;
$$;

create or replace function private.is_admin()
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return coalesce(private.my_role() = 'admin', false);
end;
$$;

create or replace function private.is_organizer()
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return coalesce(private.my_role() = 'organizer', false);
end;
$$;

-- Pakistan business day for an instant (events and day tickets use local dates).
create or replace function private.pk_date(ts timestamptz)
returns date
language sql
immutable
as $$
  select (ts at time zone 'Asia/Karachi')::date
$$;

-- SHA-256 hex of a token, used for gate staff and promoter links.
create or replace function private.token_hash(token text)
returns text
language sql
immutable
as $$
  select encode(sha256(convert_to(token, 'utf8')), 'hex')
$$;

create or replace function private.new_token()
returns text
language sql
volatile
as $$
  select replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '')
$$;

commit;
