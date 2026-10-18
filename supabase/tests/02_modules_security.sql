-- TIKKIT X module tests: classes and passes, spaces, retreats, team access, unified scan.
-- Run:  supabase db query --linked -f supabase/tests/02_modules_security.sql
-- Same harness as 01_security.sql: throwaway users and data, checks as anon, attendee,
-- organizer, team manager and gate link, then everything is rolled back by a deliberate
-- exception that carries the report. Needs the 20261016 migrations applied.

create schema tkx_test;
grant usage on schema tkx_test to anon, authenticated;

create function tkx_test.as_anon() returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  execute 'set local role anon';
end $$;

create function tkx_test.as_user(uid uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
end $$;

create function tkx_test.as_root() returns void language plpgsql as $$
begin
  execute 'reset role';
  perform set_config('request.jwt.claims', '', true);
end $$;

-- expect: 'ok' | 'error:<substring>' | 'rows:<n>' | 'rows>:<n>'
create function tkx_test.t(p_label text, p_sql text, p_expect text) returns void language plpgsql as $$
declare v_n bigint; v_err text; v_ok boolean; v_line text;
begin
  begin
    if p_expect like 'rows%' then
      execute 'select count(*) from (' || p_sql || ') q' into v_n;
    else
      execute p_sql;
    end if;
  exception when others then
    v_err := sqlerrm;
  end;
  if p_expect = 'ok' then v_ok := v_err is null;
  elsif p_expect like 'error:%' then v_ok := v_err is not null and v_err ilike '%' || substr(p_expect, 7) || '%';
  elsif p_expect like 'rows>:%' then v_ok := v_err is null and v_n > substr(p_expect, 7)::bigint;
  elsif p_expect like 'rows:%' then v_ok := v_err is null and v_n = substr(p_expect, 6)::bigint;
  else v_ok := false; end if;
  v_line := case when v_ok then 'PASS  ' else 'FAIL  ' end || p_label ||
            case when v_ok then '' else '  -> expected ' || p_expect || ' got ' || coalesce('error: ' || v_err, 'rows=' || coalesce(v_n::text, 'n/a')) end;
  perform set_config('tkx.log', coalesce(current_setting('tkx.log', true), '') || v_line || E'\n', true);
  if not v_ok then perform set_config('tkx.fails', (coalesce(nullif(current_setting('tkx.fails', true), ''), '0')::int + 1)::text, true); end if;
  perform set_config('tkx.total', (coalesce(nullif(current_setting('tkx.total', true), ''), '0')::int + 1)::text, true);
end $$;
grant execute on all functions in schema tkx_test to anon, authenticated;

do $$
declare
  org_a uuid := '00000000-0000-4000-8000-0000000000a1';
  org_b uuid := '00000000-0000-4000-8000-0000000000b1';
  att_x uuid := '00000000-0000-4000-8000-0000000000c1';
  att_y uuid := '00000000-0000-4000-8000-0000000000c2';
  att_z uuid := '00000000-0000-4000-8000-0000000000c3';
  ser uuid; ser_b uuid; sess uuid; sess2 uuid; prod uuid; pass uuid;
  bk_x uuid; bk_y uuid; pay uuid;
  sp uuid; slot timestamptz; sb_x uuid;
  ret uuid; day1 uuid; item uuid; item_int uuid; part uuid; ret_b uuid;
  v_share text; v_ptoken text; v_qr text; v_gate jsonb; v_res jsonb;
begin
  -- ---------- setup as root ----------
  insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at, email_confirmed_at) values
    (org_a, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'org-a@test.local',
     '{"role":"organizer","full_name":"Org A","company_name":"A Events","phone":"03001111111","city":"Karachi"}', now(), now(), now()),
    (org_b, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'org-b@test.local',
     '{"role":"organizer","full_name":"Org B","company_name":"B Events","phone":"03002222222","city":"Lahore"}', now(), now(), now()),
    (att_x, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'x@test.local',
     '{"role":"attendee","full_name":"Attendee X","phone":"03003333333","city":"Karachi","gender":"male","date_of_birth":"1995-05-05"}', now(), now(), now()),
    (att_y, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'y@test.local',
     '{"role":"attendee","full_name":"Attendee Y","phone":"03004444444","city":"Karachi","gender":"female","date_of_birth":"1996-06-06"}', now(), now(), now()),
    (att_z, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'z@test.local',
     '{"role":"attendee","full_name":"Attendee Z","phone":"03005555555","city":"Karachi","gender":"male","date_of_birth":"1997-07-07"}', now(), now(), now());
  update public.profile_private set id_status = 'verified' where id in (org_a, org_b);
  update public.organizer_subscriptions set plan_id = 'pro', status = 'active', current_period_end = now() + interval '30 days'
   where organizer_id = org_a;

  -- ---------- anon surface ----------
  perform tkx_test.as_anon();
  perform tkx_test.t('anon cannot read class_series', 'select * from public.class_series', 'error:permission denied');
  perform tkx_test.t('anon cannot read spaces', 'select * from public.spaces', 'error:permission denied');
  perform tkx_test.t('anon cannot read retreats', 'select * from public.retreats', 'error:permission denied');
  perform tkx_test.t('anon cannot read pass_purchases', 'select * from public.pass_purchases', 'error:permission denied');
  perform tkx_test.t('anon cannot read product payments', 'select * from public.product_payments', 'error:permission denied');
  perform tkx_test.t('anon can read public class series view', 'select * from public.public_class_series', 'ok');
  perform tkx_test.t('anon can read public spaces view', 'select * from public.public_spaces', 'ok');
  perform tkx_test.t('anon cannot book a class', $q$select public.book_class_session('00000000-0000-4000-8000-000000000001')$q$, 'error:permission denied');
  perform tkx_test.t('anon gate scope rejects bad token', $q$select public.gate_get_scope('nope')$q$, 'error:LINK_INVALID');
  perform tkx_test.t('anon shared retreat with bad token returns nothing', $q$select 1 where public.get_shared_retreat('nope') is not null$q$, 'rows:0');
  perform tkx_test.as_root();

  -- ---------- classes ----------
  perform tkx_test.as_user(org_a);
  insert into public.class_series (organizer_id, title, weekdays, start_time, starts_on, capacity, drop_in_price_pkr, status, city)
  values (org_a, 'Morning Yoga', array[0,1,2,3,4,5,6]::smallint[], '07:00', current_date, 2, 500, 'published', 'Karachi')
  returning id into ser;
  perform tkx_test.as_root();
  perform tkx_test.t('publishing a series generates sessions', format($q$select 1 from public.class_sessions where series_id = %L$q$, ser), 'rows>:20');
  select id into sess from public.class_sessions where series_id = ser and starts_at > now() + interval '3 hours' order by starts_at limit 1;
  select id into sess2 from public.class_sessions where series_id = ser and starts_at > now() + interval '3 hours' and id <> sess order by starts_at limit 1;

  perform tkx_test.as_anon();
  perform tkx_test.t('anon sees the published series', format($q$select 1 from public.public_class_series where id = %L$q$, ser), 'rows:1');
  perform tkx_test.t('anon sees upcoming sessions with seats', format($q$select 1 from public.public_class_sessions where id = %L and seats_left = 2$q$, sess), 'rows:1');
  perform tkx_test.as_root();

  perform tkx_test.as_user(org_b);
  perform tkx_test.t('another organizer cannot book as attendee', format($q$select public.book_class_session(%L)$q$, sess), 'error:FORBIDDEN');
  perform tkx_test.t('another organizer cannot read the series', format($q$select 1 from public.class_series where id = %L$q$, ser), 'rows:0');
  perform tkx_test.t('another organizer cannot cancel the session', format($q$select public.cancel_class_session(%L)$q$, sess), 'error:FORBIDDEN');
  perform tkx_test.t('a trial organizer can publish one class series',
    format($q$insert into public.class_series (organizer_id, title, weekdays, start_time, starts_on, status)
              values (%L, 'B1', array[1]::smallint[], '08:00', current_date, 'published')$q$, org_b), 'ok');
  perform tkx_test.as_root();

  perform tkx_test.as_user(att_x);
  bk_x := public.book_class_session(sess);
  perform tkx_test.t('drop in booking waits for payment', format($q$select 1 from public.class_bookings where id = %L and status = 'awaiting_payment'$q$, bk_x), 'rows:1');
  perform tkx_test.t('double booking rejected', format($q$select public.book_class_session(%L)$q$, sess), 'error:ALREADY_BOOKED');
  perform tkx_test.t('cannot submit proof with another users path',
    format($q$select public.submit_product_payment('class_booking', %L, %L)$q$, bk_x, att_y::text || '/x/proof.png'), 'error:PATH_INVALID');
  pay := public.submit_product_payment('class_booking', bk_x, att_x::text || '/' || bk_x::text || '/proof.png', 'TX1');
  perform tkx_test.t('booking moved to payment submitted', format($q$select 1 from public.class_bookings where id = %L and status = 'payment_submitted'$q$, bk_x), 'rows:1');
  perform tkx_test.as_root();

  perform tkx_test.as_user(att_y);
  bk_y := public.book_class_session(sess);
  perform tkx_test.t('attendee cannot read another attendees booking', format($q$select 1 from public.class_bookings where id = %L$q$, bk_x), 'rows:0');
  perform tkx_test.t('attendee cannot read another attendees payment', format($q$select 1 from public.product_payments where id = %L$q$, pay), 'rows:0');
  perform tkx_test.as_root();

  perform tkx_test.as_user(att_z);
  perform tkx_test.t('full session rejects the third booking', format($q$select public.book_class_session(%L)$q$, sess), 'error:SESSION_FULL');
  perform tkx_test.as_root();

  perform tkx_test.as_user(org_b);
  perform tkx_test.t('another organizer cannot review the payment', format($q$select public.review_product_payment(%L, true)$q$, pay), 'error:FORBIDDEN');
  perform tkx_test.as_root();
  perform tkx_test.as_user(org_a);
  perform tkx_test.t('owner approves the payment', format($q$select public.review_product_payment(%L, true)$q$, pay), 'ok');
  perform tkx_test.t('owner cannot approve twice', format($q$select public.review_product_payment(%L, true)$q$, pay), 'error:NOT_PENDING');
  perform tkx_test.as_root();
  perform tkx_test.t('approved booking is confirmed', format($q$select 1 from public.class_bookings where id = %L and status = 'confirmed'$q$, bk_x), 'rows:1');

  -- passes
  perform tkx_test.as_user(org_a);
  insert into public.pass_products (organizer_id, series_id, name, kind, sessions_count, validity_days, price_pkr)
  values (org_a, ser, 'Free 3 pack', 'pack', 3, 30, 0) returning id into prod;
  perform tkx_test.as_root();
  perform tkx_test.as_user(att_z);
  pass := public.purchase_pass(prod);
  perform tkx_test.t('free pass activates at once', format($q$select 1 from public.pass_purchases where id = %L and status = 'active' and sessions_used = 0$q$, pass), 'rows:1');
  perform public.book_class_session(sess2, pass);
  perform tkx_test.t('booking with a pass uses one session', format($q$select 1 from public.pass_purchases where id = %L and sessions_used = 1$q$, pass), 'rows:1');
  perform tkx_test.as_root();
  perform tkx_test.as_user(att_x);
  perform tkx_test.t('cannot use someone elses pass', format($q$select public.book_class_session(%L, %L)$q$, sess2, pass), 'error:PASS_INVALID');
  perform tkx_test.as_root();

  -- scanning
  select qr_token into v_qr from public.class_bookings where id = bk_x;
  perform tkx_test.as_user(org_a);
  perform tkx_test.t('scan outside the class window is wrong_day', format($q$select 1 where public.scan_any(%L)->>'result' = 'wrong_day'$q$, v_qr), 'rows:1');
  perform tkx_test.as_root();
  update public.class_sessions set starts_at = now(), ends_at = now() + interval '1 hour' where id = sess;
  perform tkx_test.as_user(org_b);
  perform tkx_test.t('another organizer cannot scan the booking', format($q$select public.scan_any(%L)$q$, v_qr), 'error:FORBIDDEN');
  perform tkx_test.as_root();
  perform tkx_test.as_user(org_a);
  perform tkx_test.t('scan during the class admits', format($q$select 1 where public.scan_any(%L)->>'result' = 'admitted'$q$, v_qr), 'rows:1');
  perform tkx_test.t('second scan is a duplicate', format($q$select 1 where public.scan_any(%L)->>'result' = 'duplicate'$q$, v_qr), 'rows:1');
  perform tkx_test.t('unknown token is invalid', $q$select 1 where public.scan_any('nope')->>'result' = 'invalid'$q$, 'rows:1');
  v_gate := public.create_gate_link_scoped('Studio door', null, array[ser], null, null);
  perform tkx_test.as_root();
  perform tkx_test.t('class attendance awards score', format($q$select 1 from public.attendee_stats where id = %L and attended = 1$q$, att_x), 'rows:1');

  select qr_token into v_qr from public.class_bookings where id = bk_y;   -- read as root, before switching role
  perform tkx_test.as_anon();
  perform tkx_test.t('gate scope lists the series', format($q$select 1 where jsonb_array_length(public.gate_get_scope(%L)->'classes') = 1$q$, v_gate->>'token'), 'rows:1');
  perform tkx_test.t('gate scan of a booking that is not confirmed is not_approved',
    format($q$select 1 where public.gate_scan_any(%L, %L)->>'result' = 'not_approved'$q$, v_gate->>'token', v_qr), 'rows:1');
  perform tkx_test.t('gate scan of an unknown token is invalid',
    format($q$select 1 where public.gate_scan_any(%L, 'nope')->>'result' = 'invalid'$q$, v_gate->>'token'), 'rows:1');
  perform tkx_test.as_root();

  -- session cancellation returns pass sessions
  perform tkx_test.as_user(org_a);
  perform tkx_test.t('organizer cancels a session', format($q$select public.cancel_class_session(%L, 'Instructor ill')$q$, sess2), 'ok');
  perform tkx_test.as_root();
  perform tkx_test.t('pass session returned after cancellation', format($q$select 1 from public.pass_purchases where id = %L and sessions_used = 0$q$, pass), 'rows:1');
  perform tkx_test.t('attendee notified of cancellation', format($q$select 1 from public.notifications where user_id = %L and type = 'class_cancelled'$q$, att_z), 'rows:1');

  -- ---------- spaces ----------
  perform tkx_test.as_user(org_a);
  insert into public.spaces (organizer_id, name, kind, capacity, price_pkr_per_slot, slot_minutes, min_notice_hours, status, city)
  values (org_a, 'Studio One', 'studio', 4, 1000, 60, 1, 'published', 'Karachi') returning id into sp;
  insert into public.space_hours (space_id, weekday, opens, closes)
  select sp, d, '08:00', '22:00' from generate_series(0, 6) d;
  perform tkx_test.as_root();
  perform tkx_test.as_anon();
  perform tkx_test.t('anon sees open slots tomorrow', format($q$select 1 from public.space_open_slots(%L, (now() at time zone 'Asia/Karachi')::date + 1) where is_available$q$, sp), 'rows>:5');
  perform tkx_test.as_root();
  select s.slot_start into slot from public.space_open_slots(sp, (now() at time zone 'Asia/Karachi')::date + 1) s where s.is_available order by s.slot_start limit 1;

  perform tkx_test.as_user(att_x);
  sb_x := public.book_space(sp, slot, 2, 'birthday');
  perform tkx_test.as_root();
  perform tkx_test.as_user(att_y);
  perform tkx_test.t('the same slot cannot be booked twice', format($q$select public.book_space(%L, %L, 1)$q$, sp, slot), 'error:SLOT_UNAVAILABLE');
  perform tkx_test.t('party size above capacity rejected', format($q$select public.book_space(%L, %L, 99)$q$, sp, slot + interval '2 hours'), 'error:PARTY_SIZE');
  perform tkx_test.t('another attendee cannot read the booking', format($q$select 1 from public.space_bookings where id = %L$q$, sb_x), 'rows:0');
  perform tkx_test.t('another attendee cannot cancel the booking', format($q$select public.cancel_space_booking(%L)$q$, sb_x), 'error:FORBIDDEN');
  perform tkx_test.as_root();
  perform tkx_test.as_user(att_x);
  perform tkx_test.t('owner of the booking cancels', format($q$select public.cancel_space_booking(%L)$q$, sb_x), 'ok');
  perform tkx_test.as_root();
  perform tkx_test.as_user(att_y);
  perform tkx_test.t('the slot is free again after cancelling', format($q$select public.book_space(%L, %L, 1)$q$, sp, slot), 'ok');
  perform tkx_test.as_root();

  -- ---------- retreats ----------
  perform tkx_test.as_user(org_b);
  perform tkx_test.t('retreats are Pro only',
    format($q$insert into public.retreats (organizer_id, title, starts_on, ends_on) values (%L, 'Offsite', current_date + 10, current_date + 12)$q$, org_b), 'error:PLAN_LIMIT:retreats');
  perform tkx_test.as_root();

  perform tkx_test.as_user(org_a);
  insert into public.retreats (organizer_id, title, client_company, destination, starts_on, ends_on)
  values (org_a, 'Hunza Offsite', 'Acme Pvt Ltd', 'Hunza', current_date + 30, current_date + 33) returning id into ret;
  perform tkx_test.t('a retreat starts with a day per date', format($q$select 1 from public.retreat_days where retreat_id = %L$q$, ret), 'rows:4');
  select id into day1 from public.retreat_days where retreat_id = ret and day_number = 1;
  insert into public.retreat_items (retreat_id, day_id, kind, title, requires_checkin, starts_at)
  values (ret, day1, 'activity', 'Hot air balloon', true, (current_date + 30) + time '09:00') returning id into item;
  insert into public.retreat_items (retreat_id, day_id, kind, title, is_internal, cost_pkr)
  values (ret, day1, 'activity', 'INTERNAL SECRET budget meeting', true, 5000) returning id into item_int;
  insert into public.retreat_participants (retreat_id, full_name, email, dietary, status)
  values (ret, 'Sara Employee', 'sara@acme.test', 'vegetarian', 'confirmed') returning id into part;
  perform tkx_test.t('item cannot point at a day of another retreat',
    format($q$insert into public.retreat_items (retreat_id, day_id, title) values (%L, %L, 'x')$q$, ret, (select id from public.retreat_days where retreat_id <> ret limit 1)), 'error:');
  v_share := public.enable_retreat_sharing(ret);
  perform tkx_test.t('retreat summary works for the owner', format($q$select public.retreat_summary(%L)$q$, ret), 'ok');
  perform tkx_test.as_root();
  select qr_token into v_ptoken from public.retreat_participants where id = part;

  perform tkx_test.as_anon();
  perform tkx_test.t('shared itinerary is readable by link', format($q$select 1 where public.get_shared_retreat(%L)->>'title' = 'Hunza Offsite'$q$, v_share), 'rows:1');
  perform tkx_test.t('shared itinerary hides internal items', format($q$select 1 where public.get_shared_retreat(%L)::text like '%%INTERNAL SECRET%%'$q$, v_share), 'rows:0');
  perform tkx_test.t('shared itinerary shows public items', format($q$select 1 where public.get_shared_retreat(%L)::text like '%%Hot air balloon%%'$q$, v_share), 'rows:1');
  perform tkx_test.t('shared itinerary never carries costs', format($q$select 1 where public.get_shared_retreat(%L)::text like '%%cost_pkr%%'$q$, v_share), 'rows:0');
  perform tkx_test.t('participant sees their own itinerary', format($q$select 1 where public.get_participant_itinerary(%L)->'participant'->>'name' = 'Sara Employee'$q$, v_ptoken), 'rows:1');
  perform tkx_test.t('bad participant token returns nothing', $q$select 1 where public.get_participant_itinerary('nope') is not null$q$, 'rows:0');
  perform tkx_test.as_root();

  perform tkx_test.as_user(att_x);
  perform tkx_test.t('attendee cannot read retreats', format($q$select 1 from public.retreats where id = %L$q$, ret), 'rows:0');
  perform tkx_test.t('attendee cannot read participants', format($q$select 1 from public.retreat_participants where retreat_id = %L$q$, ret), 'rows:0');
  perform tkx_test.t('attendee cannot post an update', format($q$select public.post_retreat_update(%L, 'hi')$q$, ret), 'error:FORBIDDEN');
  perform tkx_test.as_root();

  perform tkx_test.as_user(org_b);
  perform tkx_test.t('other organizer cannot read the retreat', format($q$select 1 from public.retreats where id = %L$q$, ret), 'rows:0');
  perform tkx_test.t('other organizer cannot check in', format($q$select public.retreat_check_in(%L, %L)$q$, item, v_ptoken), 'error:FORBIDDEN');
  perform tkx_test.as_root();

  perform tkx_test.as_user(org_a);
  perform tkx_test.t('retreat check in admits once', format($q$select 1 where public.retreat_check_in(%L, %L)->>'result' = 'admitted'$q$, item, v_ptoken), 'rows:1');
  perform tkx_test.t('retreat check in is a duplicate the second time', format($q$select 1 where public.retreat_check_in(%L, %L)->>'result' = 'duplicate'$q$, item, v_ptoken), 'rows:1');
  perform tkx_test.t('scan_any asks for the item for a retreat token', format($q$select 1 where public.scan_any(%L)->>'result' = 'context_required'$q$, v_ptoken), 'rows:1');
  perform tkx_test.t('owner posts an update', format($q$select public.post_retreat_update(%L, 'Meet at 8am in the lobby', true)$q$, ret), 'ok');
  perform tkx_test.t('owner duplicates the retreat', format($q$select public.duplicate_retreat(%L, current_date + 90)$q$, ret), 'ok');
  perform tkx_test.as_root();
  perform tkx_test.t('the copy has the days and the items but no participants',
    $q$select 1 from public.retreats r where r.title = 'Hunza Offsite (copy)' and
         (select count(*) from public.retreat_days d where d.retreat_id = r.id) = 4 and
         (select count(*) from public.retreat_items i where i.retreat_id = r.id) = 2 and
         (select count(*) from public.retreat_participants p where p.retreat_id = r.id) = 0$q$, 'rows:1');
  perform tkx_test.t('update queued an email', $q$select 1 from public.email_outbox where template = 'retreat_update' and to_email = 'sara@acme.test'$q$, 'rows:1');

  -- ---------- team access ----------
  perform tkx_test.as_user(org_b);
  perform tkx_test.t('before joining the team org B cannot see org A classes', format($q$select 1 from public.class_series where id = %L$q$, ser), 'rows:0');
  perform tkx_test.as_root();
  perform tkx_test.as_user(org_a);
  perform tkx_test.t('owner invites a team member', $q$select public.invite_team_member('org-b@test.local')$q$, 'ok');
  perform tkx_test.t('duplicate invite rejected', $q$select public.invite_team_member('org-b@test.local')$q$, 'error:ALREADY_INVITED');
  perform tkx_test.as_root();
  update auth.users set email_confirmed_at = null where id = org_b;
  perform tkx_test.as_user(org_b);
  perform tkx_test.t('an unconfirmed email cannot claim the invite', $q$select 1 where public.claim_team_invites() = 1$q$, 'rows:0');
  perform tkx_test.as_root();
  update auth.users set email_confirmed_at = now() where id = org_b;
  perform tkx_test.as_user(org_b);
  perform tkx_test.t('invited person claims the invite', $q$select 1 where public.claim_team_invites() = 1$q$, 'rows:1');
  perform tkx_test.t('team manager can now read the series', format($q$select 1 from public.class_series where id = %L$q$, ser), 'rows:1');
  perform tkx_test.t('team manager can read the retreat', format($q$select 1 from public.retreats where id = %L$q$, ret), 'rows:1');
  perform tkx_test.t('team manager can scan for the organizer', format($q$select 1 where public.retreat_check_in(%L, %L)->>'result' = 'duplicate'$q$, item, v_ptoken), 'rows:1');
  perform tkx_test.as_root();
  perform tkx_test.as_user(att_x);
  perform tkx_test.t('attendee cannot read the team list', 'select 1 from public.organizer_team_members', 'rows:0');
  perform tkx_test.t('attendee cannot invite team members', $q$select public.invite_team_member('x@y.test')$q$, 'error:FORBIDDEN');
  perform tkx_test.as_root();

  -- ---------- entitlements and admin ----------
  perform tkx_test.as_user(org_a);
  perform tkx_test.t('entitlements include module usage', $q$select 1 where (public.my_entitlements()->'usage') ? 'retreats'$q$, 'rows:1');
  perform tkx_test.t('organizer cannot read the admin modules overview', 'select public.master_modules_overview()', 'error:FORBIDDEN');
  perform tkx_test.as_root();

  -- ---------- report ----------
  raise exception E'TEST REPORT: % checks, % failed\n%', current_setting('tkx.total', true), coalesce(nullif(current_setting('tkx.fails', true), ''), '0'), current_setting('tkx.log', true);
end $$;
