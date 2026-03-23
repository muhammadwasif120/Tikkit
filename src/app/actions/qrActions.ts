'use server'

import { createClient } from '@/lib/supabase/server'
import { deriveEventKey, exportKeyBase64, signQRPayload, QRPayload } from '@/lib/qrCrypto'

const QR_SECRET = process.env.QR_SIGNING_SECRET ?? 'tikkit-dev-secret-change-in-prod'

export async function generateGuestQRToken(guestId: string): Promise<string | null> {
  const supabase = await createClient()

  // Fetch guest + event info
  const { data: guest } = await (supabase as any)
    .from('guests')
    .select('id, name, email, event_id, status, ticket_days, events(date_end)')
    .eq('id', guestId)
    .single()

  if (!guest) return null

  const key = await deriveEventKey(QR_SECRET, guest.event_id)

  // Expire at event end + 24h grace, or 1 year if no end date
  const eventEnd = guest.events?.date_end ? new Date(guest.events.date_end) : null
  const exp = eventEnd
    ? Math.floor(eventEnd.getTime() / 1000) + 86400
    : Math.floor(Date.now() / 1000) + 365 * 86400

  const payload: QRPayload = {
    gid: guest.id,
    eid: guest.event_id,
    name: guest.name ?? guest.email ?? 'Guest',
    days: guest.ticket_days ?? null,
    status: guest.status,
    iat: Math.floor(Date.now() / 1000),
    exp,
  }

  const token = await signQRPayload(payload, key)

  // Store in DB
  await (supabase as any)
    .from('guests')
    .update({ qr_token: token, qr_token_generated_at: new Date().toISOString() })
    .eq('id', guestId)

  return token
}

export async function getEventScanKey(eventId: string): Promise<{ keyB64: string; eventId: string } | null> {
  // Only callable by authenticated organizer/staff
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Verify user has access to this event
  const { data: event } = await supabase
    .from('events')
    .select('id, organizer_id')
    .eq('id', eventId)
    .single()

  if (!event) return null

  // Allow organizer or staff role
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['organizer', 'staff', 'admin'].includes((profile as any).role)) return null

  const key = await deriveEventKey(QR_SECRET, eventId)
  const keyB64 = await exportKeyBase64(key)
  return { keyB64, eventId }
}

export async function syncOfflineCheckins(
  queue: Array<{ guestId: string; eventId: string; scannedAt: string; deviceId?: string }>
): Promise<{ synced: number; errors: string[] }> {
  const supabase = await createClient()
  const errors: string[] = []
  let synced = 0

  for (const item of queue) {
    try {
      // Check if already checked in
      const { data: guest } = await (supabase as any)
        .from('guests')
        .select('id, status, event_id')
        .eq('id', item.guestId)
        .single()

      if (!guest) { errors.push(`Guest ${item.guestId} not found`); continue }

      if (guest.status === 'checked_in' || guest.status === 'attended') {
        synced++ // Already done, count as success
        continue
      }

      await (supabase as any)
        .from('guests')
        .update({ status: 'checked_in', checked_in_at: item.scannedAt })
        .eq('id', item.guestId)

      // Log to offline queue table
      await (supabase as any)
        .from('offline_checkin_queue')
        .insert({
          guest_id: item.guestId,
          event_id: item.eventId,
          scanned_at: item.scannedAt,
          scanner_device: item.deviceId ?? null,
          synced_at: new Date().toISOString(),
        })

      synced++
    } catch (e: any) {
      errors.push(`${item.guestId}: ${e.message}`)
    }
  }

  return { synced, errors }
}
