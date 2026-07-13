'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { signPaymentScreenshot } from '@/lib/paymentScreenshot'
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

  // Fetch recent chat messages (last 50)
  const { data: rawMessages } = await (admin as any)
    .from('event_chats')
    .select('id, event_id, user_id, role, message, screenshot_url, recipient_user_id, created_at')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false })
    .limit(50)

  // Hydrate with sender names
  const msgUserIds = [...new Set((rawMessages ?? []).map((m: any) => m.user_id))]
  const senderMap: Record<string, { full_name: string; avatar_url: string | null }> = {}

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
      recipient_user_id: m.recipient_user_id ?? null,
      created_at: m.created_at,
      sender_name: senderMap[m.user_id]?.full_name ?? 'Unknown',
      sender_avatar: senderMap[m.user_id]?.avatar_url ?? null,
    }))

  return { event: event as any, attendees, recentMessages }
}

/**
 * Lightweight chat fetch for the floating chat panel — messages only, no attendees.
 */
export async function getEventChatMessages(eventId: string): Promise<{
  event: { id: string; title: string } | null
  messages: import('@/types/verification').ChatMessage[]
  error?: string
}> {
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { event: null, messages: [], error: 'Not authenticated' }

  const { data: event } = await supabase
    .from('events')
    .select('id, title')
    .eq('id', eventId)
    .eq('organizer_id', user.id)
    .single()

  if (!event) return { event: null, messages: [], error: 'Access denied' }

  const { data: rawMessages } = await (admin as any)
    .from('event_chats')
    .select('id, event_id, user_id, role, message, screenshot_url, recipient_user_id, created_at')
    .eq('event_id', eventId)
    .order('created_at', { ascending: true })
    .limit(50)

  const userIds = [...new Set((rawMessages ?? []).map((m: any) => m.user_id))]
  const nameMap: Record<string, string> = {}
  if (userIds.length > 0) {
    const { data: profiles } = await (admin as any)
      .from('profiles').select('id, full_name').in('id', userIds)
    for (const p of profiles ?? []) nameMap[p.id] = p.full_name
  }

  const messages = (rawMessages ?? []).map((m: any) => ({
    ...m,
    recipient_user_id: m.recipient_user_id ?? null,
    sender_name: m.role === 'organizer' ? 'You' : (nameMap[m.user_id] ?? 'Guest'),
    sender_avatar: null,
  }))

  return { event, messages }
}

/**
 * Send a chat message as the organizer in a command channel.
 */
