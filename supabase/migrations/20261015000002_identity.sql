-- TIKKIT X baseline 2/9: identity (profiles, private data, organizer public profile, attendee score)

begin;

-- Public-safe profile. No email, phone, ID or DOB lives here.
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  role        public.user_role not null default 'attendee',
  full_name   text not null,
  username    text unique check (username is null or username ~ '^[a-z0-9_-]{3,30}$'),
  avatar_url  text,
  city        text,
  country     text not null default 'PK',
  ui_theme    text not null default 'dark' check (ui_theme in ('dark', 'light')),
  is_complete boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index profiles_role_idx on public.profiles (role);
create trigger profiles_updated_at before update on public.profiles
  for each row execute function private.set_updated_at();

-- Private personal data. Owner and admin only.
create table public.profile_private (
  id                 uuid primary key references public.profiles (id) on delete cascade,
  email              text not null,
  phone              text,
  date_of_birth      date,
  gender             public.gender,
  id_type            public.id_type,
  id_number_enc      text,            -- AES-GCM ciphertext (CNIC_ENCRYPTION_KEY), never plaintext
  id_image_path      text,            -- object path in bucket id-documents
  id_expiry          date,
  id_status          public.id_status not null default 'none',
  id_submitted_at    timestamptz,
  id_reviewed_by     uuid references public.profiles (id),
  id_reviewed_at     timestamptz,
  id_reject_reason   text,
  notification_prefs jsonb not null default '{}'::jsonb,
  updated_at         timestamptz not null default now()
);
create trigger profile_private_updated_at before update on public.profile_private
  for each row execute function private.set_updated_at();

-- Public organizer details. Contact info here replaces in-app messaging.
create table public.organizer_profiles (
  id             uuid primary key references public.profiles (id) on delete cascade,
  company_name   text,
  bio            text,
  logo_url       text,
  cover_url      text,
  whatsapp       text,
  contact_email  text,
  instagram      text,
  website        text,
  public_contact boolean not null default true,
  updated_at     timestamptz not null default now()
);
create trigger organizer_profiles_updated_at before update on public.organizer_profiles
  for each row execute function private.set_updated_at();

-- Attendee score. Written only by private.award_score().
create table public.attendee_stats (
  id             uuid primary key references public.profiles (id) on delete cascade,
  score          integer not null default 0,
  tier           public.score_tier not null default 'new',
  attended       integer not null default 0,
  no_shows       integer not null default 0,
  vip_events     integer not null default 0,
  streak         integer not null default 0,
  longest_streak integer not null default 0,
  updated_at     timestamptz not null default now()
);

create table public.score_events (
  id              uuid primary key default gen_random_uuid(),
  attendee_id     uuid not null references public.profiles (id) on delete cascade,
  event_id        uuid,            -- FK added after events exists
  registration_id uuid,            -- FK added after registrations exists
  delta           integer not null,
  reason          text not null,
  created_at      timestamptz not null default now()
);
create index score_events_attendee_idx on public.score_events (attendee_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Completeness: attendees need phone, DOB, city, gender. Organizers need phone,
-- city and company. Maintained by trigger so no query is needed per page load.
-- ---------------------------------------------------------------------------
create or replace function private.recompute_profile_complete(uid uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  p  public.profiles;
  pp public.profile_private;
  op public.organizer_profiles;
  ok boolean := false;
begin
  select * into p  from public.profiles where id = uid;
  if not found then return; end if;
  select * into pp from public.profile_private where id = uid;
  select * into op from public.organizer_profiles where id = uid;

  if p.role = 'attendee' then
    ok := coalesce(pp.phone, '') <> '' and pp.date_of_birth is not null and pp.gender is not null
          and coalesce(p.city, '') <> '';
  elsif p.role = 'organizer' then
    ok := coalesce(pp.phone, '') <> '' and coalesce(p.city, '') <> ''
          and coalesce(op.company_name, '') <> '';
  else
    ok := true;
  end if;

  update public.profiles set is_complete = ok where id = uid and is_complete is distinct from ok;
end;
$$;

create or replace function private.trg_recompute_complete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform private.recompute_profile_complete(new.id);
  return new;
end;
$$;

create trigger profiles_complete_after after insert or update of city, role on public.profiles
  for each row execute function private.trg_recompute_complete();
create trigger profile_private_complete_after after insert or update on public.profile_private
  for each row execute function private.trg_recompute_complete();
create trigger organizer_profiles_complete_after after insert or update on public.organizer_profiles
  for each row execute function private.trg_recompute_complete();

-- ---------------------------------------------------------------------------
-- Trust-field guard. Clients can never change role, ID status or score data.
-- Those columns are also excluded from client UPDATE grants (see rls migration);
-- this trigger is the second line of defence.
-- ---------------------------------------------------------------------------
create or replace function private.guard_profile_trust()
returns trigger
language plpgsql
as $$
begin
  if auth.role() in ('anon', 'authenticated') then
    if tg_table_name = 'profiles' and new.role is distinct from old.role then
      raise exception 'role cannot be changed' using errcode = '42501';
    end if;
    if tg_table_name = 'profile_private' and (
         new.id_status       is distinct from old.id_status
      or new.id_reviewed_by  is distinct from old.id_reviewed_by
      or new.id_reviewed_at  is distinct from old.id_reviewed_at
      or new.id_reject_reason is distinct from old.id_reject_reason
    ) then
      raise exception 'verification fields are managed by TIKKIT X' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

create trigger profiles_guard before update on public.profiles
  for each row execute function private.guard_profile_trust();
create trigger profile_private_guard before update on public.profile_private
  for each row execute function private.guard_profile_trust();

-- ---------------------------------------------------------------------------
-- Signup: create all identity rows from auth.users metadata.
-- Metadata is user-controlled, so role is limited to organizer or attendee.
-- Admins are promoted only by service role.
-- ---------------------------------------------------------------------------
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta     jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_role   public.user_role;
  v_name   text;
  v_gender public.gender;
  v_dob    date;
begin
  v_role := case when meta ->> 'role' = 'organizer' then 'organizer'::public.user_role
                 else 'attendee'::public.user_role end;
  v_name := coalesce(nullif(trim(meta ->> 'full_name'), ''), nullif(trim(meta ->> 'name'), ''),
                     split_part(new.email, '@', 1), 'New user');

  begin v_gender := (meta ->> 'gender')::public.gender; exception when others then v_gender := null; end;
  begin v_dob    := (meta ->> 'date_of_birth')::date;   exception when others then v_dob := null; end;

  insert into public.profiles (id, role, full_name, city, avatar_url)
  values (new.id, v_role, v_name, nullif(trim(meta ->> 'city'), ''),
          coalesce(meta ->> 'avatar_url', meta ->> 'picture'));

  insert into public.profile_private (id, email, phone, date_of_birth, gender)
  values (new.id, coalesce(new.email, ''), nullif(trim(meta ->> 'phone'), ''), v_dob, v_gender);

  if v_role = 'organizer' then
    insert into public.organizer_profiles (id, company_name)
    values (new.id, nullif(trim(meta ->> 'company_name'), ''));
  else
    insert into public.attendee_stats (id) values (new.id);
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

commit;
