import { createClient } from '@/lib/supabase/server'
import SpotMapEditor from '@/components/venue/os/SpotMapEditor'

export default async function SpotMapPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: venue } = await (supabase as any)
    .from('venues')
    .select('id, name')
    .eq('owner_id', user!.id)
    .single()

  const { data: spotMap } = await (supabase as any)
    .from('spot_maps')
    .select('*')
    .eq('venue_id', venue.id)
    .eq('active', true)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  return <SpotMapEditor venueId={venue.id} existingMap={spotMap ?? null} />
}
