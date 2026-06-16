import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import VenueShell from '@/components/venue/VenueShell'

export default async function VenueOsLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login?next=/venue/os')

  const { data: venue } = await (supabase as any)
    .from('venues')
    .select('name')
    .eq('owner_id', user.id)
    .single()

  if (!venue) redirect('/venue/onboarding')

  return (
    <VenueShell venueName={venue.name}>
      {children}
    </VenueShell>
  )
}
