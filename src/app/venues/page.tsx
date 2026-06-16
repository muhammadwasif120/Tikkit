import { createClient } from '@/lib/supabase/server'
import VenueBrowseClient from '@/components/venue/public/VenueBrowseClient'

export default async function VenuesBrowsePage() {
  const supabase = await createClient()

  const { data: venues } = await (supabase as any)
    .from('venues')
    .select(`
      id, name, slug, city, categories, description, photos, capacity,
      programmes(id, title, price, start_time, rrule, active),
      resources(id, name, resource_type, price_per_slot, active)
    `)
    .eq('active', true)
    .order('created_at', { ascending: false })
    .limit(40)

  return <VenueBrowseClient venues={venues ?? []} />
}
