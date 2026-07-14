import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DealDetailClient from '@/components/vendor/os/DealDetailClient'

export default async function DealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: vendor } = await (supabase as any)
    .from('vendors')
    .select('id, trading_name')
    .eq('user_id', user.id)
    .single()

  if (!vendor) redirect('/vendor/onboarding')

  const { data: deal } = await (supabase as any)
    .from('deals')
    .select('*')
    .eq('id', id)
    .eq('vendor_id', vendor.id)
    .single()

  if (!deal) notFound()

  const { data: crossHires } = await (supabase as any)
    .from('cross_hires')
    .select('*')
    .eq('deal_id', id)
    .eq('vendor_id', vendor.id)
    .order('created_at', { ascending: true })

  const { data: invoices } = await (supabase as any)
    .from('invoices')
    .select('id, invoice_number, total, status, due_date')
    .eq('deal_id', id)
    .eq('vendor_id', vendor.id)
    .order('created_at', { ascending: false })

  return (
    <DealDetailClient
      deal={deal}
      crossHires={crossHires ?? []}
      invoices={invoices ?? []}
      vendorId={vendor.id}
    />
  )
}
