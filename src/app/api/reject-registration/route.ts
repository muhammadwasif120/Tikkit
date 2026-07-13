import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createNotification, Notifications } from '@/lib/supabase/notifications'
import { pushToUser } from '@/lib/pushNotifications'
import { verifyCsrfOrigin } from '@/lib/csrf'

export async function POST(req: NextRequest) {
  const csrf = verifyCsrfOrigin(req)
  if (csrf) return csrf
  try {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { registrationId, notes } = await req.json()
    if (!registrationId) return NextResponse.json({ error: 'registrationId required' }, { status: 400 })

    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Fetch registration + event info (include email for attendee push)
    const { data: reg, error: regError } = await supabase
      .from('public_registrations')
      .select('full_name, email, event_id, event:events(title, organizer_id)')
      .eq('id', registrationId)
      .single()

    if (regError || !reg) return NextResponse.json({ error: 'Registration not found' }, { status: 404 })

    const event = (reg as any)?.event as any
    if (event?.organizer_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { error } = await (supabase as any)
      .from('public_registrations')
      .update({ status: 'rejected', reviewed_at: new Date().toISOString() })
      .eq('id', registrationId)

    if (error) { console.error(error); return NextResponse.json({ error: "Internal server error" }, { status: 500 }) }

    // Notify the organizer that a guest was rejected
    if (reg && event?.organizer_id) {
      await createNotification(
        Notifications.guestCancellation(event.organizer_id, (reg as any).event_id, (reg as any).full_name, event.title)
      )
    }

    // Push notification to the attendee (if they have a Tikkit account)
    if ((reg as any).email) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', (reg as any).email.toLowerCase())
        .maybeSingle()

      if (profile?.id) {
        const title = 'Registration update'
        const body  = `Your application for ${event?.title} was not approved this time.`

        // Cross-user notification → service role (SEC-04: authenticated clients
        // may only notify themselves).
        await createAdminClient().from('notifications').insert({
          user_id:  profile.id,
          event_id: (reg as any).event_id,
          type:     'registration_rejected',
          title,
          body,
          metadata: { registration_id: registrationId },
        } as any)

        pushToUser(profile.id, title, body, { type: 'registration_rejected', eventId: (reg as any).event_id }).catch(() => {})
      }
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
