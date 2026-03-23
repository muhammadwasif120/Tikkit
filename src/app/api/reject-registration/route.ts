import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createNotification, Notifications } from '@/lib/supabase/notifications'

export async function POST(req: NextRequest) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { registrationId, notes } = await req.json()
    if (!registrationId) return NextResponse.json({ error: 'registrationId required' }, { status: 400 })

    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Fetch registration + event info for the notification
    const { data: reg, error: regError } = await supabase
      .from('public_registrations')
      .select('full_name, event_id, event:events(title, organizer_id)')
      .eq('id', registrationId)
      .single()

    if (regError || !reg) return NextResponse.json({ error: 'Registration not found' }, { status: 404 })

    const event = (reg as any)?.event as any
    if (event?.organizer_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { error } = await (supabase as any)
      .from('public_registrations')
      .update({ status: 'rejected', reviewed_at: new Date().toISOString() })
      .eq('id', registrationId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Notify the organizer that a guest cancelled / was rejected
    if (reg && event?.organizer_id) {
      await createNotification(
        Notifications.guestCancellation(event.organizer_id, (reg as any).event_id, (reg as any).full_name, event.title)
      )
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
