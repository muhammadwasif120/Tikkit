import { createMobileClient, mobileUnauthorized } from '@/lib/supabase/mobile'
import { NextRequest } from 'next/server'

export async function GET(req: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params
  const auth = await createMobileClient(req.headers.get('Authorization'))
  if (!auth) return mobileUnauthorized()
  const { supabase, userId } = auth

  // Get user email for registration check
  const { data: profile } = await (supabase as any)
    .from('profiles').select('email, full_name').eq('id', userId).single()
  if (!profile?.email) return Response.json({ error: 'Profile not found' }, { status: 404 })

  // Verify user is registered for this event
  const { data: reg } = await (supabase as any)
    .from('public_registrations')
    .select('id, status')
    .eq('event_id', eventId)
    .eq('email', profile.email)
    .in('status', ['pending', 'approved', 'confirmed', 'registered'])
    .maybeSingle()

  if (!reg) return Response.json({ error: 'Not registered for this event' }, { status: 403 })

  // Fetch event info
  const { data: event } = await (supabase as any)
    .from('events')
    .select('id, title, organizer_id, profiles:organizer_id(full_name)')
    .eq('id', eventId)
    .single()

  if (!event) return Response.json({ error: 'Event not found' }, { status: 404 })

  const organizerName = event.profiles?.full_name ?? 'Organizer'

  // Fetch messages: all organizer messages + this user's messages
  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') ?? '0')

  const { data: messages } = await (supabase as any)
    .from('event_chats')
    .select('id, user_id, role, message, created_at')
    .eq('event_id', eventId)
    .or(`role.eq.organizer,user_id.eq.${userId}`)
    .order('created_at', { ascending: true })
    .range(page * 60, (page + 1) * 60 - 1)

  // Build name map for senders
  const userIds = [...new Set((messages ?? []).map((m: any) => m.user_id))]
  let nameMap: Record<string, string> = {}
  if (userIds.length > 0) {
    const { data: senders } = await (supabase as any)
      .from('profiles').select('id, full_name').in('id', userIds)
    for (const s of senders ?? []) nameMap[s.id] = s.full_name ?? 'Unknown'
  }

  const enriched = (messages ?? []).map((m: any) => ({
    ...m,
    sender_name: m.user_id === userId ? (profile.full_name ?? 'You') : (m.role === 'organizer' ? organizerName : nameMap[m.user_id] ?? 'Guest'),
    is_mine: m.user_id === userId,
  }))

  return Response.json({
    messages: enriched,
    event: { id: event.id, title: event.title, organizer_name: organizerName },
    user_id: userId,
  })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params
  const auth = await createMobileClient(req.headers.get('Authorization'))
  if (!auth) return mobileUnauthorized()
  const { supabase, userId } = auth

  // Get user email and name
  const { data: profile } = await (supabase as any)
    .from('profiles').select('email, full_name').eq('id', userId).single()
  if (!profile?.email) return Response.json({ error: 'Profile not found' }, { status: 404 })

  // Verify registration
  const { data: reg } = await (supabase as any)
    .from('public_registrations')
    .select('id')
    .eq('event_id', eventId)
    .eq('email', profile.email)
    .in('status', ['pending', 'approved', 'confirmed', 'registered'])
    .maybeSingle()

  if (!reg) return Response.json({ error: 'Not registered for this event' }, { status: 403 })

  const { message } = await req.json()
  const trimmed = (message ?? '').trim()
  if (!trimmed || trimmed.length > 2000) return Response.json({ error: 'Invalid message' }, { status: 400 })

  const { data: msg, error } = await (supabase as any)
    .from('event_chats')
    .insert({ event_id: eventId, user_id: userId, role: 'guest', message: trimmed })
    .select('id, user_id, role, message, created_at')
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({
    message: {
      ...msg,
      sender_name: profile.full_name ?? 'You',
      is_mine: true,
    }
  }, { status: 201 })
}
