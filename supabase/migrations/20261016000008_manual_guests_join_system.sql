-- TIKKIT X modules 8/8: everyone added by hand joins the system.
-- 1. claim_registrations(): a guest who signs up with a confirmed email gets the registrations
--    organizers created for that email, so their tickets appear in My tickets.
-- 2. add_manual_registration tells the guest: a notification if they have an account, an
--    invitation email if they do not.
-- 3. process_no_shows only penalises guests who registered themselves (source self).

begin;

create or replace function public.claim_registrations()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
  r record;
  n integer := 0;
begin
  -- Only a confirmed email may claim registrations added for it.
  select lower(pp.email) into v_email from public.profile_private pp
   where pp.id = auth.uid()
     and exists (select 1 from auth.users u where u.id = pp.id and u.email_confirmed_at is not null);
  if v_email is null or private.my_role() is distinct from 'attendee' then return 0; end if;

  for r in
    select distinct on (g.event_id) g.id, g.event_id
    from public.registrations g
    where g.attendee_id is null and lower(g.email) = v_email and g.status not in ('rejected', 'cancelled')
      and not exists (select 1 from public.registrations x
                      where x.event_id = g.event_id and x.attendee_id = auth.uid() and x.status not in ('rejected', 'cancelled'))
    order by g.event_id, g.created_at
  loop
    update public.registrations set attendee_id = auth.uid() where id = r.id;
    perform private.notify(auth.uid(), r.event_id, 'ticket_added', 'Your ticket is ready',
      (select title from public.events where id = r.event_id) || ' is in My tickets.');
    n := n + 1;
  end loop;
  return n;
end;
$$;

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
  v_title text;
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

  -- Everyone added by hand still has to sign up to open the ticket. Tell them how.
  select title into v_title from public.events where id = p_event;
  if v_attendee is not null then
    perform private.notify(v_attendee, p_event, 'ticket_added', 'You were added to ' || v_title,
      'The organizer added you to the guest list. Your ticket is in My tickets.');
  elsif nullif(trim(p_email), '') is not null then
    insert into public.email_outbox (to_email, template, payload)
    values (lower(trim(p_email)), 'guest_invite',
            jsonb_build_object('event_id', p_event, 'event_title', v_title, 'name', trim(p_full_name)));
  end if;
  return v_id;
end;
$$;

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
       returning id, attendee_id, source
    loop
      -- only guests who chose to register lose score. Organizer-added guests never do.
      if ns.source = 'self' then
        perform private.award_score(ns.attendee_id, rec.id, ns.id, -15, 'No show', false, true, false);
      end if;
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

revoke execute on function public.claim_registrations() from public, anon;
grant execute on function public.claim_registrations() to authenticated;

commit;
