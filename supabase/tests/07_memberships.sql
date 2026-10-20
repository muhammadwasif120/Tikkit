-- TIKKIT X: membership behaviour test. Run after migration 20261019000001 and after the demo has been reseeded:
--   supabase db query --linked -f supabase/tests/07_memberships.sql
-- Everything runs inside one transaction that is rolled back, so nothing is left behind.
-- Every row in the result should say ok = true. Any false row is a bug.

begin;

create temp table t_results (n serial, name text, ok boolean, detail text);
grant all on t_results to public;
grant usage, select on sequence t_results_n_seq to public;

do $$
declare
  v_org uuid; v_me uuid; v_g uuid;
  v_pass uuid; v_before timestamptz; v_after timestamptz; v_pay uuid;
  v_over uuid; v_lapsed uuid; v_sess uuid; v_n integer; v_status text; v_cycles integer;
  claim text;
begin
  select organizer_id into v_org from public.demo_config;
  select pp.id into v_me from public.profile_private pp where lower(pp.email) = 'demo.attendee@demo.tikkitx.com';
  if v_org is null or v_me is null then
    insert into t_results (name, ok, detail) values ('demo accounts exist', false, 'run scripts/setup_demo.mjs first');
    return;
  end if;
  select id, valid_until into v_pass, v_before from public.pass_purchases where attendee_id = v_me and billing_period = 'monthly' limit 1;
  insert into t_results (name, ok, detail) values ('demo attendee has a monthly membership', v_pass is not null, coalesce(v_pass::text, 'missing: reseed the demo'));
  if v_pass is null then return; end if;

  -- attendee sends a renewal receipt
  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub', v_me, 'role', 'authenticated')::text, true);
  v_pay := public.submit_product_payment('pass_purchase', v_pass, v_me::text || '/test/proof.png', 'TEST1');
  insert into t_results (name, ok, detail) values ('attendee can send a renewal receipt', v_pay is not null, v_pay::text);

  begin
    perform public.submit_product_payment('pass_purchase', v_pass, v_me::text || '/test/proof2.png', 'TEST2');
    insert into t_results (name, ok, detail) values ('a second receipt is refused while one is waiting', false, 'no error');
  exception when others then
    insert into t_results (name, ok, detail) values ('a second receipt is refused while one is waiting', sqlerrm like 'PAYMENT_PENDING%', sqlerrm);
  end;

  -- the membership stays active while the receipt waits
  reset role;
  select status::text into v_status from public.pass_purchases where id = v_pass;
  insert into t_results (name, ok, detail) values ('membership stays active while a receipt is checked', v_status = 'active', v_status);

  -- organizer approves: one more month on the same cycle
  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub', v_org, 'role', 'authenticated')::text, true);
  perform public.review_product_payment(v_pay, true, null);
  reset role;
  select valid_until, cycles_paid into v_after, v_cycles from public.pass_purchases where id = v_pass;
  insert into t_results (name, ok, detail) values ('approval extends paid until by one month', v_after = v_before + interval '1 month', v_before::text || ' -> ' || v_after::text);

  -- someone far from their due date cannot send a payment
  begin
    set local role authenticated;
    perform set_config('request.jwt.claims', json_build_object('sub', v_me, 'role', 'authenticated')::text, true);
    perform public.submit_product_payment('pass_purchase', v_pass, v_me::text || '/test/early.png', null);
    insert into t_results (name, ok, detail) values ('paying far ahead is refused', false, 'no error');
  exception when others then
    insert into t_results (name, ok, detail) values ('paying far ahead is refused', sqlerrm like 'PAYMENT_NOT_DUE%', sqlerrm);
  end;
  reset role;

  -- overdue member inside the grace period: cash payment keeps the old cycle
  select pu.id, pu.valid_until into v_over, v_before from public.pass_purchases pu
    where pu.organizer_id = v_org and pu.billing_period = 'monthly' and pu.status = 'active' and pu.valid_until < now() limit 1;
  if v_over is not null then
    set local role authenticated;
    perform set_config('request.jwt.claims', json_build_object('sub', v_org, 'role', 'authenticated')::text, true);
    perform public.record_membership_payment(v_over, 'Cash');
    reset role;
    select valid_until into v_after from public.pass_purchases where id = v_over;
    insert into t_results (name, ok, detail) values ('recorded payment inside the grace period keeps the cycle', v_after = v_before + interval '1 month', v_before::text || ' -> ' || v_after::text);
  else
    insert into t_results (name, ok, detail) values ('overdue demo member exists', false, 'reseed the demo');
  end if;

  -- lapsed member cannot book, and a recorded payment restarts today
  select pu.id, pu.attendee_id into v_lapsed, v_g from public.pass_purchases pu
    where pu.organizer_id = v_org and pu.billing_period is not null and pu.status = 'expired' limit 1;
  select x.id into v_sess from public.class_sessions x join public.class_series s on s.id = x.series_id
    where s.organizer_id = v_org and x.status = 'scheduled' and x.starts_at > now() order by x.starts_at limit 1;
  if v_lapsed is not null and v_sess is not null then
    begin
      set local role authenticated;
      perform set_config('request.jwt.claims', json_build_object('sub', v_g, 'role', 'authenticated')::text, true);
      perform public.book_class_session(v_sess, v_lapsed);
      insert into t_results (name, ok, detail) values ('a lapsed membership cannot book', false, 'no error');
    exception when others then
      insert into t_results (name, ok, detail) values ('a lapsed membership cannot book', sqlerrm like 'MEMBERSHIP_LAPSED%', sqlerrm);
    end;
    reset role;
    set local role authenticated;
    perform set_config('request.jwt.claims', json_build_object('sub', v_org, 'role', 'authenticated')::text, true);
    perform public.record_membership_payment(v_lapsed, 'Cash');
    reset role;
    select valid_until, status::text into v_after, v_status from public.pass_purchases where id = v_lapsed;
    insert into t_results (name, ok, detail) values ('payment after a lapse restarts from today', v_status = 'active' and v_after > now() + interval '27 days' and v_after < now() + interval '32 days', v_status || ' ' || v_after::text);
  end if;

  -- the roster is private to the organizer and is not empty
  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub', v_org, 'role', 'authenticated')::text, true);
  select count(*) into v_n from public.membership_roster();
  insert into t_results (name, ok, detail) values ('organizer sees their members', v_n >= 4, v_n::text);
  perform set_config('request.jwt.claims', json_build_object('sub', v_me, 'role', 'authenticated')::text, true);
  select count(*) into v_n from public.membership_roster();
  insert into t_results (name, ok, detail) values ('an attendee sees no one else''s members', v_n = 0, v_n::text);
  begin
    perform public.record_membership_payment(v_pass, 'sneaky');
    insert into t_results (name, ok, detail) values ('an attendee cannot record their own payment', false, 'no error');
  exception when others then
    insert into t_results (name, ok, detail) values ('an attendee cannot record their own payment', sqlerrm = 'FORBIDDEN', sqlerrm);
  end;
  reset role;

  -- reminders
  reset role;
  select count(*) into v_n from (select public.process_memberships()) x;
  insert into t_results (name, ok, detail) values ('daily reminder job runs', true, 'ok');
end $$;

select n, name, ok, detail from t_results order by n;

rollback;
