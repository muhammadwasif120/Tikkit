import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import InvoiceListClient from '@/components/vendor/os/InvoiceListClient'

async function InvoicesData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: vendor } = await (supabase as any)
    .from('vendors').select('id').eq('user_id', user.id).single()
  if (!vendor) redirect('/vendor/onboarding')

  const { data: invoices } = await (supabase as any)
    .from('invoices')
    .select('id, invoice_number, client_name, client_email, total, status, issue_date, due_date, advance_amount, advance_confirmed_at, paid_in_full_at')
    .eq('vendor_id', vendor.id)
    .order('created_at', { ascending: false })

  const { data: deals } = await (supabase as any)
    .from('deals')
    .select('id, event_name, client_name')
    .eq('vendor_id', vendor.id)
    .order('event_date', { ascending: false })

  return <InvoiceListClient invoices={invoices ?? []} deals={deals ?? []} vendorId={vendor.id} />
}

export default function InvoicesPage() {
  return (
    <Suspense fallback={<div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14, padding: '40px 0' }}>Loading invoices…</div>}>
      <InvoicesData />
    </Suspense>
  )
}
