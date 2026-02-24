'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type PaymentAccount = {
  id: string
  organizer_id: string
  label: string
  account_type: 'bank' | 'jazzcash' | 'easypaisa' | 'other'
  account_title: string
  account_number: string
  bank_name: string | null
  iban: string | null
  instructions: string | null
  is_active: boolean
  created_at: string
}

export async function getPaymentAccounts(): Promise<PaymentAccount[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('payment_accounts')
    .select('*')
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function createPaymentAccount(input: {
  label: string
  account_type: 'bank' | 'jazzcash' | 'easypaisa' | 'other'
  account_title: string
  account_number: string
  bank_name?: string
  iban?: string
  instructions?: string
}): Promise<PaymentAccount> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('payment_accounts')
    .insert({ ...input, organizer_id: user.id })
    .select()
    .single()

  if (error) throw error
  revalidatePath('/dashboard/settings')
  return data
}

export async function updatePaymentAccount(id: string, input: Partial<{
  label: string
  account_type: string
  account_title: string
  account_number: string
  bank_name: string
  iban: string
  instructions: string
  is_active: boolean
}>): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('payment_accounts')
    .update(input)
    .eq('id', id)
  if (error) throw error
  revalidatePath('/dashboard/settings')
}

export async function deletePaymentAccount(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('payment_accounts')
    .delete()
    .eq('id', id)
  if (error) throw error
  revalidatePath('/dashboard/settings')
}

// Event ↔ payment account linking
export async function getEventPaymentAccounts(eventId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('event_payment_accounts')
    .select('*, payment_account:payment_accounts(*)')
    .eq('event_id', eventId)
    .order('sort_order')
  return data ?? []
}

export async function setEventPaymentAccounts(eventId: string, accountIds: string[]): Promise<void> {
  const supabase = await createClient()
  // Delete existing
  await supabase.from('event_payment_accounts').delete().eq('event_id', eventId)
  // Insert new
  if (accountIds.length > 0) {
    const rows = accountIds.map((id, i) => ({
      event_id: eventId,
      payment_account_id: id,
      sort_order: i,
    }))
    const { error } = await supabase.from('event_payment_accounts').insert(rows)
    if (error) throw error
  }
  revalidatePath('/dashboard/events')
}

// Payment submission review
export async function approvePaymentSubmission(submissionId: string, registrationId: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  await supabase
    .from('payment_submissions')
    .update({ status: 'approved', reviewed_at: new Date().toISOString(), reviewed_by: user?.id })
    .eq('id', submissionId)

  await supabase
    .from('public_registrations')
    .update({ status: 'approved', payment_status: 'confirmed' })
    .eq('id', registrationId)
}

export async function rejectPaymentSubmission(submissionId: string, registrationId: string, notes: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  await supabase
    .from('payment_submissions')
    .update({ status: 'rejected', notes, reviewed_at: new Date().toISOString(), reviewed_by: user?.id })
    .eq('id', submissionId)

  await supabase
    .from('public_registrations')
    .update({ payment_status: 'rejected' })
    .eq('id', registrationId)
}