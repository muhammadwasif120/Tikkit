-- TIKKIT X: live demo workspace
--
-- A real organizer account (flagged in its JWT app_metadata as demo) holding sample data, so the public
-- demo is the actual software. Visitors are signed in as that account by a server action.
--
-- Safeguards:
--   * email from a demo session, or to a demo address, is never sent (outbox trigger)
--   * a demo session cannot invite team members, submit plan payments or change ID verification
--   * the demo events are private, so they never appear in public listings or the sitemap
--   * sample data is rebuilt nightly, and on demand with a one minute cooldown
--
-- Setup after applying this file: node --env-file=.env.local scripts/setup_demo.mjs

begin;

-- ---------------------------------------------------------------------------
-- Config and flag
-- ---------------------------------------------------------------------------
create table if not exists public.demo_config (
  id           boolean primary key default true check (id),
  organizer_id uuid not null references public.profiles (id) on delete cascade,
  last_reset   timestamptz
);
alter table public.demo_config enable row level security;
revoke all on public.demo_config from anon, authenticated;

create or replace function private.is_demo()
returns boolean
language sql
stable
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'demo')::boolean, false)
$$;

-- ---------------------------------------------------------------------------
-- Safeguards
-- ---------------------------------------------------------------------------
create or replace function private.demo_suppress_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if private.is_demo() or lower(new.to_email) like '%@demo.tikkitx.com' then
    new.status := 'failed';
    new.last_error := 'suppressed: demo workspace';
  end if;
  return new;
end;
$$;
drop trigger if exists email_outbox_demo_suppress on public.email_outbox;
create trigger email_outbox_demo_suppress before insert on public.email_outbox
  for each row execute function private.demo_suppress_email();

create or replace function private.demo_block()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if private.is_demo() then
    raise exception 'DEMO: this is not available in the demo workspace.' using errcode = 'check_violation';
  end if;
  return coalesce(new, old);
end;
$$;
drop trigger if exists organizer_team_members_demo_block on public.organizer_team_members;
create trigger organizer_team_members_demo_block before insert on public.organizer_team_members
  for each row execute function private.demo_block();
drop trigger if exists subscription_payments_demo_block on public.subscription_payments;
create trigger subscription_payments_demo_block before insert on public.subscription_payments
  for each row execute function private.demo_block();

create or replace function private.demo_block_id_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if private.is_demo() and (new.id_status is distinct from old.id_status or new.id_number_enc is distinct from old.id_number_enc) then
    raise exception 'DEMO: this is not available in the demo workspace.' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;
drop trigger if exists profile_private_demo_block on public.profile_private;
create trigger profile_private_demo_block before update on public.profile_private
  for each row execute function private.demo_block_id_change();

-- ---------------------------------------------------------------------------
-- Seed
-- ---------------------------------------------------------------------------
create or replace function private.seed_demo()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  org      uuid;
  guests   uuid[];
  g        integer;
  cat_music uuid := '033bba95-a74f-4502-b2d7-da3a6bead9d7';
  cat_social uuid := '4c46038e-3e85-4cd7-937d-1d65261611d4';
  cat_art uuid := '6dcc3362-5e0a-4933-b0e5-95d808218f48';
  cat_well uuid := '6178d019-6460-46f5-b778-6682df1e21ba';
  cat_biz uuid := 'f02ac773-6b97-4d47-8ddc-9f3db01d736f';
  e_past uuid := gen_random_uuid();
  e_live uuid := gen_random_uuid();
  e_next uuid := gen_random_uuid();
  e_draft uuid := gen_random_uuid();
  t_ea uuid := gen_random_uuid();
  t_gen uuid := gen_random_uuid();
  t_vip uuid := gen_random_uuid();
  t_past uuid := gen_random_uuid();
  t_pastvip uuid := gen_random_uuid();
  t_next uuid := gen_random_uuid();
  pa_bank uuid := gen_random_uuid();
  pa_jazz uuid := gen_random_uuid();
  r1 uuid := gen_random_uuid();
  r2 uuid := gen_random_uuid();
  r3 uuid := gen_random_uuid();
  r4 uuid := gen_random_uuid();
  l1 uuid; l2 uuid; l3 uuid; l4 uuid;
  firsts text[] := array['Ayesha','Bilal','Hira','Usman','Sana','Faizan','Maham','Talha','Noor','Daniyal','Rida','Hamza','Zoya','Saad','Iqra','Arslan','Laiba','Haris','Mehak','Fahad'];
  lasts  text[] := array['Khan','Ahmed','Malik','Sheikh','Qureshi','Raza','Siddiqui','Butt','Chaudhry','Hussain','Javed','Mirza','Naqvi','Rehman','Saeed'];
  s1 uuid; s2 uuid;
  p_pack uuid := gen_random_uuid();
  p_month uuid := gen_random_uuid();
  sp1 uuid; sp2 uuid;
  rt uuid;
  d1 uuid; d2 uuid; d3 uuid; d4 uuid;
  v1 uuid := gen_random_uuid(); v2 uuid := gen_random_uuid(); v3 uuid := gen_random_uuid(); v4 uuid := gen_random_uuid();
  base date := private.pk_date(now());
