'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/* ─── Types ──────────────────────────────────────────────────────────────── */
export type DealStage =
  | 'new_inquiry' | 'quote_sent' | 'negotiating' | 'deposit_confirmed'
  | 'confirmed' | 'event_day' | 'fulfilled' | 'lost'

export type EventTypeTag =
  | 'wedding' | 'corporate' | 'concert' | 'festival' | 'private' | 'other'

export type InvoiceStatus =
  | 'draft' | 'sent' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled'

/* ─── Helpers ────────────────────────────────────────────────────────────── */
async function getVendorId(supabase: any): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('vendors').select('id').eq('user_id', user.id).single()
  return data?.id ?? null
}

/* ─── Vendor account ─────────────────────────────────────────────────────── */
export async function createVendorAccount(fd: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await (supabase as any).from('vendors').insert({
    user_id:       user.id,
    trading_name:  fd.get('trading_name') as string,
    company_name:  (fd.get('company_name') as string) || null,
    category:      fd.get('category') as string,
    cities_covered: JSON.parse((fd.get('cities_covered') as string) || '[]'),
  })

  if (error) return { error: error.message }
  revalidatePath('/vendor/os')
}

/* ─── Deals ──────────────────────────────────────────────────────────────── */
export async function createDeal(fd: FormData) {
  const supabase = await createClient()
  const vendorId = await getVendorId(supabase)
  if (!vendorId) return { error: 'Vendor account not found' }

  const { data, error } = await (supabase as any).from('deals').insert({
    vendor_id:      vendorId,
    client_name:    fd.get('client_name') as string,
    client_contact: (fd.get('client_contact') as string) || null,
    event_name:     fd.get('event_name') as string,
    event_date:     (fd.get('event_date') as string) || null,
    event_type:     (fd.get('event_type') as EventTypeTag) || 'other',
    event_location: (fd.get('event_location') as string) || null,
    quote_value:    parseFloat((fd.get('quote_value') as string) || '0'),
    stage:          'new_inquiry' as DealStage,
    notes:          (fd.get('notes') as string) || null,
  }).select().single()

  if (error) return { error: error.message }
  revalidatePath('/vendor/os/deals')
  return { deal: data }
}

export async function updateDealStage(dealId: string, stage: DealStage) {
  const supabase = await createClient()
  const vendorId = await getVendorId(supabase)
  if (!vendorId) return { error: 'Vendor account not found' }

  const updates: any = { stage }
  if (stage === 'fulfilled' || stage === 'lost') {
    updates.won_lost_at = new Date().toISOString()
  }

  const { error } = await (supabase as any)
    .from('deals')
    .update(updates)
    .eq('id', dealId)
    .eq('vendor_id', vendorId)

  if (error) return { error: error.message }
  revalidatePath('/vendor/os/deals')
}

export async function updateDeal(dealId: string, fd: FormData) {
  const supabase = await createClient()
  const vendorId = await getVendorId(supabase)
  if (!vendorId) return { error: 'Vendor account not found' }

  const { error } = await (supabase as any)
    .from('deals')
    .update({
      client_name:    fd.get('client_name') as string,
      client_contact: (fd.get('client_contact') as string) || null,
      event_name:     fd.get('event_name') as string,
      event_date:     (fd.get('event_date') as string) || null,
      event_type:     (fd.get('event_type') as EventTypeTag) || 'other',
      event_location: (fd.get('event_location') as string) || null,
      quote_value:    parseFloat((fd.get('quote_value') as string) || '0'),
      notes:          (fd.get('notes') as string) || null,
    })
    .eq('id', dealId)
    .eq('vendor_id', vendorId)

  if (error) return { error: error.message }
  revalidatePath(`/vendor/os/deals/${dealId}`)
  revalidatePath('/vendor/os/deals')
}

export async function deleteDeal(dealId: string) {
  const supabase = await createClient()
  const vendorId = await getVendorId(supabase)
  if (!vendorId) return { error: 'Vendor account not found' }

  const { error } = await (supabase as any)
    .from('deals')
    .delete()
    .eq('id', dealId)
    .eq('vendor_id', vendorId)

  if (error) return { error: error.message }
  revalidatePath('/vendor/os/deals')
}

