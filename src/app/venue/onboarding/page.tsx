import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import VenueOnboardingClient from '@/components/venue/public/VenueOnboardingClient'

export default async function VenueOnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?next=/venue/onboarding')

  // Already has a venue
  const { data: existing } = await (supabase as any)
    .from('venues')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle()

  if (existing) redirect('/venue/os')

  return <VenueOnboardingClient />
}
