'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { CommandAttendee, ChatMessage } from '@/types/verification'

/**
 * Load all data for the Command Center for a given event.
 * Returns event info + attendee list with triple-verified profile data.
 */
export async function getCommandCenterData(eventId: string): Promise<{
  event: { id: string; title: string; date_start: string; date_end: string | null; status: string } | null
  attendees: CommandAttendee[]
  recentMessages: ChatMessage[]
  error?: string
}> {
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { event: null, attendees: [], recentMessages: [], error: 'Not authenticated' }

  // Verify ownership
  const { data: event } = await supabase
    .from('events')
    .select('id, title, date_start, date_end, status')
    .eq('id', eventId)
    .eq('organizer_id', user.id)
    .single()

  if (!event) {
    return { event: null, attendees: [], recentMessages: [], error: 'Event not found or access denied' }
  }

  // Fetch registrations with payment info
  const { data: registrations } = await supabase
    .from('public_registrations')
    .select('id, user_id, full_name, email, phone_number, status, payment_status, payment_screenshot_url, created_at')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false })

  // Batch-fetch profile verification data for all registrant user_ids
  const userIds = (registrations ?? []).map((r: any) => r.user_id).filter(Boolean)
  let profileMap: Record<string, any> = {}

  if (userIds.length > 0) {
    const { data: profiles } = await (admin as any)
      .from('profiles')
      .select('id, avatar_url, is_id_verified, is_payment_verified, social_score')
      .in('id', userIds)

    for (const p of profiles ?? []) {
      profileMap[p.id] = p
    }
  }

  const attendees: CommandAttendee[] = (registrations ?? []).map((r: any) => {
    const profile = profileMap[r.user_id] ?? null
    return {
      registration_id: r.id,
      user_id: r.user_id,
      full_name: r.full_name,
      email: r.email,
      phone_number: r.phone_number ?? null,
      avatar_url: profile?.avatar_url ?? null,
      status: r.status,
      payment_status: r.payment_status ?? null,
      payment_screenshot_url: r.payment_screenshot_url ?? null,
      is_id_verified: profile?.is_id_verified ?? false,
      is_payment_verified: profile?.is_payment_verified ?? false,
      social_score: profile?.social_score ?? 0,
      registered_at: r.created_at,
    }
  })

  // Fetch recent chat messages (last 50)
  const { data: rawMessages } = await (admin as any)
    .from('event_chats')
    .select('id, event_id, user_id, role, message, screenshot_url, created_at')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false })
    .limit(50)

  // Hydrate with sender names
  const msgUserIds = [...new Set((rawMessages ?? []).map((m: any) => m.user_id))]
  let senderMap: Record<string, { full_name: string; avatar_url: string | null }> = {}

  if (msgUserIds.length > 0) {
    const { data: senders } = await (admin as any)
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', msgUserIds)

    for (const s of senders ?? []) {
      senderMap[s.id] = { full_name: s.full_name, avatar_url: s.avatar_url }
    }
  }

  const recentMessages: ChatMessage[] = (rawMessages ?? [])
    .reverse()
    .map((m: any) => ({
      id: m.id,
      event_id: m.event_id,
      user_id: m.user_id,
      role: m.role,
      message: m.message,
      screenshot_url: m.screenshot_url,
      created_at: m.created_at,
      sender_name: senderMap[m.user_id]?.full_name ?? 'Unknown',
      sender_avatar: senderMap[m.user_id]?.avatar_url ?? null,
    }))

  return { event: event as any, attendees, recentMessages }
}

/**
 * Send a chat message as the organizer in a command channel.
 */
export async function sendCommandMessage(
  eventId: string,
  message: string
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Verify ownership
  const { data: event } = await supabase
    .from('events')
    .select('id')
    .eq('id', eventId)
    .eq('organizer_id', user.id)
    .single()

  if (!event) return { error: 'Forbidden' }

  const trimmed = message.trim()
  if (!trimmed || trimmed.length > 2000) return { error: 'Invalid message' }

  const { error } = await (supabase as any)
    .from('event_chats')
    .insert({
      event_id: eventId,
      user_id: user.id,
      role: 'organizer',
      message: trimmed,
    })

  return error ? { error: error.message } : { success: true }
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
  _count: number
}[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: events } = await supabase
    .from('events')
    .select('id, title, date_start, date_end, status')
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
