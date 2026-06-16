import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DealKanbanClient from '@/components/vendor/os/DealKanbanClient'

async function DealsData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: vendor } = await (supabase as any)
    .from('vendors')
    .select('id, trading_name')
    .eq('user_id', user.id)
    .single()

  if (!vendor) redirect('/vendor/onboarding')

  const { data: deals } = await (supabase as any)
    .from('deals')
    .select(`
      id, client_name, event_name, event_date, event_type,
      event_location, quote_value, stage, notes, created_at, updated_at
    `)
    .eq('vendor_id', vendor.id)
    .order('created_at', { ascending: false })

  return <DealKanbanClient deals={deals ?? []} vendorId={vendor.id} />
}

export default function DealsPage() {
  return (
    <Suspense fallback={
      <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14, padding: '40px 0' }}>Loading deals…</div>
    }>
      <DealsData />
    </Suspense>
  )
}
