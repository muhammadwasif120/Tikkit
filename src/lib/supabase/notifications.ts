// ─── Server-only — only import this from server actions or server components ──
// Notifications are created via the service-role client: recipients are decided
// by trusted server code, and the notifications_insert RLS policy only permits
// authenticated clients to notify themselves (SEC-04). Cross-user notifications
// must therefore bypass RLS through the service role.
import { createAdminClient } from '@/lib/supabase/admin'
import type { NotificationPayload } from './notification-types'

export async function createNotification(payload: NotificationPayload) {
  const supabase = createAdminClient()
  const { error } = await supabase.from('notifications').insert({
    user_id:  payload.userId,
    event_id: payload.eventId ?? null,
    type:     payload.type,
    title:    payload.title,
    body:     payload.body,
    metadata: (payload.metadata ?? {}) as any,
  } as any)
  if (error) console.error('[notifications] insert error:', error.message)
}

export async function createNotifications(payloads: NotificationPayload[]) {
  if (!payloads.length) return
  const supabase = createAdminClient()
  const { error } = await supabase.from('notifications').insert(
    payloads.map((p) => ({
      user_id:  p.userId,
      event_id: p.eventId ?? null,
      type:     p.type,
      title:    p.title,
      body:     p.body,
      metadata: (p.metadata ?? {}) as any,
    } as any))
  )
  if (error) console.error('[notifications] bulk insert error:', error.message)
}

export { Notifications, type NotificationType, type NotificationPayload } from './notification-types'