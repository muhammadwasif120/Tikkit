import { createMobileClient, mobileUnauthorized } from '@/lib/supabase/mobile'
import { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  const auth = await createMobileClient(req.headers.get('Authorization'))
  if (!auth) return mobileUnauthorized()
  const { supabase, userId } = auth

  // guest_profiles columns: id, social_credits (NOT credits_balance), no tier_level
  // credit_transactions table does not exist in current schema — return empty list
  const { data: guestProfile } = await (supabase as any)
    .from('guest_profiles')
    .select('social_credits')
    .eq('id', userId)
    .maybeSingle()

  return Response.json({
    balance: guestProfile?.social_credits ?? 0,
    tier: 'member',   // tier_level column doesn't exist; use static default
    transactions: [], // credit_transactions table not yet in schema
  })
}
