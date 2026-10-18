-- TIKKIT X: attendee side of the live demo
--
-- * A demo attendee (demo.attendee@demo.tikkitx.com, flagged demo in its JWT) with tickets, a pass, a class,
--   a reservation, a retreat itinerary, a score history and alerts.
-- * Demo sessions (and only demo sessions) see the demo organizer's events, classes and spaces in listings and
--   Explore. Everyone else still sees them only by direct link.
--
-- Apply after 20261017000001_demo_workspace.sql, then run: node --env-file=.env.local scripts/setup_demo.mjs

begin;

create or replace function private.demo_org()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select organizer_id from public.demo_config limit 1
$$;

-- ---------------------------------------------------------------------------
-- Listings: the same views, with one extra clause that is true only for demo sessions
-- ---------------------------------------------------------------------------
create or replace view public.event_listings as
select
  e.id,
  e.slug,
  e.title,
  e.description,
  e.cover_image_url,
  e.category_id,
  e.tags,
  e.city,
  e.area_label,
  case when e.is_secret_venue then null else e.venue_name end as venue_name,
  case when e.is_secret_venue then null else e.venue_address end as venue_address,
  e.is_secret_venue,
  es.reveal_at,
  e.starts_at,
  e.ends_at,
  e.capacity,
  e.registration_mode,
  e.require_id_verified,
  e.male_ratio_max,
  e.female_ratio_max,
  e.organizer_id,
  e.status,
  (select min(t.price_pkr) from public.ticket_types t
    where t.event_id = e.id
      and (t.sales_start is null or t.sales_start <= now())
      and (t.sales_end   is null or t.sales_end   >  now())) as min_price_pkr,
  (select count(*) from public.registrations r
    where r.event_id = e.id and r.status = any (private.seat_statuses()))::int as seats_taken
from public.events e
join public.event_secrets es on es.event_id = e.id
where e.status = 'published'
  and (e.visibility = 'public' or (private.is_demo() and e.organizer_id = private.demo_org()))
  and e.admin_status = 'live';

create or replace view public.public_class_series as
select
  s.id, s.slug, s.title, s.description, s.cover_image_url, s.category_id, s.tags, s.city, s.area_label,
  s.venue_name, s.venue_address, s.instructor_name, s.weekdays, s.start_time, s.duration_minutes,
  s.starts_on, s.ends_on, s.interval_weeks, s.capacity, s.drop_in_price_pkr, s.organizer_id,
  (select min(x.starts_at) from public.class_sessions x
     where x.series_id = s.id and x.status = 'scheduled' and x.starts_at > now()) as next_session_at
from public.class_series s
where s.status = 'published'
  and (s.visibility = 'public' or (private.is_demo() and s.organizer_id = private.demo_org()))
  and s.admin_status = 'live';

create or replace view public.public_spaces as
select
  s.id, s.slug, s.name, s.kind, s.description, s.photos, s.amenities, s.city, s.area_label, s.address,
  s.capacity, s.price_pkr_per_slot, s.slot_minutes, s.min_notice_hours, s.max_advance_days,
  s.requires_approval, s.organizer_id
from public.spaces s
where s.status = 'published'
  and (s.visibility = 'public' or (private.is_demo() and s.organizer_id = private.demo_org()))
  and s.admin_status = 'live';

-- ---------------------------------------------------------------------------
-- Attendee seed. Runs after private.seed_demo(), which has already rebuilt the organizer's side
-- (events, classes, spaces and the retreat, so every booking of this attendee is gone with them).
-- ---------------------------------------------------------------------------
create or replace function private.seed_demo_attendee()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  org uuid;
  me  uuid;
  e_live uuid; e_past uuid; e_next uuid;
  t_ea uuid; t_pastvip uuid;
  s1 uuid; sp1 uuid; rt uuid;
  p_pack uuid; pass uuid;
  sess uuid;
  reg_past uuid;
