import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ExploreClient from '@/components/guest/ExploreClient'

export default async function ExplorePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/guest-login')

  // Public upcoming events
  const { data: events } = await supabase
    .from('events')
    .select('id, title, description, venue_name, secret_venue, date_start, date_end, capacity, cover_image_url, tags, ticket_price, registration_mode, organizer:profiles!events_organizer_id_fkey(full_name, company_name)')
    .eq('status', 'published')
    .eq('is_private', false)
    .gte('date_start', new Date().toISOString())
    .order('date_start', { ascending: true })
    .limit(30)

  // Guest's own registrations (for "My Events" strip)
  const { data: myRegs } = await supabase
    .from('public_registrations')
    .select('id, event_id, status, payment_status, created_at, event:events(id, title, date_start, cover_image_url, venue_name, secret_venue)')
    .eq('email', user.email!)
    .order('created_at', { ascending: false })
    .limit(10)

  // Guest counts per event
  const eventIds = (events ?? []).map((e: any) => e.id)
  const { data: guestCounts } = eventIds.length
    ? await supabase.from('guests').select('event_id').in('event_id', eventIds).in('status', ['registered', 'checked_in'])
    : { data: [] }

  const countMap: Record<string, number> = {}
  for (const g of guestCounts ?? []) {
    countMap[g.event_id] = (countMap[g.event_id] ?? 0) + 1
  }

  const enrichedEvents = (events ?? []).map((e: any) => ({
    ...e,
    registered_count: countMap[e.id] ?? 0,
  }))

  return <ExploreClient events={enrichedEvents} myRegistrations={myRegs ?? []} />
}