/* ─── Cross-hires ────────────────────────────────────────────────────────── */
export async function addCrossHire(dealId: string, fd: FormData) {
  const supabase = await createClient()
  const vendorId = await getVendorId(supabase)
  if (!vendorId) return { error: 'Vendor account not found' }

  // Check if supplier email matches a platform user
  const supplierContact = fd.get('supplier_contact') as string
  let supplierUserId: string | null = null
  if (supplierContact?.includes('@')) {
    const { data: matchedUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', (await supabase.auth.getUser()).data.user?.id ?? '')
      .single()
    // Simple lookup — check if any user has this email
    const { data: authLookup } = await (supabase as any).rpc('get_user_id_by_email', { p_email: supplierContact }).single()
    supplierUserId = authLookup ?? null
  }

  const { data, error } = await (supabase as any).from('cross_hires').insert({
    deal_id:          dealId,
    vendor_id:        vendorId,
    type:             (fd.get('type') as string) || 'sub_contractor',
    supplier_name:    fd.get('supplier_name') as string,
    supplier_contact: supplierContact || null,
    supplier_user_id: supplierUserId,
    description:      (fd.get('description') as string) || null,
    cost:             parseFloat((fd.get('cost') as string) || '0'),
    payment_status:   'pending',
    notes:            (fd.get('notes') as string) || null,
  }).select().single()

  if (error) return { error: error.message }
  revalidatePath(`/vendor/os/deals/${dealId}`)
  return { crossHire: data }
}

export async function updateCrossHirePaymentStatus(crossHireId: string, status: 'pending' | 'partially_paid' | 'paid') {
  const supabase = await createClient()
  const vendorId = await getVendorId(supabase)
  if (!vendorId) return { error: 'Vendor account not found' }

  const { error } = await (supabase as any)
    .from('cross_hires')
    .update({ payment_status: status })
    .eq('id', crossHireId)
    .eq('vendor_id', vendorId)

  if (error) return { error: error.message }
  revalidatePath('/vendor/os/deals')
}

export async function deleteCrossHire(crossHireId: string, dealId: string) {
  const supabase = await createClient()
  const vendorId = await getVendorId(supabase)
  if (!vendorId) return { error: 'Vendor account not found' }

  const { error } = await (supabase as any)
    .from('cross_hires')
    .delete()
    .eq('id', crossHireId)
    .eq('vendor_id', vendorId)

  if (error) return { error: error.message }
  revalidatePath(`/vendor/os/deals/${dealId}`)
}

/* ─── Invoices ───────────────────────────────────────────────────────────── */
async function nextInvoiceNumber(supabase: any, vendorId: string): Promise<string> {
  const { count } = await (supabase as any)
    .from('invoices')
    .select('id', { count: 'exact', head: true })
    .eq('vendor_id', vendorId)
  const n = ((count ?? 0) + 1).toString().padStart(3, '0')
  return `TKX-V${n}`
}

export async function createInvoice(fd: FormData) {
  const supabase = await createClient()
  const vendorId = await getVendorId(supabase)
  if (!vendorId) return { error: 'Vendor account not found' }

  const lineItems = JSON.parse((fd.get('line_items') as string) || '[]')
  const subtotal  = lineItems.reduce((s: number, l: any) => s + (l.line_total ?? 0), 0)
  const tax       = parseFloat((fd.get('tax') as string) || '0')
  const invoiceNumber = await nextInvoiceNumber(supabase, vendorId)

  const { data, error } = await (supabase as any).from('invoices').insert({
    vendor_id:            vendorId,
    deal_id:              (fd.get('deal_id') as string) || null,
    client_name:          fd.get('client_name') as string,
    client_email:         (fd.get('client_email') as string) || null,
    client_phone:         (fd.get('client_phone') as string) || null,
    invoice_number:       invoiceNumber,
    issue_date:           fd.get('issue_date') as string,
    due_date:             (fd.get('due_date') as string) || null,
    line_items:           lineItems,
    subtotal,
    tax,
    total:                subtotal + tax,
    payment_instructions: (fd.get('payment_instructions') as string) || null,
    notes:                (fd.get('notes') as string) || null,
    status:               'draft',
    advance_amount:       parseFloat((fd.get('advance_amount') as string) || '0'),
  }).select().single()

  if (error) return { error: error.message }
  revalidatePath('/vendor/os/invoices')
  return { invoice: data }
}

export async function updateInvoice(invoiceId: string, fd: FormData) {
  const supabase = await createClient()
  const vendorId = await getVendorId(supabase)
  if (!vendorId) return { error: 'Vendor account not found' }

  const lineItems = JSON.parse((fd.get('line_items') as string) || '[]')
  const subtotal  = lineItems.reduce((s: number, l: any) => s + (l.line_total ?? 0), 0)
  const tax       = parseFloat((fd.get('tax') as string) || '0')

  const { error } = await (supabase as any)
    .from('invoices')
    .update({
      deal_id:              (fd.get('deal_id') as string) || null,
      client_name:          fd.get('client_name') as string,
      client_email:         (fd.get('client_email') as string) || null,
      client_phone:         (fd.get('client_phone') as string) || null,
      issue_date:           fd.get('issue_date') as string,
      due_date:             (fd.get('due_date') as string) || null,
      line_items:           lineItems,
      subtotal,
      tax,
      total:                subtotal + tax,
      payment_instructions: (fd.get('payment_instructions') as string) || null,
      notes:                (fd.get('notes') as string) || null,
      advance_amount:       parseFloat((fd.get('advance_amount') as string) || '0'),
    })
    .eq('id', invoiceId)
    .eq('vendor_id', vendorId)

  if (error) return { error: error.message }
  revalidatePath(`/vendor/os/invoices/${invoiceId}`)
  revalidatePath('/vendor/os/invoices')
}

export async function updateInvoiceStatus(invoiceId: string, status: InvoiceStatus) {
  const supabase = await createClient()
  const vendorId = await getVendorId(supabase)
  if (!vendorId) return { error: 'Vendor account not found' }

  const updates: any = { status }
  if (status === 'paid') updates.paid_in_full_at = new Date().toISOString()

  const { error } = await (supabase as any)
    .from('invoices')
    .update(updates)
    .eq('id', invoiceId)
    .eq('vendor_id', vendorId)

  if (error) return { error: error.message }
  revalidatePath(`/vendor/os/invoices/${invoiceId}`)
  revalidatePath('/vendor/os/invoices')
}

export async function confirmAdvancePayment(invoiceId: string) {
  const supabase = await createClient()
  const vendorId = await getVendorId(supabase)
  if (!vendorId) return { error: 'Vendor account not found' }

  const { error } = await (supabase as any)
    .from('invoices')
    .update({ advance_confirmed_at: new Date().toISOString(), status: 'partially_paid' })
    .eq('id', invoiceId)
    .eq('vendor_id', vendorId)

  if (error) return { error: error.message }
  revalidatePath(`/vendor/os/invoices/${invoiceId}`)
}
