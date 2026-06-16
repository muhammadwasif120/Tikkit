import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BillListClient from '@/components/vendor/os/BillListClient'

export default async function BillsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: vendor } = await (supabase as any)
    .from('vendors').select('id').eq('user_id', user.id).single()
  if (!vendor) redirect('/vendor/onboarding')

  const { data: bills } = await (supabase as any)
    .from('vendor_bills')
    .select('id, supplier_name, bill_number, issue_date, due_date, total, status, notes')
    .eq('vendor_id', vendor.id)
    .order('created_at', { ascending: false })

  return <BillListClient initialBills={bills ?? []} />
}
