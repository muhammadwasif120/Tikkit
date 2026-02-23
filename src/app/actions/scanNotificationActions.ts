'use server'

import { createNotification, Notifications } from '@/lib/supabase/notifications'

export async function notifyEntryScan(
  userId: string,
  eventId: string,
  guestName: string,
  isVip: boolean
) {
  await createNotification(
    Notifications.entryScan(userId, eventId, guestName, isVip)
  )
}

export async function notifyExitScan(
  userId: string,
  eventId: string,
  guestName: string
) {
  await createNotification(
    Notifications.exitScan(userId, eventId, guestName)
  )
}