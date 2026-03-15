import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createNotification, Notifications } from '@/lib/supabase/notifications'

export async function POST(req: NextRequest) {
  try {
    const { registrationId } = await req.json()
    if (!registrationId) return NextResponse.json({ error: 'registrationId required' }, { status: 400 })

    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: reg, error: regError } = await supabase
      .from('public_registrations')
      .select('*, event:events(id, title, ticket_price, registration_mode, organizer_id, organizer:profiles(full_name, company_name))')
      .eq('id', registrationId)
      .single()

    if (regError || !reg) return NextResponse.json({ error: 'Registration not found' }, { status: 404 })

    const event = reg.event as any
    if (event.organizer_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const isPaid = (event?.ticket_price ?? 0) > 0

    // Update registration to approved
    const { error: updateError } = await supabase
      .from('public_registrations')
      .update({ status: 'approved', payment_status: isPaid ? 'pending' : 'not_required', reviewed_at: new Date().toISOString() })
      .eq('id', registrationId)

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

    // Notify the organizer that a guest has been approved / signed up
    if (event?.organizer_id) {
      await createNotification(
        Notifications.guestSignup(event.organizer_id, reg.event_id, reg.full_name, event.title)
      )
    }

    // Create guest record for free events immediately
    if (!isPaid) {
      await supabase.from('guests').insert({
        event_id: reg.event_id,
        name: reg.full_name,
        email: reg.email,
        phone: reg.phone,
        status: 'registered',
        source: 'public_registration',
        registration_id: reg.id,
      } as any)
    }

    // Notify attendee if they have a Tikkit account
    if (reg.email) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', reg.email.toLowerCase())
        .maybeSingle()

      if (profile?.id) {
        const notifBody = isPaid
          ? `You've been approved for ${event?.title}! Submit your payment screenshot to confirm your spot.`
          : `You've been approved for ${event?.title}! Your ticket is ready in the Tickets tab.`

        await supabase.from('notifications').insert({
          user_id: profile.id,
          type:    isPaid ? 'eoi_approved_payment_required' : 'eoi_approved',
          title:   isPaid ? "Approved — Payment Required 💳" : "You're In! 🎉",
          body:    notifBody,
          data:    { event_id: reg.event_id, registration_id: registrationId, requires_payment: isPaid },
        } as any)
      }
    }

    return NextResponse.json({ success: true, requiresPayment: isPaid })
  } catch (err: any) {
    console.error('approve-registration error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
