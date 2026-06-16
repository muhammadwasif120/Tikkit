import { createClient } from '@/lib/supabase/server'
import VenueSettingsClient from '@/components/venue/os/VenueSettingsClient'

export default async function VenueSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: venue } = await (supabase as any)
    .from('venues')
    .select('*')
    .eq('owner_id', user!.id)
    .single()

  return <VenueSettingsClient venue={venue} />
}
