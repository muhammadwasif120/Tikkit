import { createMobileClient, mobileUnauthorized } from '@/lib/supabase/mobile'
import { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  const auth = await createMobileClient(req.headers.get('Authorization'))
  if (!auth) return mobileUnauthorized()
  const { supabase, userId } = auth

  const { searchParams } = new URL(req.url)
  const unreadOnly = searchParams.get('unread') === 'true'
  const page = parseInt(searchParams.get('page') ?? '0')

  // Column corrections: `metadata` (not `data`), `read` boolean (not `read_at` timestamp)
  let query = (supabase as any)
    .from('notifications')
    .select('id, type, title, body, metadata, created_at, read')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(page * 30, (page + 1) * 30 - 1)

  if (unreadOnly) query = query.eq('read', false)

  const { data, error } = await query
  // Notifications table may not exist yet — degrade gracefully
  if (error) return Response.json({ notifications: [] })

  return Response.json({ notifications: data ?? [] })
}

export async function PATCH(req: NextRequest) {
  const auth = await createMobileClient(req.headers.get('Authorization'))
  if (!auth) return mobileUnauthorized()
  const { supabase, userId } = auth

  // `read` is boolean, not a timestamp column
  await (supabase as any)
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false)

  return Response.json({ ok: true })
}
