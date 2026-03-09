// ─── Types and factories only — safe to import from anywhere ─────────────────
// No server imports, no next/headers

export type NotificationType =
  | 'guest_signup'
  | 'guest_cancellation'
  | 'entry_scan'
  | 'exit_scan'
  | 'vendor_payment_due'
  | 'event_going_live'
  | 'event_ended'
  // Public-facing registration events (fired when guests register via public event page)
  | 'new_registration'
  | 'eoi_submitted'
  // Guest-facing notifications (sent to the guest's account)
  | 'eoi_approved'
  | 'eoi_approved_payment_required'

export type NotificationPayload = {
  userId: string
  eventId?: string
  type: NotificationType
  title: string
  body: string
  metadata?: Record<string, unknown>
}

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

  vendorPaymentDue: (userId: string, eventId: string, vendorName: string, amount: number, currency = 'PKR'): NotificationPayload => ({
    userId, eventId,
    type: 'vendor_payment_due',
    title: 'Vendor payment due',
    body: `Payment of ${currency} ${(amount ?? 0).toLocaleString()} is due to ${vendorName}`,
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

  newRegistration: (userId: string, eventId: string, guestName: string, eventTitle: string): NotificationPayload => ({
    userId, eventId,
    type: 'new_registration',
    title: 'New Registration',
    body: `${guestName} registered for ${eventTitle}`,
    metadata: { guestName, eventTitle },
  }),

  eoiSubmitted: (userId: string, eventId: string, guestName: string, eventTitle: string): NotificationPayload => ({
    userId, eventId,
    type: 'eoi_submitted',
    title: 'New Application',
    body: `${guestName} expressed interest in ${eventTitle}`,
    metadata: { guestName, eventTitle },
  }),
}