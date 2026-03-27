'use server'

import { createNotification, Notifications } from '@/lib/supabase/notifications'

export async function notifyEntryScan(
  userId: string,
  eventId: string,
  guestName: string,
  isVip: boolean
) {
  try {
    await createNotification(
      Notifications.entryScan(userId, eventId, guestName, isVip)
    )
  } catch { /* fire-and-forget */ }
}

export async function notifyExitScan(
  userId: string,
  eventId: string,
  guestName: string
) {
  try {
    await createNotification(
      Notifications.exitScan(userId, eventId, guestName)
    )
  } catch { /* fire-and-forget */ }
}