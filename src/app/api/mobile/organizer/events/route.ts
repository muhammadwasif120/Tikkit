import { createMobileClient, mobileUnauthorized } from '@/lib/supabase/mobile'
import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  const auth = await createMobileClient(req.headers.get('Authorization'))
  if (!auth) return mobileUnauthorized()
  const { supabase, userId } = auth

  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  if (!profile || !['organizer', 'staff', 'admin'].includes(profile.role)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const {
    title, description, date_start, date_end,
    venue_name, venue_address, venue_city,
    capacity, ticket_price, registration_mode,
    category_id, status,
  } = body

  if (!title?.trim() || !date_start) {
    return Response.json({ error: 'Title and start date are required' }, { status: 400 })
  }

  const { data: event, error } = await (supabase as any)
    .from('events')
    .insert({
      title: title.trim(),
      description: description?.trim() || null,
      date_start,
      date_end: date_end || null,
      venue_name: venue_name?.trim() || null,
      venue_address: venue_address?.trim() || null,
      venue_city: venue_city?.trim() || null,
      capacity: capacity ? parseInt(capacity) : null,
      ticket_price: ticket_price ? parseFloat(ticket_price) : null,
      registration_mode: registration_mode ?? 'open',
      category_id: category_id || null,
      status: status ?? 'draft',
      organizer_id: userId,
    })
    .select('id, title, status')
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ event }, { status: 201 })
}

export async function GET(req: NextRequest) {
  const auth = await createMobileClient(req.headers.get('Authorization'))
  if (!auth) return mobileUnauthorized()
  const { supabase, userId } = auth

  // Verify organizer role
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  if (!profile || !['organizer', 'staff', 'admin'].includes(profile.role)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') // 'published' | 'draft' | 'ended' | null (all)

  let query = (supabase as any)
    .from('events')
    .select(`
      id, title, date_start, date_end, status, cover_image_url,
      venue_name, venue_city, capacity, registration_mode,
      event_categories!events_category_id_fkey(name, slug)
    `)
    .eq('organizer_id', userId)
    .order('date_start', { ascending: false })

  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) return Response.json({ error: error.message }, { status: 500 })

  // Attach registration counts
  const eventIds = (data ?? []).map((e: any) => e.id)
  const counts: Record<string, number> = {}

  if (eventIds.length > 0) {
    const { data: regData } = await (supabase as any)
      .from('public_registrations')
      .select('event_id')
      .in('event_id', eventIds)
      .not('status', 'eq', 'rejected')

    for (const r of regData ?? []) {
      counts[r.event_id] = (counts[r.event_id] ?? 0) + 1
    }
  }

  const events = (data ?? []).map((e: any) => ({
    ...e,
    registration_count: counts[e.id] ?? 0,
  }))

  return Response.json({ events })
}
