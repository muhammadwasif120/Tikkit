import { PageHeader } from '@/components/kit'
import VendorsClient from '@/components/vendors/VendorsClient'
import { requireOwner } from '@/lib/data/viewer'

export const metadata = { title: 'Vendors and invoices' }

export default async function VendorsPage() {
  const { supabase, profile, entitlements } = await requireOwner()
  const [{ data: vendors }, { data: invoices }, { data: events }] = await Promise.all([
    supabase.from('organizer_vendors').select('*').eq('organizer_id', profile.id).order('name'),
    supabase.from('organizer_vendor_invoices').select('id, vendor_id, amount_pkr, due_date, status, invoice_number, description, events(title), organizer_vendors(name)').eq('organizer_id', profile.id).order('due_date', { ascending: true, nullsFirst: false }),
    supabase.from('events').select('id, title').eq('organizer_id', profile.id).order('starts_at', { ascending: false }),
  ])
  const lim = entitlements?.limits.vendors
  return (
    <div className="k-fade-up">
      <PageHeader title="Vendors and invoices" description="The people you hire and what you owe them." />
      <VendorsClient
        limit={typeof lim === 'number' && lim >= 0 ? lim : null}
        events={events ?? []}
        vendors={(vendors ?? []).map(v => ({ id: v.id, name: v.name, category: v.category, contact: v.contact_name, phone: v.contact_phone, email: v.contact_email, notes: v.notes }))}
        invoices={(invoices ?? []).map(i => ({ id: i.id, vendorId: i.vendor_id, vendor: i.organizer_vendors?.name ?? '', eventTitle: i.events?.title ?? null, number: i.invoice_number, amount: i.amount_pkr, due: i.due_date, status: i.status, description: i.description }))}
      />
    </div>
  )
}
