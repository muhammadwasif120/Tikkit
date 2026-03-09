import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createNotification, Notifications } from '@/lib/supabase/notifications'

export async function POST(req: NextRequest) {
  try {
    const { registrationId, notes } = await req.json()
    if (!registrationId) return NextResponse.json({ error: 'registrationId required' }, { status: 400 })

    const supabase = await createClient()

    // Fetch registration + event info for the notification
    const { data: reg } = await supabase
      .from('public_registrations')
      .select('full_name, event_id, event:events(title, organizer_id)')
      .eq('id', registrationId)
      .single()

    const { error } = await supabase
      .from('public_registrations')
      .update({ status: 'rejected', reviewed_at: new Date().toISOString() })
      .eq('id', registrationId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Notify the organizer that a guest cancelled / was rejected
    const event = reg?.event as any
    if (reg && event?.organizer_id) {
      await createNotification(
        Notifications.guestCancellation(event.organizer_id, reg.event_id, reg.full_name, event.title)
      )
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
