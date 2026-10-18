-- TIKKIT X baseline 7/10: public projections
-- Views run with the owner's rights on purpose: they are the only door anonymous
-- visitors get to events and organizers, and they contain no private columns.

begin;

-- Statuses that hold a seat.
create or replace function private.seat_statuses()
returns public.registration_status[]
language sql
immutable
as $$
  select array['requested', 'awaiting_payment', 'payment_submitted', 'confirmed', 'checked_in', 'no_show']::public.registration_status[]
$$;

create or replace view public.event_listings as
select
  e.id,
  e.slug,
  e.title,
  e.description,
  e.cover_image_url,
  e.category_id,
  e.tags,
  e.city,
  e.area_label,
  case when e.is_secret_venue then null else e.venue_name end as venue_name,
  case when e.is_secret_venue then null else e.venue_address end as venue_address,
  e.is_secret_venue,
  es.reveal_at,
  e.starts_at,
  e.ends_at,
  e.capacity,
  e.registration_mode,
  e.require_id_verified,
  e.male_ratio_max,
  e.female_ratio_max,
  e.organizer_id,
  e.status,
  (select min(t.price_pkr) from public.ticket_types t
    where t.event_id = e.id
      and (t.sales_start is null or t.sales_start <= now())
      and (t.sales_end   is null or t.sales_end   >  now())) as min_price_pkr,
  (select count(*) from public.registrations r
    where r.event_id = e.id and r.status = any (private.seat_statuses()))::int as seats_taken
from public.events e
join public.event_secrets es on es.event_id = e.id
where e.status = 'published'
  and e.visibility = 'public'
  and e.admin_status = 'live';

create or replace view public.public_ticket_types as
select
  t.id, t.event_id, t.name, t.price_pkr, t.original_price_pkr, t.is_vip,
  t.sales_start, t.sales_end, t.sort,
  case when t.quantity is null then null
       else greatest(t.quantity - (select count(*) from public.registrations r
              where r.ticket_type_id = t.id and r.status = any (private.seat_statuses())), 0)::int
  end as seats_left
from public.ticket_types t
join public.events e on e.id = t.event_id
where e.status = 'published' and e.admin_status = 'live';

create or replace view public.public_organizers as
select
  p.id,
  p.full_name,
  p.username,
  p.avatar_url,
  p.city,
  p.created_at,
  op.company_name,
  op.bio,
  op.logo_url,
  op.cover_url,
  op.instagram,
  op.website,
  case when op.public_contact then op.whatsapp end      as whatsapp,
  case when op.public_contact then op.contact_email end as contact_email,
  (pp.id_status = 'verified') as is_verified,
  (select count(*) from public.events e
    where e.organizer_id = p.id and e.status = 'published' and e.visibility = 'public'
      and e.admin_status = 'live' and e.starts_at >= now())::int as upcoming_event_count
from public.profiles p
join public.organizer_profiles op on op.id = p.id
join public.profile_private pp on pp.id = p.id
where p.role = 'organizer';

-- A single event by slug, including unlisted (private) events reached by link.
-- Never returns drafts, suspended events or secret columns.
create or replace function public.get_event(p_slug text)
returns setof public.event_listings
language sql
stable
security definer
set search_path = public
as $$
  select
    e.id, e.slug, e.title, e.description, e.cover_image_url, e.category_id, e.tags, e.city, e.area_label,
    case when e.is_secret_venue then null else e.venue_name end,
    case when e.is_secret_venue then null else e.venue_address end,
    e.is_secret_venue, es.reveal_at, e.starts_at, e.ends_at, e.capacity, e.registration_mode,
    e.require_id_verified, e.male_ratio_max, e.female_ratio_max, e.organizer_id, e.status,
    (select min(t.price_pkr) from public.ticket_types t
      where t.event_id = e.id
        and (t.sales_start is null or t.sales_start <= now())
        and (t.sales_end   is null or t.sales_end   >  now())),
    (select count(*) from public.registrations r
      where r.event_id = e.id and r.status = any (private.seat_statuses()))::int
  from public.events e
  join public.event_secrets es on es.event_id = e.id
  where e.slug = p_slug and e.status = 'published' and e.admin_status = 'live'
$$;

-- Top organizers for the explore page.
create or replace function public.get_top_organizers(p_limit integer default 10)
returns setof public.public_organizers
language sql
stable
security definer
set search_path = public
as $$
  select * from public.public_organizers
  where upcoming_event_count > 0
  order by upcoming_event_count desc, coalesce(company_name, full_name)
  limit least(greatest(p_limit, 1), 50)
$$;

commit;
