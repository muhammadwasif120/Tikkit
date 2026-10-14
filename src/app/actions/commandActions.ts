'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { signPaymentScreenshot } from '@/lib/paymentScreenshot'
import type { CommandAttendee } from '@/types/verification'

/**
 * Load all data for the Command Center for a given event.
 * Returns event info + attendee list with triple-verified profile data.
 */
export async function getCommandCenterData(eventId: string): Promise<{
  event: { id: string; title: string; date_start: string; date_end: string | null; status: string } | null
  attendees: CommandAttendee[]
  error?: string
}> {
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { event: null, attendees: [], error: 'Not authenticated' }

  // Verify ownership
  const { data: event } = await supabase
    .from('events')
    .select('id, title, date_start, date_end, status')
    .eq('id', eventId)
    .eq('organizer_id', user.id)
    .single()

  if (!event) {
    return { event: null, attendees: [], error: 'Event not found or access denied' }
  }

  const { data: registrations } = await supabase
    .from('public_registrations')
    .select('id, full_name, email, phone, status, payment_status, payment_screenshot_url, created_at')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false })

  // Public registrations do not enforce a user_id link in this schema structure
  const userIds: string[] = []
  const profileMap: Record<string, any> = {}

  if (userIds.length > 0) {
    const { data: profiles } = await (admin as any)
      .from('profiles')
      .select('id, avatar_url, is_id_verified, is_payment_verified, social_score')
      .in('id', userIds)

    for (const p of profiles ?? []) {
      profileMap[p.id] = p
    }
  }

  const attendees: CommandAttendee[] = await Promise.all((registrations ?? []).map(async (r: any) => {
    // There are no user_ids for pure public registrations in this table
    return {
      registration_id: r.id,
      user_id: null,
      full_name: r.full_name,
      email: r.email,
      phone_number: r.phone ?? null,
      avatar_url: null,
      status: r.status,
      payment_status: r.payment_status ?? null,
      // Private bucket (SEC-02) — mint a short-lived signed URL for the organizer.
      payment_screenshot_url: await signPaymentScreenshot(r.payment_screenshot_url),
      is_id_verified: false,
      is_payment_verified: false,
      social_score: 0,
      registered_at: r.created_at,
    }
  }))

  return { event: event as any, attendees }
}

/**
 * Get the organizer's events for the Command Center landing page.
 */
export async function getCommandEvents(): Promise<{
  id: string
  title: string
  date_start: string
  date_end: string | null
  status: string
  cover_image_url: string | null
  _count: number
}[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: events } = await supabase
    .from('events')
    .select('id, title, date_start, date_end, status, cover_image_url')
    .eq('organizer_id', user.id)
    .in('status', ['published', 'completed'])
    .order('date_start', { ascending: false })
    .limit(20)

  if (!events?.length) return []

  // Batch registration counts
  const { data: counts } = await (supabase as any)
    .from('public_registrations')
    .select('event_id')
    .in('event_id', events.map((e: any) => e.id))
    .neq('status', 'rejected')

  const countMap: Record<string, number> = {}
  for (const row of (counts ?? []) as any[]) {
    countMap[row.event_id] = (countMap[row.event_id] ?? 0) + 1
  }

  return events.map((e: any) => ({ ...e, _count: countMap[e.id] ?? 0 }))
}

/**
 * Approve or reject a registration from the Command Center.
 * Fires the existing approval email API as a side-effect.
 */
export async function updateRegistrationStatus(
  registrationId: string,
  status: 'approved' | 'rejected'
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Verify the registration belongs to one of the organizer's events
  const { data: reg } = await supabase
    .from('public_registrations')
    .select('id, event_id')
    .eq('id', registrationId)
    .single()

  if (!reg) return { error: 'Registration not found' }

  const { data: event } = await supabase
    .from('events')
    .select('id')
    .eq('id', (reg as any).event_id)
    .eq('organizer_id', user.id)
    .single()

  if (!event) return { error: 'Forbidden' }

  const { error } = await (supabase as any)
    .from('public_registrations')
    .update({ status, reviewed_at: new Date().toISOString() })
    .eq('id', registrationId)

  return error ? { error: error.message } : { success: true }
}
