-- TIKKIT X: recurring memberships for classes (gyms, studios, clubs).
--
-- A membership is a monthly pass that renews every week or month. TIKKIT X never touches the money:
-- the member pays the organizer directly, uploads a screenshot, and the organizer approves it, exactly like
-- every other payment. Each approved payment extends the membership by one period. The organizer can also
-- record a cash payment, and can open a pre filled WhatsApp reminder for anyone who is late.
--
-- Rules
--   * Paid until = valid_until. After the grace period with no approved payment the membership lapses
--     (status 'expired') and class booking stops until the next payment is approved.
--   * A payment can be sent once the due date is near (3 days for weekly, 7 days for monthly) or later.
--   * Paying on time or inside the grace period keeps the old cycle dates; paying after a lapse restarts today.
--   * Memberships are on Growth and above (plan limit key 'memberships').

begin;

-- ---------------------------------------------------------------------------
-- 1. Columns
-- ---------------------------------------------------------------------------
alter table public.pass_products
  add column if not exists billing_period  text check (billing_period in ('weekly', 'monthly')),
  add column if not exists grace_days       integer not null default 3 check (grace_days between 0 and 14),
  add column if not exists period_sessions  integer check (period_sessions is null or period_sessions > 0);

alter table public.pass_products drop constraint if exists pass_products_membership_shape;
alter table public.pass_products add constraint pass_products_membership_shape
  check (billing_period is null or (kind = 'monthly' and sessions_count is null));
alter table public.pass_products drop constraint if exists pass_products_period_sessions_shape;
alter table public.pass_products add constraint pass_products_period_sessions_shape
  check (period_sessions is null or billing_period is not null);

alter table public.pass_purchases
  add column if not exists billing_period     text check (billing_period in ('weekly', 'monthly')),
  add column if not exists grace_days         integer not null default 0 check (grace_days between 0 and 14),
  add column if not exists cycles_paid        integer not null default 0 check (cycles_paid >= 0),
  add column if not exists last_reminded_at   timestamptz,
  add column if not exists reminder_count     integer not null default 0 check (reminder_count >= 0),
  add column if not exists notice_for         timestamptz,
  add column if not exists notice_stage       smallint not null default 0;

create index if not exists pass_purchases_membership_idx on public.pass_purchases (organizer_id, valid_until)
  where billing_period is not null;

-- ---------------------------------------------------------------------------
-- 2. Period helpers
-- ---------------------------------------------------------------------------
create or replace function private.membership_period(p text)
returns interval
language sql
immutable
as $$ select case p when 'weekly' then interval '7 days' else interval '1 month' end $$;

-- how long before the due date a member may send the next payment
create or replace function private.membership_window(p text)
returns interval
language sql
immutable
as $$ select case p when 'weekly' then interval '3 days' else interval '7 days' end $$;

-- ---------------------------------------------------------------------------
-- 3. Plan gate: memberships are Growth and above
-- ---------------------------------------------------------------------------
insert into public.plan_limits (plan_id, key, value) values
  ('trial',   'memberships', '-1'::jsonb),
  ('starter', 'memberships', '0'::jsonb),
  ('growth',  'memberships', '-1'::jsonb),
  ('pro',     'memberships', '-1'::jsonb)
on conflict (plan_id, key) do update set value = excluded.value;

create or replace function private.pass_product_membership_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.billing_period is not null
     and (tg_op = 'INSERT' or old.billing_period is distinct from new.billing_period)
     and coalesce(auth.role(), '') <> 'service_role' then
    if private.plan_limit_int(new.organizer_id, 'memberships') = 0 then
      raise exception 'PLAN_LIMIT:memberships: memberships are on the Growth plan and above.' using errcode = 'check_violation';
    end if;
  end if;
  if tg_op = 'UPDATE' and old.billing_period is distinct from new.billing_period
     and exists (select 1 from public.pass_purchases x where x.product_id = new.id) then
    raise exception 'LOCKED: members have already joined, so the billing period cannot change.' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;
drop trigger if exists pass_products_membership_guard on public.pass_products;
create trigger pass_products_membership_guard before insert or update on public.pass_products
  for each row execute function private.pass_product_membership_guard();

