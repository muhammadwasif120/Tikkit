import { createClient } from '@/lib/supabase/server'
import ExploreClient from '@/components/guest/ExploreClient'

export default async function ExplorePage() {
  const supabase = await createClient()

  const { data: events } = await supabase
    .from('events')
    .select('id, title, description, venue_name, secret_venue, date_start, date_end, capacity, cover_image_url, tags, ticket_price, registration_mode, is_private, organizer:profiles!events_organizer_id_fkey(full_name, company_name)')
    .eq('status', 'published')
    .eq('is_private', false)
    .gte('date_start', new Date().toISOString())
    .order('date_start', { ascending: true })
    .limit(40)

  // Get registered count for each event
  const eventIds = (events ?? []).map((e: any) => e.id)
  const { data: guestCounts } = eventIds.length
    ? await supabase
        .from('guests')
        .select('event_id')
        .in('event_id', eventIds)
        .in('status', ['registered', 'checked_in'])
    : { data: [] }

  const countMap: Record<string, number> = {}
  for (const g of guestCounts ?? []) {
    countMap[g.event_id] = (countMap[g.event_id] ?? 0) + 1
  }

  const enriched = (events ?? []).map((e: any) => ({
    ...e,
    registered_count: countMap[e.id] ?? 0,
  }))

  return <ExploreClient events={enriched} />
}