-- TIKKIT X modules 5/5: product payments, unified scanning, gate scope, entitlements,
-- row level security and grants for every new table, plan limits, storage, schedules.
-- Same rule as the baseline: deny by default, grant explicitly, trust data changes only in functions.

begin;

-- ---------------------------------------------------------------------------
-- 1. Payment accounts are visible to attendees who owe this organizer a payment
-- ---------------------------------------------------------------------------
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
                  and x.status in ('awaiting_payment', 'payment_submitted'))
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
-- 2. Proof of payment for passes, class drop ins and space bookings
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
      where id = p_subject and attendee_id = uid and status = 'awaiting_payment' for update;
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
    update public.pass_purchases set status = 'payment_submitted' where id = p_subject;
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
declare pp public.product_payments;
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

  if p_approve then
    if pp.kind = 'pass_purchase' then
      perform private.activate_pass(pp.subject_id);
    elsif pp.kind = 'class_booking' then
      update public.class_bookings set status = 'confirmed', approved_at = now(), price_paid_pkr = price_due_pkr
       where id = pp.subject_id;
    else
      update public.space_bookings set status = 'confirmed', approved_at = now(), price_paid_pkr = price_due_pkr
       where id = pp.subject_id;
    end if;
  else
    -- back to awaiting payment so the guest can send a better proof
    if pp.kind = 'pass_purchase' then
      update public.pass_purchases set status = 'awaiting_payment' where id = pp.subject_id;
    elsif pp.kind = 'class_booking' then
      update public.class_bookings set status = 'awaiting_payment' where id = pp.subject_id;
    else
      update public.space_bookings set status = 'awaiting_payment' where id = pp.subject_id;
    end if;
  end if;

  perform private.notify(pp.payer_id, null,
    case when p_approve then 'payment_approved' else 'payment_rejected' end,
    case when p_approve then 'Payment approved' else 'Payment not accepted' end,
    case when p_approve then 'Your booking is confirmed.' else coalesce(p_reason, 'Please upload a clearer proof of payment.') end,
    jsonb_build_object('product_payment_id', pp.id, 'kind', pp.kind));
  return case when p_approve then 'approved'::public.review_status else 'rejected'::public.review_status end;
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. Door check in for classes and spaces
-- ---------------------------------------------------------------------------
create or replace function private.do_class_check_in(p_booking uuid, p_by uuid, p_gate uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  b public.class_bookings;
  se public.class_sessions;
  sr public.class_series;
  v_result public.scan_result;
begin
  select * into b from public.class_bookings where id = p_booking for update;
  select * into se from public.class_sessions where id = b.session_id;
  select * into sr from public.class_series where id = b.series_id;

  if b.status = 'checked_in' then
    v_result := 'duplicate';
  elsif b.status <> 'confirmed' then
    v_result := 'not_approved';
  elsif se.status <> 'scheduled' or now() < se.starts_at - interval '60 minutes' or now() > se.ends_at + interval '30 minutes' then
    v_result := 'wrong_day';
  else
    v_result := 'admitted';
    update public.class_bookings set status = 'checked_in', checked_in_at = now() where id = b.id;
    if b.pass_purchase_id is not null then
      insert into public.pass_redemptions (pass_purchase_id, booking_id) values (b.pass_purchase_id, b.id)
      on conflict (booking_id) do nothing;
    end if;
    perform private.award_score(b.attendee_id, null, null, 8, 'Attended class', true, false, false);
  end if;

  insert into public.door_scans (kind, subject_id, organizer_id, scanned_by, gate_link_id, result)
  values ('class', b.id, b.organizer_id, p_by, p_gate, v_result);

  return jsonb_build_object(
    'result', v_result, 'kind', 'class',
    'name', (select full_name from public.profiles where id = b.attendee_id),
    'title', sr.title, 'starts_at', se.starts_at, 'via_pass', b.pass_purchase_id is not null);
end;
$$;

create or replace function private.do_space_check_in(p_booking uuid, p_by uuid, p_gate uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  b public.space_bookings;
  sp public.spaces;
  v_result public.scan_result;
begin
  select * into b from public.space_bookings where id = p_booking for update;
  select * into sp from public.spaces where id = b.space_id;

  if b.status = 'checked_in' then
    v_result := 'duplicate';
  elsif b.status <> 'confirmed' then
    v_result := 'not_approved';
  elsif now() < b.starts_at - interval '30 minutes' or now() > b.ends_at then
    v_result := 'wrong_day';
  else
    v_result := 'admitted';
    update public.space_bookings set status = 'checked_in', checked_in_at = now() where id = b.id;
  end if;

  insert into public.door_scans (kind, subject_id, organizer_id, scanned_by, gate_link_id, result)
  values ('space', b.id, b.organizer_id, p_by, p_gate, v_result);

  return jsonb_build_object(
    'result', v_result, 'kind', 'space',
    'name', (select full_name from public.profiles where id = b.attendee_id),
    'title', sp.name, 'starts_at', b.starts_at, 'party_size', b.party_size);
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. Unified scanner. One token, any product. Organizer and gate link versions.
--    p_context is only needed for retreats: the itinerary item being checked in to.
-- ---------------------------------------------------------------------------
create or replace function public.scan_any(p_token text, p_context uuid default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  reg public.registrations;
  cb public.class_bookings;
  sb public.space_bookings;
  pa public.retreat_participants;
begin
  if auth.uid() is null or p_token is null then raise exception 'FORBIDDEN' using errcode = '42501'; end if;

  select * into reg from public.registrations where qr_token = p_token;
  if found then
    if not private.manages_event(reg.event_id) then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
    return private.do_check_in(reg.event_id, p_token, null, auth.uid(), null, false) || jsonb_build_object('kind', 'event');
  end if;

  select * into cb from public.class_bookings where qr_token = p_token;
  if found then
    if not private.manages_series(cb.series_id) then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
    return private.do_class_check_in(cb.id, auth.uid(), null);
  end if;

  select * into sb from public.space_bookings where qr_token = p_token;
  if found then
    if not private.manages_space(sb.space_id) then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
    return private.do_space_check_in(sb.id, auth.uid(), null);
  end if;

  select * into pa from public.retreat_participants where qr_token = p_token;
  if found then
    if not private.manages_retreat(pa.retreat_id) then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
    if p_context is null then
      return jsonb_build_object('result', 'context_required', 'kind', 'retreat', 'name', pa.full_name, 'retreat_id', pa.retreat_id);
    end if;
    return private.do_retreat_check_in(p_context, p_token, auth.uid(), null);
  end if;

  return jsonb_build_object('result', 'invalid');
end;
$$;

create or replace function public.gate_scan_any(
  p_link_token text, p_token text, p_context uuid default null, p_offline boolean default false
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  l public.gate_staff_links;
  reg public.registrations;
  cb public.class_bookings;
  sb public.space_bookings;
  pa public.retreat_participants;
begin
  l := private.require_gate_link(p_link_token);
  if p_token is null then return jsonb_build_object('result', 'invalid'); end if;

  select * into reg from public.registrations where qr_token = p_token;
  if found then
    if not (reg.event_id = any (l.event_ids)) then return jsonb_build_object('result', 'invalid', 'reason', 'out_of_scope'); end if;
    return private.do_check_in(reg.event_id, p_token, null, null, l.id, coalesce(p_offline, false)) || jsonb_build_object('kind', 'event');
  end if;

  select * into cb from public.class_bookings where qr_token = p_token;
  if found then
    if not (cb.series_id = any (l.class_series_ids)) then return jsonb_build_object('result', 'invalid', 'reason', 'out_of_scope'); end if;
    return private.do_class_check_in(cb.id, null, l.id);
  end if;

  select * into sb from public.space_bookings where qr_token = p_token;
  if found then
    if not (sb.space_id = any (l.space_ids)) then return jsonb_build_object('result', 'invalid', 'reason', 'out_of_scope'); end if;
    return private.do_space_check_in(sb.id, null, l.id);
  end if;

  select * into pa from public.retreat_participants where qr_token = p_token;
  if found then
    if not (pa.retreat_id = any (l.retreat_ids)) then return jsonb_build_object('result', 'invalid', 'reason', 'out_of_scope'); end if;
    if p_context is null then
      return jsonb_build_object('result', 'context_required', 'kind', 'retreat', 'name', pa.full_name, 'retreat_id', pa.retreat_id);
    end if;
    if not exists (select 1 from public.retreat_items i where i.id = p_context and i.retreat_id = pa.retreat_id) then
      return jsonb_build_object('result', 'invalid', 'reason', 'out_of_scope');
    end if;
    return private.do_retreat_check_in(p_context, p_token, null, l.id);
  end if;

  return jsonb_build_object('result', 'invalid');
end;
$$;

-- What a gate link covers, for the scanner screen.
create or replace function public.gate_get_scope(p_link_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare l public.gate_staff_links;
begin
  l := private.require_gate_link(p_link_token);
  return jsonb_build_object(
    'label', l.label,
    'expires_at', l.expires_at,
    'events', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', e.id, 'title', e.title, 'starts_at', e.starts_at, 'ends_at', e.ends_at,
        'expected', (select count(*) from public.registrations r where r.event_id = e.id and r.status in ('confirmed', 'checked_in')),
        'admitted', (select count(*) from public.registrations r where r.event_id = e.id and r.status = 'checked_in')
      ) order by e.starts_at) from public.events e where e.id = any (l.event_ids)), '[]'::jsonb),
    'classes', coalesce((
      select jsonb_agg(jsonb_build_object('id', s.id, 'title', s.title) order by s.title)
      from public.class_series s where s.id = any (l.class_series_ids)), '[]'::jsonb),
    'spaces', coalesce((
      select jsonb_agg(jsonb_build_object('id', s.id, 'name', s.name) order by s.name)
      from public.spaces s where s.id = any (l.space_ids)), '[]'::jsonb),
    'retreats', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', r.id, 'title', r.title,
        'items', coalesce((select jsonb_agg(jsonb_build_object('id', i.id, 'title', i.title, 'starts_at', i.starts_at) order by i.starts_at nulls last)
                           from public.retreat_items i where i.retreat_id = r.id and i.requires_checkin), '[]'::jsonb)
      ) order by r.starts_on) from public.retreats r where r.id = any (l.retreat_ids)), '[]'::jsonb)
  );
