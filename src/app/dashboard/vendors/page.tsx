import { createClient } from '@/lib/supabase/server'
import VendorsClient from '@/components/vendors/VendorsClient'

export default async function VendorsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: vendors } = await supabase
    .from('vendors')
    .select('*')
    .eq('organizer_id', user!.id)
    .order('created_at', { ascending: false })

  const { data: invoices } = await supabase
    .from('vendor_invoices')
    .select('*')
    .order('due_date', { ascending: true })

  const { data: events } = await supabase
    .from('events')
    .select('id, title, status')
    .eq('organizer_id', user!.id)
    .order('date_start', { ascending: false })

  return (
    <VendorsClient
      vendors={vendors ?? []}
      invoices={invoices ?? []}
      events={events ?? []}
      userId={user!.id}
    />
  )
}