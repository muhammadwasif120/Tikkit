'use server'

import { createClient } from '@/lib/supabase/server'
import { createNotification, Notifications } from '@/lib/supabase/notifications'

export async function notifyEntryScan(
  eventId: string,
  guestName: string,
  isVip: boolean
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await createNotification(
    Notifications.entryScan(user.id, eventId, guestName, isVip)
  )
}

export async function notifyExitScan(
  eventId: string,
  guestName: string
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await createNotification(
    Notifications.exitScan(user.id, eventId, guestName)
  )
}