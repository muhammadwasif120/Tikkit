import { createMobileClient, mobileUnauthorized, mobileBadRequest } from '@/lib/supabase/mobile'
import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  const auth = await createMobileClient(req.headers.get('Authorization'))
  if (!auth) return mobileUnauthorized()
  const { supabase, userId } = auth

  const body = await req.json().catch(() => null)
  if (!body) return mobileBadRequest('Invalid JSON')

  const { eventId, name, email, phone, ticketDays } = body
  if (!eventId || !name || !email) return mobileBadRequest('Missing required fields')
  if (ticketDays !== undefined && ticketDays !== null && !Array.isArray(ticketDays)) {
    return mobileBadRequest('ticketDays must be an array or null')
  }

  // Fetch event
  const { data: event } = await supabase
    .from('events')
    .select('id, title, capacity, registration_mode, organizer_id, status')
    .eq('id', eventId)
    .eq('status', 'published')
    .maybeSingle()

  if (!event) return mobileBadRequest('Event not found')

  // Check capacity
  const { count: regCount } = await supabase
    .from('public_registrations')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId)
    .not('status', 'eq', 'rejected')

  if ((event as any).capacity && (regCount ?? 0) >= (event as any).capacity) {
    return mobileBadRequest('This event is full')
  }

  // Check duplicate
  const { data: existing } = await supabase
    .from('public_registrations')
    .select('id')
    .eq('event_id', eventId)
    .eq('email', email.toLowerCase().trim())
    .not('status', 'eq', 'rejected')
    .maybeSingle()

  if (existing) return mobileBadRequest('Already registered for this event')

  const isOpen = (event as any).registration_mode === 'open'
  const status = isOpen ? 'approved' : 'pending'

  const { data: reg, error } = await supabase
    .from('public_registrations')
    .insert({
      event_id: eventId,
      full_name: name,
      email: email.toLowerCase().trim(),
      phone: phone ?? null,
      status,
      ticket_days: ticketDays ?? null,
    } as any)
    .select()
    .single()

  if (error) return Response.json({ error: 'Registration failed' }, { status: 500 })

  // For open events, auto-create guest record
  if (isOpen) {
    await supabase.from('guests').insert({
      event_id: eventId,
      name,
      email: email.toLowerCase().trim(),
      phone: phone ?? null,
      status: 'registered',
      source: 'public_registration',
      ticket_days: ticketDays ?? null,
    } as any)
  }

  return Response.json({ registration: reg, status }, { status: 201 })
}
