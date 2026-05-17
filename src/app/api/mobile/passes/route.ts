import { createMobileClient, mobileUnauthorized } from '@/lib/supabase/mobile'
import { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  const auth = await createMobileClient(req.headers.get('Authorization'))
  if (!auth) return mobileUnauthorized()
  const { supabase } = auth

  // event_passes table does not exist in the current schema.
  // Passes are surfaced via the tickets endpoint (guests table + qr_token).
  // Return empty array so the mobile passes screen degrades gracefully.
  return Response.json({ passes: [], newPassIds: [] })
}
