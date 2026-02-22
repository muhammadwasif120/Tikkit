import { createClient } from '@/lib/supabase/server'

export type NotificationType =
  | 'guest_signup'
  | 'guest_cancellation'
  | 'entry_scan'
  | 'exit_scan'
  | 'vendor_payment_due'
  | 'event_going_live'
  | 'event_ended'

export type NotificationPayload = {
  userId: string
  eventId?: string
  type: NotificationType
  title: string
  body: string
  metadata?: Record<string, unknown>
}

/**
 * Creates one or more notifications in the database.
 * Call this from server actions or route handlers — never from the client.
 *
 * Usage:
 *   await createNotification({ userId, eventId, type: 'guest_signup', title: '...', body: '...' })
 *   await createNotifications([{ ... }, { ... }])  // bulk for co-organisers
 */
export async function createNotification(payload: NotificationPayload) {
  const supabase = createClient()
  const { error } = await supabase.from('notifications').insert({
    user_id:  payload.userId,
    event_id: payload.eventId ?? null,
    type:     payload.type,
    title:    payload.title,
    body:     payload.body,
    metadata: payload.metadata ?? {},
  })
  if (error) console.error('[notifications] insert error:', error.message)
}

export async function createNotifications(payloads: NotificationPayload[]) {
  if (!payloads.length) return
  const supabase = createClient()
  const { error } = await supabase.from('notifications').insert(
    payloads.map((p) => ({
      user_id:  p.userId,
      event_id: p.eventId ?? null,
      type:     p.type,
      title:    p.title,
      body:     p.body,
      metadata: p.metadata ?? {},
    }))
  )
  if (error) console.error('[notifications] bulk insert error:', error.message)
}

// ─── Pre-built notification factories ─────────────────────────────────────────
// Pass the result of these into createNotification / createNotifications

export const Notifications = {
  guestSignup: (userId: string, eventId: string, guestName: string, eventTitle: string): NotificationPayload => ({
    userId, eventId,
    type: 'guest_signup',
    title: 'New guest signed up',
    body: `${guestName} registered for ${eventTitle}`,
    metadata: { guestName, eventTitle },
  }),

  guestCancellation: (userId: string, eventId: string, guestName: string, eventTitle: string): NotificationPayload => ({
    userId, eventId,
    type: 'guest_cancellation',
    title: 'Guest cancelled',
    body: `${guestName} cancelled their ticket for ${eventTitle}`,
    metadata: { guestName, eventTitle },
  }),

  entryScan: (userId: string, eventId: string, guestName: string, isVip: boolean): NotificationPayload => ({
    userId, eventId,
    type: 'entry_scan',
    title: isVip ? '⭐ VIP arrived' : 'Guest checked in',
    body: `${guestName} has entered the event`,
    metadata: { guestName, isVip },
  }),

  exitScan: (userId: string, eventId: string, guestName: string): NotificationPayload => ({
    userId, eventId,
    type: 'exit_scan',
    title: 'Guest checked out',
    body: `${guestName} has left the event`,
    metadata: { guestName },
  }),

  vendorPaymentDue: (userId: string, eventId: string, vendorName: string, amount: number, currency = 'USD'): NotificationPayload => ({
    userId, eventId,
    type: 'vendor_payment_due',
    title: 'Vendor payment due',
    body: `Payment of ${currency} ${amount.toFixed(2)} is due to ${vendorName}`,
    metadata: { vendorName, amount, currency },
  }),

  eventGoingLive: (userId: string, eventId: string, eventTitle: string): NotificationPayload => ({
    userId, eventId,
    type: 'event_going_live',
    title: 'Event is live 🎉',
    body: `${eventTitle} has started`,
    metadata: { eventTitle },
  }),

  eventEnded: (userId: string, eventId: string, eventTitle: string, totalAttendees: number): NotificationPayload => ({
    userId, eventId,
    type: 'event_ended',
    title: 'Event ended',
    body: `${eventTitle} has ended · ${totalAttendees} attendees`,
    metadata: { eventTitle, totalAttendees },
  }),
}