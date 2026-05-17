import { createMobileClient, mobileUnauthorized, mobileBadRequest } from '@/lib/supabase/mobile'
import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  const auth = await createMobileClient(req.headers.get('Authorization'))
  if (!auth) return mobileUnauthorized()
  const { supabase, userId } = auth

  const body = await req.json().catch(() => null)
  if (!body) return mobileBadRequest('Invalid JSON')

  const { token, platform } = body
  if (!token) return mobileBadRequest('Missing token')
  if (!['ios', 'android', 'web'].includes(platform)) return mobileBadRequest('Invalid platform')

  const { error } = await (supabase as any)
    .from('push_tokens')
    .upsert(
      { user_id: userId, token, platform, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,token' }
    )

  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const auth = await createMobileClient(req.headers.get('Authorization'))
  if (!auth) return mobileUnauthorized()
  const { supabase, userId } = auth

  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token')
  if (!token) return mobileBadRequest('Missing token')

  await (supabase as any)
    .from('push_tokens')
    .delete()
    .eq('user_id', userId)
    .eq('token', token)

  return Response.json({ ok: true })
}
