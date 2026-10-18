-- TIKKIT X: Pro-only spaces, account suspension, reports, and the admin insight functions
--
-- 1. Spaces move to the Pro plan (retreats already are). Existing published spaces stay as they are; the limit applies to new ones.
-- 2. Accounts can be suspended by an admin: sign-in is blocked, sessions are ended, and an organizer's events, classes and spaces
--    leave the public site until the account is reinstated.
-- 3. Reports: signed in users can report an organizer, a guest or an event. Admins work a queue.
-- 4. Admin only functions that return the numbers behind the admin dashboard, organizer list, attendee list and user detail.

begin;

-- ---------------------------------------------------------------------------
-- 1. Spaces are part of the Pro plan
-- ---------------------------------------------------------------------------
update public.plan_limits set value = '0'::jsonb where key = 'spaces' and plan_id in ('trial', 'starter', 'growth');

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
    if lim = 0 then
      raise exception 'PLAN_LIMIT:spaces: space reservations are part of the Pro plan.' using errcode = 'check_violation';
    end if;
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

-- ---------------------------------------------------------------------------
-- 2. Suspension
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists suspended_at timestamptz,
  add column if not exists suspended_reason text;
create index if not exists profiles_suspended_idx on public.profiles (suspended_at) where suspended_at is not null;
-- (profiles only grants UPDATE on a fixed list of columns to signed in users, so these two cannot be changed by them.)

create or replace function private.require_admin()
returns void
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not private.is_admin() then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
end;
$$;

