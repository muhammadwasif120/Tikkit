import { createMobileClient, mobileUnauthorized } from '@/lib/supabase/mobile'
import { NextRequest } from 'next/server'

async function authorizeOrganizer(authHeader: string | null) {
  const auth = await createMobileClient(authHeader)
  if (!auth) return null
  const { supabase, userId } = auth
  const { data: profile } = await (supabase as any)
    .from('profiles').select('role').eq('id', userId).single()
  if (!profile || !['organizer', 'staff', 'admin'].includes(profile.role)) return null
  return { supabase, userId }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const auth = await authorizeOrganizer(req.headers.get('Authorization'))
  if (!auth) return mobileUnauthorized()
  const { supabase, userId } = auth

  // venue_city → city (column name in DB)
  const { data: event, error } = await (supabase as any)
    .from('events')
    .select('id, title, description, date_start, date_end, venue_name, venue_address, city, capacity, ticket_price, registration_mode, category_id, status, cover_image_url')
    .eq('id', id)
    .eq('organizer_id', userId)
    .single()

  if (error || !event) return Response.json({ error: 'Event not found' }, { status: 404 })

  const [{ count: guestCount }, { count: checkedInCount }, { count: regCount }, { count: pendingCount }] = await Promise.all([
    (supabase as any).from('guests').select('*', { count: 'exact', head: true }).eq('event_id', id),
    (supabase as any).from('guests').select('*', { count: 'exact', head: true }).eq('event_id', id).eq('status', 'checked_in'),
    (supabase as any).from('public_registrations').select('*', { count: 'exact', head: true }).eq('event_id', id).neq('status', 'rejected'),
    (supabase as any).from('public_registrations').select('*', { count: 'exact', head: true }).eq('event_id', id).eq('status', 'pending'),
  ])

  return Response.json({
    event: {
      ...event,
      venue_city: event.city ?? null,   // alias for mobile client
      guest_count: guestCount ?? 0,
      checked_in_count: checkedInCount ?? 0,
      registration_count: regCount ?? 0,
      pending_approvals: pendingCount ?? 0,
    }
  })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const auth = await authorizeOrganizer(req.headers.get('Authorization'))
  if (!auth) return mobileUnauthorized()
  const { supabase, userId } = auth

  const { data: existing } = await (supabase as any)
    .from('events').select('id').eq('id', id).eq('organizer_id', userId).single()
  if (!existing) return Response.json({ error: 'Event not found' }, { status: 404 })

  const { title, description, date_start, date_end, venue_name, venue_address, venue_city,
    capacity, ticket_price, registration_mode, category_id, status } = await req.json()

  if (!title?.trim() || !date_start) {
    return Response.json({ error: 'Title and start date are required' }, { status: 400 })
  }

  const { data: event, error } = await (supabase as any)
    .from('events')
    .update({
      title: title.trim(),
      description: description?.trim() || null,
      date_start,
      date_end: date_end || null,
      venue_name: venue_name?.trim() || null,
      venue_address: venue_address?.trim() || null,
      city: venue_city?.trim() || null,   // store in `city`
      capacity: capacity ? parseInt(capacity) : null,
      ticket_price: ticket_price ? parseFloat(ticket_price) : null,
      registration_mode: registration_mode ?? 'open',
      category_id: category_id || null,
      status: status ?? 'draft',
    })
    .eq('id', id)
    .select('id, title, status')
    .single()

  if (error) { console.error(error); return Response.json({ error: "Internal server error" }, { status: 500 }) }
  return Response.json({ event })
}
