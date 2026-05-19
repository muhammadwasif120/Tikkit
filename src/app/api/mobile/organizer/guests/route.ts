import { createMobileClient, mobileUnauthorized } from '@/lib/supabase/mobile'
import { NextRequest } from 'next/server'

async function authorize(authHeader: string | null) {
  const auth = await createMobileClient(authHeader)
  if (!auth) return null
  const { supabase, userId } = auth
  const { data: profile } = await (supabase as any)
    .from('profiles').select('role').eq('id', userId).single()
  if (!profile || !['organizer', 'staff', 'admin'].includes(profile.role)) return null
  return { supabase, userId }
}

// GET — all guests across all organizer events
export async function GET(req: NextRequest) {
  const auth = await authorize(req.headers.get('Authorization'))
  if (!auth) return mobileUnauthorized()
  const { supabase, userId } = auth

  const { searchParams } = new URL(req.url)
  const eventId = searchParams.get('eventId')
  const tier = searchParams.get('tier') // 'vip'|'regular'|'waitlist'

  const { data: events } = await supabase
    .from('events')
    .select('id, title, status')
    .eq('organizer_id', userId)
    .order('date_start', { ascending: false })

  const eventIds = (events ?? []).map((e: any) => e.id)
  if (eventIds.length === 0) return Response.json({ guests: [], events: [] })

  let query = (supabase as any)
    .from('guests')
    .select('id, event_id, full_name, email, phone, gender, status, is_vip, waitlist, waitlist_position, plus_one, plus_one_name, created_at')
    .in('event_id', eventId ? [eventId] : eventIds)
    .order('created_at', { ascending: false })
    .limit(500)

  if (tier === 'vip') query = query.eq('is_vip', true)
  else if (tier === 'waitlist') query = query.eq('waitlist', true)
  else if (tier === 'regular') query = query.eq('is_vip', false).eq('waitlist', false)

  const { data: guests, error } = await query
  if (error) { console.error(error); return Response.json({ error: "Internal server error" }, { status: 500 }) }

  return Response.json({ guests: guests ?? [], events: events ?? [] })
}

// PATCH — edit a guest
export async function PATCH(req: NextRequest) {
  const auth = await authorize(req.headers.get('Authorization'))
  if (!auth) return mobileUnauthorized()
  const { supabase, userId } = auth

  const { guestId, full_name, email, phone, gender, is_vip, waitlist } = await req.json()
  if (!guestId) return Response.json({ error: 'guestId required' }, { status: 400 })

  // Verify ownership
  const { data: guest } = await (supabase as any)
    .from('guests').select('id, event_id').eq('id', guestId).single()
  if (!guest) return Response.json({ error: 'Guest not found' }, { status: 404 })

  const { data: event } = await supabase
    .from('events').select('id').eq('id', guest.event_id).eq('organizer_id', userId).single()
  if (!event) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const { data: updated, error } = await (supabase as any)
    .from('guests')
    .update({ full_name, email, phone, gender, is_vip, waitlist })
    .eq('id', guestId)
    .select()
    .single()

  if (error) { console.error(error); return Response.json({ error: "Internal server error" }, { status: 500 }) }
  return Response.json({ guest: updated })
}

// DELETE — remove a guest
export async function DELETE(req: NextRequest) {
  const auth = await authorize(req.headers.get('Authorization'))
  if (!auth) return mobileUnauthorized()
  const { supabase, userId } = auth

  const { searchParams } = new URL(req.url)
  const guestId = searchParams.get('guestId')
  if (!guestId) return Response.json({ error: 'guestId required' }, { status: 400 })

  const { data: guest } = await (supabase as any)
    .from('guests').select('id, event_id').eq('id', guestId).single()
  if (!guest) return Response.json({ error: 'Guest not found' }, { status: 404 })

  const { data: event } = await supabase
    .from('events').select('id').eq('id', guest.event_id).eq('organizer_id', userId).single()
  if (!event) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const { error } = await (supabase as any).from('guests').delete().eq('id', guestId)
  if (error) { console.error(error); return Response.json({ error: "Internal server error" }, { status: 500 }) }
  return Response.json({ ok: true })
}
