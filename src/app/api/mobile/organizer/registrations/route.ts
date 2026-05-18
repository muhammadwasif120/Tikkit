import { createMobileClient, mobileUnauthorized, mobileBadRequest } from '@/lib/supabase/mobile'
import { NextRequest } from 'next/server'

async function assertOrganizer(supabase: any, userId: string) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()
  return profile && ['organizer', 'staff', 'admin'].includes(profile.role)
}

export async function GET(req: NextRequest) {
  const auth = await createMobileClient(req.headers.get('Authorization'))
  if (!auth) return mobileUnauthorized()
  const { supabase, userId } = auth

  if (!await assertOrganizer(supabase, userId)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const eventId = searchParams.get('eventId')
  const status = searchParams.get('status') // 'pending' | 'approved' | 'rejected' | null (all)

  if (!eventId) return mobileBadRequest('Missing eventId')

  // Verify organizer owns this event
  const { data: event } = await supabase
    .from('events')
    .select('id')
    .eq('id', eventId)
    .eq('organizer_id', userId)
    .maybeSingle()

  if (!event) return Response.json({ error: 'Event not found or access denied' }, { status: 404 })

  let query = (supabase as any)
    .from('public_registrations')
    .select('id, full_name, email, phone, status, payment_status, created_at, ticket_days')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ registrations: data ?? [] })
}

export async function PATCH(req: NextRequest) {
  const auth = await createMobileClient(req.headers.get('Authorization'))
  if (!auth) return mobileUnauthorized()
  const { supabase, userId } = auth

  if (!await assertOrganizer(supabase, userId)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  if (!body) return mobileBadRequest('Invalid JSON')

  const { registrationId, action } = body
  if (!registrationId || !action) return mobileBadRequest('Missing registrationId or action')
  if (!['approve', 'reject'].includes(action)) return mobileBadRequest('Invalid action')

  const newStatus = action === 'approve' ? 'approved' : 'rejected'

  // C1: Fetch registration first — then verify event ownership before updating.
  // Without this check any organizer could approve/reject another organizer's guests.
  const { data: reg, error: fetchError } = await (supabase as any)
    .from('public_registrations')
    .select('id, event_id, full_name, email')
    .eq('id', registrationId)
    .single()

  if (fetchError || !reg) return Response.json({ error: 'Registration not found' }, { status: 404 })

  // Ownership check — confirm this event belongs to the calling organizer
  const { data: event } = await supabase
    .from('events')
    .select('id')
    .eq('id', reg.event_id)
    .eq('organizer_id', userId)
    .maybeSingle()

  if (!event) return Response.json({ error: 'Forbidden' }, { status: 403 })

  // Perform the update using the server-fetched reg.id (not the client-supplied value)
  const { data: updated, error } = await (supabase as any)
    .from('public_registrations')
    .update({ status: newStatus, reviewed_at: new Date().toISOString() })
    .eq('id', reg.id)
    .select('id, status, event_id, full_name, email')
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ registration: updated })
}
