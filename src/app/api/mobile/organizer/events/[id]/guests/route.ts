import { createMobileClient, mobileUnauthorized } from '@/lib/supabase/mobile'
import { NextRequest } from 'next/server'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: eventId } = await params
  const auth = await createMobileClient(req.headers.get('Authorization'))
  if (!auth) return mobileUnauthorized()
  const { supabase, userId } = auth

  const { data: profile } = await (supabase as any)
    .from('profiles').select('role').eq('id', userId).single()
  if (!profile || !['organizer', 'staff', 'admin'].includes(profile.role))
    return Response.json({ error: 'Forbidden' }, { status: 403 })

  // Verify ownership
  const { data: event } = await supabase
    .from('events').select('id, title').eq('id', eventId).eq('organizer_id', userId).single()
  if (!event) return Response.json({ error: 'Event not found' }, { status: 404 })

  const { full_name, email, phone, gender, is_vip, waitlist } = await req.json()
  if (!full_name?.trim()) return Response.json({ error: 'full_name is required' }, { status: 400 })

  const { data: guest, error } = await (supabase as any)
    .from('guests')
    .insert({
      event_id: eventId,
      full_name: full_name.trim(),
      email: email?.trim() || null,
      phone: phone?.trim() || null,
      gender: gender || null,
      is_vip: is_vip ?? false,
      waitlist: waitlist ?? false,
      status: 'invited',
    })
    .select()
    .single()

  if (error) { console.error(error); return Response.json({ error: "Internal server error" }, { status: 500 }) }

  // Also upsert into public_registrations for email-matched guests
  if (email?.trim()) {
    await (supabase as any).from('public_registrations').upsert({
      event_id: eventId,
      email: email.trim(),
      full_name: full_name.trim(),
      phone: phone?.trim() || null,
      status: 'approved',
    }, { onConflict: 'event_id,email', ignoreDuplicates: true })
  }

  return Response.json({ guest }, { status: 201 })
}
