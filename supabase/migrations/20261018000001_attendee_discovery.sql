-- TIKKIT X: attendee discovery and collectible tickets
--
-- * attendee_interests: categories a guest chooses to follow, used to tune the For You feed
-- * my_collectibles(): serial number and attendance total for each night a guest actually attended
-- * demo catalogue: a wider set of events, classes and spaces and a richer history for the demo attendee

begin;

-- ---------------------------------------------------------------------------
-- Interests
-- ---------------------------------------------------------------------------
create table if not exists public.attendee_interests (
  user_id     uuid not null references public.profiles (id) on delete cascade,
  category_id uuid not null references public.event_categories (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, category_id)
);
alter table public.attendee_interests enable row level security;
drop policy if exists attendee_interests_own on public.attendee_interests;
create policy attendee_interests_own on public.attendee_interests for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
grant select, insert, delete on public.attendee_interests to authenticated;

-- ---------------------------------------------------------------------------
-- Collectibles: one per checked in registration. Serial is the order guests were admitted.
-- ---------------------------------------------------------------------------
create or replace function public.my_collectibles()
returns table (registration_id uuid, serial integer, attended_total integer)
language sql
stable
security definer
set search_path = public
as $$
  with mine as (
    select r.id, r.event_id from public.registrations r
    where r.attendee_id = auth.uid() and r.status = 'checked_in'
  ),
  ranked as (
    select r.id,
           row_number() over (partition by r.event_id order by r.checked_in_at, r.id)::int as serial,
           count(*) over (partition by r.event_id)::int as total
    from public.registrations r
    where r.event_id in (select event_id from mine) and r.status = 'checked_in'
  )
  select ranked.id, ranked.serial, ranked.total from ranked where ranked.id in (select id from mine)
$$;
revoke all on function public.my_collectibles() from public, anon;
grant execute on function public.my_collectibles() to authenticated;

-- ---------------------------------------------------------------------------
-- Demo catalogue and history. Runs after seed_demo() and seed_demo_attendee().
-- ---------------------------------------------------------------------------
create or replace function private.seed_demo_catalogue()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  org uuid;
  me  uuid;
  base date := private.pk_date(now());
  c_music uuid := '033bba95-a74f-4502-b2d7-da3a6bead9d7';
  c_tech uuid := 'e4d75599-9662-4fe2-aac3-1c197dda2508';
  c_art uuid := '6dcc3362-5e0a-4933-b0e5-95d808218f48';
  c_sports uuid := '766223a3-e6a6-41cf-8bf5-111601c019c8';
  c_food uuid := 'c52ae858-8a5e-43d9-8558-ea0c30556f9b';
  c_comedy uuid := '4f504d0a-d406-48d4-a547-2a6d6a23f817';
  c_well uuid := '6178d019-6460-46f5-b778-6682df1e21ba';
  ids uuid[] := array(select gen_random_uuid() from generate_series(1, 11));
  tids uuid[] := array(select gen_random_uuid() from generate_series(1, 11));
  firsts text[] := array['Ayesha','Bilal','Hira','Usman','Sana','Faizan','Maham','Talha','Noor','Daniyal','Rida','Hamza','Zoya','Saad','Iqra','Arslan','Laiba','Haris','Mehak','Fahad'];
  lasts  text[] := array['Khan','Ahmed','Malik','Sheikh','Qureshi','Raza','Siddiqui','Butt','Chaudhry','Hussain','Javed','Mirza','Naqvi','Rehman','Saeed'];
  i integer;
  s_color uuid; s_gtr uuid; sp_art uuid; sp_pod uuid;
