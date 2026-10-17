-- TIKKIT X modules 7/7: security review fixes.
-- 1. add_manual_registration rejects a ticket type from another event (inventory tampering).
-- 2. scan_any checks that the retreat item belongs to the participant's retreat.
-- 3. Invite claims need a confirmed email address.
-- Function bodies are otherwise unchanged. Grants carry over because the signatures are the same.

begin;

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
    -- the ticket must belong to this event, or one organizer could burn another organizer's inventory
    if not found then raise exception 'TICKET_NOT_FOUND: that ticket type is not part of this event.' using errcode = 'check_violation'; end if;
  end if;

  insert into public.registrations (event_id, attendee_id, ticket_type_id, source, status, full_name, phone, email,
                                    ticket_days, plus_one, is_vip, approved_at, price_paid_pkr)
  values (p_event, v_attendee, p_ticket_type, p_source, 'confirmed', trim(p_full_name), p_phone,
          lower(nullif(trim(p_email), '')), p_days, coalesce(p_plus_one, false), coalesce(v_vip, false), now(), 0)
  returning id into v_id;
  return v_id;
end;
$$;

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
    if not exists (select 1 from public.retreat_items i where i.id = p_context and i.retreat_id = pa.retreat_id) then
      return jsonb_build_object('result', 'invalid');
    end if;
    return private.do_retreat_check_in(p_context, p_token, auth.uid(), null);
  end if;

  return jsonb_build_object('result', 'invalid');
end;
$$;

create or replace function public.claim_team_invites()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
  v_n integer;
begin
  -- only a confirmed email address may claim an invite sent to it
  select lower(pp.email) into v_email from public.profile_private pp
   where pp.id = auth.uid()
     and exists (select 1 from auth.users u where u.id = pp.id and u.email_confirmed_at is not null);
  if v_email is null then return 0; end if;
  update public.organizer_team_members
     set user_id = auth.uid(), status = 'active', accepted_at = now()
   where lower(email) = v_email and status = 'invited' and organizer_id <> auth.uid();
  get diagnostics v_n = row_count;
  return v_n;
end;
$$;

create or replace function public.claim_retreat_invites()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare v_email text; v_n integer;
begin
  select lower(pp.email) into v_email from public.profile_private pp
   where pp.id = auth.uid()
     and exists (select 1 from auth.users u where u.id = pp.id and u.email_confirmed_at is not null);
  if v_email is null then return 0; end if;
  update public.retreat_participants set attendee_id = auth.uid()
   where lower(email) = v_email and attendee_id is null;
  get diagnostics v_n = row_count;
  return v_n;
end;
$$;

commit;
