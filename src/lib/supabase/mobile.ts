import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

/**
 * Creates a Supabase client authenticated with a Bearer JWT from a mobile client.
 * Validates the token and returns the client + user, or null if invalid.
 */
export async function createMobileClient(authHeader: string | null): Promise<{
  supabase: ReturnType<typeof createClient<Database>>
  userId: string
} | null> {
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.slice(7)

  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    }
  )

  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return null

  return { supabase, userId: user.id }
}

export function mobileUnauthorized() {
  return Response.json({ error: 'Unauthorized' }, { status: 401 })
}

export function mobileBadRequest(message: string) {
  return Response.json({ error: message }, { status: 400 })
}
