'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function saveVendorAction(payload: {
  id?: string
  name: string
  category: string
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  notes: string | null
  event_ids: string[]
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { id, ...fields } = payload

  if (id) {
    const { data, error } = await supabase
      .from('vendors')
      .update(fields)
      .eq('id', id)
      .eq('organizer_id', user.id)
      .select()
      .single()
    if (error) return { error: error.message }
    revalidatePath('/dashboard/vendors')
    return { data }
  } else {
    const { data, error } = await supabase
      .from('vendors')
      .insert({ ...fields, organizer_id: user.id })
      .select()
      .single()
    if (error) return { error: error.message }
    revalidatePath('/dashboard/vendors')
    return { data }
  }
}

export async function deleteVendorAction(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('vendors')
    .delete()
    .eq('id', id)
    .eq('organizer_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/vendors')
  return { success: true }
}

export async function saveInvoiceAction(payload: {
  id?: string
  vendor_id: string
  event_id: string | null
  amount: number
  description: string | null
  due_date: string | null
  status: 'pending' | 'paid' | 'overdue' | 'cancelled'
  paid_at?: string | null
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { id, ...fields } = payload

  if (id) {
    const { data, error } = await supabase
      .from('vendor_invoices')
      .update(fields)
      .eq('id', id)
      .select()
      .single()
    if (error) return { error: error.message }
    revalidatePath('/dashboard/vendors')
    return { data }
  } else {
    const { data, error } = await supabase
      .from('vendor_invoices')
      .insert(fields)
      .select()
      .single()
    if (error) return { error: error.message }
    revalidatePath('/dashboard/vendors')
    return { data }
  }
}

export async function deleteInvoiceAction(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('vendor_invoices')
    .delete()
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/vendors')
  return { success: true }
}

export async function markInvoicePaidAction(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('vendor_invoices')
    .update({ status: 'paid', paid_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return { error: error.message }
  revalidatePath('/dashboard/vendors')
  return { data }
}
