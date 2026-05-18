'use server'

import { createNotification, Notifications } from '@/lib/supabase/notifications'
import { pushToUser } from '@/lib/pushNotifications'

export async function notifyGuestApproved(
  userId: string,
  eventId: string,
  guestName: string,
  eventTitle: string
) {
  try {
    await Promise.all([
      createNotification(
        Notifications.guestSignup(userId, eventId, guestName, eventTitle)
      ),
      pushToUser(
        userId,
        '🎉 You\'re approved!',
        `Your registration for ${eventTitle} has been confirmed. Check your ticket.`,
        { type: 'registration_approved', eventId }
      ),
    ])
  } catch { /* fire-and-forget */ }
}

export async function notifyGuestRejected(
  userId: string,
  eventId: string,
  guestName: string,
  eventTitle: string
) {
  try {
    await Promise.all([
      createNotification(
        Notifications.guestCancellation(userId, eventId, guestName, eventTitle)
      ),
      pushToUser(
        userId,
        'Registration update',
        `Your application for ${eventTitle} was not approved this time.`,
        { type: 'registration_rejected', eventId }
      ),
    ])
  } catch { /* fire-and-forget */ }
}
