'use server'

import { createNotification, Notifications } from '@/lib/supabase/notifications'

export async function notifyEventGoingLive(
  userId: string,
  eventId: string,
  eventTitle: string
) {
  await createNotification(
    Notifications.eventGoingLive(userId, eventId, eventTitle)
  )
}

export async function notifyEventEnded(
  userId: string,
  eventId: string,
  eventTitle: string,
  totalAttendees: number
) {
  await createNotification(
    Notifications.eventEnded(userId, eventId, eventTitle, totalAttendees)
  )
}