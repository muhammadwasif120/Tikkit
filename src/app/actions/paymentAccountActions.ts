'use server'

import { createClient } from '@/lib/supabase/server'

export async function getPaymentAccounts() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('payment_accounts')
    .select('*')
    .eq('organizer_id', user.id)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function createPaymentAccount(account: {
  label: string
  account_type: string
  account_title: string
  account_number: string
  bank_name?: string
  iban?: string
  instructions?: string
  is_default?: boolean
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // If setting as default, unset all others first
  if (account.is_default) {
    await supabase
      .from('payment_accounts')
      .update({ is_default: false })
      .eq('organizer_id', user.id)
  }

  const { data, error } = await supabase
    .from('payment_accounts')
    .insert({ ...account, organizer_id: user.id })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updatePaymentAccount(id: string, updates: {
  label?: string
  account_type?: string
  account_title?: string
  account_number?: string
  bank_name?: string
  iban?: string
  instructions?: string
  is_active?: boolean
  is_default?: boolean
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // If setting as default, unset all others first
  if (updates.is_default) {
    await supabase
      .from('payment_accounts')
      .update({ is_default: false })
      .eq('organizer_id', user.id)
  }

  const { data, error } = await supabase
    .from('payment_accounts')
    .update(updates)
    .eq('id', id)
    .eq('organizer_id', user.id) // safety: can only update own accounts
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deletePaymentAccount(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('payment_accounts')
    .delete()
    .eq('id', id)
    .eq('organizer_id', user.id) // safety: can only delete own accounts

  if (error) throw error
}

export async function approvePaymentSubmission(submissionId: string, registrationId: string) {
  const supabase = await createClient()

  // 1. Mark submission approved
  const { error: subError } = await supabase
    .from('payment_submissions')
    .update({ status: 'approved', reviewed_at: new Date().toISOString() })
    .eq('id', submissionId)

  if (subError) throw subError

  // 2. Update registration payment_status → confirmed, status → approved
  const { error: regError } = await supabase
    .from('public_registrations')
    .update({ payment_status: 'confirmed', status: 'approved', reviewed_at: new Date().toISOString() })
    .eq('id', registrationId)

  if (regError) throw regError

  // 3. Fetch registration + event details for email + guest creation
  const { data: reg } = await supabase
    .from('public_registrations')
    .select('*, event:events(*, organizer:profiles(full_name, company_name))')
    .eq('id', registrationId)
    .single()

  if (reg) {
    // 4. Create guest record (payment is now confirmed)
    await supabase.from('guests').insert({
      event_id:        reg.event_id,
      name:            reg.full_name,
      email:           reg.email,
      phone:           reg.phone,
      status:          'registered',
      source:          'public_registration',
      registration_id: reg.id,
    })

    // 5. Send payment confirmed email
    const event = reg.event as any
    await fetch('/api/send-approval-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type:          'payment_confirmed',
        name:          reg.full_name,
        email:         reg.email,
        eventTitle:    event?.title,
        organizer:     event?.organizer?.company_name ?? event?.organizer?.full_name,
        referenceCode: event?.require_reference_code ? event?.reference_code : null,
      }),
    })
  }
}

export async function rejectPaymentSubmission(submissionId: string, registrationId: string, notes?: string) {
  const supabase = await createClient()

  // 1. Mark submission rejected
  const { error: subError } = await supabase
    .from('payment_submissions')
    .update({ status: 'rejected', notes: notes ?? null, reviewed_at: new Date().toISOString() })
    .eq('id', submissionId)

  if (subError) throw subError

  // 2. Update registration payment_status → rejected
  const { error: regError } = await supabase
    .from('public_registrations')
    .update({ payment_status: 'rejected' })
    .eq('id', registrationId)

  if (regError) throw regError

  // 3. Send rejection email
  const { data: reg } = await supabase
    .from('public_registrations')
    .select('*, event:events(title)')
    .eq('id', registrationId)
    .single()

  if (reg) {
    await fetch('/api/send-approval-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type:       'payment_rejected',
        name:       reg.full_name,
        email:      reg.email,
        eventTitle: (reg.event as any)?.title,
        notes:      notes ?? null,
      }),
    })
  }
}
export type PaymentAccount = {
  id: string
  organizer_id: string
  label: string
  account_type: string
  account_title: string
  account_number: string
  bank_name: string | null
  iban: string | null
  instructions: string | null
  is_active: boolean
  is_default: boolean
  created_at: string
}

export async function setEventPaymentAccounts(eventId: string, accountIds: string[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Delete existing links
  await supabase
    .from('event_payment_accounts')
    .delete()
    .eq('event_id', eventId)

  // Insert new links
  if (accountIds.length > 0) {
    await supabase
      .from('event_payment_accounts')
      .insert(accountIds.map(id => ({ event_id: eventId, payment_account_id: id })))
  }

  const { revalidatePath } = await import('next/cache')
  revalidatePath(`/dashboard/events/${eventId}`)
}
