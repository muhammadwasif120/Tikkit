import { createMobileClient, mobileUnauthorized } from '@/lib/supabase/mobile'
import { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  const auth = await createMobileClient(req.headers.get('Authorization'))
  if (!auth) return mobileUnauthorized()
  const { supabase, userId } = auth

  const { searchParams } = new URL(req.url)
  const unreadOnly = searchParams.get('unread') === 'true'
  const page = parseInt(searchParams.get('page') ?? '0')

  let query = (supabase as any)
    .from('notifications')
    .select('id, type, title, body, data, created_at, read_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(page * 30, (page + 1) * 30 - 1)

  if (unreadOnly) query = query.is('read_at', null)

  const { data, error } = await query
  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ notifications: data ?? [] })
}

export async function PATCH(req: NextRequest) {
  const auth = await createMobileClient(req.headers.get('Authorization'))
  if (!auth) return mobileUnauthorized()
  const { supabase, userId } = auth

  // Mark all as read
  await (supabase as any)
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('read_at', null)

  return Response.json({ ok: true })
}
