import { createMobileClient, mobileUnauthorized } from '@/lib/supabase/mobile'
import { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  const auth = await createMobileClient(req.headers.get('Authorization'))
  if (!auth) return mobileUnauthorized()
  const { supabase, userId } = auth

  const [{ data: guestProfile }, { data: transactions }] = await Promise.all([
    (supabase as any)
      .from('guest_profiles')
      .select('credits_balance, tier_level')
      .eq('id', userId)
      .maybeSingle(),
    (supabase as any)
      .from('credit_transactions')
      .select('id, points, type, description, created_at, event_id, events(title)')
      .eq('guest_profile_id', userId)
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  return Response.json({
    balance: guestProfile?.credits_balance ?? 0,
    tier: guestProfile?.tier_level ?? 'bronze',
    transactions: transactions ?? [],
  })
}
