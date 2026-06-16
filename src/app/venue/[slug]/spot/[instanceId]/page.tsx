import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SpotMapSelector from '@/components/venue/public/SpotMapSelector'

export default async function SpotSelectionPage({
  params,
}: {
  params: Promise<{ slug: string; instanceId: string }>
}) {
  const { slug, instanceId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: venue } = await (supabase as any)
    .from('venues')
    .select('id, name, slug')
    .eq('slug', slug)
    .eq('active', true)
    .single()

  if (!venue) notFound()

  const { data: instance } = await (supabase as any)
    .from('programme_instances')
    .select('id, date, status, programme_id, programmes(id, title, start_time, capacity, spot_booking_enabled)')
    .eq('id', instanceId)
    .single()

  if (!instance || instance.status === 'cancelled') notFound()
  if (!instance.programmes?.spot_booking_enabled) notFound()

  const { data: spotMap } = await (supabase as any)
    .from('spot_maps')
    .select('id, name, layout_json, canvas_width, canvas_height')
    .eq('venue_id', venue.id)
    .eq('active', true)
    .limit(1)
    .maybeSingle()

  if (!spotMap) notFound()

  // Existing bookings for this instance
  const { data: existingBookings } = await (supabase as any)
    .from('spot_bookings')
    .select('spot_id, user_id, party_size')
    .eq('spot_map_id', spotMap.id)
    .eq('instance_id', instanceId)
    .eq('status', 'confirmed')

  // Has current user already booked a spot?
  const mySpot = user
    ? (existingBookings ?? []).find((b: any) => b.user_id === user.id)
    : null

  return (
    <SpotMapSelector
      venue={venue}
      instance={instance}
      programme={instance.programmes}
      spotMap={spotMap}
      existingBookings={existingBookings ?? []}
      mySpot={mySpot ?? null}
      userId={user?.id ?? null}
    />
  )
}
