import { createMobileClient, mobileUnauthorized } from '@/lib/supabase/mobile'
import { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  const auth = await createMobileClient(req.headers.get('Authorization'))
  if (!auth) return mobileUnauthorized()
  const { supabase, userId } = auth

  const { data: profile, error } = await (supabase as any)
    .from('profiles')
    .select('cnic_status, cnic_number, full_name, role')
    .eq('id', userId)
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({
    status: profile?.cnic_status ?? 'unverified',
    cnic_number: profile?.cnic_number ?? null,
  })
}
