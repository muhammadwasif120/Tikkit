import { createMobileClient, mobileUnauthorized } from '@/lib/supabase/mobile'
import { NextRequest } from 'next/server'
import { deriveEventKey, exportKeyBase64, signQRPayload } from '@/lib/qrCrypto'

function getQrSecret(): string {
  const secret = process.env.QR_SIGNING_SECRET
  if (!secret) throw new Error('QR_SIGNING_SECRET not set')
  return secret
}

export async function GET(req: NextRequest) {
  const auth = await createMobileClient(req.headers.get('Authorization'))
  if (!auth) return mobileUnauthorized()
  const { supabase } = auth

  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return mobileUnauthorized()

  // Fetch guest records linked by email
  const { data: guests, error } = await (supabase as any)
    .from('guests')
    .select(`
      id, name, email, status, ticket_days, is_vip, qr_token, checked_in_at,
      events(id, title, date_start, date_end, venue_name, venue_city, cover_image_url,
             profiles!events_organizer_id_fkey(full_name, username))
    `)
    .eq('email', user.email)
    .order('created_at', { ascending: false })

  if (error) return Response.json({ error: error.message }, { status: 500 })

  const QR_SECRET = getQrSecret()

  // Ensure every guest record has a fresh QR token
  const tickets = await Promise.all((guests ?? []).map(async (g: any) => {
    let qrToken = g.qr_token

    if (!qrToken && g.events) {
      try {
        const key = await deriveEventKey(QR_SECRET, g.events.id)
        const eventEnd = g.events.date_end ? new Date(g.events.date_end) : null
        const exp = eventEnd
          ? Math.floor(eventEnd.getTime() / 1000) + 86400
          : Math.floor(Date.now() / 1000) + 365 * 86400

        const payload = {
          gid: g.id,
          eid: g.events.id,
          name: g.name ?? g.email ?? 'Guest',
          days: g.ticket_days ?? null,
          status: g.status,
          iat: Math.floor(Date.now() / 1000),
          exp,
        }
        qrToken = await signQRPayload(payload, key)
        await (supabase as any)
          .from('guests')
          .update({ qr_token: qrToken, qr_token_generated_at: new Date().toISOString() })
          .eq('id', g.id)
      } catch { /* non-critical */ }
    }

    return { ...g, qr_token: qrToken }
  }))

  return Response.json({ tickets })
}
