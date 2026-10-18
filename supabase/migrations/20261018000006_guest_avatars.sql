-- TIKKIT X: organizers can see the profile photo of guests who registered for their events
--
-- Profile rows stay private to their owner (and admins). This function returns only the photo link, and only for guests who
-- have a registration at an event the caller manages (the organizer, or a team manager acting for them).

begin;

create or replace function public.my_guest_avatars()
returns table (attendee_id uuid, avatar_url text)
language sql
stable
security definer
set search_path = public
as $$
  select distinct r.attendee_id, p.avatar_url
  from public.registrations r
  join public.events e on e.id = r.event_id
  join public.profiles p on p.id = r.attendee_id
  where r.attendee_id is not null and p.avatar_url is not null and private.manages_org(e.organizer_id)
$$;

revoke execute on function public.my_guest_avatars() from public, anon;
grant execute on function public.my_guest_avatars() to authenticated;

commit;
