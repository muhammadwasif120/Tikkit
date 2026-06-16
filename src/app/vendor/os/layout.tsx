import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import VendorShell from '@/components/vendor/VendorShell'

export default async function VendorOsLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login?next=/vendor/os')

  const { data: vendor } = await (supabase as any)
    .from('vendors')
    .select('trading_name')
    .eq('user_id', user.id)
    .single()

  if (!vendor) redirect('/vendor/onboarding')

  return (
    <VendorShell tradingName={vendor.trading_name}>
      {children}
    </VendorShell>
  )
}
