'use server'

import { createNotification, Notifications } from '@/lib/supabase/notifications'

export async function notifyVendorPaymentDue(
  userId: string,
  eventId: string | null,
  vendorName: string,
  amount: number
) {
  try {
    await createNotification(
      Notifications.vendorPaymentDue(userId, eventId ?? '', vendorName, amount, 'PKR')
    )
  } catch { /* fire-and-forget */ }
}