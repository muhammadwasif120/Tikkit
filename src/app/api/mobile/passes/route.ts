import { createMobileClient, mobileUnauthorized } from '@/lib/supabase/mobile'
import { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  const auth = await createMobileClient(req.headers.get('Authorization'))
  if (!auth) return mobileUnauthorized()
  const { supabase, userId } = auth

  const { data: passes, error } = await (supabase as any)
    .from('event_passes')
    .select(`
      id, pass_type, qr_token, issued_at, metadata,
      event:events(id, title, date_start, date_end, cover_image_url, venue_name, venue_city)
    `)
    .eq('guest_id', userId)
    .order('issued_at', { ascending: false })

  if (error) return Response.json({ error: error.message }, { status: 500 })

  const oneDayAgo = new Date(Date.now() - 86400000).toISOString()
  const newPassIds = (passes ?? [])
    .filter((p: any) => p.issued_at >= oneDayAgo)
    .map((p: any) => p.id)

  return Response.json({ passes: passes ?? [], newPassIds })
}