begin
  select organizer_id into org from public.demo_config;
  if org is null then return; end if;

  select coalesce(array_agg(pp.id order by pp.email), '{}') into guests
  from public.profile_private pp where pp.email like 'demo.guest%@demo.tikkitx.com';
  g := coalesce(cardinality(guests), 0);

  -- ---- wipe ----------------------------------------------------------------
  delete from public.pass_redemptions where pass_purchase_id in (select id from public.pass_purchases where organizer_id = org);
  delete from public.class_bookings where organizer_id = org;
  delete from public.pass_purchases where organizer_id = org;
  delete from public.pass_products where organizer_id = org;
  delete from public.class_series where organizer_id = org;
  delete from public.space_bookings where organizer_id = org;
  delete from public.spaces where organizer_id = org;
  delete from public.product_payments where organizer_id = org;
  delete from public.retreats where organizer_id = org;
  delete from public.events where organizer_id = org;
  delete from public.referrers where organizer_id = org;
  delete from public.organizer_vendor_invoices where organizer_id = org;
  delete from public.organizer_vendors where organizer_id = org;
  delete from public.payment_accounts where organizer_id = org;
  delete from public.gate_staff_links where organizer_id = org;
  delete from public.organizer_team_members where organizer_id = org;
  delete from public.organizer_commission_defaults where organizer_id = org;

  -- ---- account ---------------------------------------------------------------
  update public.profiles set full_name = 'Areeba Malik', city = 'Lahore', is_complete = true, role = 'organizer' where id = org;
  update public.profile_private set id_status = 'verified', id_type = 'cnic', id_reviewed_at = now() where id = org;
  update public.organizer_profiles set company_name = 'Neon District Events', bio = 'Rooftop parties, brand launches and weekend wellness in Lahore and Karachi.',
    instagram = 'neondistrict.pk', contact_email = 'hello@demo.tikkitx.com', whatsapp = '+923001234567', public_contact = false where id = org;
  insert into public.organizer_subscriptions (organizer_id, plan_id, status, billing_period, current_period_start, current_period_end)
  values (org, 'pro', 'active', 'year', now() - interval '60 days', now() + interval '305 days')
  on conflict (organizer_id) do update set plan_id = 'pro', status = 'active', billing_period = 'year',
    current_period_start = excluded.current_period_start, current_period_end = excluded.current_period_end, trial_ends_at = null;
  insert into public.organizer_commission_defaults (organizer_id, mode, value) values (org, 'percent', 10)
  on conflict (organizer_id) do update set mode = 'percent', value = 10;

  insert into public.payment_accounts (id, organizer_id, method, label, account_title, account_number, bank_name, iban, instructions) values
    (pa_bank, org, 'bank', 'Main account', 'Neon District Events', '0123456789012', 'Meezan Bank', 'PK00MEZN0000000123456789', 'Transfer, then upload the screenshot.'),
    (pa_jazz, org, 'jazzcash', 'JazzCash', 'Areeba Malik', '03001234567', null, null, 'Send to this number and keep the receipt.');

  -- ---- events ----------------------------------------------------------------
  insert into public.events (id, organizer_id, title, description, category_id, status, visibility, registration_mode, starts_at, ends_at, capacity,
                             venue_name, venue_address, area_label, city, is_secret_venue, tags, published_at) values
    (e_past, org, 'Neon Rooftop: Summer Closing', 'The last rooftop night of the season. House, techno and a skyline.', cat_music, 'completed', 'private', 'open',
       ((base - 12) + time '21:00') at time zone 'Asia/Karachi', ((base - 11) + time '03:00') at time zone 'Asia/Karachi', 150,
       'The Terrace', 'Gulberg III, Lahore', 'Gulberg', 'Lahore', false, array['rooftop','house'], now() - interval '40 days'),
    (e_live, org, 'Midnight Garden Sessions', 'An open air night in a private garden. Live set from 11pm.', cat_music, 'published', 'private', 'open',
       (base + time '20:00') at time zone 'Asia/Karachi', ((base + 1) + time '02:00') at time zone 'Asia/Karachi', 300,
       'Secret Garden', 'Revealed 24 hours before', 'DHA Phase 6', 'Lahore', true, array['garden','live'], now() - interval '21 days'),
    (e_next, org, 'Brand Launch: Aurora', 'Invite only launch evening with a tasting menu and a live visual set.', cat_biz, 'published', 'private', 'approval',
       ((base + 18) + time '19:30') at time zone 'Asia/Karachi', ((base + 18) + time '23:00') at time zone 'Asia/Karachi', 120,
       'Arfa Tower Lounge', 'Ferozepur Road, Lahore', 'Gulberg', 'Lahore', false, array['launch','invite'], now() - interval '5 days'),
    (e_draft, org, 'Sunrise Yoga and Brunch', 'A slow Sunday morning on the lawn.', cat_well, 'draft', 'private', 'open',
       ((base + 32) + time '08:00') at time zone 'Asia/Karachi', ((base + 32) + time '11:30') at time zone 'Asia/Karachi', 60,
       'Jilani Park Lawn', null, 'Race Course', 'Lahore', false, array['wellness'], null);

  insert into public.ticket_types (id, event_id, name, price_pkr, original_price_pkr, quantity, is_vip, sort) values
    (t_past, e_past, 'General', 2500, null, 120, false, 1),
    (t_pastvip, e_past, 'VIP', 6000, null, 30, true, 2),
    (t_ea, e_live, 'Early bird', 1800, 2500, 100, false, 1),
    (t_gen, e_live, 'General', 2500, null, 150, false, 2),
    (t_vip, e_live, 'VIP table', 6000, null, 50, true, 3),
    (t_next, e_next, 'Guest', 3500, null, 120, false, 1);

  update public.event_secrets set venue_address = 'House 12, Street 4, DHA Phase 6, Lahore', venue_notes = 'Gate on the left, ask for Midnight Garden.',
    reveal_at = ((base + 0) + time '19:00') at time zone 'Asia/Karachi' where event_id = e_live;

  insert into public.event_payment_accounts (event_id, payment_account_id)
  select e, pa from unnest(array[e_past, e_live, e_next]) e, unnest(array[pa_bank, pa_jazz]) pa;

  -- ---- referrers -------------------------------------------------------------
  insert into public.referrers (id, organizer_id, name, phone, email) values
    (r1, org, 'Zain Raza', '03011112222', 'zain@demo.tikkitx.com'),
    (r2, org, 'Hassan Khan', '03022223333', 'hassan@demo.tikkitx.com'),
    (r3, org, 'Mehreen Qadir', '03033334444', 'mehreen@demo.tikkitx.com'),
    (r4, org, 'Bilal Sheikh', '03044445555', 'bilal@demo.tikkitx.com');
  insert into public.referral_links (event_id, referrer_id, code, commission_mode, commission_value) values
    (e_live, r1, 'ZAIN10', 'percent', 10), (e_live, r2, 'HK15', 'percent', 10), (e_live, r3, 'MEHREEN', 'percent', 12), (e_live, r4, 'BILAL20', 'fixed', 250),
    (e_past, r1, 'ZAIN10', 'percent', 10), (e_past, r2, 'HK15', 'percent', 10);
  select id into l1 from public.referral_links where event_id = e_live and referrer_id = r1;
  select id into l2 from public.referral_links where event_id = e_live and referrer_id = r2;
  select id into l3 from public.referral_links where event_id = e_live and referrer_id = r3;
  select id into l4 from public.referral_links where event_id = e_live and referrer_id = r4;
  insert into public.coupons (event_id, code, discount_type, discount_value, max_uses) values (e_live, 'EARLYBIRD', 'percent', 15, 50);

  -- ---- registrations: finished event -------------------------------------------
  insert into public.registrations (event_id, ticket_type_id, source, status, full_name, phone, email, gender, is_vip, price_due_pkr, price_paid_pkr,
                                    referrer_id, approved_at, checked_in_at, created_at)
  select e_past, case when n % 5 = 0 then t_pastvip else t_past end, 'manual',
         case when n % 17 = 0 then 'no_show'::public.registration_status else 'checked_in'::public.registration_status end,
         firsts[1 + n % 20] || ' ' || lasts[1 + (n * 7) % 15], '0300' || lpad((1000000 + n * 7919)::text, 7, '0'),
         'guest' || n || '@demo.tikkitx.com', (case when n % 2 = 0 then 'female' else 'male' end)::public.gender,
         n % 5 = 0, case when n % 5 = 0 then 6000 else 2500 end, case when n % 5 = 0 then 6000 else 2500 end,
         case when n % 4 = 0 then r1 when n % 7 = 0 then r2 else null end,
         (base - 12) + time '10:00', case when n % 17 = 0 then null else ((base - 12) + time '21:30' + (n % 120) * interval '1 minute') at time zone 'Asia/Karachi' end,
         now() - interval '20 days' + n * interval '2 hours'
  from generate_series(1, 118) n;

  -- ---- registrations: tonight's event --------------------------------------------
  insert into public.registrations (event_id, ticket_type_id, source, status, full_name, phone, email, gender, is_vip, price_due_pkr, price_paid_pkr,
                                    referrer_id, referral_link_id, approved_at, checked_in_at, created_at)
  select e_live, case when n % 9 = 0 then t_vip when n % 3 = 0 then t_gen else t_ea end, 'manual',
         case when n % 6 = 0 then 'checked_in'::public.registration_status else 'confirmed'::public.registration_status end,
         firsts[1 + (n * 3) % 20] || ' ' || lasts[1 + (n * 4) % 15], '0301' || lpad((2000000 + n * 6007)::text, 7, '0'),
         'tonight' || n || '@demo.tikkitx.com', (case when n % 2 = 0 then 'female' else 'male' end)::public.gender,
         n % 9 = 0, case when n % 9 = 0 then 6000 when n % 3 = 0 then 2500 else 1800 end, case when n % 9 = 0 then 6000 when n % 3 = 0 then 2500 else 1800 end,
         case when n % 4 = 0 then r1 when n % 5 = 0 then r2 when n % 7 = 0 then r3 when n % 11 = 0 then r4 else null end,
         case when n % 4 = 0 then l1 when n % 5 = 0 then l2 when n % 7 = 0 then l3 when n % 11 = 0 then l4 else null end,
         now() - interval '2 days', case when n % 6 = 0 then now() - (n % 40) * interval '1 minute' else null end,
         now() - interval '14 days' + n * interval '4 hours'
  from generate_series(1, 64) n;

  -- people with accounts waiting for a decision (these show scores)
  if g >= 8 then
    insert into public.registrations (event_id, attendee_id, ticket_type_id, source, status, full_name, phone, email, gender, is_vip, price_due_pkr, referrer_id, referral_link_id, created_at)
    select e_live, guests[i], t_gen, 'self',
           (case when i <= 3 then 'payment_submitted' when i <= 5 then 'requested' else 'awaiting_payment' end)::public.registration_status,
           (select full_name from public.profiles where id = guests[i]), '0302' || lpad((3000000 + i * 4111)::text, 7, '0'),
           (select email from public.profile_private where id = guests[i]), (case when i % 2 = 0 then 'female' else 'male' end)::public.gender,
           false, 2500, case when i = 1 then r1 when i = 2 then r2 else null end, case when i = 1 then l1 when i = 2 then l2 else null end,
           now() - i * interval '3 hours'
    from generate_series(1, 8) i;

    insert into public.payment_submissions (registration_id, reference, amount_pkr, status)
    select r.id, 'TXN' || (480000 + row_number() over ())::text, 2500, 'submitted'
    from public.registrations r where r.event_id = e_live and r.status = 'payment_submitted';

    -- the launch event: invite only, a few asking to come
    insert into public.registrations (event_id, attendee_id, ticket_type_id, source, status, full_name, email, price_due_pkr, created_at)
    select e_next, guests[i], t_next, 'self', 'requested', (select full_name from public.profiles where id = guests[i]),
           (select email from public.profile_private where id = guests[i]), 3500, now() - i * interval '5 hours'
    from generate_series(9, least(g, 14)) i;
  end if;

  -- commissions for referred, paid registrations
  insert into public.commissions (registration_id, event_id, organizer_id, referrer_id, amount_pkr, status, paid_at)
  select r.id, r.event_id, org, r.referrer_id,
         round(coalesce(r.price_paid_pkr, 0) * 0.10)::integer,
         case when r.event_id = e_past then 'paid' else 'accrued' end::public.commission_status,
         case when r.event_id = e_past then now() - interval '5 days' else null end
  from public.registrations r
  where r.event_id in (e_past, e_live) and r.referrer_id is not null and r.status in ('confirmed', 'checked_in');
  update public.referral_links l set uses = (select count(*) from public.registrations r where r.referral_link_id = l.id and r.status in ('confirmed','checked_in'))
  where l.event_id = e_live;

  insert into public.event_announcements (event_id, author_id, body, send_email) values
    (e_live, org, 'Doors open at 8pm. Bring your QR ticket and a valid ID. The garden address goes out 24 hours before.', false),
    (e_live, org, 'Parking is at the back gate. Shuttle from the main road every 15 minutes.', false);

  insert into public.gate_staff_links (organizer_id, label, event_ids, token_hash, expires_at)
  values (org, 'Main gate', array[e_live], md5(random()::text || clock_timestamp()::text) || md5(clock_timestamp()::text || random()::text), now() + interval '3 days');

  insert into public.scan_logs (event_id, registration_id, scanned_by, result, scanned_at)
  select e_live, r.id, org, 'admitted', r.checked_in_at from public.registrations r where r.event_id = e_live and r.checked_in_at is not null;

  -- ---- vendors ---------------------------------------------------------------
  insert into public.organizer_vendors (id, organizer_id, name, category, contact_name, contact_phone, event_ids) values
    (v1, org, 'SoundWorks PA', 'Sound', 'Kamran', '03055556666', array[e_live, e_past]),
    (v2, org, 'Lumen Lights', 'Lighting', 'Sara', '03066667777', array[e_live]),
    (v3, org, 'Bites and Co', 'Catering', 'Adeel', '03077778888', array[e_next]),
    (v4, org, 'Peak Security', 'Security', 'Major (r) Aslam', '03088889999', array[e_live, e_next]);
  insert into public.organizer_vendor_invoices (organizer_id, vendor_id, event_id, invoice_number, amount_pkr, due_date, status, description, paid_at) values
    (org, v1, e_past, 'SW-1042', 85000, base - 10, 'paid', 'PA and DJ monitors', now() - interval '9 days'),
    (org, v2, e_live, 'LL-221', 60000, base + 1, 'pending', 'Garden lighting rig', null),
    (org, v1, e_live, 'SW-1077', 95000, base + 2, 'pending', 'PA, stage and engineer', null),
    (org, v3, e_next, 'BC-310', 120000, base + 14, 'pending', 'Tasting menu for 120', null),
    (org, v4, e_live, 'PS-88', 40000, base - 1, 'paid', 'Door and perimeter, 8 guards', now() - interval '1 day');

  -- ---- classes ---------------------------------------------------------------
  insert into public.class_series (organizer_id, title, description, category_id, status, visibility, weekdays, start_time, duration_minutes, starts_on,
                                   capacity, drop_in_price_pkr, instructor_name, venue_name, area_label, city, tags)
  values (org, 'Morning Vinyasa', 'A flowing 60 minute practice for all levels.', cat_well, 'published', 'private', array[1,3,5], time '07:00', 60, base - 30,
          14, 1500, 'Hina Farooq', 'Studio A', 'Gulberg', 'Lahore', array['yoga'])
  returning id into s1;
  insert into public.class_series (organizer_id, title, description, category_id, status, visibility, weekdays, start_time, duration_minutes, starts_on,
                                   capacity, drop_in_price_pkr, instructor_name, venue_name, area_label, city, tags)
  values (org, 'Saturday Pottery', 'Hand building and glazing. Materials included.', cat_art, 'published', 'private', array[6], time '11:00', 120, base - 30,
          10, 3000, 'Omar Siddiq', 'Clay House', 'DHA Phase 5', 'Lahore', array['pottery'])
  returning id into s2;

  insert into public.pass_products (id, organizer_id, series_id, name, kind, sessions_count, validity_days, price_pkr, sort) values
    (p_pack, org, null, '10 class pass', 'pack', 10, 90, 12000, 1),
    (p_month, org, s1, 'Monthly unlimited Vinyasa', 'monthly', null, 30, 9000, 2);

  if g >= 8 then
    insert into public.pass_purchases (product_id, organizer_id, attendee_id, status, valid_from, valid_until, sessions_total, sessions_used, price_due_pkr, price_paid_pkr, approved_at)
    values (p_pack, org, guests[1], 'active', now() - interval '20 days', now() + interval '70 days', 10, 4, 12000, 12000, now() - interval '20 days'),
           (p_pack, org, guests[2], 'active', now() - interval '10 days', now() + interval '80 days', 10, 1, 12000, 12000, now() - interval '10 days'),
           (p_month, org, guests[3], 'active', now() - interval '5 days', now() + interval '25 days', null, 3, 9000, 9000, now() - interval '5 days'),
           (p_pack, org, guests[4], 'payment_submitted', null, null, 10, 0, 12000, null, null);

    insert into public.class_bookings (session_id, series_id, organizer_id, attendee_id, status, price_due_pkr, price_paid_pkr, approved_at)
    select x.id, s1, org, guests[i], (case when i <= 5 then 'confirmed' else 'requested' end)::public.registration_status, 1500, case when i <= 5 then 1500 else null end,
           case when i <= 5 then now() else null end
    from (select id from public.class_sessions where series_id = s1 and status = 'scheduled' and starts_at > now() order by starts_at limit 1) x,
         generate_series(1, 7) i;
    insert into public.class_bookings (session_id, series_id, organizer_id, attendee_id, status, price_due_pkr, price_paid_pkr, approved_at)
    select x.id, s2, org, guests[i], 'confirmed', 3000, 3000, now()
    from (select id from public.class_sessions where series_id = s2 and status = 'scheduled' and starts_at > now() order by starts_at limit 1) x,
         generate_series(5, 8) i;
  end if;

  -- ---- spaces ----------------------------------------------------------------
  insert into public.spaces (organizer_id, name, kind, description, amenities, city, area_label, address, capacity, price_pkr_per_slot, slot_minutes,
                             buffer_minutes, min_notice_hours, requires_approval, status, visibility)
  values (org, 'Studio A', 'studio', 'A bright 40 person studio with mirrors and a sound system.', array['Mirrors','Sound system','Changing room'],
          'Lahore', 'Gulberg', 'Main Boulevard, Gulberg', 40, 3500, 60, 15, 2, false, 'published', 'private')
  returning id into sp1;
  insert into public.spaces (organizer_id, name, kind, description, amenities, city, area_label, address, capacity, price_pkr_per_slot, slot_minutes,
                             buffer_minutes, min_notice_hours, requires_approval, status, visibility)
  values (org, 'Padel Court 1', 'court', 'Floodlit glass court. Rackets for hire.', array['Floodlights','Racket hire','Parking'],
          'Lahore', 'DHA Phase 5', 'Sector Y, DHA', 4, 6000, 90, 0, 4, true, 'published', 'private')
  returning id into sp2;
  insert into public.space_hours (space_id, weekday, opens, closes) select sp1, d, time '09:00', time '20:00' from generate_series(1, 6) d;
  insert into public.space_hours (space_id, weekday, opens, closes) select sp2, d, time '08:00', time '23:00' from generate_series(0, 6) d;

  if g >= 8 then
    insert into public.space_bookings (space_id, organizer_id, attendee_id, starts_at, ends_at, blocked_until, party_size, status, price_due_pkr, price_paid_pkr, approved_at)
    select sp1, org, guests[i], (((base + i) + time '10:00') at time zone 'Asia/Karachi'), (((base + i) + time '12:00') at time zone 'Asia/Karachi'),
           (((base + i) + time '12:15') at time zone 'Asia/Karachi'), 12, 'confirmed', 7000, 7000, now()
    from generate_series(1, 3) i;
    insert into public.space_bookings (space_id, organizer_id, attendee_id, starts_at, ends_at, blocked_until, party_size, status, price_due_pkr)
    select sp2, org, guests[i], (((base + i) + time '19:00') at time zone 'Asia/Karachi'), (((base + i) + time '20:30') at time zone 'Asia/Karachi'),
           (((base + i) + time '20:30') at time zone 'Asia/Karachi'), 4, 'requested', 6000
    from generate_series(4, 6) i;
  end if;

  -- ---- retreat ---------------------------------------------------------------
  insert into public.retreats (organizer_id, title, description, destination, city, client_company, starts_on, ends_on, status, headcount_target, budget_pkr)
  values (org, 'Hunza Reset: Northbay Team Offsite', 'Four days of strategy, hiking and rest for the Northbay product team.', 'Karimabad, Hunza', 'Hunza',
          'Northbay Technologies', base + 40, base + 43, 'planning', 14, 1800000)
  returning id into rt;
  select id into d1 from public.retreat_days where retreat_id = rt and day_number = 1;
  select id into d2 from public.retreat_days where retreat_id = rt and day_number = 2;
  select id into d3 from public.retreat_days where retreat_id = rt and day_number = 3;
  select id into d4 from public.retreat_days where retreat_id = rt and day_number = 4;
  update public.retreat_days set title = case day_number when 1 then 'Arrival' when 2 then 'Strategy and hike' when 3 then 'Workshops' else 'Closing' end where retreat_id = rt;

  insert into public.retreat_items (retreat_id, day_id, kind, title, description, location_name, starts_at, ends_at, cost_pkr, requires_checkin, sort) values
    (rt, d1, 'transport', 'Airport pickup', 'Coaster from Gilgit airport', 'Gilgit Airport', ((base + 40) + time '11:00') at time zone 'Asia/Karachi', ((base + 40) + time '14:00') at time zone 'Asia/Karachi', 60000, true, 1),
    (rt, d1, 'stay', 'Check in at the lodge', null, 'Eagle Nest Lodge', ((base + 40) + time '15:00') at time zone 'Asia/Karachi', null, 0, true, 2),
    (rt, d1, 'meal', 'Welcome dinner', 'Local menu, long table', 'Lodge terrace', ((base + 40) + time '20:00') at time zone 'Asia/Karachi', ((base + 40) + time '22:00') at time zone 'Asia/Karachi', 90000, false, 3),
    (rt, d2, 'session', 'Strategy session', 'Half year planning', 'Conference room', ((base + 41) + time '09:30') at time zone 'Asia/Karachi', ((base + 41) + time '12:30') at time zone 'Asia/Karachi', 0, true, 1),
    (rt, d2, 'activity', 'Baltit Fort hike', 'Guided, 3 hours round trip', 'Baltit Fort', ((base + 41) + time '15:00') at time zone 'Asia/Karachi', ((base + 41) + time '18:00') at time zone 'Asia/Karachi', 45000, true, 2),
    (rt, d3, 'session', 'Design workshop', null, 'Conference room', ((base + 42) + time '10:00') at time zone 'Asia/Karachi', ((base + 42) + time '13:00') at time zone 'Asia/Karachi', 0, false, 1),
    (rt, d3, 'free_time', 'Free afternoon', 'Market, rest or river walk', null, ((base + 42) + time '14:00') at time zone 'Asia/Karachi', ((base + 42) + time '18:00') at time zone 'Asia/Karachi', 0, false, 2),
    (rt, d4, 'transport', 'Return transfer', null, 'Eagle Nest Lodge', ((base + 43) + time '08:00') at time zone 'Asia/Karachi', null, 60000, false, 1);

  insert into public.retreat_participants (retreat_id, full_name, email, phone, department, dietary, room_label, status)
  select rt, firsts[1 + n % 20] || ' ' || lasts[1 + (n * 3) % 15], 'p' || n || '@demo.tikkitx.com', '0309' || lpad((4000000 + n * 3301)::text, 7, '0'),
         (array['Product','Engineering','Design','Sales'])[1 + n % 4], case when n % 5 = 0 then 'Vegetarian' else null end,
         'Room ' || (100 + (n + 1) / 2), (case when n <= 11 then 'confirmed' when n <= 13 then 'invited' else 'declined' end)::public.participant_status
  from generate_series(1, 14) n;

  insert into public.retreat_tasks (retreat_id, title, due_date, is_done, sort) values
    (rt, 'Confirm lodge block of 8 rooms', base + 10, true, 1),
    (rt, 'Book Coaster and driver', base + 14, true, 2),
    (rt, 'Collect dietary and room preferences', base + 20, false, 3),
    (rt, 'Send itinerary links to participants', base + 30, false, 4),
    (rt, 'Final headcount to the lodge', base + 35, false, 5);
  insert into public.retreat_budget_lines (retreat_id, category, label, estimated_pkr, actual_pkr, is_paid) values
    (rt, 'Stay', 'Eagle Nest Lodge, 3 nights', 720000, 720000, true),
    (rt, 'Transport', 'Coaster both ways', 120000, null, false),
    (rt, 'Food', 'Meals and snacks', 300000, null, false),
    (rt, 'Activities', 'Guides, fort entry', 90000, null, false),
    (rt, 'Contingency', 'Buffer', 150000, null, false);
  insert into public.retreat_updates (retreat_id, author_id, body)
  values (rt, org, 'Lodge confirmed. Final itinerary goes out once headcount is locked.');

  -- ---- team ------------------------------------------------------------------
  insert into public.organizer_team_members (organizer_id, email, role, status, invited_by)
  values (org, 'bilal.manager@demo.tikkitx.com', 'manager', 'invited', org);

  -- ---- sample attendee reputation ---------------------------------------------
  if g >= 8 then
    update public.attendee_stats a set attended = v.att, no_shows = v.ns, streak = v.st, longest_streak = v.st + 1, vip_events = v.vip,
           score = v.sc, tier = v.tier::public.score_tier
    from (select guests[i] as id, (3 + i * 2) as att, (i % 3) as ns, (i % 5) as st, (i % 4) as vip, (60 + i * 4) as sc,
                 (array['new','reliable','regular','trusted'])[1 + i % 4] as tier from generate_series(1, g) i) v
    where a.id = v.id;
  end if;

  update public.demo_config set last_reset = now() where id;
end;
$$;

-- Callable only with the service role (setup script, the reset button, the nightly job).
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
  return true;
end;
$$;
revoke all on function public.demo_reseed(boolean) from public, anon, authenticated;
grant execute on function public.demo_reseed(boolean) to service_role;

-- Nightly rebuild at 02:00 Pakistan time.
select cron.schedule('tkx_demo_reseed', '0 21 * * *', $$select public.demo_reseed(true)$$);

commit;
