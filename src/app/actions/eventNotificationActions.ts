'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createNotification, Notifications } from '@/lib/supabase/notifications'
import { pushToUser } from '@/lib/pushNotifications'

/**
 * Notify a guest that an organizer added them to an event.
 *
 * SEC-04: this replaces a client-side cross-user notification insert. The
 * notification is created server-side via the service role, and only after we
 * verify the caller actually owns the event — so this action cannot be abused
 * to send arbitrary notifications to arbitrary users.
 */
export async function notifyGuestAddedByOrganizer(email: string, eventId: string) {
  try {
    if (!email || !eventId) return
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Verify the caller owns this event before notifying anyone.
    const { data: event } = await supabase
      .from('events')
      .select('id, title, organizer_id')
      .eq('id', eventId)
      .single()
    if (!event || (event as any).organizer_id !== user.id) return

    const admin = createAdminClient()
    const { data: profile } = await (admin as any)
      .from('profiles')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle()
    if (!profile?.id) return

    await createNotification({
      userId:   profile.id,
      eventId,
      type:     'organizer_invite' as any,
      title:    "You're on the list! 🎉",
      body:     `You've been added to ${(event as any).title ?? 'an event'}. Check your Tikkit for details.`,
      metadata: { event_id: eventId },
    })
  } catch { /* fire-and-forget */ }
}

export async function notifyEventGoingLive(
  userId: string,
  eventId: string,
  eventTitle: string
) {
  try {
    await Promise.all([
      createNotification(
        Notifications.eventGoingLive(userId, eventId, eventTitle)
      ),
      pushToUser(
        userId,
        '🎫 Event is live!',
        `${eventTitle} is happening now. Have your ticket ready.`,
        { type: 'event_reminder', eventId }
      ),
    ])
  } catch { /* fire-and-forget */ }
}

export async function notifyEventEnded(
  userId: string,
  eventId: string,
  eventTitle: string,
  totalAttendees: number
) {
  try {
    await Promise.all([
      createNotification(
        Notifications.eventEnded(userId, eventId, eventTitle, totalAttendees)
      ),
      pushToUser(
        userId,
        'Thanks for coming!',
        `${eventTitle} has wrapped up. Hope to see you at the next one.`,
        { type: 'event_reminder', eventId }
      ),
    ])
  } catch { /* fire-and-forget */ }
}
