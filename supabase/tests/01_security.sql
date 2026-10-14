-- TIKKIT X security and flow tests.
-- Run:  supabase db query --linked -f supabase/tests/01_security.sql
-- Creates throwaway users and data, runs checks as anon / attendee / organizer / gate link / admin,
-- then deliberately raises an exception with the report so EVERYTHING (including these helpers)
-- is rolled back. Output: "TEST REPORT" with PASS/FAIL lines.

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
  org_a  uuid := '00000000-0000-4000-8000-0000000000a1';
  org_b  uuid := '00000000-0000-4000-8000-0000000000b1';
  att_x  uuid := '00000000-0000-4000-8000-0000000000c1';
  att_y  uuid := '00000000-0000-4000-8000-0000000000c2';
  adm    uuid := '00000000-0000-4000-8000-0000000000d1';
  ev     uuid;
  ev_b   uuid;
  tt     uuid;
  tt_old uuid;
  reg_x  uuid;
  reg_y  uuid;
  sub    uuid;
  ref    jsonb;
  link   jsonb;
  gate   jsonb;
  res    jsonb;
  promo  text;
  v_slug text;
  v_tok_x text;
  v_tok_bad text := 'not-a-token';
begin
  -- ---------- setup as root ----------
  insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at) values
    (org_a, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'org-a@test.local',
     '{"role":"organizer","full_name":"Org A","company_name":"A Events","phone":"03001111111","city":"Karachi"}', now(), now()),
    (org_b, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'org-b@test.local',
     '{"role":"organizer","full_name":"Org B","company_name":"B Events","phone":"03002222222","city":"Lahore"}', now(), now()),
    (att_x, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'x@test.local',
     '{"role":"attendee","full_name":"Attendee X","phone":"03003333333","city":"Karachi","gender":"male","date_of_birth":"1995-05-05"}', now(), now()),
    (att_y, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'y@test.local',
     '{"role":"attendee","full_name":"Attendee Y","phone":"03004444444","city":"Karachi","gender":"female","date_of_birth":"1996-06-06"}', now(), now()),
    (adm, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@test.local',
     '{"role":"attendee","full_name":"Admin"}', now(), now());
  update public.profiles set role = 'admin' where id = adm;      -- only root can promote
  update public.profile_private set id_status = 'verified' where id = org_a;   -- org A verified, org B not
  perform tkx_test.t('signup: metadata role admin cannot be self assigned',
    $q$select 1 from public.profiles where id = '00000000-0000-4000-8000-0000000000d1' and role = 'attendee'$q$, 'rows:0');
  perform tkx_test.t('signup: organizer gets 14 day trial',
    $q$select 1 from public.organizer_subscriptions where organizer_id = '00000000-0000-4000-8000-0000000000a1' and status = 'trial' and plan_id = 'trial'$q$, 'rows:1');
  perform tkx_test.t('signup: attendee profile complete',
    $q$select 1 from public.profiles where id = '00000000-0000-4000-8000-0000000000c1' and is_complete$q$, 'rows:1');
  perform tkx_test.t('signup: organizer profile complete',
    $q$select 1 from public.profiles where id = '00000000-0000-4000-8000-0000000000a1' and is_complete$q$, 'rows:1');

  -- ---------- anon ----------
  perform tkx_test.as_anon();
  perform tkx_test.t('anon cannot read profiles', 'select * from public.profiles', 'error:permission denied');
  perform tkx_test.t('anon cannot read profile_private', 'select * from public.profile_private', 'error:permission denied');
  perform tkx_test.t('anon cannot read event_secrets', 'select * from public.event_secrets', 'error:permission denied');
  perform tkx_test.t('anon cannot read registrations', 'select * from public.registrations', 'error:permission denied');
  perform tkx_test.t('anon cannot read gate links', 'select * from public.gate_staff_links', 'error:permission denied');
  perform tkx_test.t('anon cannot read payment accounts', 'select * from public.payment_accounts', 'error:permission denied');
  perform tkx_test.t('anon cannot read notifications', 'select * from public.notifications', 'error:permission denied');
  perform tkx_test.t('anon can read plans (pricing page)', 'select * from public.plans', 'rows>:0');
  perform tkx_test.t('anon can read categories', 'select * from public.event_categories', 'rows>:0');
  perform tkx_test.t('anon can read public organizers view', 'select * from public.public_organizers', 'ok');
  perform tkx_test.t('anon can read event listings view', 'select * from public.event_listings', 'ok');
  perform tkx_test.t('anon public organizers view has no email/phone columns',
    $q$select email from public.public_organizers$q$, 'error:column');
  perform tkx_test.t('anon cannot register', $q$select public.register_for_event('00000000-0000-4000-8000-000000000001')$q$, 'error:permission denied');
  perform tkx_test.t('anon cannot call admin overview', 'select public.master_overview()', 'error:permission denied');
  perform tkx_test.t('anon promoter dashboard rejects bad token', $q$select public.promoter_dashboard('nope')$q$, 'error:LINK_INVALID');
  perform tkx_test.t('anon gate link rejects bad token', $q$select * from public.gate_get_events('nope')$q$, 'error:LINK_INVALID');
  perform tkx_test.as_root();

  -- ---------- organizer A creates an event ----------
  perform tkx_test.as_user(org_a);
  insert into public.events (organizer_id, title, starts_at, ends_at, capacity, status, area_label, city, is_secret_venue, venue_name, venue_address)
  values (org_a, 'Rooftop Night', now() + interval '2 days', now() + interval '2 days 5 hours', 50, 'draft', 'DHA', 'Karachi', true, 'Secret Place', 'Plot 7 leak attempt')
  returning id into ev;
  perform tkx_test.t('organizer cannot set admin_status',
    format($q$update public.events set admin_status = 'suspended' where id = %L$q$, ev), 'error:permission denied');
  perform tkx_test.t('organizer cannot set slug',
    format($q$update public.events set slug = 'hijack' where id = %L$q$, ev), 'error:permission denied');
  perform tkx_test.t('organizer cannot insert for another organizer',
    format($q$insert into public.events (organizer_id, title, starts_at) values (%L, 'x', now())$q$, org_b), 'error:row-level security');
  insert into public.ticket_types (event_id, name, price_pkr, quantity) values (ev, 'General', 1000, 10) returning id into tt;
  insert into public.ticket_types (event_id, name, price_pkr, sales_end) values (ev, 'Early bird', 500, now() - interval '1 hour') returning id into tt_old;
  update public.event_secrets set venue_address = 'Plot 7, Secret Lane', reveal_at = now() + interval '1 day' where event_id = ev;
  perform tkx_test.as_root();

  -- secrets: reveal requires a plan with auto_reveal. trial plan has it. Starter does not (tested later).
  perform tkx_test.as_user(org_a);
  perform tkx_test.t('publish rejects capacity above trial limit',
    format($q$update public.events set status='published', capacity=5000 where id = %L$q$, ev), 'error:PLAN_LIMIT');
  perform tkx_test.t('publish works for verified organizer',
    format($q$update public.events set status='published', capacity=50 where id = %L$q$, ev), 'ok');
  perform tkx_test.t('second published event in the same month hits trial cap',
    format($q$insert into public.events (organizer_id, title, starts_at, status, capacity) values (%L, 'Another', now() + interval '3 days', 'published', 20)$q$, org_a), 'error:PLAN_LIMIT');
  perform tkx_test.as_root();

  -- anon sees listing without secrets
  select slug into v_slug from public.events where id = ev;
  perform tkx_test.as_anon();
  perform tkx_test.t('listing visible to anon', format($q$select 1 from public.event_listings where id = %L$q$, ev), 'rows:1');
  perform tkx_test.t('listing hides secret venue name', format($q$select 1 from public.event_listings where id = %L and venue_name is null$q$, ev), 'rows:1');
  perform tkx_test.t('listing venue_address is null for secret venue', format($q$select 1 from public.event_listings where id = %L and venue_address is null$q$, ev), 'rows:1');
  perform tkx_test.t('get_event works for anon', format($q$select * from public.get_event(%L)$q$, v_slug), 'rows:1');
  perform tkx_test.as_root();
  perform tkx_test.t('secret venue address never stored on events row', format($q$select 1 from public.events where id = %L and venue_address is null$q$, ev), 'rows:1');

  -- ---------- organizer B ----------
  perform tkx_test.as_user(org_b);
  insert into public.events (organizer_id, title, starts_at, status) values (org_b, 'B draft', now() + interval '5 days', 'draft') returning id into ev_b;
  perform tkx_test.t('unverified organizer cannot publish',
    format($q$update public.events set status='published', capacity=10 where id = %L$q$, ev_b), 'error:ID_VERIFICATION_REQUIRED');
  perform tkx_test.t('organizer B cannot see event A secrets', format($q$select 1 from public.event_secrets where event_id = %L$q$, ev), 'rows:0');
  perform tkx_test.t('organizer B edit of event A is a no-op', format($q$update public.events set title='hijacked' where id = %L$q$, ev), 'ok');
  perform tkx_test.t('organizer B cannot read other profiles', format($q$select 1 from public.profile_private where id = %L$q$, org_a), 'rows:0');
  perform tkx_test.as_root();
  perform tkx_test.t('event A title unchanged after B edit attempt', format($q$select 1 from public.events where id = %L and title = 'Rooftop Night'$q$, ev), 'rows:1');

  -- ---------- attendee X ----------
  perform tkx_test.as_user(att_x);
  perform tkx_test.t('attendee cannot change role', format($q$update public.profiles set role='admin' where id = %L$q$, att_x), 'error:permission denied');
  perform tkx_test.t('attendee cannot self verify ID', format($q$update public.profile_private set id_status='verified' where id = %L$q$, att_x), 'error:permission denied');
  perform tkx_test.t('attendee cannot edit own score', format($q$update public.attendee_stats set score = 999 where id = %L$q$, att_x), 'error:permission denied');
  perform tkx_test.t('attendee cannot insert registration directly',
    format($q$insert into public.registrations (event_id, attendee_id, full_name) values (%L, %L, 'x')$q$, ev, att_x), 'error:permission denied');
  perform tkx_test.t('attendee cannot read event secrets table', format($q$select 1 from public.event_secrets where event_id = %L$q$, ev), 'rows:0');
  perform tkx_test.t('attendee cannot read gate token hash', 'select token_hash from public.gate_staff_links', 'error:permission denied');
  perform tkx_test.t('attendee cannot create gate link', format($q$select public.create_gate_link('x', array[%L]::uuid[])$q$, ev), 'error:FORBIDDEN');
  perform tkx_test.t('attendee cannot call master_overview', 'select public.master_overview()', 'error:FORBIDDEN');
  perform tkx_test.t('expired early bird ticket rejected', format($q$select public.register_for_event(%L, %L)$q$, ev, tt_old), 'error:TICKET_EXPIRED');
  reg_x := public.register_for_event(ev, tt);
  perform tkx_test.t('duplicate registration rejected', format($q$select public.register_for_event(%L, %L)$q$, ev, tt), 'error:ALREADY_REGISTERED');
  perform tkx_test.t('registration is awaiting payment', format($q$select 1 from public.registrations where id = %L and status = 'awaiting_payment' and price_due_pkr = 1000$q$, reg_x), 'rows:1');
  perform tkx_test.t('reveal not yet allowed', format($q$select 1 where (public.get_event_secret(%L) ->> 'revealed') = 'false'$q$, ev), 'rows:1');
  perform tkx_test.t('attendee cannot approve own payment', format($q$select public.review_registration(%L, true)$q$, reg_x), 'error:FORBIDDEN');
  sub := public.submit_payment(reg_x, 'x/y/proof.png', 'TXN1');
  perform tkx_test.t('attendee cannot review payment', format($q$select public.review_payment(%L, true)$q$, sub), 'error:FORBIDDEN');
  perform tkx_test.as_root();

  -- ---------- attendee Y cannot see X ----------
  perform tkx_test.as_user(att_y);
  perform tkx_test.t('attendee Y cannot see X registration', format($q$select 1 from public.registrations where id = %L$q$, reg_x), 'rows:0');
  perform tkx_test.t('attendee Y cannot see X payment submission', format($q$select 1 from public.payment_submissions where id = %L$q$, sub), 'rows:0');
  perform tkx_test.t('attendee Y reveal denied', format($q$select 1 where (public.get_event_secret(%L) ->> 'revealed') = 'false'$q$, ev), 'rows:1');
  perform tkx_test.as_root();

  -- ---------- approvals, referral, check-in ----------
  perform tkx_test.as_user(org_b);
  perform tkx_test.t('organizer B cannot review A payment', format($q$select public.review_payment(%L, true)$q$, sub), 'error:FORBIDDEN');
  perform tkx_test.as_root();

  perform tkx_test.as_user(org_a);
  perform tkx_test.t('advanced commission allowed on trial',
    $q$insert into public.organizer_commission_defaults (organizer_id, mode, value) values ('00000000-0000-4000-8000-0000000000a1', 'percent', 10)$q$, 'ok');
  ref := public.create_referrer('Promoter P', '03009999999', 'p@test.local');
  insert into public.referral_links (event_id, referrer_id, code, buyer_discount_type, buyer_discount_value)
  values (ev, (ref ->> 'id')::uuid, 'PROMO10', 'fixed', 100);
  perform tkx_test.t('organizer cannot link another organizers referrer',
    format($q$insert into public.referral_links (event_id, referrer_id, code) values (%L, %L, 'BAD')$q$, ev, gen_random_uuid()), 'error:row-level security');
  perform tkx_test.as_root();

  perform tkx_test.as_user(att_y);
  reg_y := public.register_for_event(ev, tt, null, 'promo10');
  perform tkx_test.t('referral discount applied', format($q$select 1 from public.registrations where id = %L and discount_pkr = 100 and price_due_pkr = 900 and referrer_id is not null$q$, reg_y), 'rows:1');
  perform tkx_test.t('preview rejects unknown code', format($q$select 1 where (public.preview_code(%L, 'NOPE', %L) ->> 'valid') = 'false'$q$, ev, tt), 'rows:1');
  perform tkx_test.t('preview accepts referral code', format($q$select 1 where (public.preview_code(%L, 'promo10', %L) ->> 'valid') = 'true'$q$, ev, tt), 'rows:1');
  perform public.submit_payment(reg_y, 'y/z/proof.png', null);
  perform tkx_test.as_root();

  perform tkx_test.as_user(org_a);
  res := to_jsonb(public.review_payment(sub, true)::text);
  perform public.review_payment((select id from public.payment_submissions where registration_id = reg_y), true);
  perform tkx_test.t('X confirmed after approval', format($q$select 1 from public.registrations where id = %L and status = 'confirmed' and price_paid_pkr = 1000$q$, reg_x), 'rows:1');
  perform tkx_test.t('commission accrued on Y (10 percent of 900)', format($q$select 1 from public.commissions where registration_id = %L and amount_pkr = 90$q$, reg_y), 'rows:1');
  perform tkx_test.t('no commission for X (no referral)', format($q$select 1 from public.commissions where registration_id = %L$q$, reg_x), 'rows:0');
  perform tkx_test.t('organizer cannot void commission', format($q$update public.commissions set status = 'void' where registration_id = %L$q$, reg_y), 'error:void');
  perform tkx_test.t('organizer can mark commission paid', format($q$update public.commissions set status = 'paid' where registration_id = %L$q$, reg_y), 'ok');
  perform tkx_test.t('organizer cannot edit commission amount', format($q$update public.commissions set amount_pkr = 99999 where registration_id = %L$q$, reg_y), 'error:permission denied');
  perform tkx_test.as_root();

  -- announcements and reveal
  perform tkx_test.as_user(org_a);
  perform public.publish_announcement(ev, 'Doors at 9pm', false);
  perform tkx_test.as_root();
  perform tkx_test.as_user(att_x);
  perform tkx_test.t('attendee X receives announcement', $q$select 1 from public.notifications where type = 'announcement'$q$, 'rows:1');
  perform tkx_test.as_root();
  perform tkx_test.as_user(att_y);
  perform tkx_test.t('attendee Y sees only own notifications', $q$select 1 from public.notifications where user_id <> auth.uid()$q$, 'rows:0');
  perform tkx_test.as_root();

  update public.event_secrets set reveal_at = now() - interval '1 minute' where event_id = ev;
  perform set_config('request.jwt.claims', '', true);
  perform public.reveal_due_events();
  perform tkx_test.as_user(att_x);
  perform tkx_test.t('X sees address after reveal', format($q$select 1 where (public.get_event_secret(%L) ->> 'venue_address') = 'Plot 7, Secret Lane'$q$, ev), 'rows:1');
  perform tkx_test.t('X got location notification', $q$select 1 from public.notifications where type = 'location_revealed'$q$, 'rows:1');
  perform tkx_test.as_root();

  -- gate staff
  select qr_token into v_tok_x from public.registrations where id = reg_x;
  perform tkx_test.as_user(org_a);
  gate := public.create_gate_link('Door team', array[ev]);
  perform tkx_test.as_root();
  perform tkx_test.as_anon();
  perform tkx_test.t('gate link lists its event', format($q$select * from public.gate_get_events(%L)$q$, gate ->> 'token'), 'rows:1');
  perform tkx_test.t('gate link cannot check in other event', format($q$select public.gate_check_in(%L, %L, 'zzz')$q$, gate ->> 'token', ev_b), 'error:LINK_SCOPE');
  res := public.gate_check_in(gate ->> 'token', ev, v_tok_x);
  perform tkx_test.as_root();
  perform tkx_test.t('first scan admits', format($q$select 1 where %L::jsonb ->> 'result' = 'admitted'$q$, res), 'rows:1');
  perform tkx_test.as_anon();
  res := public.gate_check_in(gate ->> 'token', ev, v_tok_x);
  perform tkx_test.as_root();
  perform tkx_test.t('second scan is duplicate', format($q$select 1 where %L::jsonb ->> 'result' = 'duplicate'$q$, res), 'rows:1');
  perform tkx_test.t('attendee score updated by scan', format($q$select 1 from public.attendee_stats where id = %L and attended = 1 and score = 10$q$, att_x), 'rows:1');
  perform tkx_test.as_anon();
  perform tkx_test.t('invalid qr is logged as invalid', format($q$select 1 where (public.gate_check_in(%L, %L, 'not-a-token') ->> 'result') = 'invalid'$q$, gate ->> 'token', ev), 'rows:1');
  perform tkx_test.t('gate lookup finds a guest', format($q$select * from public.gate_lookup(%L, %L, 'Attendee')$q$, gate ->> 'token', ev), 'rows>:0');
  perform tkx_test.as_root();

  perform tkx_test.as_user(org_a);
  perform public.revoke_gate_link((gate ->> 'id')::uuid);
  perform tkx_test.as_root();
  perform tkx_test.as_anon();
  perform tkx_test.t('revoked gate link rejected', format($q$select * from public.gate_get_events(%L)$q$, gate ->> 'token'), 'error:LINK_INVALID');
  perform tkx_test.as_root();

  -- promoter dashboard
  promo := ref ->> 'token';
  perform tkx_test.as_anon();
  perform tkx_test.t('promoter dashboard works with token', format($q$select public.promoter_dashboard(%L)$q$, promo), 'ok');
  perform tkx_test.as_root();

  -- scores visible to organizers via function
  perform tkx_test.as_user(org_a);
  perform tkx_test.t('organizer reads registrant scores', format($q$select * from public.get_registrant_scores(%L)$q$, ev), 'rows:2');
  perform tkx_test.as_root();
  perform tkx_test.as_user(org_b);
  perform tkx_test.t('other organizer cannot read registrant scores', format($q$select * from public.get_registrant_scores(%L)$q$, ev), 'error:FORBIDDEN');
  perform tkx_test.as_root();

  -- starter plan limits
  update public.organizer_subscriptions set plan_id = 'starter', status = 'active', current_period_end = now() + interval '20 days' where organizer_id = org_a;
  perform tkx_test.as_user(org_a);
  perform tkx_test.t('starter: advanced commission blocked',
    $q$update public.organizer_commission_defaults set mode = 'percent' where organizer_id = '00000000-0000-4000-8000-0000000000a1'$q$, 'error:PLAN_LIMIT');
  perform tkx_test.t('starter: auto reveal blocked', format($q$update public.event_secrets set reveal_at = now() + interval '3 days' where event_id = %L$q$, ev), 'error:PLAN_LIMIT');
  perform tkx_test.t('starter: scores show tier only', format($q$select 1 from public.get_registrant_scores(%L) where score is null and attended is null$q$, ev), 'rows:2');
  perform tkx_test.as_root();

  -- expired subscription is read only
  update public.organizer_subscriptions set status = 'active', current_period_end = now() - interval '30 days' where organizer_id = org_a;
  perform tkx_test.as_user(org_a);
  perform tkx_test.t('expired plan cannot create events',
    format($q$insert into public.events (organizer_id, title, starts_at) values (%L, 'late', now())$q$, org_a), 'error:SUBSCRIPTION_REQUIRED');
  perform tkx_test.as_root();

  -- admin
  perform tkx_test.as_user(adm);
  perform tkx_test.t('admin can read overview', 'select public.master_overview()', 'ok');
  perform tkx_test.t('admin can suspend event', format($q$select public.admin_set_event_status(%L, 'suspended')$q$, ev), 'ok');
  perform tkx_test.as_root();
  perform tkx_test.as_anon();
  perform tkx_test.t('suspended event vanishes from listings', format($q$select 1 from public.event_listings where id = %L$q$, ev), 'rows:0');
  perform tkx_test.as_root();

  -- ---------- report ----------
  raise exception E'TEST REPORT: % checks, % failed\n%', current_setting('tkx.total', true), coalesce(nullif(current_setting('tkx.fails', true), ''), '0'), current_setting('tkx.log', true);
end $$;
