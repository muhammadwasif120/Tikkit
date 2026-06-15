import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import VendorOnboardingClient from '@/components/vendor/VendorOnboardingClient'

export default async function VendorOnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login?next=/vendor/onboarding')

  // Already onboarded
  const { data: vendor } = await (supabase as any)
    .from('vendors')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (vendor) redirect('/vendor/os')

  return <VendorOnboardingClient userId={user.id} />
}
