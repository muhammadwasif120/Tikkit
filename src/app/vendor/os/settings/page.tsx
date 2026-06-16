import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import VendorSettingsClient from '@/components/vendor/os/VendorSettingsClient'

export default async function VendorSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: vendor } = await (supabase as any)
    .from('vendors')
    .select('trading_name, company_name, category, bio, cities_covered, portfolio_urls, verification_tier')
    .eq('user_id', user.id)
    .single()

  if (!vendor) redirect('/vendor/onboarding')

  return <VendorSettingsClient vendor={vendor} />
}
