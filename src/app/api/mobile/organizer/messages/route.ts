import { createMobileClient, mobileUnauthorized } from '@/lib/supabase/mobile'
import { NextRequest } from 'next/server'

async function authorize(authHeader: string | null) {
  const auth = await createMobileClient(authHeader)
  if (!auth) return null
  const { supabase, userId } = auth
  const { data: profile } = await (supabase as any)
    .from('profiles').select('role, full_name').eq('id', userId).single()
  if (!profile) return null
  return { supabase, userId, profile }
}

export async function GET(req: NextRequest) {
  const auth = await authorize(req.headers.get('Authorization'))
  if (!auth) return mobileUnauthorized()
  const { supabase, userId } = auth

  const { data: messages, error } = await (supabase as any)
    .from('support_messages')
    .select('id, message, sender, created_at, user_name')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ messages: messages ?? [] })
}

export async function POST(req: NextRequest) {
  const auth = await authorize(req.headers.get('Authorization'))
  if (!auth) return mobileUnauthorized()
  const { supabase, userId, profile } = auth

  const { message } = await req.json()
  if (!message?.trim()) return Response.json({ error: 'message required' }, { status: 400 })

  const { data: msg, error } = await (supabase as any)
    .from('support_messages')
    .insert({
      user_id: userId,
      user_name: profile.full_name ?? 'Organizer',
      user_type: profile.role === 'guest' ? 'attendee' : 'organizer',
      message: message.trim(),
      sender: 'user',
    })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ message: msg }, { status: 201 })
}
