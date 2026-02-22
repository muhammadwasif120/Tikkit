'use server'

import { createClient } from '@/lib/supabase/server'
import { createNotification, Notifications } from '@/lib/supabase/notifications'

export async function notifyEventGoingLive(eventId: string, eventTitle: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await createNotification(
    Notifications.eventGoingLive(user.id, eventId, eventTitle)
  )
}

export async function notifyEventEnded(eventId: string, eventTitle: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { count } = await supabase
    .from('guests')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId)
    .eq('status', 'checked_in')

  await createNotification(
    Notifications.eventEnded(user.id, eventId, eventTitle, count ?? 0)
  )
}