end;
$$;

create or replace function public.create_gate_link_scoped(
  p_label text, p_event_ids uuid[], p_series_ids uuid[], p_space_ids uuid[], p_retreat_ids uuid[]
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_events uuid[] := coalesce(p_event_ids, '{}'::uuid[]);
  v_series uuid[] := coalesce(p_series_ids, '{}'::uuid[]);
  v_spaces uuid[] := coalesce(p_space_ids, '{}'::uuid[]);
  v_retreats uuid[] := coalesce(p_retreat_ids, '{}'::uuid[]);
  v_token text := private.new_token();
  v_expires timestamptz;
  v_id uuid;
  v_active integer;
begin
  if not private.is_organizer() then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
  if cardinality(v_events) + cardinality(v_series) + cardinality(v_spaces) + cardinality(v_retreats) = 0 then
    raise exception 'SCOPE_REQUIRED: choose at least one thing to scan.' using errcode = 'check_violation';
  end if;
  if exists (select 1 from unnest(v_events) x where not exists (select 1 from public.events e where e.id = x and e.organizer_id = v_uid))
     or exists (select 1 from unnest(v_series) x where not exists (select 1 from public.class_series s where s.id = x and s.organizer_id = v_uid))
     or exists (select 1 from unnest(v_spaces) x where not exists (select 1 from public.spaces s where s.id = x and s.organizer_id = v_uid))
     or exists (select 1 from unnest(v_retreats) x where not exists (select 1 from public.retreats r where r.id = x and r.organizer_id = v_uid))
  then
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

  v_expires := greatest(
    coalesce((select max(coalesce(e.ends_at, e.starts_at + interval '12 hours')) from public.events e where e.id = any (v_events)), now()),
    case when cardinality(v_series) + cardinality(v_spaces) > 0 then now() + interval '24 hours' else now() end,
    coalesce((select max(r.ends_on)::timestamptz + interval '1 day' from public.retreats r where r.id = any (v_retreats)), now())
  ) + interval '3 hours';

  insert into public.gate_staff_links (organizer_id, label, event_ids, class_series_ids, space_ids, retreat_ids, token_hash, expires_at)
  values (v_uid, trim(p_label), v_events, v_series, v_spaces, v_retreats, private.token_hash(v_token), v_expires)
  returning id into v_id;

  return jsonb_build_object('id', v_id, 'token', v_token, 'expires_at', v_expires);
end;
$$;

-- ---------------------------------------------------------------------------
-- 5. Entitlements with the new usage counters, and an admin overview of the modules
-- ---------------------------------------------------------------------------
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
      'vendors', (select count(*) from public.organizer_vendors v where v.organizer_id = v_uid),
      'classes', (select count(*) from public.class_series c where c.organizer_id = v_uid and c.status = 'published'),
      'spaces', (select count(*) from public.spaces x where x.organizer_id = v_uid and x.status = 'published'),
      'retreats', (select count(*) from public.retreats x where x.organizer_id = v_uid and x.status in ('planning', 'confirmed', 'in_progress')),
      'team_members', (select count(*) from public.organizer_team_members m where m.organizer_id = v_uid and m.status <> 'removed')
    )
  );
