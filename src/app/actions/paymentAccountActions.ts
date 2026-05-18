'use server'

import { createClient } from '@/lib/supabase/server'

export async function getPaymentAccounts() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await (supabase as any)
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
    await (supabase as any)
      .from('payment_accounts')
      .update({ is_default: false })
      .eq('organizer_id', user.id)
  }

  const { data, error } = await (supabase as any)
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
    await (supabase as any)
      .from('payment_accounts')
      .update({ is_default: false })
      .eq('organizer_id', user.id)
  }

  const { data, error } = await (supabase as any)
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

  const { error } = await (supabase as any)
    .from('payment_accounts')
    .delete()
    .eq('id', id)
    .eq('organizer_id', user.id) // safety: can only delete own accounts

  if (error) throw error
}

export async function approvePaymentSubmission(submissionId: string, registrationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // 1. Fetch registration + event details to verify ownership
  const { data: reg } = await (supabase as any)
    .from('public_registrations')
    .select('*, event:events(*, organizer:profiles(full_name, company_name))')
    .eq('id', registrationId)
    .single()

  if (!reg || (reg.event as any)?.organizer_id !== user.id) {
    throw new Error('Forbidden: Only the event organizer can approve payments')
  }

  // 2. Mark submission approved
  const { error: subError } = await (supabase as any)
    .from('payment_submissions')
    .update({ status: 'approved', reviewed_at: new Date().toISOString() })
    .eq('id', submissionId)

  if (subError) throw subError

  // 3. Update registration payment_status → confirmed, status → approved
  const { error: regError } = await (supabase as any)
    .from('public_registrations')
    .update({ payment_status: 'confirmed', status: 'approved', reviewed_at: new Date().toISOString() })
    .eq('id', registrationId)

  if (regError) throw regError

  // 4. Create guest record (payment is now confirmed)
  await (supabase as any).from('guests').insert({
    event_id:        (reg as any).event_id,
    name:            (reg as any).full_name,
    email:           (reg as any).email,
    phone:           (reg as any).phone,
    status:          'registered',
    source:          'public_registration',
    registration_id: (reg as any).id,
  } as any)

  // 5. Send payment confirmed email
  // M9: Use absolute URL — relative fetch('/api/...') fails in server actions
  // because Node.js has no base URL context. NEXT_PUBLIC_APP_URL is set in .env.local.
  const event = (reg as any).event as any
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://tikkit.app'
  await fetch(`${appUrl}/api/send-approval-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type:           'payment_confirmed',
      name:           (reg as any).full_name,
      email:          (reg as any).email,
      eventTitle:     event?.title,
      organizer:      event?.organizer?.company_name ?? event?.organizer?.full_name,
      referenceCode:  event?.require_reference_code ? event?.reference_code : null,
      registrationId: (reg as any).id,
    }),
  })
}

export async function rejectPaymentSubmission(submissionId: string, registrationId: string, notes?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // 1. Verify ownership and fetch email info
  const { data: reg } = await (supabase as any)
    .from('public_registrations')
    .select('*, event:events(title, organizer_id)')
    .eq('id', registrationId)
    .single()

  if (!reg || (reg.event as any)?.organizer_id !== user.id) {
    throw new Error('Forbidden: Only the event organizer can reject payments')
  }

  // 2. Mark submission rejected
  const { error: subError } = await (supabase as any)
    .from('payment_submissions')
    .update({ status: 'rejected', notes: notes ?? null, reviewed_at: new Date().toISOString() })
    .eq('id', submissionId)

  if (subError) throw subError

  // 3. Update registration payment_status → rejected
  const { error: regError } = await (supabase as any)
    .from('public_registrations')
    .update({ payment_status: 'rejected' })
    .eq('id', registrationId)

  if (regError) throw regError

  // 4. Send rejection email
  // M9: Absolute URL required in server actions (same reason as above)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://tikkit.app'
  await fetch(`${appUrl}/api/send-approval-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type:           'payment_rejected',
      name:           (reg as any).full_name,
      email:          (reg as any).email,
      eventTitle:     ((reg as any).event as any)?.title,
      notes:          notes ?? null,
      registrationId: registrationId,
    }),
  })
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
    await (supabase as any)
      .from('event_payment_accounts')
      .insert(accountIds.map(id => ({ event_id: eventId, payment_account_id: id })))
  }

  const { revalidatePath } = await import('next/cache')
  revalidatePath(`/dashboard/events/${eventId}`)
}
