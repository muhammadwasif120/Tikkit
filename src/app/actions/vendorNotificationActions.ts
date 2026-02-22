'use server'

import { createClient } from '@/lib/supabase/server'
import { createNotification, Notifications } from '@/lib/supabase/notifications'

export async function notifyVendorPaymentDue(
  eventId: string | null,
  vendorName: string,
  amount: number
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await createNotification(
    Notifications.vendorPaymentDue(user.id, eventId ?? '', vendorName, amount, 'PKR')
  )
}