create or replace function public.admin_set_account_status(p_user uuid, p_suspend boolean, p_reason text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  t public.profiles;
  ev_ids uuid[] := '{}'; cl_ids uuid[] := '{}'; sp_ids uuid[] := '{}';
  prev jsonb;
begin
  perform private.require_admin();
  select * into t from public.profiles where id = p_user;
  if not found then raise exception 'NOT_FOUND: no such account.' using errcode = 'check_violation'; end if;
  if t.role = 'admin' then raise exception 'FORBIDDEN: admin accounts cannot be suspended here.' using errcode = '42501'; end if;
  if p_user = auth.uid() then raise exception 'FORBIDDEN: you cannot suspend yourself.' using errcode = '42501'; end if;

  if p_suspend then
    if coalesce(trim(p_reason), '') = '' then raise exception 'REASON_REQUIRED: say why the account is suspended.' using errcode = 'check_violation'; end if;
    update public.profiles set suspended_at = now(), suspended_reason = trim(p_reason) where id = p_user;

    if t.role = 'organizer' then
      with u as (update public.events set admin_status = 'suspended' where organizer_id = p_user and admin_status = 'live' returning id) select coalesce(array_agg(id), '{}') into ev_ids from u;
      with u as (update public.class_series set admin_status = 'suspended' where organizer_id = p_user and admin_status = 'live' returning id) select coalesce(array_agg(id), '{}') into cl_ids from u;
      with u as (update public.spaces set admin_status = 'suspended' where organizer_id = p_user and admin_status = 'live' returning id) select coalesce(array_agg(id), '{}') into sp_ids from u;
    end if;

    -- Block sign in and end every open session. A failure here must not stop the suspension itself.
    begin
      update auth.users set banned_until = now() + interval '100 years' where id = p_user;
      delete from auth.sessions where user_id = p_user;
    exception when others then null;
    end;

    perform private.audit('suspend_account', 'profile', p_user::text,
      jsonb_build_object('reason', trim(p_reason), 'role', t.role, 'events', ev_ids, 'classes', cl_ids, 'spaces', sp_ids));
    return jsonb_build_object('ok', true, 'suspended', true, 'events_hidden', cardinality(ev_ids), 'classes_hidden', cardinality(cl_ids), 'spaces_hidden', cardinality(sp_ids));
  end if;

  -- reinstate: bring back exactly what the suspension hid
  update public.profiles set suspended_at = null, suspended_reason = null where id = p_user;
  begin
    update auth.users set banned_until = null where id = p_user;
  exception when others then null;
  end;
  select details into prev from public.admin_audit_log where action = 'suspend_account' and entity_id = p_user::text order by created_at desc limit 1;
  if prev is not null then
    update public.events set admin_status = 'live' where admin_status = 'suspended' and id in (select (jsonb_array_elements_text(prev -> 'events'))::uuid);
    update public.class_series set admin_status = 'live' where admin_status = 'suspended' and id in (select (jsonb_array_elements_text(prev -> 'classes'))::uuid);
    update public.spaces set admin_status = 'live' where admin_status = 'suspended' and id in (select (jsonb_array_elements_text(prev -> 'spaces'))::uuid);
  end if;
  perform private.audit('reinstate_account', 'profile', p_user::text, jsonb_build_object('role', t.role));
  return jsonb_build_object('ok', true, 'suspended', false);
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. Reports
-- ---------------------------------------------------------------------------
create table if not exists public.reports (
  id           uuid primary key default gen_random_uuid(),
  reporter_id  uuid references public.profiles (id) on delete set null,
  subject_kind text not null check (subject_kind in ('organizer', 'attendee', 'event')),
  subject_id   uuid not null,
  event_id     uuid references public.events (id) on delete set null,
  category     text not null check (category in ('fraud_scam', 'no_refund', 'fake_event', 'harassment', 'impersonation', 'inappropriate_content', 'safety', 'other')),
  details      text not null check (length(trim(details)) between 10 and 2000),
  status       text not null default 'open' check (status in ('open', 'reviewing', 'actioned', 'dismissed')),
  admin_notes  text,
  reviewed_by  uuid references public.profiles (id),
  reviewed_at  timestamptz,
  created_at   timestamptz not null default now()
);
create unique index if not exists reports_one_open_per_reporter_subject on public.reports (reporter_id, subject_kind, subject_id) where status in ('open', 'reviewing');
create index if not exists reports_status_idx on public.reports (status, created_at desc);
create index if not exists reports_subject_idx on public.reports (subject_kind, subject_id);
alter table public.reports enable row level security;
drop policy if exists reports_select on public.reports;
create policy reports_select on public.reports for select to authenticated using (reporter_id = auth.uid() or private.is_admin());
grant select on public.reports to authenticated;   -- every write goes through the functions below

create or replace function public.submit_report(p_kind text, p_subject uuid, p_category text, p_details text, p_event uuid default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare me uuid := auth.uid(); v_id uuid; n integer; v_event uuid := p_event;
begin
  if me is null then raise exception 'AUTH_REQUIRED: log in to send a report.' using errcode = '42501'; end if;
  if private.is_demo() then raise exception 'DEMO: this is not available in the demo workspace.' using errcode = 'check_violation'; end if;
  if p_kind not in ('organizer', 'attendee', 'event') then raise exception 'INVALID: unknown report type.' using errcode = 'check_violation'; end if;
  if p_subject = me then raise exception 'SELF: you cannot report yourself.' using errcode = 'check_violation'; end if;
  if length(trim(coalesce(p_details, ''))) < 10 then raise exception 'DETAILS: please describe what happened in a few words.' using errcode = 'check_violation'; end if;

  select count(*) into n from public.reports where reporter_id = me and created_at > now() - interval '24 hours';
  if n >= 10 then raise exception 'RATE_LIMIT: you have sent a lot of reports today. Try again tomorrow.' using errcode = 'check_violation'; end if;

  if p_kind = 'event' then
    if not exists (select 1 from public.events where id = p_subject) then raise exception 'NOT_FOUND: that event does not exist.' using errcode = 'check_violation'; end if;
    v_event := p_subject;
  elsif p_kind = 'organizer' then
    if not exists (select 1 from public.profiles where id = p_subject and role = 'organizer') then raise exception 'NOT_FOUND: that organizer does not exist.' using errcode = 'check_violation'; end if;
  else
    if not exists (select 1 from public.profiles where id = p_subject and role = 'attendee') then raise exception 'NOT_FOUND: that guest does not exist.' using errcode = 'check_violation'; end if;
    -- Only an organizer (or their manager) who has actually had this guest on a guest list can report them.
    if not exists (select 1 from public.registrations r join public.events e on e.id = r.event_id
                   where r.attendee_id = p_subject and private.manages_org(e.organizer_id)) then
      raise exception 'NOT_ALLOWED: you can only report guests who registered for your events.' using errcode = 'check_violation';
    end if;
  end if;

  begin
    insert into public.reports (reporter_id, subject_kind, subject_id, event_id, category, details)
    values (me, p_kind, p_subject, v_event, p_category, trim(p_details)) returning id into v_id;
  exception when unique_violation then
    raise exception 'ALREADY_REPORTED: you already have an open report about this. We are looking at it.' using errcode = 'check_violation';
  end;
  return v_id;
end;
$$;

create or replace function public.admin_update_report(p_report uuid, p_status text, p_notes text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform private.require_admin();
  if p_status not in ('open', 'reviewing', 'actioned', 'dismissed') then raise exception 'INVALID: unknown status.' using errcode = 'check_violation'; end if;
  update public.reports set status = p_status, admin_notes = coalesce(nullif(trim(p_notes), ''), admin_notes),
    reviewed_by = auth.uid(), reviewed_at = now() where id = p_report;
  if not found then raise exception 'NOT_FOUND: no such report.' using errcode = 'check_violation'; end if;
  perform private.audit('report_' || p_status, 'report', p_report::text, jsonb_build_object('notes', nullif(trim(coalesce(p_notes, '')), '')));
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. Admin insight functions (admin only, read only)
-- ---------------------------------------------------------------------------
create or replace function public.admin_dashboard()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare r jsonb;
begin
  perform private.require_admin();
  select jsonb_build_object(
    'accounts', jsonb_build_object(
      'organizers', (select count(*) from public.profiles where role = 'organizer'),
      'attendees', (select count(*) from public.profiles where role = 'attendee'),
      'managers', (select count(distinct user_id) from public.organizer_team_members where status = 'active'),
      'suspended_organizers', (select count(*) from public.profiles where role = 'organizer' and suspended_at is not null),
      'suspended_attendees', (select count(*) from public.profiles where role = 'attendee' and suspended_at is not null),
      'organizers_7d', (select count(*) from public.profiles where role = 'organizer' and created_at > now() - interval '7 days'),
      'organizers_30d', (select count(*) from public.profiles where role = 'organizer' and created_at > now() - interval '30 days'),
      'attendees_7d', (select count(*) from public.profiles where role = 'attendee' and created_at > now() - interval '7 days'),
      'attendees_30d', (select count(*) from public.profiles where role = 'attendee' and created_at > now() - interval '30 days')
    ),
    'signups_30d', (
      select coalesce(jsonb_agg(jsonb_build_object('day', d.day, 'organizers', coalesce(o.n, 0), 'attendees', coalesce(a.n, 0)) order by d.day), '[]'::jsonb)
      from (select (current_date - g)::date as day from generate_series(0, 29) g) d
      left join (select created_at::date as day, count(*) n from public.profiles where role = 'organizer' and created_at >= current_date - 29 group by 1) o on o.day = d.day
      left join (select created_at::date as day, count(*) n from public.profiles where role = 'attendee' and created_at >= current_date - 29 group by 1) a on a.day = d.day
    ),
    'events', jsonb_build_object(
      'total', (select count(*) from public.events),
      'draft', (select count(*) from public.events where status = 'draft'),
      'published', (select count(*) from public.events where status = 'published'),
      'completed', (select count(*) from public.events where status = 'completed'),
      'cancelled', (select count(*) from public.events where status = 'cancelled'),
      'upcoming', (select count(*) from public.events where status = 'published' and coalesce(ends_at, starts_at) >= now()),
      'next_7d', (select count(*) from public.events where status = 'published' and starts_at between now() and now() + interval '7 days'),
      'next_30d', (select count(*) from public.events where status = 'published' and starts_at between now() and now() + interval '30 days'),
      'happening_now', (select count(*) from public.events where status = 'published' and starts_at <= now() and coalesce(ends_at, starts_at + interval '6 hours') >= now()),
      'created_30d', (select count(*) from public.events where created_at > now() - interval '30 days'),
      'flagged_or_suspended', (select count(*) from public.events where admin_status <> 'live')
    ),
    'registrations', jsonb_build_object(
      'total', (select count(*) from public.registrations where status not in ('cancelled', 'rejected')),
      'last_30d', (select count(*) from public.registrations where created_at > now() - interval '30 days' and status not in ('cancelled', 'rejected')),
      'confirmed', (select count(*) from public.registrations where status = 'confirmed'),
      'checked_in', (select count(*) from public.registrations where status = 'checked_in'),
      'no_show', (select count(*) from public.registrations where status = 'no_show'),
      'awaiting_review', (select count(*) from public.registrations where status in ('requested', 'payment_submitted')),
      'for_upcoming_events', (select count(*) from public.registrations r join public.events e on e.id = r.event_id
                              where e.status = 'published' and coalesce(e.ends_at, e.starts_at) >= now() and r.status in ('requested', 'awaiting_payment', 'payment_submitted', 'confirmed')),
      'unique_attendees', (select count(distinct attendee_id) from public.registrations where attendee_id is not null and status not in ('cancelled', 'rejected'))
    ),
    'activity', jsonb_build_object(
      'organizers_with_upcoming', (select count(distinct organizer_id) from public.events where status = 'published' and coalesce(ends_at, starts_at) >= now()),
      'organizers_active_30d', (select count(distinct organizer_id) from public.events where created_at > now() - interval '30 days' or (status = 'published' and starts_at between now() - interval '30 days' and now() + interval '30 days')),
      'organizers_never_published', (select count(*) from public.profiles p where p.role = 'organizer' and not exists (select 1 from public.events e where e.organizer_id = p.id and e.status in ('published', 'completed'))),
      'attendees_never_registered', (select count(*) from public.profiles p where p.role = 'attendee' and not exists (select 1 from public.registrations r where r.attendee_id = p.id)),
      'attendees_attended', (select count(distinct attendee_id) from public.registrations where status = 'checked_in' and attendee_id is not null)
    ),
    'modules', jsonb_build_object(
      'classes', jsonb_build_object('series', (select count(*) from public.class_series), 'organizers', (select count(distinct organizer_id) from public.class_series), 'bookings', (select count(*) from public.class_bookings)),
      'spaces', jsonb_build_object('spaces', (select count(*) from public.spaces), 'organizers', (select count(distinct organizer_id) from public.spaces), 'bookings', (select count(*) from public.space_bookings)),
      'retreats', jsonb_build_object('retreats', (select count(*) from public.retreats), 'organizers', (select count(distinct organizer_id) from public.retreats), 'participants', (select count(*) from public.retreat_participants))
    ),
    'plans', (select coalesce(jsonb_agg(jsonb_build_object('plan', plan_id, 'status', status, 'count', n) order by plan_id, status), '[]'::jsonb)
              from (select plan_id, status, count(*) n from public.organizer_subscriptions group by 1, 2) s),
    'subscriptions', jsonb_build_object(
      'trials_ending_7d', (select count(*) from public.organizer_subscriptions where status = 'trial' and trial_ends_at between now() and now() + interval '7 days'),
      'expired_or_grace', (select count(*) from public.organizer_subscriptions where status in ('expired', 'grace', 'cancelled')),
      'revenue_pkr', (select coalesce(sum(amount_pkr), 0) from public.subscription_invoices),
      'revenue_30d_pkr', (select coalesce(sum(amount_pkr), 0) from public.subscription_invoices where issued_at > now() - interval '30 days')
    ),
    'ticket_value', jsonb_build_object(
      'total_pkr', (select coalesce(sum(price_paid_pkr), 0) from public.registrations where status in ('confirmed', 'checked_in')),
      'last_30d_pkr', (select coalesce(sum(price_paid_pkr), 0) from public.registrations where status in ('confirmed', 'checked_in') and approved_at > now() - interval '30 days')
    ),
    'cities', (select coalesce(jsonb_agg(c order by (c ->> 'registrations')::int desc), '[]'::jsonb) from (
        select jsonb_build_object('city', coalesce(e.city, 'Unknown'), 'events', count(distinct e.id), 'registrations', count(r.id)) c
        from public.events e left join public.registrations r on r.event_id = e.id and r.status not in ('cancelled', 'rejected')
        where e.status in ('published', 'completed') group by coalesce(e.city, 'Unknown') order by count(r.id) desc limit 8) t),
    'categories', (select coalesce(jsonb_agg(c order by (c ->> 'events')::int desc), '[]'::jsonb) from (
        select jsonb_build_object('category', coalesce(k.name, 'Uncategorised'), 'events', count(distinct e.id), 'registrations', count(r.id)) c
        from public.events e left join public.event_categories k on k.id = e.category_id
        left join public.registrations r on r.event_id = e.id and r.status not in ('cancelled', 'rejected')
        where e.status in ('published', 'completed') group by coalesce(k.name, 'Uncategorised') order by count(distinct e.id) desc limit 8) t),
    'top_organizers', (select coalesce(jsonb_agg(c order by (c ->> 'registrations')::int desc), '[]'::jsonb) from (
        select jsonb_build_object('id', p.id, 'name', coalesce(op.company_name, p.full_name), 'events', count(distinct e.id), 'registrations', count(r.id), 'checked_in', count(r.id) filter (where r.status = 'checked_in')) c
        from public.events e join public.profiles p on p.id = e.organizer_id left join public.organizer_profiles op on op.id = p.id
        left join public.registrations r on r.event_id = e.id and r.status not in ('cancelled', 'rejected') and r.created_at > now() - interval '90 days'
        where e.status in ('published', 'completed') group by p.id, coalesce(op.company_name, p.full_name) order by count(r.id) desc limit 8) t),
    'reports', jsonb_build_object(
      'open', (select count(*) from public.reports where status = 'open'),
      'reviewing', (select count(*) from public.reports where status = 'reviewing'),
      'last_7d', (select count(*) from public.reports where created_at > now() - interval '7 days')
    ),
    'pending', jsonb_build_object(
      'id_reviews', (select count(*) from public.profile_private where id_status = 'pending'),
      'subscription_payments', (select count(*) from public.subscription_payments where status = 'submitted')
    )
  ) into r;
  return r;
end;
$$;

create or replace function public.admin_upcoming_events(p_days integer default 90, p_limit integer default 100)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  perform private.require_admin();
  return coalesce((
    select jsonb_agg(j order by (j ->> 'starts_at')) from (
      select jsonb_build_object(
        'id', e.id, 'title', e.title, 'slug', e.slug, 'city', e.city, 'starts_at', e.starts_at, 'status', e.status, 'admin_status', e.admin_status,
        'visibility', e.visibility, 'capacity', e.capacity, 'organizer_id', e.organizer_id, 'organizer', coalesce(op.company_name, p.full_name),
        'registrations', coalesce(c.total, 0), 'confirmed', coalesce(c.confirmed, 0), 'awaiting', coalesce(c.awaiting, 0), 'checked_in', coalesce(c.checked_in, 0)
      ) j
      from public.events e
      join public.profiles p on p.id = e.organizer_id
      left join public.organizer_profiles op on op.id = e.organizer_id
      left join lateral (
        select count(*) filter (where r.status not in ('cancelled', 'rejected')) total,
               count(*) filter (where r.status = 'confirmed') confirmed,
               count(*) filter (where r.status in ('requested', 'awaiting_payment', 'payment_submitted')) awaiting,
               count(*) filter (where r.status = 'checked_in') checked_in
        from public.registrations r where r.event_id = e.id) c on true
      where e.status = 'published' and coalesce(e.ends_at, e.starts_at) >= now() and e.starts_at <= now() + make_interval(days => greatest(p_days, 1))
      order by e.starts_at limit least(greatest(p_limit, 1), 300)
    ) t
  ), '[]'::jsonb);
end;
$$;

create or replace function public.admin_list_organizers(p_search text default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  perform private.require_admin();
  return coalesce((
    select jsonb_agg(j order by (j ->> 'joined') desc) from (
      select jsonb_build_object(
        'id', p.id, 'name', coalesce(op.company_name, p.full_name), 'contact', p.full_name, 'email', pp.email, 'phone', pp.phone, 'city', p.city,
        'joined', p.created_at, 'last_sign_in', u.last_sign_in_at, 'suspended_at', p.suspended_at,
        'plan', s.plan_id, 'plan_status', s.status, 'trial_ends_at', s.trial_ends_at, 'period_end', s.current_period_end, 'id_status', pp.id_status,
        'events_total', coalesce(ev.total, 0), 'events_published', coalesce(ev.published, 0), 'events_upcoming', coalesce(ev.upcoming, 0), 'last_event_at', ev.last_event,
        'registrations', coalesce(rg.total, 0), 'checked_in', coalesce(rg.attended, 0),
        'classes', (select count(*) from public.class_series c where c.organizer_id = p.id),
        'spaces', (select count(*) from public.spaces x where x.organizer_id = p.id),
        'retreats', (select count(*) from public.retreats x where x.organizer_id = p.id),
        'open_reports', (select count(*) from public.reports r where r.subject_kind = 'organizer' and r.subject_id = p.id and r.status in ('open', 'reviewing'))
      ) j
      from public.profiles p
      left join public.organizer_profiles op on op.id = p.id
      left join public.profile_private pp on pp.id = p.id
      left join public.organizer_subscriptions s on s.organizer_id = p.id
      left join auth.users u on u.id = p.id
      left join (select organizer_id, count(*) total, count(*) filter (where status = 'published') published,
                        count(*) filter (where status = 'published' and coalesce(ends_at, starts_at) >= now()) upcoming, max(starts_at) last_event
                 from public.events group by organizer_id) ev on ev.organizer_id = p.id
      left join (select e.organizer_id, count(*) filter (where r.status not in ('cancelled', 'rejected')) total, count(*) filter (where r.status = 'checked_in') attended
                 from public.registrations r join public.events e on e.id = r.event_id group by e.organizer_id) rg on rg.organizer_id = p.id
      where p.role = 'organizer'
        and (coalesce(trim(p_search), '') = '' or coalesce(op.company_name, '') ilike '%' || trim(p_search) || '%'
             or p.full_name ilike '%' || trim(p_search) || '%' or coalesce(pp.email, '') ilike '%' || trim(p_search) || '%')
      limit 500
    ) t
  ), '[]'::jsonb);
end;
$$;

create or replace function public.admin_list_attendees(p_search text default null, p_limit integer default 100, p_offset integer default 0)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare v_total integer; v_rows jsonb;
begin
  perform private.require_admin();
  select count(*) into v_total
  from public.profiles p left join public.profile_private pp on pp.id = p.id
  where p.role = 'attendee' and (coalesce(trim(p_search), '') = '' or p.full_name ilike '%' || trim(p_search) || '%' or coalesce(pp.email, '') ilike '%' || trim(p_search) || '%' or coalesce(pp.phone, '') like '%' || trim(p_search) || '%');

  select coalesce(jsonb_agg(j order by (j ->> 'joined') desc), '[]'::jsonb) into v_rows from (
    select jsonb_build_object(
      'id', p.id, 'name', p.full_name, 'email', pp.email, 'phone', pp.phone, 'city', p.city, 'joined', p.created_at, 'last_sign_in', u.last_sign_in_at,
      'suspended_at', p.suspended_at, 'id_status', pp.id_status, 'tier', st.tier, 'score', st.score, 'attended', coalesce(st.attended, 0), 'no_shows', coalesce(st.no_shows, 0),
      'registrations', (select count(*) from public.registrations r where r.attendee_id = p.id and r.status not in ('cancelled', 'rejected')),
      'is_manager', exists (select 1 from public.organizer_team_members m where m.user_id = p.id and m.status = 'active'),
      'open_reports', (select count(*) from public.reports r where r.subject_kind = 'attendee' and r.subject_id = p.id and r.status in ('open', 'reviewing'))
    ) j
    from public.profiles p
    left join public.profile_private pp on pp.id = p.id
    left join public.attendee_stats st on st.id = p.id
    left join auth.users u on u.id = p.id
    where p.role = 'attendee' and (coalesce(trim(p_search), '') = '' or p.full_name ilike '%' || trim(p_search) || '%' or coalesce(pp.email, '') ilike '%' || trim(p_search) || '%' or coalesce(pp.phone, '') like '%' || trim(p_search) || '%')
    order by p.created_at desc
    limit least(greatest(p_limit, 1), 200) offset greatest(p_offset, 0)
  ) t;
  return jsonb_build_object('total', v_total, 'rows', v_rows);
end;
$$;

create or replace function public.admin_user_detail(p_user uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare r jsonb;
begin
  perform private.require_admin();
  select jsonb_build_object(
    'profile', jsonb_build_object('id', p.id, 'role', p.role, 'name', p.full_name, 'username', p.username, 'city', p.city, 'joined', p.created_at,
      'suspended_at', p.suspended_at, 'suspended_reason', p.suspended_reason, 'email', pp.email, 'phone', pp.phone, 'id_status', pp.id_status,
      'last_sign_in', u.last_sign_in_at, 'company', op.company_name),
    'subscription', (select to_jsonb(s) - 'organizer_id' from public.organizer_subscriptions s where s.organizer_id = p.id),
    'stats', jsonb_build_object(
      'events', (select count(*) from public.events where organizer_id = p.id),
      'published', (select count(*) from public.events where organizer_id = p.id and status = 'published'),
      'registrations_received', (select count(*) from public.registrations r join public.events e on e.id = r.event_id where e.organizer_id = p.id and r.status not in ('cancelled', 'rejected')),
      'checked_in_received', (select count(*) from public.registrations r join public.events e on e.id = r.event_id where e.organizer_id = p.id and r.status = 'checked_in'),
      'registrations_made', (select count(*) from public.registrations where attendee_id = p.id and status not in ('cancelled', 'rejected')),
      'attended', coalesce((select attended from public.attendee_stats where id = p.id), 0),
      'no_shows', coalesce((select no_shows from public.attendee_stats where id = p.id), 0),
      'tier', (select tier from public.attendee_stats where id = p.id)
    ),
    'recent_events', (select coalesce(jsonb_agg(j order by (j ->> 'starts_at') desc), '[]'::jsonb) from (
        select jsonb_build_object('id', e.id, 'title', e.title, 'slug', e.slug, 'status', e.status, 'admin_status', e.admin_status, 'starts_at', e.starts_at) j
        from public.events e where e.organizer_id = p.id order by e.starts_at desc limit 10) t),
    'recent_registrations', (select coalesce(jsonb_agg(j order by (j ->> 'created_at') desc), '[]'::jsonb) from (
        select jsonb_build_object('id', r.id, 'event', e.title, 'status', r.status, 'created_at', r.created_at) j
        from public.registrations r join public.events e on e.id = r.event_id where r.attendee_id = p.id order by r.created_at desc limit 10) t),
    'reports_about', (select coalesce(jsonb_agg(j order by (j ->> 'created_at') desc), '[]'::jsonb) from (
        select jsonb_build_object('id', x.id, 'category', x.category, 'status', x.status, 'details', x.details, 'created_at', x.created_at) j
        from public.reports x where x.subject_id = p.id order by x.created_at desc limit 20) t),
    'reports_made', (select count(*) from public.reports where reporter_id = p.id),
    'audit', (select coalesce(jsonb_agg(j order by (j ->> 'created_at') desc), '[]'::jsonb) from (
        select jsonb_build_object('action', a.action, 'details', a.details, 'created_at', a.created_at) j
        from public.admin_audit_log a where a.entity_id = p.id::text order by a.created_at desc limit 20) t)
  ) into r
  from public.profiles p
  left join public.profile_private pp on pp.id = p.id
  left join public.organizer_profiles op on op.id = p.id
  left join auth.users u on u.id = p.id
  where p.id = p_user;
  if r is null then raise exception 'NOT_FOUND: no such account.' using errcode = 'check_violation'; end if;
  return r;
end;
$$;

create or replace function public.admin_list_reports(p_status text default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  perform private.require_admin();
  return coalesce((
    select jsonb_agg(j order by (j ->> 'created_at') desc) from (
      select jsonb_build_object(
        'id', r.id, 'kind', r.subject_kind, 'subject_id', r.subject_id, 'category', r.category, 'details', r.details, 'status', r.status,
        'admin_notes', r.admin_notes, 'created_at', r.created_at, 'reviewed_at', r.reviewed_at,
        'reporter_id', r.reporter_id, 'reporter', rp.full_name, 'reporter_role', rp.role,
        'subject', case r.subject_kind when 'event' then (select title from public.events where id = r.subject_id)
                                       else (select coalesce(op.company_name, sp.full_name) from public.profiles sp left join public.organizer_profiles op on op.id = sp.id where sp.id = r.subject_id) end,
        'event_id', r.event_id, 'event_slug', (select slug from public.events where id = coalesce(r.event_id, case when r.subject_kind = 'event' then r.subject_id end)),
        'reports_on_subject', (select count(*) from public.reports x where x.subject_kind = r.subject_kind and x.subject_id = r.subject_id)
      ) j
      from public.reports r left join public.profiles rp on rp.id = r.reporter_id
      where p_status is null or p_status = '' or r.status = p_status
      order by r.created_at desc limit 300
    ) t
  ), '[]'::jsonb);
end;
$$;

commit;