export async function sendCommandMessage(
  eventId: string,
  message: string,
  recipientUserId: string | null = null
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
      recipient_user_id: recipientUserId,
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

/**
 * Send a chat message as a guest (checks registration, not ownership).
 */
export async function sendGuestMessage(eventId: string, message: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Verify user is registered for this event
  const { data: reg } = await (supabase as any)
    .from('public_registrations')
    .select('id, status')
    .eq('event_id', eventId)
    .eq('email', user.email!)
    .in('status', ['confirmed', 'checked_in', 'attended', 'registered', 'approved', 'eoi_submitted', 'eoi_approved', 'payment_pending', 'pending'])
    .single()

  if (!reg) return { error: 'You are not registered for this event' }

  const trimmed = message.trim()
  if (!trimmed || trimmed.length > 2000) return { error: 'Invalid message' }

  const { error } = await (supabase as any)
    .from('event_chats')
    .insert({ event_id: eventId, user_id: user.id, role: 'guest', message: trimmed })

  if (error) {
    console.error('sendGuestMessage error:', error)
    return { error: 'Failed to send message' }
  }
  return {}
}

/**
 * Fetch recent chat messages for a guest (their own + organizer messages).
 */
export async function getGuestChatMessages(eventId: string): Promise<{
  messages: import('@/types/verification').ChatMessage[]
  event: { id: string; title: string; organizer_name: string | null } | null
  error?: string
}> {
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { messages: [], event: null, error: 'Not authenticated' }

  // Verify registration
  const { data: reg } = await (supabase as any)
    .from('public_registrations')
    .select('id')
    .eq('event_id', eventId)
    .eq('email', user.email!)
    .single()

  if (!reg) return { messages: [], event: null, error: 'Not registered for this event' }

  // Fetch event info
  const { data: ev } = await supabase
    .from('events')
    .select('id, title, organizer_id')
    .eq('id', eventId)
    .single()

  if (!ev) return { messages: [], event: null, error: 'Event not found' }

  // Fetch organizer name
  const { data: orgProfile } = await (admin as any)
    .from('profiles')
    .select('full_name, company_name')
    .eq('id', ev.organizer_id)
    .single()

  const organizerName = (orgProfile as any)?.company_name ?? (orgProfile as any)?.full_name ?? 'Organizer'

  // Fetch messages — guest's own + organizer's messages
  const { data: msgs } = await (admin as any)
    .from('event_chats')
    .select('id, event_id, user_id, role, message, screenshot_url, recipient_user_id, created_at')
    .eq('event_id', eventId)
    .or(`user_id.eq.${user.id},and(role.eq.organizer,recipient_user_id.is.null),and(role.eq.organizer,recipient_user_id.eq.${user.id})`)
    .order('created_at', { ascending: true })
    .limit(100)

  const messages: import('@/types/verification').ChatMessage[] = (msgs ?? []).map((m: any) => ({
    ...m,
    recipient_user_id: m.recipient_user_id ?? null,
    sender_name: m.role === 'organizer' ? organizerName : 'You',
    sender_avatar: null,
  }))

  return {
    messages,
    event: { id: ev.id, title: ev.title, organizer_name: organizerName },
  }
}

/**
 * Fetch all event threads for the guest inbox.
 * Returns one entry per registered event with the last visible message.
 */
export async function getGuestInbox(): Promise<{
  eventId: string
  eventTitle: string
  coverImageUrl: string | null
  dateStart: string | null
  organizerName: string
  lastMessage: { text: string; createdAt: string; role: string } | null
  status: string
}[]> {
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // All registered events (by email)
  const { data: regs } = await (supabase as any)
    .from('public_registrations')
    .select('id, event_id, status, event:events(id, title, cover_image_url, date_start, organizer_id)')
    .eq('email', user.email!)
    .not('status', 'eq', 'rejected')
    .order('created_at', { ascending: false })

  if (!regs?.length) return []

  const eventIds: string[] = [...new Set((regs as any[]).map((r: any) => r.event_id).filter(Boolean))]

  // Batch-fetch organizer names
  const organizerIds = [...new Set((regs as any[]).map((r: any) => r.event?.organizer_id).filter(Boolean))]
  const { data: orgProfiles } = await (admin as any)
    .from('profiles')
    .select('id, full_name, company_name')
    .in('id', organizerIds)
  const orgMap: Record<string, string> = {}
  for (const p of orgProfiles ?? []) {
    orgMap[p.id] = p.company_name ?? p.full_name ?? 'Organizer'
  }

  // Fetch last visible message per event in one query
  const { data: allMsgs } = await (admin as any)
    .from('event_chats')
    .select('id, event_id, user_id, role, message, recipient_user_id, created_at')
    .in('event_id', eventIds)
    .order('created_at', { ascending: false })
    .limit(500)

  // Take last message per event_id that the guest can see
  const lastMsgMap: Record<string, any> = {}
  for (const msg of allMsgs ?? []) {
    if (lastMsgMap[msg.event_id]) continue
    const isOwn = msg.user_id === user.id
    const isOrgBroadcast = msg.role === 'organizer' && !msg.recipient_user_id
    const isPrivateToMe = msg.role === 'organizer' && msg.recipient_user_id === user.id
    if (isOwn || isOrgBroadcast || isPrivateToMe) {
      lastMsgMap[msg.event_id] = msg
    }
  }

  // De-duplicate by event_id (keep first occurrence = most recent registration)
  const seen = new Set<string>()
  return (regs as any[])
    .filter((r: any) => {
      if (!r.event_id || seen.has(r.event_id)) return false
      seen.add(r.event_id)
      return true
    })
    .map((r: any) => {
      const ev = r.event as any
      const lastMsg = lastMsgMap[r.event_id] ?? null
      return {
        eventId: r.event_id,
        eventTitle: ev?.title ?? 'Unknown Event',
        coverImageUrl: ev?.cover_image_url ?? null,
        dateStart: ev?.date_start ?? null,
        organizerName: orgMap[ev?.organizer_id] ?? 'Organizer',
        lastMessage: lastMsg
          ? { text: lastMsg.message, createdAt: lastMsg.created_at, role: lastMsg.role }
          : null,
        status: r.status,
      }
    })
}
