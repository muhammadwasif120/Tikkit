import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { registrationId } = await req.json()
    if (!registrationId) {
      return NextResponse.json({ error: 'registrationId required' }, { status: 400 })
    }

    const supabase = await createClient()

    // 1. Fetch the registration + event
    const { data: reg, error: regError } = await supabase
      .from('public_registrations')
      .select('*, event:events(*, organizer:profiles(full_name, company_name))')
      .eq('id', registrationId)
      .single()

    if (regError || !reg) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 })
    }

    const event = reg.event

    // 2. Determine flow:
    //    - EOI + paid  → approve registration, DON'T create guest yet, send payment link email
    //    - EOI + free  → approve registration, create guest record immediately
    //    - Open + paid → this shouldn't hit this route (handled at registration time)
    const isPaid = (event.ticket_price ?? 0) > 0
    const isEOI  = event.registration_mode === 'expression_of_interest'

    if (isEOI && isPaid) {
      // Approve but don't create guest — guest needs to pay first
      const { error: updateError } = await supabase
        .from('public_registrations')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', registrationId)

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }

      // Send payment link email (handled by /api/send-approval-email with type='approved_payment_required')
      return NextResponse.json({ success: true, requiresPayment: true, paymentToken: reg.payment_token })
    }

    // Free EOI or any other flow: approve + create guest
    const { error: updateError } = await supabase
      .from('public_registrations')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', registrationId)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Create guest record
    const { error: guestError } = await supabase
      .from('guests')
      .insert({
        event_id: reg.event_id,
        name: reg.full_name,
        email: reg.email,
        phone: reg.phone,
        status: 'registered',
        source: 'public_registration',
        registration_id: reg.id,
      })

    if (guestError) {
      console.error('Guest creation failed:', guestError)
      // Don't fail the whole request — registration is approved, guest creation is secondary
    }

    return NextResponse.json({ success: true, requiresPayment: false })
  } catch (err: any) {
    console.error('approve-registration error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}