begin
  select organizer_id into org from public.demo_config;
  if org is null then return; end if;
  select pp.id into me from public.profile_private pp where lower(pp.email) = 'demo.attendee@demo.tikkitx.com';
  if me is null then return; end if;

  select id into e_live from public.events where organizer_id = org and title = 'Midnight Garden Sessions';
  select id into e_past from public.events where organizer_id = org and title like 'Neon Rooftop%';
  select id into e_next from public.events where organizer_id = org and title like 'Brand Launch%';
  select id into t_ea from public.ticket_types where event_id = e_live and name = 'Early bird';
  select id into t_pastvip from public.ticket_types where event_id = e_past and name = 'VIP';
  select id into s1 from public.class_series where organizer_id = org and title = 'Morning Vinyasa';
  select id into sp1 from public.spaces where organizer_id = org and name = 'Studio A';
  select id into rt from public.retreats where organizer_id = org limit 1;
  select id into p_pack from public.pass_products where organizer_id = org and kind = 'pack' limit 1;

  -- profile: complete, so the app never asks them to finish it
  update public.profiles set full_name = 'Noor Fatima', city = 'Lahore', is_complete = true, role = 'attendee' where id = me;
  update public.profile_private set phone = '03005550123', date_of_birth = date '1996-04-12', gender = 'female', id_status = 'verified'
    where id = me;

  -- clean slate for things that survive the organizer rebuild
  delete from public.score_events where attendee_id = me;
  delete from public.notifications where user_id = me;
  delete from public.event_favourites where user_id = me;
  delete from public.organizer_favourites where user_id = me;
  delete from public.registrations where attendee_id = me;

  if e_live is null or e_past is null then return; end if;

  -- a confirmed ticket for tonight, one attended night, one request waiting on the organizer
  insert into public.registrations (event_id, attendee_id, ticket_type_id, source, status, full_name, phone, email, gender, price_due_pkr, price_paid_pkr, approved_at, created_at)
  values (e_live, me, t_ea, 'self', 'confirmed', 'Noor Fatima', '03005550123', 'demo.attendee@demo.tikkitx.com', 'female', 1800, 1800, now() - interval '3 days', now() - interval '4 days');
  insert into public.registrations (event_id, attendee_id, ticket_type_id, source, status, full_name, phone, email, gender, is_vip, price_due_pkr, price_paid_pkr, approved_at, checked_in_at, created_at)
  values (e_past, me, t_pastvip, 'self', 'checked_in', 'Noor Fatima', '03005550123', 'demo.attendee@demo.tikkitx.com', 'female', true, 6000, 6000, now() - interval '20 days', now() - interval '12 days', now() - interval '25 days')
  returning id into reg_past;
  if e_next is not null then
    insert into public.registrations (event_id, attendee_id, source, status, full_name, phone, email, gender, price_due_pkr, created_at)
    values (e_next, me, 'self', 'requested', 'Noor Fatima', '03005550123', 'demo.attendee@demo.tikkitx.com', 'female', 3500, now() - interval '6 hours');
  end if;

  -- a class pass in use, a booked class and a reservation
  if p_pack is not null then
    insert into public.pass_purchases (product_id, organizer_id, attendee_id, status, valid_from, valid_until, sessions_total, sessions_used, price_due_pkr, price_paid_pkr, approved_at)
    values (p_pack, org, me, 'active', now() - interval '12 days', now() + interval '78 days', 10, 3, 12000, 12000, now() - interval '12 days')
    returning id into pass;
  end if;
  if s1 is not null then
    select id into sess from public.class_sessions where series_id = s1 and status = 'scheduled' and starts_at > now() order by starts_at offset 1 limit 1;
    if sess is not null then
      insert into public.class_bookings (session_id, series_id, organizer_id, attendee_id, pass_purchase_id, status, price_due_pkr, price_paid_pkr, approved_at)
      values (sess, s1, org, me, pass, 'confirmed', 0, 0, now());
    end if;
  end if;
  if sp1 is not null then
    insert into public.space_bookings (space_id, organizer_id, attendee_id, starts_at, ends_at, blocked_until, party_size, status, price_due_pkr, price_paid_pkr, approved_at)
    values (sp1, org, me, ((private.pk_date(now()) + 5) + time '16:00') at time zone 'Asia/Karachi', ((private.pk_date(now()) + 5) + time '17:00') at time zone 'Asia/Karachi',
            ((private.pk_date(now()) + 5) + time '17:15') at time zone 'Asia/Karachi', 6, 'confirmed', 3500, 3500, now());
  end if;

  -- invited to the company retreat, so the private itinerary link works
  if rt is not null then
    insert into public.retreat_participants (retreat_id, attendee_id, full_name, email, phone, department, status, room_label)
    values (rt, me, 'Noor Fatima', 'demo.attendee@demo.tikkitx.com', '03005550123', 'Design', 'confirmed', 'Room 112');
  end if;

  -- reputation
  update public.attendee_stats set attended = 9, no_shows = 0, streak = 4, longest_streak = 6, vip_events = 2, score = 74, tier = 'regular' where id = me;
  insert into public.score_events (attendee_id, event_id, registration_id, delta, reason, created_at) values
    (me, e_past, reg_past, 10, 'Attended Neon Rooftop: Summer Closing', now() - interval '12 days'),
    (me, null, null, 5, 'Four events in a row', now() - interval '12 days'),
    (me, null, null, 10, 'Verified your ID', now() - interval '40 days'),
    (me, null, null, 8, 'Attended Rooftop Sundowner', now() - interval '55 days'),
    (me, null, null, 8, 'Attended Comedy Night Lahore', now() - interval '70 days');

  -- alerts and favourites
  insert into public.notifications (user_id, event_id, type, title, body, created_at, read_at) values
    (me, e_live, 'registration_approved', 'You are in', 'Your ticket for Midnight Garden Sessions is ready. Show the QR at the door.', now() - interval '3 days', null),
    (me, e_live, 'announcement', 'Doors open at 8pm', 'Bring your QR ticket and a valid ID. The address is revealed shortly before.', now() - interval '5 hours', null),
    (me, null, 'class_reminder', 'Class tomorrow', 'Morning Vinyasa at 7:00am. Your pass has 7 sessions left.', now() - interval '1 hour', null),
    (me, e_past, 'score_update', 'Your score went up', 'You earned 10 points for attending Neon Rooftop.', now() - interval '12 days', now() - interval '11 days');
  insert into public.organizer_favourites (user_id, organizer_id) values (me, org);
  insert into public.event_favourites (user_id, event_id) values (me, e_live);
end;
$$;

-- Same as before, now rebuilding both sides.
create or replace function public.demo_reseed(p_force boolean default false)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare last_at timestamptz;
begin
  select last_reset into last_at from public.demo_config;
  if not p_force and last_at is not null and last_at > now() - interval '1 minute' then return false; end if;
  perform private.seed_demo();
  perform private.seed_demo_attendee();
  return true;
end;
$$;
revoke all on function public.demo_reseed(boolean) from public, anon, authenticated;
grant execute on function public.demo_reseed(boolean) to service_role;

commit;
