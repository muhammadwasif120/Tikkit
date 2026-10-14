-- TIKKIT X baseline 8/10: business flows as security definer functions.
-- Trust data (status, score, commission, check-in, subscription) changes only here.
-- Error messages start with a machine readable code, e.g. 'ALREADY_REGISTERED: ...'.

begin;

-- ---------------------------------------------------------------------------
-- Small helpers
-- ---------------------------------------------------------------------------
create or replace function private.notify(
  p_user uuid, p_event uuid, p_type text, p_title text, p_body text default null, p_meta jsonb default '{}'::jsonb
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_user is null then return; end if;
  insert into public.notifications (user_id, event_id, type, title, body, metadata)
  values (p_user, p_event, p_type, p_title, p_body, coalesce(p_meta, '{}'::jsonb));
end;
$$;

create or replace function private.owns_event(p_event uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.events e where e.id = p_event and e.organizer_id = auth.uid())
$$;

create or replace function private.manages_event(p_event uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select private.owns_event(p_event) or private.is_admin()
$$;

create or replace function private.audit(p_action text, p_entity text, p_entity_id text, p_details jsonb default '{}'::jsonb)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.admin_audit_log (actor_id, action, entity, entity_id, details)
  values (auth.uid(), p_action, p_entity, p_entity_id, coalesce(p_details, '{}'::jsonb))
$$;

-- ---------------------------------------------------------------------------
-- Guest score. Called only from other functions.
-- ---------------------------------------------------------------------------
create or replace function private.score_tier_for(p_score integer, p_attended integer, p_no_shows integer)
returns public.score_tier
language sql
immutable
as $$
  select case
    when p_attended = 0 then 'new'::public.score_tier
    when p_score >= 120 and p_no_shows * 5 <= p_attended then 'trusted'::public.score_tier
    when p_score >= 60 then 'regular'::public.score_tier
    when p_score >= 20 then 'reliable'::public.score_tier
    else 'new'::public.score_tier
  end
$$;

create or replace function private.award_score(
  p_attendee uuid, p_event uuid, p_reg uuid, p_delta integer, p_reason text,
  p_attended boolean default false, p_no_show boolean default false, p_vip boolean default false
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare s public.attendee_stats;
begin
  if p_attendee is null then return; end if;
  insert into public.attendee_stats (id) values (p_attendee) on conflict (id) do nothing;
  insert into public.score_events (attendee_id, event_id, registration_id, delta, reason)
  values (p_attendee, p_event, p_reg, p_delta, p_reason);

  select * into s from public.attendee_stats where id = p_attendee for update;
  s.score := greatest(s.score + p_delta, 0);
  if p_attended then
    s.attended := s.attended + 1;
    s.streak := s.streak + 1;
    s.longest_streak := greatest(s.longest_streak, s.streak);
    if p_vip then s.vip_events := s.vip_events + 1; end if;
  end if;
  if p_no_show then
    s.no_shows := s.no_shows + 1;
    s.streak := 0;
  end if;
  update public.attendee_stats
     set score = s.score, attended = s.attended, no_shows = s.no_shows, vip_events = s.vip_events,
         streak = s.streak, longest_streak = s.longest_streak,
         tier = private.score_tier_for(s.score, s.attended, s.no_shows), updated_at = now()
   where id = p_attendee;
end;
$$;

-- ---------------------------------------------------------------------------
-- Discount and commission math
-- ---------------------------------------------------------------------------
create or replace function private.discount_amount(p_type public.discount_type, p_value integer, p_price integer)
returns integer
language sql
immutable
as $$
  select case
    when p_type is null or p_value is null then 0
    when p_type = 'percent' then least(p_price, round(p_price * least(p_value, 100) / 100.0)::int)
    else least(p_price, p_value)
  end
$$;

-- Commission for a registration, following link -> organizer default.
create or replace function private.accrue_commission(p_reg uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r        public.registrations;
  l        public.referral_links;
  d        public.organizer_commission_defaults;
  v_org    uuid;
  v_mode   public.commission_mode;
  v_value  integer;
  v_tiers  jsonb;
  v_base   integer;
  v_amount integer := 0;
  v_prior  integer;
  v_tier   jsonb;
  v_cum    integer := 0;
  v_tmode  text;
begin
  select * into r from public.registrations where id = p_reg;
  if not found or r.referrer_id is null or r.price_paid_pkr is null then return; end if;
  if exists (select 1 from public.commissions where registration_id = p_reg) then return; end if;

  select e.organizer_id into v_org from public.events e where e.id = r.event_id;
  select * into l from public.referral_links where id = r.referral_link_id;
  select * into d from public.organizer_commission_defaults where organizer_id = v_org;

  v_mode  := coalesce(l.commission_mode, d.mode, 'none');
  v_value := coalesce(l.commission_value, d.value, 0);
  v_tiers := coalesce(l.commission_tiers, d.tiers);
  v_base  := r.price_paid_pkr;

  if v_mode = 'none' then return; end if;

  if v_mode = 'percent' then
    v_amount := round(v_base * v_value / 100.0)::int;
  elsif v_mode = 'fixed' then
    v_amount := v_value;
  elsif v_mode = 'tiered' and v_tiers is not null then
    select count(*) into v_prior from public.commissions c
      where c.referrer_id = r.referrer_id and c.event_id = r.event_id and c.status <> 'void';
    v_tmode := 'percent';
    for v_tier in select * from jsonb_array_elements(v_tiers) loop
      v_tmode := coalesce(v_tier ->> 'mode', 'percent');
      if v_tier ? 'upto' then
        v_cum := (v_tier ->> 'upto')::int;
        if v_prior < v_cum then
          v_value := (v_tier ->> 'value')::int; exit;
        end if;
      else
        v_value := (v_tier ->> 'value')::int; exit;
      end if;
    end loop;
    v_amount := case when v_tmode = 'fixed' then v_value else round(v_base * v_value / 100.0)::int end;
  end if;

  -- The buyer discount can be funded by the referrer's commission.
  if l.discount_funded_by = 'referrer' then
    v_amount := v_amount - r.discount_pkr;
  elsif l.discount_funded_by = 'split' then
    v_amount := v_amount - (r.discount_pkr / 2);
  end if;
  v_amount := greatest(v_amount, 0);

  insert into public.commissions (registration_id, event_id, organizer_id, referrer_id, amount_pkr)
  values (p_reg, r.event_id, v_org, r.referrer_id, v_amount);
end;
$$;

create or replace function private.void_commission(p_reg uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.commissions set status = 'void' where registration_id = p_reg and status <> 'paid'
$$;

-- ---------------------------------------------------------------------------
-- Register for an event (attendee)
-- ---------------------------------------------------------------------------
create or replace function public.register_for_event(
  p_event uuid,
  p_ticket_type uuid default null,
  p_days date[] default null,
  p_code text default null,
  p_phone text default null,
  p_notes text default null,
  p_plus_one boolean default false,
  p_plus_one_name text default null,
  p_reference_code text default null
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid     uuid := auth.uid();
  v_prof    public.profiles;
  v_priv    public.profile_private;
  v_event   public.events;
  v_secret  public.event_secrets;
  v_ticket  public.ticket_types;
  v_link    public.referral_links;
  v_coupon  public.coupons;
  v_ref     public.referrers;
  v_price   integer := 0;
  v_disc    integer := 0;
  v_taken   integer;
  v_ttaken  integer;
  v_status  public.registration_status;
  v_id      uuid;
  v_code    text := nullif(trim(coalesce(p_code, '')), '');
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED: sign in to register.' using errcode = '28000'; end if;

  select * into v_prof from public.profiles where id = v_uid;
  if not found or v_prof.role <> 'attendee' then
    raise exception 'ATTENDEE_ONLY: register with an attendee account.' using errcode = '42501';
  end if;
  if not v_prof.is_complete then
    raise exception 'PROFILE_INCOMPLETE: complete your profile (phone, date of birth, gender, city) first.' using errcode = 'check_violation';
  end if;
  select * into v_priv from public.profile_private where id = v_uid;

  select * into v_event from public.events where id = p_event for update;
  if not found or v_event.status <> 'published' or v_event.admin_status <> 'live' then
    raise exception 'EVENT_UNAVAILABLE: this event is not open for registration.' using errcode = 'check_violation';
  end if;
  if coalesce(v_event.ends_at, v_event.starts_at + interval '12 hours') < now() then
    raise exception 'EVENT_ENDED: this event has ended.' using errcode = 'check_violation';
  end if;
  if v_event.organizer_id = v_uid then
    raise exception 'OWN_EVENT: you cannot register for your own event.' using errcode = 'check_violation';
  end if;

  if exists (select 1 from public.registrations r
             where r.event_id = p_event and r.attendee_id = v_uid and r.status not in ('rejected', 'cancelled')) then
    raise exception 'ALREADY_REGISTERED: you are already registered for this event.' using errcode = 'unique_violation';
  end if;

  if v_event.require_id_verified and v_priv.id_status <> 'verified' then
    raise exception 'ID_VERIFICATION_REQUIRED: this event requires a verified ID.' using errcode = 'check_violation';
  end if;

  select * into v_secret from public.event_secrets where event_id = p_event;
  if v_secret.require_reference_code
     and lower(trim(coalesce(p_reference_code, ''))) <> lower(coalesce(v_secret.reference_code, '')) then
    raise exception 'INVALID_REFERENCE_CODE: the invite code is not valid.' using errcode = 'check_violation';
  end if;

  -- ticket type
  if p_ticket_type is not null then
    select * into v_ticket from public.ticket_types where id = p_ticket_type and event_id = p_event;
    if not found then raise exception 'TICKET_INVALID: ticket type not found.' using errcode = 'check_violation'; end if;
    if v_ticket.sales_start is not null and v_ticket.sales_start > now() then
      raise exception 'TICKET_NOT_ON_SALE: this ticket is not on sale yet.' using errcode = 'check_violation';
    end if;
    if v_ticket.sales_end is not null and v_ticket.sales_end <= now() then
      raise exception 'TICKET_EXPIRED: this ticket is no longer on sale.' using errcode = 'check_violation';
    end if;
    if v_ticket.quantity is not null then
      select count(*) into v_ttaken from public.registrations r
        where r.ticket_type_id = v_ticket.id and r.status = any (private.seat_statuses());
      if v_ttaken >= v_ticket.quantity then
        raise exception 'TICKET_SOLD_OUT: this ticket type is sold out.' using errcode = 'check_violation';
      end if;
    end if;
    v_price := v_ticket.price_pkr;
  end if;

  -- referral link or coupon
  if v_code is not null then
    select * into v_link from public.referral_links l
      where l.event_id = p_event and lower(l.code) = lower(v_code) and l.is_active
        and (l.expires_at is null or l.expires_at > now())
        and (l.max_uses is null or l.uses < l.max_uses);
    if found then
      select * into v_ref from public.referrers where id = v_link.referrer_id and is_active;
      if v_ref.id is not null
         and ((v_ref.phone is not null and v_ref.phone = v_priv.phone)
           or (v_ref.email is not null and lower(v_ref.email) = lower(v_priv.email))) then
        raise exception 'SELF_REFERRAL: you cannot use your own referral code.' using errcode = 'check_violation';
      end if;
      v_disc := private.discount_amount(v_link.buyer_discount_type, v_link.buyer_discount_value, v_price);
    else
      select * into v_coupon from public.coupons c
        where c.event_id = p_event and lower(c.code) = lower(v_code) and c.is_active
          and (c.expires_at is null or c.expires_at > now())
          and (c.max_uses is null or c.uses < c.max_uses);
      if not found then
        raise exception 'CODE_INVALID: that code is not valid for this event.' using errcode = 'check_violation';
      end if;
      v_disc := private.discount_amount(v_coupon.discount_type, v_coupon.discount_value, v_price);
    end if;
  end if;

  -- capacity
  select count(*) into v_taken from public.registrations r
    where r.event_id = p_event and r.status = any (private.seat_statuses());
  if v_event.capacity is not null and v_taken >= v_event.capacity then
    v_status := 'waitlisted';
  elsif v_event.registration_mode = 'approval' then
    v_status := 'requested';
  elsif v_price - v_disc > 0 then
    v_status := 'awaiting_payment';
  else
    v_status := 'confirmed';
  end if;

  insert into public.registrations (
    event_id, attendee_id, ticket_type_id, source, status, full_name, phone, email, gender,
    ticket_days, plus_one, plus_one_name, is_vip, notes, price_due_pkr, discount_pkr,
    referrer_id, referral_link_id, coupon_id, reference_code_entered, approved_at
  ) values (
    p_event, v_uid, p_ticket_type, 'self', v_status, v_prof.full_name,
    coalesce(nullif(trim(p_phone), ''), v_priv.phone), v_priv.email, v_priv.gender,
    p_days, coalesce(p_plus_one, false), p_plus_one_name, coalesce(v_ticket.is_vip, false), p_notes,
    v_price - v_disc, v_disc,
    v_link.referrer_id, v_link.id, v_coupon.id, p_reference_code,
    case when v_status = 'confirmed' then now() end
  ) returning id into v_id;

  if v_link.id is not null then update public.referral_links set uses = uses + 1 where id = v_link.id; end if;
  if v_coupon.id is not null then update public.coupons set uses = uses + 1 where id = v_coupon.id; end if;

  perform private.notify(v_event.organizer_id, p_event,
    case v_status when 'requested' then 'registration_request' else 'registration_new' end,
    case v_status when 'requested' then 'New request to join' else 'New registration' end,
    v_prof.full_name || ' - ' || v_event.title);

  return v_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Attendee submits payment proof
-- ---------------------------------------------------------------------------
create or replace function public.submit_payment(p_registration uuid, p_screenshot_path text, p_reference text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.registrations;
  v_event public.events;
  v_id uuid;
begin
  select * into r from public.registrations where id = p_registration and attendee_id = auth.uid() for update;
  if not found then raise exception 'NOT_FOUND: registration not found.' using errcode = 'no_data_found'; end if;
  if r.status not in ('awaiting_payment', 'payment_submitted') then
    raise exception 'INVALID_STATE: payment cannot be submitted for this registration.' using errcode = 'check_violation';
  end if;
  if coalesce(p_screenshot_path, '') = '' then
    raise exception 'SCREENSHOT_REQUIRED: attach your payment screenshot.' using errcode = 'check_violation';
  end if;

  update public.payment_submissions set status = 'rejected', reason = coalesce(reason, 'Replaced by a new submission'),
         reviewed_at = now()
   where registration_id = p_registration and status = 'submitted';

  insert into public.payment_submissions (registration_id, screenshot_path, reference, amount_pkr)
  values (p_registration, p_screenshot_path, nullif(trim(p_reference), ''), r.price_due_pkr)
  returning id into v_id;

  update public.registrations set status = 'payment_submitted', status_reason = null where id = p_registration;

  select * into v_event from public.events where id = r.event_id;
  perform private.notify(v_event.organizer_id, r.event_id, 'payment_submitted', 'Payment proof received',
                         r.full_name || ' - ' || v_event.title);
  return v_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Organizer decisions
-- ---------------------------------------------------------------------------
create or replace function public.review_registration(p_registration uuid, p_approve boolean, p_reason text default null)
returns public.registration_status
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.registrations;
  v_event public.events;
  v_new public.registration_status;
begin
  select * into r from public.registrations where id = p_registration for update;
  if not found then raise exception 'NOT_FOUND: registration not found.' using errcode = 'no_data_found'; end if;
  if not private.manages_event(r.event_id) then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
  if r.status not in ('requested', 'waitlisted') then
    raise exception 'INVALID_STATE: only requests and waitlisted guests can be reviewed.' using errcode = 'check_violation';
  end if;
  select * into v_event from public.events where id = r.event_id;

  if p_approve then
    v_new := case when r.price_due_pkr > 0 then 'awaiting_payment' else 'confirmed' end;
    update public.registrations
       set status = v_new, status_reason = null,
           approved_at = case when v_new = 'confirmed' then now() else approved_at end,
           price_paid_pkr = case when v_new = 'confirmed' then 0 else price_paid_pkr end
     where id = p_registration;
    perform private.notify(r.attendee_id, r.event_id, 'registration_approved',
      case when v_new = 'confirmed' then 'You are in' else 'Approved. Payment needed' end, v_event.title);
  else
    v_new := 'rejected';
    update public.registrations set status = 'rejected', status_reason = p_reason where id = p_registration;
    perform private.void_commission(p_registration);
    perform private.notify(r.attendee_id, r.event_id, 'registration_rejected', 'Request not approved', v_event.title);
  end if;
  return v_new;
end;
$$;

create or replace function public.review_payment(p_submission uuid, p_approve boolean, p_reason text default null)
returns public.registration_status
language plpgsql
security definer
set search_path = public
as $$
declare
  s public.payment_submissions;
  r public.registrations;
  v_event public.events;
begin
  select * into s from public.payment_submissions where id = p_submission for update;
  if not found then raise exception 'NOT_FOUND: submission not found.' using errcode = 'no_data_found'; end if;
  select * into r from public.registrations where id = s.registration_id for update;
  if not private.manages_event(r.event_id) then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
  if s.status <> 'submitted' then
    raise exception 'INVALID_STATE: this submission was already reviewed.' using errcode = 'check_violation';
  end if;
  select * into v_event from public.events where id = r.event_id;

  if p_approve then
    update public.payment_submissions set status = 'approved', reviewed_by = auth.uid(), reviewed_at = now() where id = p_submission;
    update public.registrations
       set status = 'confirmed', status_reason = null, approved_at = now(),
           price_paid_pkr = coalesce(s.amount_pkr, r.price_due_pkr)
     where id = r.id;
    perform private.accrue_commission(r.id);
    perform private.notify(r.attendee_id, r.event_id, 'payment_approved', 'Payment approved. Your ticket is ready', v_event.title);
    return 'confirmed';
  else
    update public.payment_submissions
       set status = 'rejected', reviewed_by = auth.uid(), reviewed_at = now(), reason = p_reason where id = p_submission;
    update public.registrations set status = 'awaiting_payment', status_reason = p_reason where id = r.id;
    perform private.notify(r.attendee_id, r.event_id, 'payment_rejected', 'Payment proof not accepted',
                           coalesce(p_reason, v_event.title));
    return 'awaiting_payment';
  end if;
end;
$$;

create or replace function public.cancel_registration(p_registration uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare r public.registrations;
begin
  select * into r from public.registrations where id = p_registration for update;
  if not found or (r.attendee_id is distinct from auth.uid() and not private.manages_event(r.event_id)) then
    raise exception 'NOT_FOUND: registration not found.' using errcode = 'no_data_found';
  end if;
  if r.status in ('checked_in', 'no_show', 'cancelled', 'rejected') then
    raise exception 'INVALID_STATE: this registration cannot be cancelled.' using errcode = 'check_violation';
  end if;
  update public.registrations set status = 'cancelled', cancelled_at = now() where id = p_registration;
  perform private.void_commission(p_registration);
end;
$$;

-- Organizer adds a guest by hand (walk-in, VIP list, invite).
create or replace function public.add_manual_registration(
  p_event uuid, p_full_name text, p_phone text default null, p_email text default null,
  p_ticket_type uuid default null, p_source public.registration_source default 'manual',
  p_is_vip boolean default false, p_plus_one boolean default false, p_days date[] default null
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_attendee uuid;
  v_vip boolean := p_is_vip;
begin
  if not private.manages_event(p_event) then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
  if coalesce(trim(p_full_name), '') = '' then raise exception 'NAME_REQUIRED' using errcode = 'check_violation'; end if;
  if p_source = 'self' then raise exception 'INVALID_SOURCE' using errcode = 'check_violation'; end if;

  if p_email is not null then
    select pp.id into v_attendee from public.profile_private pp
      join public.profiles p on p.id = pp.id and p.role = 'attendee'
      where lower(pp.email) = lower(trim(p_email)) limit 1;
  end if;
  if p_ticket_type is not null then
    select coalesce(t.is_vip, v_vip) into v_vip from public.ticket_types t where t.id = p_ticket_type and t.event_id = p_event;
  end if;

  insert into public.registrations (event_id, attendee_id, ticket_type_id, source, status, full_name, phone, email,
                                    ticket_days, plus_one, is_vip, approved_at, price_paid_pkr)
  values (p_event, v_attendee, p_ticket_type, p_source, 'confirmed', trim(p_full_name), p_phone,
          lower(nullif(trim(p_email), '')), p_days, coalesce(p_plus_one, false), coalesce(v_vip, false), now(), 0)
  returning id into v_id;
  return v_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Check-in. One internal routine, three entry points (organizer, gate link, admin).
-- ---------------------------------------------------------------------------
create or replace function private.do_check_in(
  p_event uuid, p_token text, p_reg uuid, p_scanned_by uuid, p_gate_link uuid, p_offline boolean
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.registrations;
  v_result public.scan_result;
  v_ticket text;
begin
  if p_reg is not null then
    select * into r from public.registrations where id = p_reg and event_id = p_event for update;
  else
    select * into r from public.registrations where qr_token = p_token and event_id = p_event for update;
  end if;

  if not found then
    insert into public.scan_logs (event_id, scanned_by, gate_link_id, result, offline_synced)
    values (p_event, p_scanned_by, p_gate_link, 'invalid', p_offline);
    return jsonb_build_object('result', 'invalid');
  end if;

  if r.status = 'checked_in' then
    v_result := 'duplicate';
  elsif r.status <> 'confirmed' then
    v_result := 'not_approved';
  elsif r.ticket_days is not null and not (private.pk_date(now()) = any (r.ticket_days)) then
    v_result := 'wrong_day';
  else
    v_result := 'admitted';
    update public.registrations set status = 'checked_in', checked_in_at = now() where id = r.id;
    perform private.award_score(r.attendee_id, r.event_id, r.id, case when r.is_vip then 15 else 10 end,
                                'Attended event', true, false, r.is_vip);
  end if;

  insert into public.scan_logs (event_id, registration_id, scanned_by, gate_link_id, result, offline_synced)
  values (p_event, r.id, p_scanned_by, p_gate_link, v_result, p_offline);

  select t.name into v_ticket from public.ticket_types t where t.id = r.ticket_type_id;
  return jsonb_build_object(
    'result', v_result, 'registration_id', r.id, 'name', r.full_name, 'ticket', v_ticket,
    'is_vip', r.is_vip, 'plus_one', r.plus_one, 'checked_in_at', r.checked_in_at, 'status', r.status
  );
end;
$$;

create or replace function public.organizer_check_in(p_event uuid, p_token text default null, p_registration uuid default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not private.manages_event(p_event) then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
  return private.do_check_in(p_event, p_token, p_registration, auth.uid(), null, false);
end;
$$;

-- Validates a gate staff link. Returns the link row id or raises.
create or replace function private.require_gate_link(p_link_token text, p_event uuid default null)
returns public.gate_staff_links
language plpgsql
security definer
set search_path = public
as $$
declare l public.gate_staff_links;
begin
  select * into l from public.gate_staff_links where token_hash = private.token_hash(coalesce(p_link_token, ''));
  if not found or l.revoked_at is not null or l.expires_at <= now() then
    raise exception 'LINK_INVALID: this access link is not valid or has expired.' using errcode = '42501';
  end if;
  if p_event is not null and not (p_event = any (l.event_ids)) then
    raise exception 'LINK_SCOPE: this link does not cover that event.' using errcode = '42501';
  end if;
  update public.gate_staff_links set last_used_at = now() where id = l.id;
  return l;
end;
$$;

create or replace function public.gate_get_events(p_link_token text)
returns table (id uuid, title text, starts_at timestamptz, ends_at timestamptz,
               expected integer, admitted integer)
language plpgsql
security definer
set search_path = public
as $$
declare l public.gate_staff_links;
begin
  l := private.require_gate_link(p_link_token);
  return query
    select e.id, e.title, e.starts_at, e.ends_at,
           (select count(*)::int from public.registrations r where r.event_id = e.id and r.status in ('confirmed', 'checked_in')),
           (select count(*)::int from public.registrations r where r.event_id = e.id and r.status = 'checked_in')
    from public.events e where e.id = any (l.event_ids) order by e.starts_at;
end;
$$;

create or replace function public.gate_check_in(
  p_link_token text, p_event uuid, p_token text default null, p_registration uuid default null, p_offline boolean default false
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare l public.gate_staff_links;
begin
  l := private.require_gate_link(p_link_token, p_event);
  return private.do_check_in(p_event, p_token, p_registration, null, l.id, coalesce(p_offline, false));
end;
$$;

-- Name or phone lookup for QR failures. Returns the minimum a door needs.
create or replace function public.gate_lookup(p_link_token text, p_event uuid, p_query text)
returns table (registration_id uuid, full_name text, ticket text, status public.registration_status, is_vip boolean, plus_one boolean)
language plpgsql
security definer
set search_path = public
as $$
declare l public.gate_staff_links;
begin
  l := private.require_gate_link(p_link_token, p_event);
  if length(trim(coalesce(p_query, ''))) < 2 then return; end if;
  return query
    select r.id, r.full_name, t.name, r.status, r.is_vip, r.plus_one
    from public.registrations r
    left join public.ticket_types t on t.id = r.ticket_type_id
    where r.event_id = p_event
      and r.status in ('confirmed', 'checked_in')
      and (r.full_name ilike '%' || trim(p_query) || '%' or coalesce(r.phone, '') like '%' || trim(p_query) || '%')
    order by r.full_name limit 20;
end;
$$;

create or replace function public.create_gate_link(p_label text, p_event_ids uuid[])
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_token text := private.new_token();
  v_expires timestamptz;
  v_id uuid;
  v_active integer;
begin
  if not private.is_organizer() then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
  if p_event_ids is null or cardinality(p_event_ids) = 0 then
    raise exception 'EVENTS_REQUIRED: choose at least one event.' using errcode = 'check_violation';
  end if;
  if exists (select 1 from unnest(p_event_ids) x where not exists
             (select 1 from public.events e where e.id = x and e.organizer_id = v_uid)) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if not private.can_publish(v_uid) then
    raise exception 'SUBSCRIPTION_REQUIRED: upgrade to create gate links.' using errcode = 'check_violation';
  end if;

  select count(*) into v_active from public.gate_staff_links
    where organizer_id = v_uid and revoked_at is null and expires_at > now();
  if v_active >= private.plan_limit_int(v_uid, 'gate_staff_links') then
    raise exception 'PLAN_LIMIT:gate_staff_links: your plan allows % active gate links.',
      private.plan_limit_int(v_uid, 'gate_staff_links') using errcode = 'check_violation';
  end if;

  -- Expires 3 hours after the last selected event finishes.
  select max(coalesce(e.ends_at, e.starts_at + interval '12 hours')) + interval '3 hours'
    into v_expires from public.events e where e.id = any (p_event_ids);

  insert into public.gate_staff_links (organizer_id, label, event_ids, token_hash, expires_at)
  values (v_uid, trim(p_label), p_event_ids, private.token_hash(v_token), v_expires)
  returning id into v_id;

  return jsonb_build_object('id', v_id, 'token', v_token, 'expires_at', v_expires);
end;
$$;

create or replace function public.revoke_gate_link(p_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.gate_staff_links set revoked_at = now()
  where id = p_id and (organizer_id = auth.uid() or private.is_admin())
$$;

-- ---------------------------------------------------------------------------
-- Secrets, reveal, announcements
-- ---------------------------------------------------------------------------
-- Auto reveal needs a plan that includes it.
create or replace function private.event_secrets_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare v_org uuid;
begin
  if new.reveal_at is not null and (tg_op = 'INSERT' or new.reveal_at is distinct from old.reveal_at)
     and auth.role() in ('anon', 'authenticated') then
    select organizer_id into v_org from public.events where id = new.event_id;
    if not private.plan_allows(v_org, 'auto_reveal') then
      raise exception 'PLAN_LIMIT:auto_reveal: automatic location reveal is available on the Growth and Pro plans.'
        using errcode = 'check_violation';
    end if;
    new.reveal_notified_at := null;
  end if;
  return new;
end;
$$;
create trigger event_secrets_guard before insert or update on public.event_secrets
  for each row execute function private.event_secrets_guard();

create or replace function public.get_event_secret(p_event uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare s public.event_secrets;
begin
  select * into s from public.event_secrets where event_id = p_event;
  if not found then return null; end if;

  if private.manages_event(p_event) then
    return jsonb_build_object('venue_address', s.venue_address, 'venue_notes', s.venue_notes, 'revealed', true);
  end if;

  if s.reveal_at is not null and s.reveal_at <= now() and exists (
       select 1 from public.registrations r
       where r.event_id = p_event and r.attendee_id = auth.uid() and r.status in ('confirmed', 'checked_in')) then
    return jsonb_build_object('venue_address', s.venue_address, 'venue_notes', s.venue_notes, 'revealed', true);
  end if;

  return jsonb_build_object('revealed', false, 'reveal_at', s.reveal_at);
end;
$$;

create or replace function public.publish_announcement(p_event uuid, p_body text, p_send_email boolean default false)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event public.events;
  v_id uuid;
  v_count integer;
  v_month_emails integer;
  v_recipients integer;
begin
  if not private.manages_event(p_event) then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
  select * into v_event from public.events where id = p_event;

  select count(*) into v_count from public.event_announcements where event_id = p_event;
  if v_count >= private.plan_limit_int(v_event.organizer_id, 'announcements_per_event') then
    raise exception 'PLAN_LIMIT:announcements_per_event: your plan allows % announcements per event.',
      private.plan_limit_int(v_event.organizer_id, 'announcements_per_event') using errcode = 'check_violation';
  end if;

  if p_send_email then
    select count(*) into v_recipients from public.registrations r
      where r.event_id = p_event and r.status in ('confirmed', 'payment_submitted', 'awaiting_payment') and r.email is not null;
    select count(*) into v_month_emails from public.email_outbox o
      where o.template = 'announcement' and (o.payload ->> 'organizer_id') = v_event.organizer_id::text
        and o.created_at >= date_trunc('month', now());
    if v_month_emails + v_recipients > private.plan_limit_int(v_event.organizer_id, 'email_blasts_per_month') then
      raise exception 'PLAN_LIMIT:email_blasts_per_month: this would exceed your monthly email allowance.'
        using errcode = 'check_violation';
    end if;
  end if;

  insert into public.event_announcements (event_id, author_id, body, send_email)
  values (p_event, auth.uid(), trim(p_body), coalesce(p_send_email, false))
  returning id into v_id;

  insert into public.notifications (user_id, event_id, type, title, body)
  select r.attendee_id, p_event, 'announcement', v_event.title, trim(p_body)
  from public.registrations r
  where r.event_id = p_event and r.attendee_id is not null
    and r.status in ('confirmed', 'payment_submitted', 'awaiting_payment', 'checked_in');

  if p_send_email then
    insert into public.email_outbox (to_email, template, payload)
    select r.email, 'announcement',
           jsonb_build_object('event_id', p_event, 'event_title', v_event.title, 'body', trim(p_body),
                              'organizer_id', v_event.organizer_id)
    from public.registrations r
    where r.event_id = p_event and r.email is not null
      and r.status in ('confirmed', 'payment_submitted', 'awaiting_payment');
  end if;

  return v_id;
end;
$$;

-- Runs every minute (pg_cron). Announces newly revealed locations once.
create or replace function public.reveal_due_events()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  rec record;
  n integer := 0;
begin
  if auth.role() in ('anon', 'authenticated') then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
  for rec in
    select s.event_id, e.title, e.organizer_id
    from public.event_secrets s
    join public.events e on e.id = s.event_id
    where s.reveal_at is not null and s.reveal_at <= now() and s.reveal_notified_at is null
      and e.status = 'published' and e.admin_status = 'live'
    for update of s skip locked
  loop
    insert into public.notifications (user_id, event_id, type, title, body)
    select r.attendee_id, rec.event_id, 'location_revealed', 'Location revealed', rec.title
    from public.registrations r
    where r.event_id = rec.event_id and r.attendee_id is not null and r.status in ('confirmed', 'checked_in');

    insert into public.email_outbox (to_email, template, payload)
    select r.email, 'location_revealed', jsonb_build_object('event_id', rec.event_id, 'event_title', rec.title)
    from public.registrations r
    where r.event_id = rec.event_id and r.email is not null and r.status = 'confirmed';

    update public.event_secrets set reveal_notified_at = now() where event_id = rec.event_id;
    n := n + 1;
  end loop;
  return n;
end;
$$;

-- Runs hourly (pg_cron). Closes finished events and records no-shows.
create or replace function public.process_no_shows()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  rec record;
  ns  record;
  n integer := 0;
begin
  if auth.role() in ('anon', 'authenticated') then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
  for rec in
    select e.id from public.events e
    where e.status = 'published'
      and coalesce(e.ends_at, e.starts_at + interval '12 hours') + interval '6 hours' < now()
  loop
    for ns in
      update public.registrations set status = 'no_show'
       where event_id = rec.id and status = 'confirmed'
       returning id, attendee_id
    loop
      perform private.award_score(ns.attendee_id, rec.id, ns.id, -15, 'No show', false, true, false);
      n := n + 1;
    end loop;
    update public.registrations set status = 'cancelled', cancelled_at = now(), status_reason = 'Event ended'
     where event_id = rec.id and status in ('requested', 'awaiting_payment', 'waitlisted');
    update public.events set status = 'completed' where id = rec.id;
  end loop;
  -- archive three days after the event ended
  update public.events set status = 'archived'
   where status = 'completed' and coalesce(ends_at, starts_at + interval '12 hours') + interval '72 hours' < now();
  return n;
end;
$$;

-- ---------------------------------------------------------------------------
-- Referrals
-- ---------------------------------------------------------------------------
create or replace function public.create_referrer(p_name text, p_phone text default null, p_email text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_token text := private.new_token();
  v_id uuid;
  v_count integer;
begin
  if not private.is_organizer() then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
  select count(*) into v_count from public.referrers where organizer_id = v_uid and is_active;
  if v_count >= private.plan_limit_int(v_uid, 'promoters') then
    raise exception 'PLAN_LIMIT:promoters: your plan allows % promoters.', private.plan_limit_int(v_uid, 'promoters')
      using errcode = 'check_violation';
  end if;
  insert into public.referrers (organizer_id, name, phone, email, access_token_hash)
  values (v_uid, trim(p_name), nullif(trim(p_phone), ''), nullif(lower(trim(p_email)), ''), private.token_hash(v_token))
  returning id into v_id;
  return jsonb_build_object('id', v_id, 'token', v_token);
end;
$$;

create or replace function public.rotate_referrer_token(p_referrer uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare v_token text := private.new_token();
begin
  update public.referrers set access_token_hash = private.token_hash(v_token)
   where id = p_referrer and organizer_id = auth.uid();
  if not found then raise exception 'NOT_FOUND' using errcode = 'no_data_found'; end if;
  return v_token;
end;
$$;

-- Plan checks for advanced commission modes on links and defaults.
create or replace function private.referral_plan_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare v_org uuid; v_mode public.commission_mode;
begin
  if auth.role() not in ('anon', 'authenticated') then return new; end if;
  if tg_table_name = 'referral_links' then
    select organizer_id into v_org from public.events where id = new.event_id;
    v_mode := new.commission_mode;
  else
    v_org := new.organizer_id;
    v_mode := new.mode;
  end if;
  if v_mode in ('percent', 'tiered') and not private.plan_allows(v_org, 'advanced_commission') then
    raise exception 'PLAN_LIMIT:advanced_commission: percent and tiered commission need the Growth or Pro plan.'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;
create trigger referral_links_plan_guard before insert or update on public.referral_links
  for each row execute function private.referral_plan_guard();
create trigger commission_defaults_plan_guard before insert or update on public.organizer_commission_defaults
  for each row execute function private.referral_plan_guard();

-- Promoter view by private link. No login.
create or replace function public.promoter_dashboard(p_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  ref public.referrers;
  v_links jsonb;
  v_totals jsonb;
begin
  select * into ref from public.referrers
   where access_token_hash = private.token_hash(coalesce(p_token, '')) and is_active;
  if not found then raise exception 'LINK_INVALID' using errcode = '42501'; end if;

  select coalesce(jsonb_agg(jsonb_build_object(
      'event_id', e.id, 'event_title', e.title, 'event_slug', e.slug, 'starts_at', e.starts_at,
      'code', l.code, 'uses', l.uses,
      'registrations', (select count(*) from public.registrations r where r.referral_link_id = l.id and r.status not in ('rejected', 'cancelled')),
      'confirmed', (select count(*) from public.registrations r where r.referral_link_id = l.id and r.status in ('confirmed', 'checked_in')),
      'commission_pkr', coalesce((select sum(c.amount_pkr) from public.commissions c
                                   join public.registrations r on r.id = c.registration_id
                                   where r.referral_link_id = l.id and c.status <> 'void'), 0)
    ) order by e.starts_at desc), '[]'::jsonb)
  into v_links
  from public.referral_links l join public.events e on e.id = l.event_id
  where l.referrer_id = ref.id and l.is_active;

  select jsonb_build_object(
    'accrued_pkr', coalesce(sum(amount_pkr) filter (where status in ('accrued', 'approved')), 0),
    'paid_pkr',    coalesce(sum(amount_pkr) filter (where status = 'paid'), 0)
  ) into v_totals from public.commissions where referrer_id = ref.id;

  return jsonb_build_object('name', ref.name, 'links', v_links, 'totals', v_totals);
end;
$$;

-- Validate a code before the attendee submits, so the UI can show the discount.
create or replace function public.preview_code(p_event uuid, p_code text, p_ticket_type uuid default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_price integer := 0;
  l public.referral_links;
  c public.coupons;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED' using errcode = '28000'; end if;
  if p_ticket_type is not null then
    select price_pkr into v_price from public.ticket_types where id = p_ticket_type and event_id = p_event;
  end if;
  select * into l from public.referral_links
   where event_id = p_event and lower(code) = lower(trim(p_code)) and is_active
     and (expires_at is null or expires_at > now()) and (max_uses is null or uses < max_uses);
  if found then
    return jsonb_build_object('valid', true, 'kind', 'referral',
      'discount_pkr', private.discount_amount(l.buyer_discount_type, l.buyer_discount_value, coalesce(v_price, 0)));
  end if;
  select * into c from public.coupons
   where event_id = p_event and lower(code) = lower(trim(p_code)) and is_active
     and (expires_at is null or expires_at > now()) and (max_uses is null or uses < max_uses);
  if found then
    return jsonb_build_object('valid', true, 'kind', 'coupon',
      'discount_pkr', private.discount_amount(c.discount_type, c.discount_value, coalesce(v_price, 0)));
  end if;
  return jsonb_build_object('valid', false);
end;
$$;

-- ---------------------------------------------------------------------------
-- Identity verification (manual review)
-- ---------------------------------------------------------------------------
create or replace function public.submit_id_verification(
  p_id_type public.id_type, p_number_enc text, p_image_path text, p_expiry date default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED' using errcode = '28000'; end if;
  if coalesce(p_number_enc, '') = '' or coalesce(p_image_path, '') = '' then
    raise exception 'ID_INCOMPLETE: ID number and image are required.' using errcode = 'check_violation';
  end if;
  update public.profile_private
     set id_type = p_id_type, id_number_enc = p_number_enc, id_image_path = p_image_path, id_expiry = p_expiry,
         id_status = 'pending', id_submitted_at = now(), id_reject_reason = null
   where id = auth.uid() and id_status in ('none', 'rejected');
  if not found then
    raise exception 'INVALID_STATE: verification is already pending or complete.' using errcode = 'check_violation';
  end if;
end;
$$;

create or replace function public.review_id_verification(p_user uuid, p_approve boolean, p_reason text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not private.is_admin() then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
  update public.profile_private
     set id_status = case when p_approve then 'verified'::public.id_status else 'rejected'::public.id_status end,
         id_reviewed_by = auth.uid(), id_reviewed_at = now(),
         id_reject_reason = case when p_approve then null else p_reason end
   where id = p_user and id_status = 'pending';
  if not found then raise exception 'INVALID_STATE: nothing pending for that user.' using errcode = 'check_violation'; end if;
  perform private.notify(p_user, null, case when p_approve then 'id_verified' else 'id_rejected' end,
                         case when p_approve then 'Your ID is verified' else 'ID verification not approved' end,
                         case when p_approve then null else p_reason end);
  perform private.audit('review_id_verification', 'profile', p_user::text, jsonb_build_object('approved', p_approve));
end;
$$;

-- ---------------------------------------------------------------------------
-- Subscription
-- ---------------------------------------------------------------------------
create or replace function public.submit_subscription_payment(
  p_plan text, p_period public.billing_period, p_screenshot_path text, p_reference text default null
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  pl public.plans;
  v_id uuid;
begin
  if not private.is_organizer() then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
  select * into pl from public.plans where id = p_plan and is_purchasable;
  if not found then raise exception 'PLAN_INVALID' using errcode = 'check_violation'; end if;
  if coalesce(p_screenshot_path, '') = '' then
    raise exception 'SCREENSHOT_REQUIRED: attach your transfer screenshot.' using errcode = 'check_violation';
  end if;
  insert into public.subscription_payments (organizer_id, plan_id, period, amount_pkr, screenshot_path, reference)
  values (auth.uid(), p_plan, p_period,
          case p_period when 'month' then pl.price_pkr_month else pl.price_pkr_year end,
          p_screenshot_path, nullif(trim(p_reference), ''))
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.review_subscription_payment(p_payment uuid, p_approve boolean, p_reason text default null)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  p public.subscription_payments;
  s public.organizer_subscriptions;
  v_start timestamptz;
  v_end timestamptz;
  v_number text;
begin
  if not private.is_admin() then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
  select * into p from public.subscription_payments where id = p_payment for update;
  if not found or p.status <> 'submitted' then
    raise exception 'INVALID_STATE: payment not found or already reviewed.' using errcode = 'check_violation';
  end if;

  if not p_approve then
    update public.subscription_payments set status = 'rejected', reviewed_by = auth.uid(), reviewed_at = now(), reject_reason = p_reason
     where id = p_payment;
    perform private.notify(p.organizer_id, null, 'subscription_rejected', 'Subscription payment not accepted', p_reason);
    perform private.audit('subscription_rejected', 'subscription_payment', p_payment::text);
    return 'rejected';
  end if;

  select * into s from public.organizer_subscriptions where organizer_id = p.organizer_id for update;
  v_start := case when s.status = 'active' and s.current_period_end > now() and s.plan_id = p.plan_id
                  then s.current_period_end else now() end;
  v_end := v_start + case p.period when 'month' then interval '1 month' else interval '1 year' end;

  insert into public.organizer_subscriptions (organizer_id, plan_id, status, billing_period, current_period_start, current_period_end)
  values (p.organizer_id, p.plan_id, 'active', p.period, v_start, v_end)
  on conflict (organizer_id) do update
    set plan_id = excluded.plan_id, status = 'active', billing_period = excluded.billing_period,
        current_period_start = excluded.current_period_start, current_period_end = excluded.current_period_end;

  update public.subscription_payments set status = 'approved', reviewed_by = auth.uid(), reviewed_at = now() where id = p_payment;

  v_number := 'TKX-' || to_char(now() at time zone 'Asia/Karachi', 'YYYY') || '-' || nextval('public.subscription_invoice_seq');
  insert into public.subscription_invoices (number, organizer_id, payment_id, plan_id, period, amount_pkr, period_start, period_end)
  values (v_number, p.organizer_id, p.id, p.plan_id, p.period, p.amount_pkr, v_start, v_end);

  perform private.notify(p.organizer_id, null, 'subscription_active', 'Your plan is active', v_number);
  perform private.audit('subscription_approved', 'subscription_payment', p_payment::text, jsonb_build_object('invoice', v_number));
  return v_number;
end;
$$;

-- What the UI needs to show plan, limits and usage.
create or replace function public.my_entitlements()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  s public.organizer_subscriptions;
  v_limits jsonb;
begin
  if v_uid is null then return null; end if;
  select * into s from public.organizer_subscriptions where organizer_id = v_uid;
  select coalesce(jsonb_object_agg(key, value), '{}'::jsonb) into v_limits
    from public.plan_limits where plan_id = s.plan_id;
  return jsonb_build_object(
    'state', private.subscription_state(v_uid),
    'plan_id', s.plan_id,
    'trial_ends_at', s.trial_ends_at,
    'current_period_end', s.current_period_end,
    'limits', v_limits,
    'usage', jsonb_build_object(
      'events_this_month', (select count(*) from public.events e where e.organizer_id = v_uid and e.published_at >= date_trunc('month', now())),
      'gate_links', (select count(*) from public.gate_staff_links g where g.organizer_id = v_uid and g.revoked_at is null and g.expires_at > now()),
      'promoters', (select count(*) from public.referrers r where r.organizer_id = v_uid and r.is_active),
      'vendors', (select count(*) from public.organizer_vendors v where v.organizer_id = v_uid)
    )
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Admin
-- ---------------------------------------------------------------------------
create or replace function public.master_overview()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not private.is_admin() then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
  return jsonb_build_object(
    'organizers', (select count(*) from public.profiles where role = 'organizer'),
    'attendees', (select count(*) from public.profiles where role = 'attendee'),
    'events_by_status', (select coalesce(jsonb_object_agg(status, n), '{}'::jsonb) from (select status, count(*) n from public.events group by 1) x),
    'registrations_by_status', (select coalesce(jsonb_object_agg(status, n), '{}'::jsonb) from (select status, count(*) n from public.registrations group by 1) x),
    'gross_ticket_sales_pkr', (select coalesce(sum(price_paid_pkr), 0) from public.registrations where status in ('confirmed', 'checked_in', 'no_show')),
    'commissions_accrued_pkr', (select coalesce(sum(amount_pkr), 0) from public.commissions where status in ('accrued', 'approved')),
    'pending_id_reviews', (select count(*) from public.profile_private where id_status = 'pending'),
    'pending_subscription_payments', (select count(*) from public.subscription_payments where status = 'submitted'),
    'subscriptions', (select coalesce(jsonb_object_agg(plan_id, n), '{}'::jsonb) from (select plan_id, count(*) n from public.organizer_subscriptions group by 1) x)
  );
end;
$$;

create or replace function public.admin_set_event_status(p_event uuid, p_status public.admin_status)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not private.is_admin() then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
  update public.events set admin_status = p_status where id = p_event;
  perform private.audit('event_admin_status', 'event', p_event::text, jsonb_build_object('status', p_status));
end;
$$;

commit;