begin
  select organizer_id into org from public.demo_config;
  if org is null then return; end if;
  select pp.id into me from public.profile_private pp where lower(pp.email) = 'demo.attendee@demo.tikkitx.com';

  -- upcoming: 1..7, finished: 8..10, cancelled: 11
  insert into public.events (id, organizer_id, title, description, category_id, status, visibility, registration_mode, starts_at, ends_at, capacity,
                             venue_name, area_label, city, tags, published_at) values
    (ids[1], org, 'Punk Rock Basement Night', 'Three loud bands in a Gulberg basement. Earplugs at the door.', c_music, 'published', 'private', 'open',
       ((base + 3) + time '21:00') at time zone 'Asia/Karachi', ((base + 4) + time '00:30') at time zone 'Asia/Karachi', 120, 'The Basement', 'Gulberg', 'Lahore', array['punk','rock','live'], now() - interval '9 days'),
    (ids[2], org, 'Plein Air Painting Workshop', 'Paint the Fort gardens at golden hour. Materials and tea included.', c_art, 'published', 'private', 'open',
       ((base + 6) + time '16:00') at time zone 'Asia/Karachi', ((base + 6) + time '19:00') at time zone 'Asia/Karachi', 25, 'Lahore Fort Gardens', 'Walled City', 'Lahore', array['painting','workshop'], now() - interval '9 days'),
    (ids[3], org, 'Founders and Coffee', 'A relaxed morning for early stage founders. Bring one problem.', c_tech, 'published', 'private', 'open',
       ((base + 8) + time '10:00') at time zone 'Asia/Karachi', ((base + 8) + time '12:30') at time zone 'Asia/Karachi', 60, 'Co-Lab Cafe', 'Gulberg', 'Lahore', array['startup','networking'], now() - interval '9 days'),
    (ids[4], org, 'Open Mic Comedy Night', 'Twelve comics, five minutes each, one very patient host.', c_comedy, 'published', 'private', 'open',
       ((base + 9) + time '20:30') at time zone 'Asia/Karachi', ((base + 9) + time '23:00') at time zone 'Asia/Karachi', 90, 'The Loft', 'DHA Phase 5', 'Lahore', array['standup','comedy'], now() - interval '9 days'),
    (ids[5], org, 'Sunset Padel Cup', 'Doubles knockout under the lights. All levels.', c_sports, 'published', 'private', 'open',
       ((base + 12) + time '16:30') at time zone 'Asia/Karachi', ((base + 12) + time '21:00') at time zone 'Asia/Karachi', 48, 'Padel Arena', 'DHA Phase 5', 'Lahore', array['padel','tournament'], now() - interval '9 days'),
    (ids[6], org, 'Sunday Brunch Social', 'Long tables, good coffee and strangers who become friends.', c_food, 'published', 'private', 'open',
       ((base + 13) + time '11:00') at time zone 'Asia/Karachi', ((base + 13) + time '14:00') at time zone 'Asia/Karachi', 40, 'Garden Cafe', 'Model Town', 'Lahore', array['brunch','social'], now() - interval '9 days'),
    (ids[7], org, 'Gallery Night: Colours of Lahore', 'Opening night of a group show by eight local painters.', c_art, 'published', 'private', 'approval',
       ((base + 15) + time '19:00') at time zone 'Asia/Karachi', ((base + 15) + time '22:00') at time zone 'Asia/Karachi', 80, 'Alhamra Gallery', 'Mall Road', 'Lahore', array['gallery','painting','exhibition'], now() - interval '9 days'),
    (ids[8], org, 'Watercolour Wednesday', 'A slow evening of watercolour and chai.', c_art, 'completed', 'private', 'open',
       ((base - 30) + time '17:00') at time zone 'Asia/Karachi', ((base - 30) + time '20:00') at time zone 'Asia/Karachi', 30, 'Studio A', 'Gulberg', 'Lahore', array['painting','watercolour'], now() - interval '50 days'),
    (ids[9], org, 'Pottery Open Studio', 'Wheels, clay and a kiln firing for everyone who comes.', c_art, 'completed', 'private', 'open',
       ((base - 45) + time '11:00') at time zone 'Asia/Karachi', ((base - 45) + time '15:00') at time zone 'Asia/Karachi', 30, 'Clay House', 'DHA Phase 5', 'Lahore', array['pottery','craft'], now() - interval '65 days'),
    (ids[10], org, 'Indie Gig Night', 'Four indie acts and a late set.', c_music, 'completed', 'private', 'open',
       ((base - 18) + time '21:00') at time zone 'Asia/Karachi', ((base - 17) + time '00:00') at time zone 'Asia/Karachi', 150, 'The Loft', 'DHA Phase 5', 'Lahore', array['indie','live'], now() - interval '40 days'),
    (ids[11], org, 'Gallery Opening: Old Lahore', 'Photographs of the Walled City. Postponed indefinitely.', c_art, 'cancelled', 'private', 'open',
       ((base - 9) + time '19:00') at time zone 'Asia/Karachi', ((base - 9) + time '22:00') at time zone 'Asia/Karachi', 80, 'Alhamra Gallery', 'Mall Road', 'Lahore', array['gallery','photography'], now() - interval '30 days');

  insert into public.ticket_types (id, event_id, name, price_pkr, quantity, sort) values
    (tids[1], ids[1], 'General', 1500, 120, 1), (tids[2], ids[2], 'Workshop', 2200, 25, 1), (tids[3], ids[3], 'Free entry', 0, 60, 1),
    (tids[4], ids[4], 'General', 1200, 90, 1), (tids[5], ids[5], 'Team of two', 4000, 48, 1), (tids[6], ids[6], 'Seat', 2800, 40, 1),
    (tids[7], ids[7], 'Guest', 1000, 80, 1), (tids[8], ids[8], 'Early bird', 1800, 30, 1), (tids[9], ids[9], 'Studio pass', 2500, 30, 1),
    (tids[10], ids[10], 'General', 2000, 150, 1), (tids[11], ids[11], 'General', 1500, 80, 1);

  -- other guests at the finished nights, so collectible serials mean something
  for i in 8..10 loop
    insert into public.registrations (event_id, ticket_type_id, source, status, full_name, email, gender, price_due_pkr, price_paid_pkr, approved_at, checked_in_at, created_at)
    select ids[i], tids[i], 'manual', 'checked_in', firsts[1 + n % 20] || ' ' || lasts[1 + (n * 7) % 15], 'past' || i || '_' || n || '@demo.tikkitx.com',
           (case when n % 2 = 0 then 'female' else 'male' end)::public.gender,
           (select price_pkr from public.ticket_types where id = tids[i]), (select price_pkr from public.ticket_types where id = tids[i]),
           now() - (base - (select (starts_at at time zone 'Asia/Karachi')::date from public.events where id = ids[i])) * interval '1 day' - interval '5 days',
           (select starts_at from public.events where id = ids[i]) + (10 + n * 3) * interval '1 minute',
           now() - interval '70 days'
    from generate_series(1, case i when 8 then 24 when 9 then 20 else 44 end) n;
  end loop;

  -- classes and spaces in other corners of the catalogue
  insert into public.class_series (organizer_id, title, description, category_id, status, visibility, weekdays, start_time, duration_minutes, starts_on,
                                   capacity, drop_in_price_pkr, instructor_name, venue_name, area_label, city, tags)
  values (org, 'Watercolour Basics', 'Loose washes, layering and colour mixing for beginners.', c_art, 'published', 'private', array[2,4], time '18:00', 90, base - 20,
          12, 2500, 'Maryam Aslam', 'Studio A', 'Gulberg', 'Lahore', array['painting','watercolour']) returning id into s_color;
  insert into public.class_series (organizer_id, title, description, category_id, status, visibility, weekdays, start_time, duration_minutes, starts_on,
                                   capacity, drop_in_price_pkr, instructor_name, venue_name, area_label, city, tags)
  values (org, 'Intro to Guitar', 'Chords, strumming and your first three songs.', c_music, 'published', 'private', array[6], time '16:00', 60, base - 20,
          8, 2000, 'Faraz Ali', 'Sound Room', 'DHA Phase 5', 'Lahore', array['guitar','music']) returning id into s_gtr;

  insert into public.spaces (organizer_id, name, kind, description, amenities, city, area_label, address, capacity, price_pkr_per_slot, slot_minutes, buffer_minutes, min_notice_hours, requires_approval, status, visibility)
  values (org, 'Art Studio B', 'studio', 'North light, easels and a sink. Bring your own paper.', array['Easels','North light','Sink'], 'Lahore', 'Gulberg', 'Main Boulevard, Gulberg', 10, 3000, 120, 0, 4, false, 'published', 'private')
  returning id into sp_art;
  insert into public.spaces (organizer_id, name, kind, description, amenities, city, area_label, address, capacity, price_pkr_per_slot, slot_minutes, buffer_minutes, min_notice_hours, requires_approval, status, visibility)
  values (org, 'Podcast Room', 'room', 'Soundproofed, two mics and a mixer.', array['Mics','Soundproofing','Mixer'], 'Lahore', 'DHA Phase 5', 'Sector Y, DHA', 4, 4500, 60, 0, 2, true, 'published', 'private')
  returning id into sp_pod;
  insert into public.space_hours (space_id, weekday, opens, closes) select sp_art, d, time '10:00', time '19:00' from generate_series(0, 6) d;
  insert into public.space_hours (space_id, weekday, opens, closes) select sp_pod, d, time '11:00', time '22:00' from generate_series(1, 6) d;

  -- Noor's history: art leaning, one miss, one cancelled event
  if me is not null then
    insert into public.registrations (event_id, attendee_id, ticket_type_id, source, status, full_name, phone, email, gender, price_due_pkr, price_paid_pkr, approved_at, checked_in_at, status_reason, cancelled_at, created_at)
    values
      (ids[8], me, tids[8], 'self', 'checked_in', 'Noor Fatima', '03005550123', 'demo.attendee@demo.tikkitx.com', 'female', 1800, 1800, now() - interval '35 days',
        (select starts_at from public.events where id = ids[8]) + interval '2 minutes', null, null, now() - interval '40 days'),
      (ids[9], me, tids[9], 'self', 'checked_in', 'Noor Fatima', '03005550123', 'demo.attendee@demo.tikkitx.com', 'female', 2500, 2500, now() - interval '50 days',
        (select starts_at from public.events where id = ids[9]) + interval '31 minutes', null, null, now() - interval '55 days'),
      (ids[10], me, tids[10], 'self', 'no_show', 'Noor Fatima', '03005550123', 'demo.attendee@demo.tikkitx.com', 'female', 2000, 2000, now() - interval '25 days',
        null, 'Did not check in', null, now() - interval '30 days'),
      (ids[11], me, tids[11], 'self', 'cancelled', 'Noor Fatima', '03005550123', 'demo.attendee@demo.tikkitx.com', 'female', 1500, null, null,
        null, 'The organizer cancelled this event', now() - interval '10 days', now() - interval '20 days');

    -- approved payment receipts for everything she paid for, so the wallet has a history
    insert into public.payment_submissions (registration_id, amount_pkr, reference, status, reviewed_at, created_at)
    select r.id, r.price_paid_pkr, 'TXN' || upper(substr(r.id::text, 1, 6)), 'approved', coalesce(r.approved_at, now()), r.created_at
    from public.registrations r where r.attendee_id = me and coalesce(r.price_paid_pkr, 0) > 0;
    insert into public.product_payments (kind, subject_id, payer_id, organizer_id, amount_pkr, screenshot_path, reference, status, reviewed_at, created_at)
    select 'pass_purchase', pu.id, me, org, pu.price_paid_pkr, org::text || '/demo/receipt.png', 'TXN' || upper(substr(pu.id::text, 1, 6)), 'approved', now() - interval '12 days', now() - interval '12 days'
    from public.pass_purchases pu where pu.attendee_id = me and pu.status = 'active';

    delete from public.attendee_interests where user_id = me;
    insert into public.attendee_interests (user_id, category_id) values (me, c_art), (me, c_well);

    insert into public.score_events (attendee_id, event_id, delta, reason, created_at) values
      (me, ids[8], 10, 'Attended Watercolour Wednesday', now() - interval '30 days'),
      (me, ids[9], 10, 'Attended Pottery Open Studio', now() - interval '45 days'),
      (me, ids[10], -10, 'Missed Indie Gig Night', now() - interval '17 days');
  end if;
end;
$$;

-- Rebuild all three layers.
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
  perform private.seed_demo_catalogue();
  return true;
end;
$$;
revoke all on function public.demo_reseed(boolean) from public, anon, authenticated;
grant execute on function public.demo_reseed(boolean) to service_role;

commit;
