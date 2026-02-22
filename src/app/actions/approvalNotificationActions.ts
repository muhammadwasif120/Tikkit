'use server'

import { createClient } from '@/lib/supabase/server'
import { createNotification, Notifications } from '@/lib/supabase/notifications'

export async function notifyGuestApproved(
  eventId: string,
  guestName: string,
  eventTitle: string
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await createNotification(
    Notifications.guestSignup(user.id, eventId, guestName, eventTitle)
  )
}

export async function notifyGuestRejected(
  eventId: string,
  guestName: string,
  eventTitle: string
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await createNotification(
    Notifications.guestCancellation(user.id, eventId, guestName, eventTitle)
  )
}