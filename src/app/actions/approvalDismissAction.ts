'use server'

import { createClient } from '@/lib/supabase/server'

// Dismiss the "expressed interest" notification for a specific guest+event
export async function dismissInterestNotification(eventId: string, guestName: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase
      .from('notifications')
      .update({ dismissed: true })
      .eq('user_id', user.id)
      .eq('event_id', eventId)
      .eq('type', 'guest_signup')
      .contains('metadata', { guestName, isInterest: true })
  } catch {
    // fire-and-forget — failure is non-critical
  }
}

// Dismiss vendor_payment_due notification for a specific vendor+event
export async function dismissVendorPaymentNotification(eventId: string | null, vendorName: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    let query = supabase
      .from('notifications')
      .update({ dismissed: true })
      .eq('user_id', user.id)
      .eq('type', 'vendor_payment_due')
      .contains('metadata', { vendorName })

    if (eventId) query = query.eq('event_id', eventId)

    await query
  } catch {
    // fire-and-forget — failure is non-critical
  }
}

// Dismiss event_going_live notification when event ends/is cancelled
export async function dismissEventLiveNotification(eventId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase
      .from('notifications')
      .update({ dismissed: true })
      .eq('user_id', user.id)
      .eq('event_id', eventId)
      .eq('type', 'event_going_live')
  } catch {
    // fire-and-forget — failure is non-critical
  }
}