end;
$$;

create or replace function public.master_modules_overview()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not private.is_admin() then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
  return jsonb_build_object(
    'class_series_by_status', (select coalesce(jsonb_object_agg(status, n), '{}'::jsonb) from (select status, count(*) n from public.class_series group by 1) x),
    'upcoming_sessions', (select count(*) from public.class_sessions where status = 'scheduled' and starts_at > now()),
    'pass_purchases_by_status', (select coalesce(jsonb_object_agg(status, n), '{}'::jsonb) from (select status, count(*) n from public.pass_purchases group by 1) x),
    'spaces_by_status', (select coalesce(jsonb_object_agg(status, n), '{}'::jsonb) from (select status, count(*) n from public.spaces group by 1) x),
    'space_bookings_by_status', (select coalesce(jsonb_object_agg(status, n), '{}'::jsonb) from (select status, count(*) n from public.space_bookings group by 1) x),
    'retreats_by_status', (select coalesce(jsonb_object_agg(status, n), '{}'::jsonb) from (select status, count(*) n from public.retreats group by 1) x),
    'active_team_members', (select count(*) from public.organizer_team_members where status = 'active'),
    'pending_product_payments', (select count(*) from public.product_payments where status = 'submitted')
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- 6. Plan limits for the new keys (classes and spaces were seeded in the baseline)
-- ---------------------------------------------------------------------------
insert into public.plan_limits (plan_id, key, value) values
  ('trial',   'team_members', '2'::jsonb),
  ('starter', 'team_members', '0'::jsonb),
  ('growth',  'team_members', '3'::jsonb),
  ('pro',     'team_members', '-1'::jsonb),
  ('trial',   'retreats', '0'::jsonb),
  ('starter', 'retreats', '0'::jsonb),
  ('growth',  'retreats', '0'::jsonb),
  ('pro',     'retreats', '-1'::jsonb)
on conflict (plan_id, key) do update set value = excluded.value;

-- ---------------------------------------------------------------------------
-- 7. Row level security and grants
-- ---------------------------------------------------------------------------
alter table public.organizer_team_members  enable row level security;
alter table public.event_favourites        enable row level security;
alter table public.product_payments        enable row level security;
alter table public.door_scans              enable row level security;
alter table public.class_series            enable row level security;
alter table public.class_sessions          enable row level security;
alter table public.pass_products           enable row level security;
alter table public.pass_purchases          enable row level security;
alter table public.class_bookings          enable row level security;
alter table public.pass_redemptions        enable row level security;
alter table public.spaces                  enable row level security;
alter table public.space_hours             enable row level security;
alter table public.space_blackouts         enable row level security;
alter table public.space_bookings          enable row level security;
alter table public.retreats                enable row level security;
alter table public.retreat_days            enable row level security;
alter table public.retreat_items           enable row level security;
alter table public.retreat_participants    enable row level security;
alter table public.retreat_checkins        enable row level security;
alter table public.retreat_budget_lines    enable row level security;
alter table public.retreat_tasks           enable row level security;
alter table public.retreat_updates         enable row level security;
alter table public.retreat_documents       enable row level security;

-- Team members can read the events of the organizer they work for.
create policy events_team_select on public.events for select to authenticated
  using (private.is_team_manager(organizer_id));

-- team access: read only, changes go through functions
grant select on public.organizer_team_members to authenticated;
create policy team_members_select on public.organizer_team_members for select to authenticated
  using (organizer_id = auth.uid() or user_id = auth.uid() or private.is_admin());

-- gate links: expose the new scope columns (the token hash stays hidden)
grant select (class_series_ids, space_ids, retreat_ids) on public.gate_staff_links to authenticated;

-- saved events
grant select, insert, delete on public.event_favourites to authenticated;
create policy event_favourites_all on public.event_favourites for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- product payments and door scans: read only
grant select on public.product_payments to authenticated;
create policy product_payments_select on public.product_payments for select to authenticated
  using (payer_id = auth.uid() or private.manages_org(organizer_id));
grant select on public.door_scans to authenticated;
create policy door_scans_select on public.door_scans for select to authenticated
  using (private.manages_org(organizer_id));

-- class series
grant select, delete on public.class_series to authenticated;
grant insert (organizer_id, title, description, cover_image_url, category_id, tags, city, area_label, venue_name,
              venue_address, instructor_name, weekdays, start_time, duration_minutes, starts_on, ends_on,
              interval_weeks, capacity, drop_in_price_pkr, status, visibility)
  on public.class_series to authenticated;
grant update (title, description, cover_image_url, category_id, tags, city, area_label, venue_name,
              venue_address, instructor_name, weekdays, start_time, duration_minutes, starts_on, ends_on,
              interval_weeks, capacity, drop_in_price_pkr, status, visibility)
  on public.class_series to authenticated;
create policy class_series_select on public.class_series for select to authenticated
  using (private.manages_org(organizer_id));
create policy class_series_insert on public.class_series for insert to authenticated
  with check (organizer_id = auth.uid() and private.is_organizer());
create policy class_series_update on public.class_series for update to authenticated
  using (private.manages_org(organizer_id)) with check (private.manages_org(organizer_id));
create policy class_series_delete on public.class_series for delete to authenticated
  using (organizer_id = auth.uid() and status = 'draft');

grant select on public.class_sessions to authenticated;
grant update (capacity, notes) on public.class_sessions to authenticated;
create policy class_sessions_select on public.class_sessions for select to authenticated
  using (private.manages_series(series_id));
create policy class_sessions_update on public.class_sessions for update to authenticated
  using (private.manages_series(series_id)) with check (private.manages_series(series_id));

-- passes
grant select, insert, update, delete on public.pass_products to authenticated;
create policy pass_products_select on public.pass_products for select to authenticated
  using (private.manages_org(organizer_id));
create policy pass_products_insert on public.pass_products for insert to authenticated
  with check (organizer_id = auth.uid() and private.is_organizer());
create policy pass_products_update on public.pass_products for update to authenticated
  using (private.manages_org(organizer_id)) with check (private.manages_org(organizer_id));
create policy pass_products_delete on public.pass_products for delete to authenticated
  using (private.manages_org(organizer_id));
revoke insert, update on public.pass_products from authenticated;
grant insert (organizer_id, series_id, name, kind, sessions_count, validity_days, price_pkr, is_active, sort)
  on public.pass_products to authenticated;
grant update (series_id, name, sessions_count, validity_days, price_pkr, is_active, sort)
  on public.pass_products to authenticated;

grant select on public.pass_purchases to authenticated;
create policy pass_purchases_select on public.pass_purchases for select to authenticated
  using (attendee_id = auth.uid() or private.manages_org(organizer_id));
grant select on public.class_bookings to authenticated;
create policy class_bookings_select on public.class_bookings for select to authenticated
  using (attendee_id = auth.uid() or private.manages_org(organizer_id));
grant select on public.pass_redemptions to authenticated;
create policy pass_redemptions_select on public.pass_redemptions for select to authenticated
  using (exists (select 1 from public.pass_purchases pp
                 where pp.id = pass_purchase_id and (pp.attendee_id = auth.uid() or private.manages_org(pp.organizer_id))));

-- spaces
grant select, delete on public.spaces to authenticated;
grant insert (organizer_id, name, kind, description, photos, amenities, city, area_label, address, capacity,
              price_pkr_per_slot, slot_minutes, buffer_minutes, min_notice_hours, max_advance_days,
              requires_approval, status, visibility)
  on public.spaces to authenticated;
grant update (name, kind, description, photos, amenities, city, area_label, address, capacity,
              price_pkr_per_slot, slot_minutes, buffer_minutes, min_notice_hours, max_advance_days,
              requires_approval, status, visibility)
  on public.spaces to authenticated;
create policy spaces_select on public.spaces for select to authenticated
  using (private.manages_org(organizer_id));
create policy spaces_insert on public.spaces for insert to authenticated
  with check (organizer_id = auth.uid() and private.is_organizer());
create policy spaces_update on public.spaces for update to authenticated
  using (private.manages_org(organizer_id)) with check (private.manages_org(organizer_id));
create policy spaces_delete on public.spaces for delete to authenticated
  using (organizer_id = auth.uid() and status = 'draft');

grant select, insert, delete on public.space_hours to authenticated;
grant update (weekday, opens, closes) on public.space_hours to authenticated;
create policy space_hours_select on public.space_hours for select to authenticated using (private.manages_space(space_id));
create policy space_hours_insert on public.space_hours for insert to authenticated with check (private.manages_space(space_id));
create policy space_hours_update on public.space_hours for update to authenticated
  using (private.manages_space(space_id)) with check (private.manages_space(space_id));
create policy space_hours_delete on public.space_hours for delete to authenticated using (private.manages_space(space_id));

grant select, insert, delete on public.space_blackouts to authenticated;
grant update (starts_at, ends_at, reason) on public.space_blackouts to authenticated;
create policy space_blackouts_select on public.space_blackouts for select to authenticated using (private.manages_space(space_id));
create policy space_blackouts_insert on public.space_blackouts for insert to authenticated with check (private.manages_space(space_id));
create policy space_blackouts_update on public.space_blackouts for update to authenticated
  using (private.manages_space(space_id)) with check (private.manages_space(space_id));
create policy space_blackouts_delete on public.space_blackouts for delete to authenticated using (private.manages_space(space_id));

grant select on public.space_bookings to authenticated;
create policy space_bookings_select on public.space_bookings for select to authenticated
  using (attendee_id = auth.uid() or private.manages_org(organizer_id));

-- retreats: private to the organizer account. Everyone else reads through the share and participant functions.
grant select, delete on public.retreats to authenticated;
grant insert (organizer_id, title, client_company, description, destination, city, cover_image_url, accent_color,
              starts_on, ends_on, status, headcount_target, budget_pkr, notes)
  on public.retreats to authenticated;
grant update (title, client_company, description, destination, city, cover_image_url, accent_color,
              starts_on, ends_on, status, headcount_target, budget_pkr, notes)
  on public.retreats to authenticated;
create policy retreats_select on public.retreats for select to authenticated
  using (private.manages_org(organizer_id));
create policy retreats_insert on public.retreats for insert to authenticated
  with check (organizer_id = auth.uid() and private.is_organizer());
create policy retreats_update on public.retreats for update to authenticated
  using (private.manages_org(organizer_id)) with check (private.manages_org(organizer_id));
create policy retreats_delete on public.retreats for delete to authenticated
  using (organizer_id = auth.uid() and status = 'planning');

grant select, insert, update, delete on public.retreat_days to authenticated;
revoke insert, update on public.retreat_days from authenticated;
grant insert (retreat_id, day_number, day_date, title, summary) on public.retreat_days to authenticated;
grant update (day_number, day_date, title, summary) on public.retreat_days to authenticated;
create policy retreat_days_select on public.retreat_days for select to authenticated using (private.manages_retreat(retreat_id));
create policy retreat_days_insert on public.retreat_days for insert to authenticated with check (private.manages_retreat(retreat_id));
create policy retreat_days_update on public.retreat_days for update to authenticated
  using (private.manages_retreat(retreat_id)) with check (private.manages_retreat(retreat_id));
create policy retreat_days_delete on public.retreat_days for delete to authenticated using (private.manages_retreat(retreat_id));

grant select, insert, update, delete on public.retreat_items to authenticated;
revoke insert, update on public.retreat_items from authenticated;
grant insert (retreat_id, day_id, kind, title, description, starts_at, ends_at, location_name, location_address,
              latitude, longitude, cost_pkr, status, vendor_id, assignee, is_internal, requires_checkin, sort, notes)
  on public.retreat_items to authenticated;
grant update (day_id, kind, title, description, starts_at, ends_at, location_name, location_address,
              latitude, longitude, cost_pkr, status, vendor_id, assignee, is_internal, requires_checkin, sort, notes)
  on public.retreat_items to authenticated;
create policy retreat_items_select on public.retreat_items for select to authenticated using (private.manages_retreat(retreat_id));
create policy retreat_items_insert on public.retreat_items for insert to authenticated
  with check (private.manages_retreat(retreat_id)
              and (vendor_id is null or exists (select 1 from public.organizer_vendors v
                    where v.id = vendor_id and v.organizer_id = (select r.organizer_id from public.retreats r where r.id = retreat_id))));
create policy retreat_items_update on public.retreat_items for update to authenticated
  using (private.manages_retreat(retreat_id)) with check (private.manages_retreat(retreat_id));
create policy retreat_items_delete on public.retreat_items for delete to authenticated using (private.manages_retreat(retreat_id));

grant select, insert, update, delete on public.retreat_participants to authenticated;
revoke insert, update on public.retreat_participants from authenticated;
grant insert (retreat_id, full_name, email, phone, department, dietary, accessibility, room_label, emergency_contact, status)
  on public.retreat_participants to authenticated;
grant update (full_name, email, phone, department, dietary, accessibility, room_label, emergency_contact, status)
  on public.retreat_participants to authenticated;
create policy retreat_participants_select on public.retreat_participants for select to authenticated
  using (private.manages_retreat(retreat_id) or attendee_id = auth.uid());
create policy retreat_participants_insert on public.retreat_participants for insert to authenticated
  with check (private.manages_retreat(retreat_id));
create policy retreat_participants_update on public.retreat_participants for update to authenticated
  using (private.manages_retreat(retreat_id)) with check (private.manages_retreat(retreat_id));
create policy retreat_participants_delete on public.retreat_participants for delete to authenticated
  using (private.manages_retreat(retreat_id));

grant select on public.retreat_checkins to authenticated;
create policy retreat_checkins_select on public.retreat_checkins for select to authenticated using (private.manages_retreat(retreat_id));

grant select, insert, update, delete on public.retreat_budget_lines to authenticated;
revoke insert, update on public.retreat_budget_lines from authenticated;
grant insert (retreat_id, category, label, estimated_pkr, actual_pkr, is_paid, vendor_id, item_id, notes)
  on public.retreat_budget_lines to authenticated;
grant update (category, label, estimated_pkr, actual_pkr, is_paid, vendor_id, item_id, notes)
  on public.retreat_budget_lines to authenticated;
create policy retreat_budget_select on public.retreat_budget_lines for select to authenticated using (private.manages_retreat(retreat_id));
create policy retreat_budget_insert on public.retreat_budget_lines for insert to authenticated with check (private.manages_retreat(retreat_id));
create policy retreat_budget_update on public.retreat_budget_lines for update to authenticated
  using (private.manages_retreat(retreat_id)) with check (private.manages_retreat(retreat_id));
create policy retreat_budget_delete on public.retreat_budget_lines for delete to authenticated using (private.manages_retreat(retreat_id));

grant select, insert, update, delete on public.retreat_tasks to authenticated;
revoke insert, update on public.retreat_tasks from authenticated;
grant insert (retreat_id, title, due_date, assignee_name, is_done, done_at, sort) on public.retreat_tasks to authenticated;
grant update (title, due_date, assignee_name, is_done, done_at, sort) on public.retreat_tasks to authenticated;
create policy retreat_tasks_select on public.retreat_tasks for select to authenticated using (private.manages_retreat(retreat_id));
create policy retreat_tasks_insert on public.retreat_tasks for insert to authenticated with check (private.manages_retreat(retreat_id));
create policy retreat_tasks_update on public.retreat_tasks for update to authenticated
  using (private.manages_retreat(retreat_id)) with check (private.manages_retreat(retreat_id));
create policy retreat_tasks_delete on public.retreat_tasks for delete to authenticated using (private.manages_retreat(retreat_id));

grant select on public.retreat_updates to authenticated;
create policy retreat_updates_select on public.retreat_updates for select to authenticated using (private.manages_retreat(retreat_id));

grant select, insert, update, delete on public.retreat_documents to authenticated;
revoke insert, update on public.retreat_documents from authenticated;
grant insert (retreat_id, item_id, name, storage_path, is_shared) on public.retreat_documents to authenticated;
grant update (item_id, name, is_shared) on public.retreat_documents to authenticated;
create policy retreat_documents_select on public.retreat_documents for select to authenticated using (private.manages_retreat(retreat_id));
create policy retreat_documents_insert on public.retreat_documents for insert to authenticated with check (private.manages_retreat(retreat_id));
create policy retreat_documents_update on public.retreat_documents for update to authenticated
  using (private.manages_retreat(retreat_id)) with check (private.manages_retreat(retreat_id));
create policy retreat_documents_delete on public.retreat_documents for delete to authenticated using (private.manages_retreat(retreat_id));

-- public views
grant select on public.public_class_series, public.public_class_sessions, public.public_pass_products,
                public.public_spaces, public.public_space_hours to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 8. Function execute grants (default is none)
-- ---------------------------------------------------------------------------
revoke execute on function
  public.invite_team_member(text), public.claim_team_invites(), public.remove_team_member(uuid),
  public.generate_class_sessions(uuid, integer), public.cancel_class_session(uuid, text),
  public.purchase_pass(uuid), public.book_class_session(uuid, uuid), public.cancel_class_booking(uuid),
  public.process_class_sessions(), public.process_space_bookings(),
  public.book_space(uuid, timestamptz, integer, text), public.cancel_space_booking(uuid),
  public.review_space_booking(uuid, boolean, text), public.space_open_slots(uuid, date),
  public.get_class_series(text), public.get_space(text),
  public.enable_retreat_sharing(uuid), public.disable_retreat_sharing(uuid),
  public.get_shared_retreat(text), public.get_participant_itinerary(text), public.my_retreats(),
  public.claim_retreat_invites(), public.retreat_check_in(uuid, text), public.post_retreat_update(uuid, text, boolean),
  public.duplicate_retreat(uuid, date), public.retreat_summary(uuid),
  public.submit_product_payment(public.product_kind, uuid, text, text), public.review_product_payment(uuid, boolean, text),
  public.scan_any(text, uuid), public.gate_scan_any(text, text, uuid, boolean), public.gate_get_scope(text),
  public.create_gate_link_scoped(text, uuid[], uuid[], uuid[], uuid[]), public.master_modules_overview(),
  public.my_entitlements()
  from public, anon, authenticated;

grant execute on function
  public.get_class_series(text), public.get_space(text), public.space_open_slots(uuid, date),
  public.get_shared_retreat(text), public.get_participant_itinerary(text),
  public.gate_scan_any(text, text, uuid, boolean), public.gate_get_scope(text)
  to anon, authenticated;

grant execute on function
  public.invite_team_member(text), public.claim_team_invites(), public.remove_team_member(uuid),
  public.generate_class_sessions(uuid, integer), public.cancel_class_session(uuid, text),
  public.purchase_pass(uuid), public.book_class_session(uuid, uuid), public.cancel_class_booking(uuid),
  public.book_space(uuid, timestamptz, integer, text), public.cancel_space_booking(uuid),
  public.review_space_booking(uuid, boolean, text),
  public.enable_retreat_sharing(uuid), public.disable_retreat_sharing(uuid), public.my_retreats(),
  public.claim_retreat_invites(), public.retreat_check_in(uuid, text), public.post_retreat_update(uuid, text, boolean),
  public.duplicate_retreat(uuid, date), public.retreat_summary(uuid),
  public.submit_product_payment(public.product_kind, uuid, text, text), public.review_product_payment(uuid, boolean, text),
  public.scan_any(text, uuid), public.create_gate_link_scoped(text, uuid[], uuid[], uuid[], uuid[]),
  public.master_modules_overview(), public.my_entitlements()
  to authenticated;

grant execute on function public.process_class_sessions(), public.process_space_bookings() to service_role;

-- ---------------------------------------------------------------------------
-- 9. Storage
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('retreat-files', 'retreat-files', false, 20971520,
   array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- retreat-files/<organizer_id>/<retreat_id>/<file>. Team managers share the organizer's folder.
create policy "retreat files managed by organizer account" on storage.objects for all to authenticated
  using (bucket_id = 'retreat-files' and private.manages_org(private.try_uuid((storage.foldername(name))[1])))
  with check (bucket_id = 'retreat-files' and private.manages_org(private.try_uuid((storage.foldername(name))[1])));

-- payment-proofs/<attendee_id>/<subject_id>/<file>: the organizer who is owed can read it.
create or replace function private.can_see_product_proof(p_subject uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.product_payments pp
                 where pp.subject_id = p_subject and private.manages_org(pp.organizer_id))
$$;

create policy "payment proofs readable by product organizer" on storage.objects for select to authenticated
  using (bucket_id = 'payment-proofs'
         and private.can_see_product_proof(private.try_uuid((storage.foldername(name))[2])));

-- ---------------------------------------------------------------------------
-- 10. Schedules
-- ---------------------------------------------------------------------------
select cron.unschedule(jobid) from cron.job
 where jobname in ('tkx_process_class_sessions', 'tkx_process_space_bookings');
select cron.schedule('tkx_process_class_sessions', '*/30 * * * *', $$select public.process_class_sessions()$$);
select cron.schedule('tkx_process_space_bookings', '*/30 * * * *', $$select public.process_space_bookings()$$);

commit;
