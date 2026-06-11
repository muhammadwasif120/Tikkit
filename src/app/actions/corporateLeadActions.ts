'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export type CorporateLeadPayload = {
  full_name: string
  company: string
  role: string
  email: string
  phone?: string
  event_type: string
  headcount: string
  message?: string
}

export async function submitCorporateLead(payload: CorporateLeadPayload): Promise<{ error?: string }> {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )

  const { error } = await (supabase as any).from('corporate_leads').insert([payload])
  if (error) return { error: error.message }
  return {}
}
