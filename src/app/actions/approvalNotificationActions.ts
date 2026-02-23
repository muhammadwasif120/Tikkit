'use server'

import { createNotification, Notifications } from '@/lib/supabase/notifications'

export async function notifyGuestApproved(
  userId: string,
  eventId: string,
  guestName: string,
  eventTitle: string
) {
  await createNotification(
    Notifications.guestSignup(userId, eventId, guestName, eventTitle)
  )
}

export async function notifyGuestRejected(
  userId: string,
  eventId: string,
  guestName: string,
  eventTitle: string
) {
  await createNotification(
    Notifications.guestCancellation(userId, eventId, guestName, eventTitle)
  )
}