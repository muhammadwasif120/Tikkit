import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import InventoryClient from '@/components/vendor/os/InventoryClient'

export default async function InventoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: vendor } = await (supabase as any)
    .from('vendors').select('id').eq('user_id', user.id).single()
  if (!vendor) redirect('/vendor/onboarding')

  const { data: items } = await (supabase as any)
    .from('vendor_inventory')
    .select('id, name, category, quantity, available_quantity, condition, description, purchase_value, daily_hire_rate, notes')
    .eq('vendor_id', vendor.id)
    .order('created_at', { ascending: false })

  return <InventoryClient initialItems={items ?? []} />
}
