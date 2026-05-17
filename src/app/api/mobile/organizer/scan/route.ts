import { createMobileClient, mobileUnauthorized, mobileBadRequest } from '@/lib/supabase/mobile'
import { NextRequest } from 'next/server'
import { deriveEventKey, verifyQRToken } from '@/lib/qrCrypto'

function getQrSecret(): string {
  const secret = process.env.QR_SIGNING_SECRET
  if (!secret) throw new Error('QR_SIGNING_SECRET not set')
  return secret
}

export async function POST(req: NextRequest) {
  const auth = await createMobileClient(req.headers.get('Authorization'))
  if (!auth) return mobileUnauthorized()
  const { supabase, userId } = auth

  // Verify organizer/staff role
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  if (!profile || !['organizer', 'staff', 'admin'].includes(profile.role)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  if (!body) return mobileBadRequest('Invalid JSON')

  const { token, eventId } = body
  if (!token || !eventId) return mobileBadRequest('Missing token or eventId')

  // Verify organizer owns/has access to this event
  const { data: event } = await supabase
    .from('events')
    .select('id, title, organizer_id')
    .eq('id', eventId)
    .maybeSingle()

  if (!event) return Response.json({ error: 'Event not found' }, { status: 404 })
  if ((event as any).organizer_id !== userId && profile.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Verify QR signature
  const QR_SECRET = getQrSecret()
  let payload: any
  try {
    const key = await deriveEventKey(QR_SECRET, eventId)
    payload = await verifyQRToken(token, key)
  } catch {
    return Response.json({ valid: false, error: 'Invalid or expired QR code' }, { status: 422 })
  }

  if (!payload || payload.eid !== eventId) {
    return Response.json({ valid: false, error: 'QR code not valid for this event' }, { status: 422 })
  }

  // Fetch guest record
  const { data: guest } = await (supabase as any)
    .from('guests')
    .select('id, name, email, status, is_vip, ticket_days, checked_in_at')
    .eq('id', payload.gid)
    .maybeSingle()

  if (!guest) {
    return Response.json({ valid: false, error: 'Guest record not found' }, { status: 404 })
  }

  if (guest.status === 'checked_in' || guest.status === 'attended') {
    return Response.json({
      valid: true,
      already_checked_in: true,
      guest,
      checked_in_at: guest.checked_in_at,
    })
  }

  // Check in
  await (supabase as any)
    .from('guests')
    .update({ status: 'checked_in', checked_in_at: new Date().toISOString() })
    .eq('id', guest.id)

  return Response.json({
    valid: true,
    already_checked_in: false,
    guest: { ...guest, status: 'checked_in' },
  })
}
