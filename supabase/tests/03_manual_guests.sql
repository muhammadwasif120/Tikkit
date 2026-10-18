-- TIKKIT X manual guests join the system: claim on signup, ticket stock isolation, no-show scoring.
-- Run:  supabase db query --linked -f supabase/tests/03_manual_guests.sql
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
  late  uuid := '00000000-0000-4000-8000-0000000000c5';
  unc   uuid := '00000000-0000-4000-8000-0000000000c6';
  ev_a uuid; ev_b uuid; tb uuid; ta uuid; n integer;
begin
  insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at, email_confirmed_at) values
    (org_a, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'org-a@test.local', '{"role":"organizer","full_name":"Org A","company_name":"A Events","phone":"03001111111","city":"Karachi"}', now(), now(), now()),
    (org_b, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'org-b@test.local', '{"role":"organizer","full_name":"Org B","company_name":"B Events","phone":"03002222222","city":"Lahore"}', now(), now(), now()),
    (att_x, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'x@test.local', '{"role":"attendee","full_name":"Attendee X","phone":"03003333333","city":"Karachi","gender":"male","date_of_birth":"1995-05-05"}', now(), now(), now()),
    (unc,   '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'unconfirmed@test.local', '{"role":"attendee","full_name":"Unconfirmed","phone":"03005555555","city":"Karachi","gender":"male","date_of_birth":"1997-07-07"}', now(), now(), null);
  update public.profile_private set id_status = 'verified' where id in (org_a, org_b);

  perform tkx_test.as_user(org_a);
  insert into public.events (organizer_id, title, starts_at, ends_at, capacity, status, city) values (org_a, 'Night A', now() + interval '2 days', now() + interval '2 days 4 hours', 50, 'published', 'Karachi') returning id into ev_a;
  insert into public.ticket_types (event_id, name, price_pkr, quantity) values (ev_a, 'General', 1000, 20) returning id into ta;
  perform tkx_test.as_root();
  perform tkx_test.as_user(org_b);
  insert into public.events (organizer_id, title, starts_at, ends_at, capacity, status, city) values (org_b, 'Night B', now() + interval '2 days', now() + interval '2 days 4 hours', 50, 'published', 'Lahore') returning id into ev_b;
  insert into public.ticket_types (event_id, name, price_pkr, quantity) values (ev_b, 'Limited', 500, 5) returning id into tb;
  perform tkx_test.as_root();

  perform tkx_test.as_user(org_a);
  perform tkx_test.t('a manual guest with no account can be added', format($q$select public.add_manual_registration(%L, 'Late Guest', null, 'late@test.local', %L)$q$, ev_a, ta), 'ok');
  perform tkx_test.t('a ticket type from another event is rejected', format($q$select public.add_manual_registration(%L, 'Sneaky', null, 'sneaky@test.local', %L)$q$, ev_a, tb), 'error:TICKET_NOT_FOUND');
  perform tkx_test.t('an existing account is linked and notified', format($q$select public.add_manual_registration(%L, 'Attendee X', null, 'x@test.local', %L)$q$, ev_a, ta), 'ok');
  perform tkx_test.t('manual guest for an unconfirmed account', format($q$select public.add_manual_registration(%L, 'Unconfirmed', null, 'unconfirmed@test.local', %L)$q$, ev_a, ta), 'ok');
  perform tkx_test.as_root();
  perform tkx_test.t('the guest without an account waits unclaimed', format($q$select 1 from public.registrations where event_id = %L and lower(email) = 'late@test.local' and attendee_id is null$q$, ev_a), 'rows:1');
  perform tkx_test.t('an invitation email was queued for them', $q$select 1 from public.email_outbox where template = 'guest_invite' and to_email = 'late@test.local'$q$, 'rows:1');
  perform tkx_test.t('the existing attendee was notified', format($q$select 1 from public.notifications where user_id = %L and type = 'ticket_added'$q$, att_x), 'rows:1');
  perform tkx_test.t('the other organizer ticket stock is untouched', format($q$select 1 from public.registrations where ticket_type_id = %L$q$, tb), 'rows:0');

  -- the guest signs up later with that email
  insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at, email_confirmed_at) values
    (late, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'late@test.local', '{"role":"attendee","full_name":"Late Guest","phone":"03006666666","city":"Karachi","gender":"female","date_of_birth":"1996-06-06"}', now(), now(), now());
  perform tkx_test.as_user(late);
  perform tkx_test.t('signing up with that email claims the ticket', $q$select 1 where public.claim_registrations() = 1$q$, 'rows:1');
  perform tkx_test.t('the ticket now shows in their account', $q$select 1 from public.registrations where attendee_id = auth.uid() and status = 'confirmed'$q$, 'rows:1');
  perform tkx_test.t('claiming twice does nothing', $q$select 1 where public.claim_registrations() = 0$q$, 'rows:1');
  perform tkx_test.as_root();
  perform tkx_test.as_user(unc);
  perform tkx_test.t('an unconfirmed email cannot claim', $q$select 1 where public.claim_registrations() = 0$q$, 'rows:1');
  perform tkx_test.as_root();
  perform tkx_test.as_user(org_b);
  perform tkx_test.t('another organizer cannot claim for anyone', $q$select public.claim_registrations()$q$, 'ok');
  perform tkx_test.as_root();

  -- no show: organizer added guests are never penalised
  update public.events set starts_at = now() - interval '2 days', ends_at = now() - interval '2 days' + interval '1 hour' where id = ev_a;
  perform public.process_no_shows();
  perform tkx_test.t('organizer added guests lose no score for missing the event', format($q$select 1 from public.score_events where attendee_id = %L and reason = 'No show'$q$, att_x), 'rows:0');

  raise exception E'TEST REPORT: % checks, % failed\n%', current_setting('tkx.total', true), coalesce(nullif(current_setting('tkx.fails', true), ''), '0'), current_setting('tkx.log', true);
end $$;
