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

// GET — event info + attendees + recent chat
export async function GET(req: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params
  const auth = await authorize(req.headers.get('Authorization'))
  if (!auth) return mobileUnauthorized()
  const { supabase, userId } = auth

  const { data: event } = await (supabase as any)
    .from('events')
    .select('id, title, date_start, date_end, status, capacity')
    .eq('id', eventId)
    .eq('organizer_id', userId)
    .single()

  if (!event) return Response.json({ error: 'Event not found' }, { status: 404 })

  const [{ data: registrations }, { data: chatMessages }] = await Promise.all([
    (supabase as any)
      .from('public_registrations')
      .select('id, full_name, email, phone, status, payment_status, payment_screenshot_url, created_at')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false }),
    (supabase as any)
      .from('event_chats')
      .select('id, user_id, role, message, created_at, sender_name, sender_avatar')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  const attendees = (registrations ?? []).map((r: any) => ({
    id: r.id,
    full_name: r.full_name,
    email: r.email,
    phone: r.phone,
    status: r.status,
    payment_status: r.payment_status,
    has_payment_screenshot: !!r.payment_screenshot_url,
    registered_at: r.created_at,
  }))

  const messages = [...(chatMessages ?? [])].reverse()

  const totalAttendees = attendees.length
  const approvedCount = attendees.filter((a: any) => a.status === 'approved').length
  const pendingCount = attendees.filter((a: any) => a.status === 'pending').length

  return Response.json({ event, attendees, messages, stats: { totalAttendees, approvedCount, pendingCount } })
}

// POST — approve/reject attendee OR send a chat message
export async function POST(req: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params
  const auth = await authorize(req.headers.get('Authorization'))
  if (!auth) return mobileUnauthorized()
  const { supabase, userId } = auth

  // Verify event ownership
  const { data: event } = await (supabase as any)
    .from('events').select('id').eq('id', eventId).eq('organizer_id', userId).single()
  if (!event) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { type } = body

  if (type === 'update_status') {
    const { registrationId, action } = body
    let update: any = { reviewed_at: new Date().toISOString() }
    if (action === 'approve') update.status = 'approved'
    else if (action === 'reject') update.status = 'rejected'
    else if (action === 'confirm_payment') update.payment_status = 'confirmed'
    else return Response.json({ error: 'Invalid action' }, { status: 400 })

    const { data, error } = await (supabase as any)
      .from('public_registrations')
      .update(update)
      .eq('id', registrationId)
      .select()
      .single()

    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ registration: data })
  }

  if (type === 'send_message') {
    const { message } = body
    if (!message?.trim()) return Response.json({ error: 'message required' }, { status: 400 })

    const { data: profile } = await (supabase as any)
      .from('profiles').select('full_name').eq('id', userId).single()

    const { data: msg, error } = await (supabase as any)
      .from('event_chats')
      .insert({
        event_id: eventId,
        user_id: userId,
        role: 'organizer',
        message: message.trim(),
        sender_name: profile?.full_name ?? 'Organizer',
      })
      .select()
      .single()

    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ message: msg }, { status: 201 })
  }

  return Response.json({ error: 'Unknown type' }, { status: 400 })
}
