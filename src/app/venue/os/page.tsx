import { createClient } from '@/lib/supabase/server'
import OverviewClient from '@/components/venue/os/OverviewClient'

export default async function VenueOverviewPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: venue } = await (supabase as any)
    .from('venues')
    .select('*')
    .eq('owner_id', user!.id)
    .single()

  const [{ data: programmes }, { data: resources }] = await Promise.all([
    (supabase as any).from('programmes').select('id, title, active, capacity, price').eq('venue_id', venue.id),
    (supabase as any).from('resources').select('id, name, active, price_per_slot, resource_type').eq('venue_id', venue.id),
  ])

  const resourceIds = (resources ?? []).map((r: any) => r.id)
  const { data: recentBookings } = resourceIds.length > 0
    ? await (supabase as any)
        .from('slot_bookings')
        .select('id, date, start_time, end_time, status, total_price, guest_count, resources(name)')
        .in('resource_id', resourceIds)
        .order('created_at', { ascending: false })
        .limit(10)
    : { data: [] }

  return (
    <OverviewClient
      venue={venue}
      programmes={programmes ?? []}
      resources={resources ?? []}
      recentBookings={recentBookings ?? []}
    />
  )
}
