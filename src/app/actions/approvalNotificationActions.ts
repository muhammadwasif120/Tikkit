'use server'

import { createNotification, Notifications } from '@/lib/supabase/notifications'

export async function notifyGuestApproved(
  userId: string,
  eventId: string,
  guestName: string,
  eventTitle: string
) {
  try {
    await createNotification(
      Notifications.guestSignup(userId, eventId, guestName, eventTitle)
    )
  } catch { /* fire-and-forget */ }
}

export async function notifyGuestRejected(
  userId: string,
  eventId: string,
  guestName: string,
  eventTitle: string
) {
  try {
    await createNotification(
      Notifications.guestCancellation(userId, eventId, guestName, eventTitle)
    )
  } catch { /* fire-and-forget */ }
}