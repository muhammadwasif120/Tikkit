import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'
import { deriveEventKey, verifyQRToken } from '@/lib/qrCrypto'

// Check-in endpoint for team_invites token holders (gate staff scanning at
// the door, admin/manager using the embedded scanner) — no Supabase session
// exists for these callers, so authorization comes from the invite token
// itself, validated here with the service-role client, not from RLS. Used by
// both the web StaffScanner and the mobile app's team-access scan screen.

function getQrSecret(): string {
  const secret = process.env.QR_SIGNING_SECRET
  if (!secret) throw new Error('QR_SIGNING_SECRET not set')
  return secret
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body) return Response.json({ valid: false, error: 'Invalid request' }, { status: 400 })

  const { inviteToken, qrToken, eventId, scanType } = body
  if (!inviteToken || !qrToken || !eventId) {
    return Response.json({ valid: false, error: 'Missing inviteToken, qrToken, or eventId' }, { status: 400 })
  }

  const ip = await getClientIp()
  if (!(await checkRateLimit(`staff-scan:${ip}`, 120, 60_000))) {
    return Response.json({ valid: false, error: 'Scan rate limit exceeded. Please slow down.' }, { status: 429 })
  }

  const supabase = createAdminClient()

  const { data: invite } = await supabase
    .from('team_invites')
    .select('organizer_id, role, revoked, expires_at')
    .eq('token', inviteToken)
    .eq('revoked', false)
    .maybeSingle()

  if (!invite) return Response.json({ valid: false, error: 'Invalid or revoked access link' }, { status: 403 })
  if ((invite as any).expires_at && new Date((invite as any).expires_at) < new Date()) {
    return Response.json({ valid: false, error: 'Access link expired' }, { status: 403 })
  }

  const { data: event } = await supabase
    .from('events')
    .select('id, organizer_id')
    .eq('id', eventId)
    .maybeSingle()

  if (!event || (event as any).organizer_id !== (invite as any).organizer_id) {
    return Response.json({ valid: false, error: 'Event not found' }, { status: 404 })
  }

  let payload: any
  try {
    const key = await deriveEventKey(getQrSecret(), eventId)
    payload = await verifyQRToken(qrToken, key)
  } catch {
    return Response.json({ valid: false, error: 'Invalid or expired QR code' }, { status: 422 })
  }

  if (!payload || payload.eid !== eventId) {
    return Response.json({ valid: false, error: 'QR code not valid for this event' }, { status: 422 })
  }

  const { data: guest } = await supabase
    .from('guests')
    .select('id, full_name, email, status, is_vip, ticket_days, checked_in_at')
    .eq('id', payload.gid)
    .maybeSingle()

  if (!guest) return Response.json({ valid: false, error: 'Guest record not found' }, { status: 404 })

  if ((guest as any).status === 'cancelled') {
    return Response.json({ valid: false, error: 'Ticket cancelled', guest: { ...(guest as any), name: (guest as any).full_name } })
  }

  // Multi-day ticket: only valid on the days it was issued for.
  const ticketDays: string[] | null = (guest as any).ticket_days ?? null
  if (ticketDays && ticketDays.length > 0) {
    const todayStr = new Date().toISOString().slice(0, 10)
    if (!ticketDays.includes(todayStr)) {
      return Response.json({
        valid: false,
        error: `Not valid today — ticket is for: ${ticketDays.join(', ')}`,
        guest: { ...(guest as any), name: (guest as any).full_name },
      })
    }
  }

  const type: 'entry' | 'exit' = scanType === 'exit' ? 'exit' : 'entry'

  if ((guest as any).status === 'checked_in' && type === 'entry') {
    return Response.json({
      valid: true,
      already_checked_in: true,
      guest: { ...(guest as any), name: (guest as any).full_name },
      checked_in_at: (guest as any).checked_in_at,
    })
  }

  const nextStatus = type === 'entry' ? 'checked_in' : 'checked_out'
  await supabase
    .from('guests')
    .update({ status: nextStatus, checked_in_at: type === 'entry' ? new Date().toISOString() : (guest as any).checked_in_at })
    .eq('id', (guest as any).id)

  await supabase.from('scan_logs').insert({
    event_id: eventId,
    guest_id: (guest as any).id,
    scan_type: type,
    scanned_by: null,
  })

  return Response.json({
    valid: true,
    already_checked_in: false,
    guest: { ...(guest as any), name: (guest as any).full_name, status: nextStatus },
  })
}
