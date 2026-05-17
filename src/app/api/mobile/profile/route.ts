import { createMobileClient, mobileUnauthorized, mobileBadRequest } from '@/lib/supabase/mobile'
import { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  const auth = await createMobileClient(req.headers.get('Authorization'))
  if (!auth) return mobileUnauthorized()
  const { supabase, userId } = auth

  const { data: profile, error } = await (supabase as any)
    .from('profiles')
    .select('id, full_name, email, role, avatar_url, username')
    .eq('id', userId)
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })

  // Also fetch guest_profiles if role is guest
  let guestProfile = null
  if (profile?.role === 'guest') {
    const { data } = await supabase
      .from('guest_profiles')
      .select('credits_balance, tier_level, signup_date')
      .eq('id', userId)
      .maybeSingle()
    guestProfile = data
  }

  return Response.json({ profile, guest_profile: guestProfile })
}

export async function PATCH(req: NextRequest) {
  const auth = await createMobileClient(req.headers.get('Authorization'))
  if (!auth) return mobileUnauthorized()
  const { supabase, userId } = auth

  const body = await req.json().catch(() => null)
  if (!body) return mobileBadRequest('Invalid JSON')

  const allowed = ['full_name', 'avatar_url', 'city'] as const
  const updates: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) updates[key] = body[key]
  }

  if (Object.keys(updates).length === 0) return mobileBadRequest('No valid fields to update')

  const { data, error } = await (supabase as any)
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select('id, full_name, email, role, avatar_url, city')
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ profile: data })
}
