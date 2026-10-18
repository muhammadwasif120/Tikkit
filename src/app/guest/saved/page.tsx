import { PageHeader } from '@/components/kit'
import SavedClient, { type Followed, type SavedEvent } from '@/components/attendee/SavedClient'
import { requireAttendee } from '@/lib/data/viewer'

export const metadata = { title: 'Saved' }

export default async function SavedPage() {
  const { supabase, profile } = await requireAttendee()
  const [{ data: fe }, { data: fo }] = await Promise.all([
    supabase.from('event_favourites').select('event_id, created_at').eq('user_id', profile.id).order('created_at', { ascending: false }),
    supabase.from('organizer_favourites').select('organizer_id').eq('user_id', profile.id),
  ])
  const evIds = (fe ?? []).map(f => f.event_id), orgIds = (fo ?? []).map(f => f.organizer_id)
  const [{ data: evs }, { data: orgs }] = await Promise.all([
    evIds.length ? supabase.from('event_listings').select('id, slug, title, starts_at, ends_at, city, area_label, venue_name, is_secret_venue, min_price_pkr, cover_image_url').in('id', evIds).gte('ends_at', new Date().toISOString()).order('starts_at') : Promise.resolve({ data: [] }),
    orgIds.length ? supabase.from('public_organizers').select('id, company_name, full_name, username, city, logo_url, upcoming_event_count').in('id', orgIds) : Promise.resolve({ data: [] }),
  ])
  const events: SavedEvent[] = (evs ?? []).filter(e => e.id && e.slug).map(e => ({ id: e.id!, slug: e.slug!, title: e.title ?? 'Event', startsAt: e.starts_at!, cover: e.cover_image_url, price: e.min_price_pkr, where: e.is_secret_venue ? `Secret location · ${e.area_label ?? e.city ?? ''}` : [e.venue_name, e.area_label ?? e.city].filter(Boolean).join(', ') }))
  const following: Followed[] = (orgs ?? []).filter(o => o.id).map(o => ({ id: o.id!, name: o.company_name || o.full_name || 'Organizer', username: o.username, city: o.city, logo: o.logo_url, upcoming: o.upcoming_event_count ?? 0 }))
  return (
    <div className="k-fade-up">
      <PageHeader title="Saved" description="Events you are keeping an eye on, and the organizers you follow." />
      <SavedClient events={events} orgs={following} />
    </div>
  )
}
