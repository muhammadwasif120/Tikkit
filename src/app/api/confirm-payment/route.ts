import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyCsrfOrigin } from '@/lib/csrf'

export async function POST(req: NextRequest) {
  const csrf = verifyCsrfOrigin(req)
  if (csrf) return csrf
  try {
    const { registrationId } = await req.json()
    if (!registrationId) return NextResponse.json({ error: 'registrationId required' }, { status: 400 })

    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: reg } = await supabase
      .from('public_registrations')
      .select('email, event:events(id, title, organizer_id)')
      .eq('id', registrationId)
      .single()

    if (!reg) return NextResponse.json({ error: 'Registration not found' }, { status: 404 })
    if ((reg.event as any)?.organizer_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { error } = await supabase
      .from('public_registrations')
      .update({ payment_status: 'confirmed', reviewed_at: new Date().toISOString() })
      .eq('id', registrationId)

    if (error) { console.error(error); return NextResponse.json({ error: "Internal server error" }, { status: 500 }) }

    if (reg?.email) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', reg.email)
        .maybeSingle()

      if (profile?.id) {
        // Cross-user notification → service role (SEC-04: authenticated clients
        // may only notify themselves).
        await createAdminClient().from('notifications').insert({
          user_id:  profile.id,
          event_id: (reg.event as any)?.id,
          type: 'payment_confirmed',
          title: 'Payment Confirmed 🎟',
          body: `Your payment for ${(reg.event as any)?.title} has been confirmed. Your ticket is ready!`,
          metadata: { registration_id: registrationId },
        } as any)
      }
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
