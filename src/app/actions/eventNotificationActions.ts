'use server'

import { createNotification, Notifications } from '@/lib/supabase/notifications'

export async function notifyEventGoingLive(
  userId: string,
  eventId: string,
  eventTitle: string
) {
  try {
    await createNotification(
      Notifications.eventGoingLive(userId, eventId, eventTitle)
    )
  } catch { /* fire-and-forget */ }
}

export async function notifyEventEnded(
  userId: string,
  eventId: string,
  eventTitle: string,
  totalAttendees: number
) {
  try {
    await createNotification(
      Notifications.eventEnded(userId, eventId, eventTitle, totalAttendees)
    )
  } catch { /* fire-and-forget */ }
}