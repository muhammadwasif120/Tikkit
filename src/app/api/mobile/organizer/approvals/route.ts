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

export async function GET(req: NextRequest) {
  const auth = await authorize(req.headers.get('Authorization'))
  if (!auth) return mobileUnauthorized()
  const { supabase, userId } = auth

  const { searchParams } = new URL(req.url)
  const filter = searchParams.get('filter') ?? 'pending'
  const eventId = searchParams.get('eventId')

  const eventIds = await getOrganizerEventIds(supabase, userId)
  if (eventIds.length === 0) return Response.json({ registrations: [], events: [] })

  const { data: events } = await (supabase as any)
    .from('events')
    .select('id, title, registration_mode, require_id_verification, require_reference_code')
    .in('id', eventIds)

  // Removed: id_document_url, payment_screenshot_url (don't exist in public_registrations)
  // Fixed: `notes` → `registration_notes`
  let query = (supabase as any)
    .from('public_registrations')
    .select('id, event_id, full_name, email, phone, status, payment_status, registration_notes, reference_code_entered, created_at, reviewed_at')
    .in('event_id', eventId ? [eventId] : eventIds)
    .order('created_at', { ascending: false })

  if (filter === 'pending')   query = query.eq('status', 'pending')
  else if (filter === 'payment')  query = query.eq('status', 'approved').eq('payment_status', 'submitted')
  else if (filter === 'approved') query = query.eq('status', 'approved').neq('payment_status', 'submitted')
  else if (filter === 'rejected') query = query.eq('status', 'rejected')

  const { data: registrations, error } = await query
  if (error) { console.error(error); return Response.json({ error: "Internal server error" }, { status: 500 }) }

  // Alias registration_notes → notes for mobile client compatibility
  const mapped = (registrations ?? []).map((r: any) => ({
    ...r,
    notes: r.registration_notes ?? null,
  }))

  return Response.json({ registrations: mapped, events: events ?? [] })
}

export async function POST(req: NextRequest) {
  const auth = await authorize(req.headers.get('Authorization'))
  if (!auth) return mobileUnauthorized()
  const { supabase, userId } = auth

  const { registrationId, action, notes } = await req.json()
  if (!registrationId || !action) return Response.json({ error: 'registrationId and action required' }, { status: 400 })

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
    update.registration_notes = notes ?? null
  } else if (action === 'reject') {
    update.status = 'rejected'
    update.registration_notes = notes ?? null
  } else if (action === 'confirm_payment') {
    update.payment_status = 'confirmed'
  } else if (action === 'reject_payment') {
    // payment_status CHECK only allows: not_required|pending|submitted|confirmed
    // Reset to `pending` so the guest can resubmit a screenshot
    update.payment_status = 'pending'
    update.registration_notes = notes ?? null
  } else {
    return Response.json({ error: 'Invalid action' }, { status: 400 })
  }

  const { data: updated, error } = await (supabase as any)
    .from('public_registrations').update(update).eq('id', registrationId).select().single()

  if (error) { console.error(error); return Response.json({ error: "Internal server error" }, { status: 500 }) }
  return Response.json({ registration: { ...updated, notes: updated.registration_notes ?? null } })
}
