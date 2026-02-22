import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { registrationId } = await req.json()

  const { data: reg, error: regError } = await supabase
    .from('public_registrations')
    .select('*')
    .eq('id', registrationId)
    .single()

  if (regError || !reg) {
    return NextResponse.json({ error: 'Registration not found' }, { status: 404 })
  }

  const { error: updateError } = await supabase
    .from('public_registrations')
    .update({ status: 'approved', reviewed_at: new Date().toISOString() })
    .eq('id', registrationId)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  const { error: guestError } = await supabase
    .from('guests')
    .insert({
      event_id: reg.event_id,
      full_name: reg.full_name,
      email: reg.email,
      phone: reg.phone,
      gender: reg.gender,
      status: 'registered',
      is_vip: false,
    })

  if (guestError) {
    console.error('Guest insert error:', guestError)
    return NextResponse.json({ error: guestError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}