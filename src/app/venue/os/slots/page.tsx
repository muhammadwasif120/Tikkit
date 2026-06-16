import { createClient } from '@/lib/supabase/server'
import SlotListClient from '@/components/venue/os/SlotListClient'

export default async function SlotsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: venue } = await (supabase as any)
    .from('venues')
    .select('id')
    .eq('owner_id', user!.id)
    .single()

  const { data: resources } = await (supabase as any)
    .from('resources')
    .select('*')
    .eq('venue_id', venue.id)
    .order('created_at', { ascending: false })

  // Fetch upcoming bookings across all resources
  const resourceIds = (resources ?? []).map((r: any) => r.id)
  const today = new Date().toISOString().slice(0, 10)

  const { data: upcomingBookings } = resourceIds.length > 0
    ? await (supabase as any)
        .from('slot_bookings')
        .select('id, resource_id, date, start_time, end_time, status, total_price, guest_count, notes')
        .in('resource_id', resourceIds)
        .gte('date', today)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true })
        .limit(50)
    : { data: [] }

  return (
    <SlotListClient
      resources={resources ?? []}
      upcomingBookings={upcomingBookings ?? []}
    />
  )
}
