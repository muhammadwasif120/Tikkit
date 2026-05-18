'use server'

import { createNotification, Notifications } from '@/lib/supabase/notifications'
import { pushToUser } from '@/lib/pushNotifications'

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
