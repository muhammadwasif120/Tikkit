import { createMobileClient, mobileUnauthorized } from '@/lib/supabase/mobile'
import { NextRequest } from 'next/server'

async function getOrganizerEventIds(supabase: any, userId: string): Promise<string[]> {
  const { data } = await supabase.from('events').select('id').eq('organizer_id', userId)
  return (data ?? []).map((e: any) => e.id)
}

async function authorize(authHeader: string | null) {
  const auth = await createMobileClient(authHeader)
  if (!auth) return null
  const { supabase, userId } = auth
  const { data: profile } = await (supabase as any)
    .from('profiles').select('role').eq('id', userId).single()
  if (!profile || !['organizer', 'staff', 'admin'].includes(profile.role)) return null
  return { supabase, userId }
}

// GET — all registrations needing organizer attention (pending EOI + submitted payments)
export async function GET(req: NextRequest) {
  const auth = await authorize(req.headers.get('Authorization'))
  if (!auth) return mobileUnauthorized()
  const { supabase, userId } = auth

  const { searchParams } = new URL(req.url)
  const filter = searchParams.get('filter') ?? 'pending' // 'all'|'pending'|'payment'|'approved'|'rejected'
  const eventId = searchParams.get('eventId')

  const eventIds = await getOrganizerEventIds(supabase, userId)
  if (eventIds.length === 0) return Response.json({ registrations: [], events: [] })

  // Fetch events for context
  const { data: events } = await (supabase as any)
    .from('events')
    .select('id, title, registration_mode, require_id_verification, require_reference_code')
    .in('id', eventIds)

  let query = (supabase as any)
    .from('public_registrations')
    .select('id, event_id, full_name, email, phone, status, payment_status, notes, payment_screenshot_url, id_document_url, reference_code_entered, created_at, reviewed_at')
    .in('event_id', eventId ? [eventId] : eventIds)
    .order('created_at', { ascending: false })

  if (filter === 'pending') query = query.eq('status', 'pending')
  else if (filter === 'payment') query = query.eq('status', 'approved').eq('payment_status', 'submitted')
  else if (filter === 'approved') query = query.eq('status', 'approved').neq('payment_status', 'submitted')
  else if (filter === 'rejected') query = query.eq('status', 'rejected')
  // 'all' — no extra filter

  const { data: registrations, error } = await query
  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ registrations: registrations ?? [], events: events ?? [] })
}

// POST — approve, reject, or confirm payment
export async function POST(req: NextRequest) {
  const auth = await authorize(req.headers.get('Authorization'))
  if (!auth) return mobileUnauthorized()
  const { supabase, userId } = auth

  const { registrationId, action, notes } = await req.json()
  if (!registrationId || !action) return Response.json({ error: 'registrationId and action are required' }, { status: 400 })

  // Verify the registration belongs to the organizer
  const { data: reg } = await (supabase as any)
    .from('public_registrations')
    .select('id, event_id, full_name, email, status')
    .eq('id', registrationId)
    .single()

  if (!reg) return Response.json({ error: 'Registration not found' }, { status: 404 })

  const eventIds = await getOrganizerEventIds(supabase, userId)
  if (!eventIds.includes(reg.event_id)) return Response.json({ error: 'Forbidden' }, { status: 403 })

  let update: Record<string, any> = { reviewed_at: new Date().toISOString() }

  if (action === 'approve') {
    update.status = 'approved'
    update.notes = notes ?? null
  } else if (action === 'reject') {
    update.status = 'rejected'
    update.notes = notes ?? null
  } else if (action === 'confirm_payment') {
    update.payment_status = 'confirmed'
  } else if (action === 'reject_payment') {
    update.payment_status = 'rejected'
    update.notes = notes ?? null
  } else {
    return Response.json({ error: 'Invalid action' }, { status: 400 })
  }

  const { data: updated, error } = await (supabase as any)
    .from('public_registrations')
    .update(update)
    .eq('id', registrationId)
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ registration: updated })
}