-- organizers may set the new columns when creating a product; the period itself never changes afterwards
grant insert (billing_period, grace_days, period_sessions) on public.pass_products to authenticated;
grant update (grace_days, period_sessions) on public.pass_products to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Public projection gains the membership columns (added at the end, so existing readers keep working)
-- ---------------------------------------------------------------------------
create or replace view public.public_pass_products as
select p.id, p.series_id, p.organizer_id, p.name, p.kind, p.sessions_count, p.validity_days, p.price_pkr, p.sort,
       p.billing_period, p.period_sessions
from public.pass_products p
join public.organizer_profiles op on op.id = p.organizer_id
where p.is_active
  and (p.series_id is null or exists (
        select 1 from public.class_series s
        where s.id = p.series_id and s.status = 'published' and s.admin_status = 'live'));
grant select on public.public_pass_products to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 5. Activation and renewal
-- ---------------------------------------------------------------------------
create or replace function private.activate_pass(p_pass uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare p public.pass_purchases; v_days integer;
begin
  select * into p from public.pass_purchases where id = p_pass for update;
  if p.billing_period is not null then
    update public.pass_purchases
       set status = 'active', approved_at = now(), valid_from = now(),
           valid_until = now() + private.membership_period(p.billing_period),
           price_paid_pkr = price_due_pkr, cycles_paid = 1, sessions_used = 0, notice_for = null, notice_stage = 0
     where id = p.id;
    return;
  end if;
  select validity_days into v_days from public.pass_products where id = p.product_id;
  update public.pass_purchases
     set status = 'active', approved_at = now(), valid_from = now(),
         valid_until = now() + make_interval(days => v_days), price_paid_pkr = price_due_pkr
   where id = p.id;
end;
$$;

-- One more paid period. On time (or inside the grace period) the cycle dates carry on; after a lapse it restarts today.
create or replace function private.renew_membership(p_pass uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare p public.pass_purchases; base timestamptz;
begin
  select * into p from public.pass_purchases where id = p_pass for update;
  if not found or p.billing_period is null then return; end if;
  base := case
    when p.status in ('active', 'exhausted') and p.valid_until is not null
         and p.valid_until + make_interval(days => p.grace_days) >= now() then p.valid_until
    else now()
  end;
  update public.pass_purchases
     set status = 'active', approved_at = now(), valid_until = base + private.membership_period(p.billing_period),
         price_paid_pkr = price_due_pkr, cycles_paid = cycles_paid + 1, sessions_used = 0, notice_for = null, notice_stage = 0
   where id = p.id;
end;
$$;

-- ---------------------------------------------------------------------------
-- 6. Buying a membership
-- ---------------------------------------------------------------------------
create or replace function public.purchase_pass(p_product uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  p public.pass_products;
  v_id uuid;
begin
  if uid is null or private.my_role() is distinct from 'attendee' then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
  select * into p from public.pass_products where id = p_product and is_active;
  if not found then raise exception 'PRODUCT_NOT_FOUND: that pass is not available.' using errcode = 'P0002'; end if;
  if not private.can_publish(p.organizer_id) then
    raise exception 'UNAVAILABLE: this organizer is not selling passes right now.' using errcode = 'check_violation';
  end if;
  if p.billing_period is not null and exists (
       select 1 from public.pass_purchases x
       where x.product_id = p.id and x.attendee_id = uid and x.status in ('awaiting_payment', 'payment_submitted', 'active', 'exhausted', 'expired')) then
    raise exception 'ALREADY_MEMBER: you already have this membership. Open My tickets to pay or renew it.' using errcode = 'unique_violation';
  end if;

  insert into public.pass_purchases (product_id, organizer_id, attendee_id, status, sessions_total, price_due_pkr, billing_period, grace_days)
  values (p.id, p.organizer_id, uid, 'awaiting_payment',
          case when p.billing_period is not null then p.period_sessions else p.sessions_count end,
          p.price_pkr, p.billing_period, case when p.billing_period is not null then p.grace_days else 0 end)
  returning id into v_id;

  if p.price_pkr = 0 then
    perform private.activate_pass(v_id);
  else
    perform private.notify(p.organizer_id, null, 'pass_purchase',
      case when p.billing_period is not null then 'New member' else 'New pass purchase' end,
      p.name || ' is waiting for payment.', jsonb_build_object('pass_purchase_id', v_id));
  end if;
  return v_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- 7. Sending and reviewing payments (now also for renewals)
-- ---------------------------------------------------------------------------
create or replace function public.submit_product_payment(
  p_kind public.product_kind, p_subject uuid, p_screenshot_path text, p_reference text default null
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  v_org uuid;
  v_amount integer;
  v_id uuid;
begin
  if uid is null then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
  if p_screenshot_path is null or p_screenshot_path not like uid::text || '/%' then
    raise exception 'PATH_INVALID: upload the proof again.' using errcode = 'check_violation';
  end if;

  if p_kind = 'pass_purchase' then
    select organizer_id, price_due_pkr into v_org, v_amount from public.pass_purchases
      where id = p_subject and attendee_id = uid
        and (status = 'awaiting_payment'
             or (billing_period is not null and approved_at is not null and status in ('active', 'exhausted', 'expired')
                 and valid_until <= now() + private.membership_window(billing_period)))
      for update;
    if v_org is not null and exists (select 1 from public.product_payments x
                                     where x.kind = 'pass_purchase' and x.subject_id = p_subject and x.status = 'submitted') then
      raise exception 'PAYMENT_PENDING: your last payment is still waiting for the organizer.' using errcode = 'check_violation';
    end if;
  elsif p_kind = 'class_booking' then
    select organizer_id, price_due_pkr into v_org, v_amount from public.class_bookings
      where id = p_subject and attendee_id = uid and status = 'awaiting_payment' for update;
  else
    select organizer_id, price_due_pkr into v_org, v_amount from public.space_bookings
      where id = p_subject and attendee_id = uid and status = 'awaiting_payment' for update;
  end if;
  if v_org is null then
    raise exception 'PAYMENT_NOT_DUE: there is nothing to pay for here.' using errcode = 'check_violation';
  end if;

  insert into public.product_payments (kind, subject_id, payer_id, organizer_id, amount_pkr, screenshot_path, reference)
  values (p_kind, p_subject, uid, v_org, v_amount, p_screenshot_path, left(p_reference, 120))
  returning id into v_id;

  if p_kind = 'pass_purchase' then
    -- a renewal keeps the membership as it is while the receipt is checked
    update public.pass_purchases set status = 'payment_submitted' where id = p_subject and status = 'awaiting_payment';
  elsif p_kind = 'class_booking' then
    update public.class_bookings set status = 'payment_submitted' where id = p_subject;
  else
    update public.space_bookings set status = 'payment_submitted' where id = p_subject;
  end if;

  perform private.notify(v_org, null, 'payment_submitted', 'Payment proof received',
    'A guest uploaded proof of payment for you to review.',
    jsonb_build_object('product_payment_id', v_id, 'kind', p_kind));
  return v_id;
end;
$$;

create or replace function public.review_product_payment(p_payment uuid, p_approve boolean, p_reason text default null)
returns public.review_status
language plpgsql
security definer
set search_path = public
as $$
declare pp public.product_payments; v_member boolean := false; v_until timestamptz;
begin
  select * into pp from public.product_payments where id = p_payment for update;
  if not found then raise exception 'NOT_FOUND' using errcode = 'P0002'; end if;
  if not private.manages_org(pp.organizer_id) then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
  if pp.status <> 'submitted' then
    raise exception 'NOT_PENDING: this payment was already reviewed.' using errcode = 'check_violation';
  end if;

  update public.product_payments
     set status = case when p_approve then 'approved'::public.review_status else 'rejected'::public.review_status end,
         reviewed_by = auth.uid(), reviewed_at = now(), reject_reason = case when p_approve then null else left(p_reason, 300) end
   where id = pp.id;

  if pp.kind = 'pass_purchase' then
    select (billing_period is not null) into v_member from public.pass_purchases where id = pp.subject_id;
  end if;

  if p_approve then
    if pp.kind = 'pass_purchase' then
      if v_member and exists (select 1 from public.pass_purchases where id = pp.subject_id and approved_at is not null) then
        perform private.renew_membership(pp.subject_id);
      else
        perform private.activate_pass(pp.subject_id);
      end if;
      select valid_until into v_until from public.pass_purchases where id = pp.subject_id;
    elsif pp.kind = 'class_booking' then
      update public.class_bookings set status = 'confirmed', approved_at = now(), price_paid_pkr = price_due_pkr
       where id = pp.subject_id;
    else
      update public.space_bookings set status = 'confirmed', approved_at = now(), price_paid_pkr = price_due_pkr
       where id = pp.subject_id;
    end if;
  else
    -- back to awaiting payment so the guest can send a better proof (a renewal never left its status)
    if pp.kind = 'pass_purchase' then
      update public.pass_purchases set status = 'awaiting_payment' where id = pp.subject_id and status = 'payment_submitted';
    elsif pp.kind = 'class_booking' then
      update public.class_bookings set status = 'awaiting_payment' where id = pp.subject_id;
    else
      update public.space_bookings set status = 'awaiting_payment' where id = pp.subject_id;
    end if;
  end if;

  perform private.notify(pp.payer_id, null,
    case when p_approve then 'payment_approved' else 'payment_rejected' end,
    case when p_approve then 'Payment approved' else 'Payment not accepted' end,
    case when p_approve and v_member and v_until is not null
           then 'Your membership is paid until ' || to_char(v_until at time zone 'Asia/Karachi', 'DD Mon YYYY') || '.'
         when p_approve then 'Your booking is confirmed.'
         else coalesce(p_reason, 'Please upload a clearer proof of payment.') end,
    jsonb_build_object('product_payment_id', pp.id, 'kind', pp.kind));
  return case when p_approve then 'approved'::public.review_status else 'rejected'::public.review_status end;
end;
$$;

-- Members see the organizer's payment accounts when a renewal is near, too.
create or replace function private.attendee_sees_account(p_account uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    exists (
      select 1 from public.event_payment_accounts epa
      join public.registrations r on r.event_id = epa.event_id
      where epa.payment_account_id = p_account
        and r.attendee_id = auth.uid()
        and r.status in ('awaiting_payment', 'payment_submitted')
    )
    or exists (
      select 1 from public.payment_accounts a
      where a.id = p_account and (
        exists (select 1 from public.pass_purchases x
                where x.organizer_id = a.organizer_id and x.attendee_id = auth.uid()
                  and (x.status in ('awaiting_payment', 'payment_submitted')
                       or (x.billing_period is not null and x.approved_at is not null and x.status in ('active', 'exhausted', 'expired')
                           and x.valid_until <= now() + private.membership_window(x.billing_period))))
        or exists (select 1 from public.class_bookings x
                   where x.organizer_id = a.organizer_id and x.attendee_id = auth.uid()
                     and x.status in ('awaiting_payment', 'payment_submitted'))
        or exists (select 1 from public.space_bookings x
                   where x.organizer_id = a.organizer_id and x.attendee_id = auth.uid()
                     and x.status in ('awaiting_payment', 'payment_submitted'))
      )
    )
$$;

-- ---------------------------------------------------------------------------
-- 7b. Cash or direct payments the organizer records by hand, and stopping a membership
-- ---------------------------------------------------------------------------
create or replace function public.record_membership_payment(p_pass uuid, p_note text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare p public.pass_purchases; v_until timestamptz;
begin
  select * into p from public.pass_purchases where id = p_pass for update;
  if not found then raise exception 'NOT_FOUND' using errcode = 'P0002'; end if;
  if not private.manages_org(p.organizer_id) then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
  if p.billing_period is null then raise exception 'NOT_A_MEMBERSHIP: only memberships renew.' using errcode = 'check_violation'; end if;
  if p.status = 'cancelled' then raise exception 'CANCELLED: this membership was stopped.' using errcode = 'check_violation'; end if;
  if exists (select 1 from public.product_payments x where x.kind = 'pass_purchase' and x.subject_id = p.id and x.status = 'submitted') then
    raise exception 'PAYMENT_PENDING: a receipt is waiting. Approve it instead.' using errcode = 'check_violation';
  end if;

  insert into public.product_payments (kind, subject_id, payer_id, organizer_id, amount_pkr, screenshot_path, reference, status, reviewed_by, reviewed_at)
  values ('pass_purchase', p.id, p.attendee_id, p.organizer_id, p.price_due_pkr, 'manual:recorded',
          coalesce(nullif(left(trim(coalesce(p_note, '')), 120), ''), 'Recorded by the organizer'), 'approved', auth.uid(), now());

  if p.approved_at is null then perform private.activate_pass(p.id); else perform private.renew_membership(p.id); end if;
  select valid_until into v_until from public.pass_purchases where id = p.id;
  perform private.notify(p.attendee_id, null, 'payment_approved', 'Payment recorded',
    'Your membership is paid until ' || to_char(v_until at time zone 'Asia/Karachi', 'DD Mon YYYY') || '.',
    jsonb_build_object('pass_purchase_id', p.id));
end;
$$;

create or replace function public.mark_membership_reminded(p_pass uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare p public.pass_purchases;
begin
  select * into p from public.pass_purchases where id = p_pass;
  if not found or not private.manages_org(p.organizer_id) then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
  update public.pass_purchases set last_reminded_at = now(), reminder_count = reminder_count + 1 where id = p.id;
end;
$$;

create or replace function public.stop_membership(p_pass uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare p public.pass_purchases;
begin
  select * into p from public.pass_purchases where id = p_pass for update;
  if not found then raise exception 'NOT_FOUND' using errcode = 'P0002'; end if;
  if p.attendee_id <> auth.uid() and not private.manages_org(p.organizer_id) then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
  if p.billing_period is null then raise exception 'NOT_A_MEMBERSHIP: only memberships can be stopped.' using errcode = 'check_violation'; end if;
  update public.pass_purchases set status = 'cancelled' where id = p.id and status <> 'cancelled';
  update public.product_payments set status = 'rejected', reject_reason = 'Membership stopped', reviewed_at = now()
   where kind = 'pass_purchase' and subject_id = p.id and status = 'submitted';
  if p.attendee_id <> auth.uid() then
    perform private.notify(p.attendee_id, null, 'membership_stopped', 'Membership stopped', 'Your organizer stopped this membership.', jsonb_build_object('pass_purchase_id', p.id));
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- 8. The organizer's member list (names and phone numbers of their own members only)
-- ---------------------------------------------------------------------------
create or replace function public.membership_roster()
returns table (
  id uuid, attendee_id uuid, full_name text, phone text, product_name text, billing_period text, price_pkr integer,
  valid_until timestamptz, status text, state text, cycles_paid integer, grace_days integer,
  last_reminded_at timestamptz, reminder_count integer, pending_payment_id uuid, sessions_total integer, sessions_used integer
)
language sql
stable
security definer
set search_path = public
as $$
  select * from (
    select pu.id, pu.attendee_id, pr.full_name, pv.phone, pd.name, pu.billing_period, pu.price_due_pkr,
           pu.valid_until, pu.status::text,
           case
             when pu.status = 'awaiting_payment' then 'awaiting_first'
             when pu.status = 'payment_submitted' then 'pending_first'
             when pend.id is not null then 'pending'
             when pu.status = 'expired' then 'lapsed'
             when pu.valid_until < now() then 'overdue'
             when pu.valid_until <= now() + private.membership_window(pu.billing_period) then 'due_soon'
             else 'paid'
           end as state,
           pu.cycles_paid, pu.grace_days, pu.last_reminded_at, pu.reminder_count, pend.id, pu.sessions_total, pu.sessions_used
    from public.pass_purchases pu
    join public.pass_products pd on pd.id = pu.product_id
    join public.profiles pr on pr.id = pu.attendee_id
    left join public.profile_private pv on pv.id = pu.attendee_id
    left join lateral (select x.id from public.product_payments x
                       where x.kind = 'pass_purchase' and x.subject_id = pu.id and x.status = 'submitted' limit 1) pend on true
    where pu.billing_period is not null and pu.status <> 'cancelled'
      and (pu.organizer_id = auth.uid() or private.is_team_manager(pu.organizer_id))
  ) m
  order by case m.state when 'overdue' then 0 when 'lapsed' then 1 when 'pending' then 2 when 'pending_first' then 2 when 'due_soon' then 3 when 'awaiting_first' then 4 else 5 end,
           m.valid_until nulls last
$$;
revoke all on function public.membership_roster() from public, anon;
grant execute on function public.membership_roster() to authenticated;
revoke all on function public.record_membership_payment(uuid, text) from public, anon;
grant execute on function public.record_membership_payment(uuid, text) to authenticated;
revoke all on function public.mark_membership_reminded(uuid) from public, anon;
grant execute on function public.mark_membership_reminded(uuid) to authenticated;
revoke all on function public.stop_membership(uuid) from public, anon;
grant execute on function public.stop_membership(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 9. Booking with a membership respects the grace period
-- ---------------------------------------------------------------------------
create or replace function public.book_class_session(p_session uuid, p_pass uuid default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  se public.class_sessions;
  sr public.class_series;
  pp public.pass_purchases;
  v_cap integer;
  v_taken integer;
  v_price integer := 0;
  v_status public.registration_status;
  v_id uuid;
begin
  if uid is null or private.my_role() is distinct from 'attendee' then raise exception 'FORBIDDEN' using errcode = '42501'; end if;

  select * into se from public.class_sessions where id = p_session for update;
  if not found or se.status <> 'scheduled' or se.starts_at <= now() then
    raise exception 'SESSION_UNAVAILABLE: that class is not open for booking.' using errcode = 'check_violation';
  end if;
  select * into sr from public.class_series where id = se.series_id;
  if sr.status <> 'published' or sr.admin_status <> 'live' then
    raise exception 'SESSION_UNAVAILABLE: that class is not open for booking.' using errcode = 'check_violation';
  end if;
  if exists (select 1 from public.class_bookings b
             where b.session_id = se.id and b.attendee_id = uid and b.status not in ('rejected', 'cancelled')) then
    raise exception 'ALREADY_BOOKED: you already have a place in this class.' using errcode = 'unique_violation';
  end if;

  v_cap := coalesce(se.capacity, sr.capacity);
  if v_cap is not null then
    select count(*) into v_taken from public.class_bookings b
      where b.session_id = se.id and b.status = any (private.class_seat_statuses());
    if v_taken >= v_cap then
      raise exception 'SESSION_FULL: this class is full.' using errcode = 'check_violation';
    end if;
  end if;

  if p_pass is not null then
    select * into pp from public.pass_purchases where id = p_pass and attendee_id = uid for update;
    if found and pp.billing_period is not null and pp.status = 'expired' then
      raise exception 'MEMBERSHIP_LAPSED: your membership payment is overdue. Pay to keep booking.' using errcode = 'check_violation';
    end if;
    if not found or pp.status <> 'active' or pp.organizer_id <> sr.organizer_id
       or (pp.valid_until is not null and
           pp.valid_until + make_interval(days => case when pp.billing_period is not null then pp.grace_days else 0 end) < se.starts_at) then
      raise exception 'PASS_INVALID: that pass cannot be used for this class.' using errcode = 'check_violation';
    end if;
    if exists (select 1 from public.pass_products pr
               where pr.id = pp.product_id and pr.series_id is not null and pr.series_id <> sr.id) then
      raise exception 'PASS_SCOPE: that pass is for a different class.' using errcode = 'check_violation';
    end if;
    if pp.sessions_total is not null and pp.sessions_used >= pp.sessions_total then
      raise exception 'PASS_EMPTY: that pass has no sessions left.' using errcode = 'check_violation';
    end if;
    update public.pass_purchases
       set sessions_used = sessions_used + 1,
           status = case when sessions_total is not null and sessions_used + 1 >= sessions_total
                         then 'exhausted'::public.pass_status else status end
     where id = pp.id;
    v_status := 'confirmed';
  else
    v_price := sr.drop_in_price_pkr;
    v_status := case when v_price = 0 then 'confirmed'::public.registration_status
                     else 'awaiting_payment'::public.registration_status end;
  end if;

  insert into public.class_bookings (session_id, series_id, organizer_id, attendee_id, pass_purchase_id,
                                     status, price_due_pkr, approved_at)
  values (se.id, sr.id, sr.organizer_id, uid, p_pass, v_status, v_price,
          case when v_status = 'confirmed' then now() end)
  returning id into v_id;

  perform private.notify(sr.organizer_id, null, 'class_booking', 'New class booking',
    sr.title || ' on ' || to_char(se.starts_at at time zone 'Asia/Karachi', 'DD Mon HH12:MI AM'),
    jsonb_build_object('booking_id', v_id, 'series_id', sr.id));
  return v_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- 10. Scheduled work
-- ---------------------------------------------------------------------------
-- Same job as before, except a membership only lapses once its grace period is over.
create or replace function public.process_class_sessions()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare b record; n integer := 0; s record;
begin
  for s in select id from public.class_series where status = 'published' and admin_status = 'live' loop
    perform private.generate_class_sessions(s.id, 12);
  end loop;

  for b in
    select cb.id, cb.attendee_id from public.class_bookings cb
    join public.class_sessions x on x.id = cb.session_id
    where cb.status = 'confirmed' and x.ends_at < now() - interval '1 hour'
  loop
    update public.class_bookings set status = 'no_show' where id = b.id;
    perform private.award_score(b.attendee_id, null, null, -10, 'Missed class', false, true);
    n := n + 1;
  end loop;

  for b in
    select cb.id from public.class_bookings cb
    join public.class_sessions x on x.id = cb.session_id
    where cb.status in ('awaiting_payment', 'payment_submitted') and x.starts_at < now()
  loop
    perform private.release_class_booking(b.id, 'Payment not received before class');
  end loop;

  update public.class_sessions set status = 'completed' where status = 'scheduled' and ends_at < now();
  update public.pass_purchases set status = 'expired'
   where status in ('active', 'exhausted') and valid_until is not null
     and valid_until + make_interval(days => case when billing_period is not null then grace_days else 0 end) < now();
  update public.class_series set status = 'ended'
   where status = 'published' and ends_on is not null and ends_on < private.pk_date(now());

  return n;
end;
$$;

-- Daily in app reminders for members (and a heads up to the organizer when someone is late).
-- Stages: 1 = due soon, 2 = due today, 3 = overdue. Each stage is sent once per cycle.
create or replace function public.process_memberships()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare m record; v_stage smallint; v_left integer; v_n integer := 0; v_name text;
begin
  for m in
    select pu.*, pd.name as product_name, pr.full_name
    from public.pass_purchases pu
    join public.pass_products pd on pd.id = pu.product_id
    join public.profiles pr on pr.id = pu.attendee_id
    where pu.billing_period is not null and pu.approved_at is not null and pu.status in ('active', 'exhausted')
      and pu.valid_until is not null and pu.valid_until <= now() + private.membership_window(pu.billing_period)
      and not exists (select 1 from public.product_payments x where x.kind = 'pass_purchase' and x.subject_id = pu.id and x.status = 'submitted')
  loop
    v_left := private.pk_date(m.valid_until) - private.pk_date(now());
    v_stage := case when v_left < 0 then 3 when v_left = 0 then 2 else 1 end;
    continue when m.notice_for is not distinct from m.valid_until and m.notice_stage >= v_stage;

    perform private.notify(m.attendee_id, null, 'membership_due',
      case v_stage when 1 then 'Membership payment coming up' when 2 then 'Membership payment due today' else 'Membership payment overdue' end,
      m.product_name || ': ' || case v_stage
        when 1 then 'due on ' || to_char(m.valid_until at time zone 'Asia/Karachi', 'DD Mon') || '. Open My tickets to pay.'
        when 2 then 'pay today to keep booking classes.'
        else 'pay now to keep booking classes. It lapses ' || m.grace_days || ' days after the due date.' end,
      jsonb_build_object('pass_purchase_id', m.id, 'stage', v_stage));

    if v_stage = 3 then
      v_name := coalesce(m.full_name, 'A member');
      perform private.notify(m.organizer_id, null, 'membership_overdue', 'Membership overdue',
        v_name || ' is overdue on ' || m.product_name || '. Send a WhatsApp reminder from Members.',
        jsonb_build_object('pass_purchase_id', m.id));
    end if;

    update public.pass_purchases set notice_for = m.valid_until, notice_stage = v_stage where id = m.id;
    v_n := v_n + 1;
  end loop;
  return v_n;
end;
$$;
revoke all on function public.process_memberships() from public, anon, authenticated;
grant execute on function public.process_memberships() to service_role;

select cron.unschedule(jobid) from cron.job where jobname = 'tkx_process_memberships';
select cron.schedule('tkx_process_memberships', '30 4 * * *', $$select public.process_memberships()$$);

-- ---------------------------------------------------------------------------
-- 11. Demo: a studio membership with members in every state
-- ---------------------------------------------------------------------------
create or replace function private.seed_demo_memberships()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  org uuid; me uuid; guests uuid[]; g integer;
  s1 uuid; m_studio uuid := gen_random_uuid(); m_week uuid := gen_random_uuid();
  pu uuid;
  receipt text;
begin
  select organizer_id into org from public.demo_config;
  if org is null then return; end if;
  receipt := org::text || '/demo/receipt.png';
  select coalesce(array_agg(pp.id order by pp.email), '{}') into guests
    from public.profile_private pp where pp.email like 'demo.guest%@demo.tikkitx.com';
  g := coalesce(cardinality(guests), 0);
  select pp.id into me from public.profile_private pp where lower(pp.email) = 'demo.attendee@demo.tikkitx.com';
  select id into s1 from public.class_series where organizer_id = org order by created_at limit 1;

  insert into public.pass_products (id, organizer_id, series_id, name, kind, sessions_count, validity_days, price_pkr, sort, billing_period, grace_days, period_sessions)
  values (m_studio, org, null, 'Studio membership', 'monthly', null, 30, 8000, 3, 'monthly', 3, null),
         (m_week, org, s1, 'Weekly Vinyasa club', 'monthly', null, 7, 2000, 4, 'weekly', 2, 3);

  if g >= 8 then
    -- paid, comfortably
    insert into public.pass_purchases (product_id, organizer_id, attendee_id, status, valid_from, valid_until, sessions_used, price_due_pkr, price_paid_pkr, approved_at, billing_period, grace_days, cycles_paid)
    values (m_studio, org, guests[5], 'active', now() - interval '11 days', now() + interval '19 days', 4, 8000, 8000, now() - interval '11 days', 'monthly', 3, 3);
    -- due soon
    insert into public.pass_purchases (product_id, organizer_id, attendee_id, status, valid_from, valid_until, sessions_used, price_due_pkr, price_paid_pkr, approved_at, billing_period, grace_days, cycles_paid)
    values (m_studio, org, guests[6], 'active', now() - interval '26 days', now() + interval '4 days', 9, 8000, 8000, now() - interval '26 days', 'monthly', 3, 5);
    -- overdue, still inside the grace period
    insert into public.pass_purchases (product_id, organizer_id, attendee_id, status, valid_from, valid_until, sessions_used, price_due_pkr, price_paid_pkr, approved_at, billing_period, grace_days, cycles_paid, last_reminded_at, reminder_count)
    values (m_studio, org, guests[7], 'active', now() - interval '31 days', now() - interval '1 day', 7, 8000, 8000, now() - interval '31 days', 'monthly', 3, 2, now() - interval '5 hours', 1);
    -- lapsed
    insert into public.pass_purchases (product_id, organizer_id, attendee_id, status, valid_from, valid_until, sessions_used, price_due_pkr, price_paid_pkr, approved_at, billing_period, grace_days, cycles_paid)
    values (m_studio, org, guests[8], 'expired', now() - interval '40 days', now() - interval '10 days', 2, 8000, 8000, now() - interval '40 days', 'monthly', 3, 1);
    -- renewal receipt waiting for the organizer
    insert into public.pass_purchases (product_id, organizer_id, attendee_id, status, valid_from, valid_until, sessions_used, price_due_pkr, price_paid_pkr, approved_at, billing_period, grace_days, cycles_paid)
    values (m_studio, org, guests[2], 'active', now() - interval '30 days', now() + interval '1 day', 6, 8000, 8000, now() - interval '30 days', 'monthly', 3, 4)
    returning id into pu;
    insert into public.product_payments (kind, subject_id, payer_id, organizer_id, amount_pkr, screenshot_path, reference, status)
    values ('pass_purchase', pu, guests[2], org, 8000, receipt, 'TXN' || '771204', 'submitted');
    -- weekly club with a cap of three sessions a week
    insert into public.pass_purchases (product_id, organizer_id, attendee_id, status, valid_from, valid_until, sessions_total, sessions_used, price_due_pkr, price_paid_pkr, approved_at, billing_period, grace_days, cycles_paid)
    values (m_week, org, guests[1], 'active', now() - interval '3 days', now() + interval '4 days', 3, 1, 2000, 2000, now() - interval '3 days', 'weekly', 2, 6);
  end if;

  -- the demo attendee: a monthly membership whose next payment is almost due
  if me is not null then
    insert into public.pass_purchases (product_id, organizer_id, attendee_id, status, valid_from, valid_until, sessions_used, price_due_pkr, price_paid_pkr, approved_at, billing_period, grace_days, cycles_paid)
    values (m_studio, org, me, 'active', now() - interval '28 days', now() + interval '2 days', 5, 8000, 8000, now() - interval '28 days', 'monthly', 3, 2);
  end if;
end;
$$;
revoke all on function private.seed_demo_memberships() from public, anon, authenticated;

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
  perform private.seed_demo_memberships();
  return true;
end;
$$;
revoke all on function public.demo_reseed(boolean) from public, anon, authenticated;
grant execute on function public.demo_reseed(boolean) to service_role;

commit;
