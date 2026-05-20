'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'

/**
 * Reads the role from the user's auth JWT metadata (set at signUp, server-trusted)
 * and upserts the profile row using the service-role client.
 *
 * This bypasses the protect_profile_role trigger (which only fires for
 * 'authenticated'/'anon' roles, not 'service_role') so it can correct
 * an existing profile that has the wrong role — e.g. 'guest' for an organizer.
 *
 * Safe because:
 *  - The role is read from the server-side session JWT, not from user input
 *  - Only 'organizer' and 'guest' are accepted
 *  - The caller must be authenticated (getUser() validates the JWT)
 */
export async function ensureProfileRole() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const metaRole = user.user_metadata?.role as string | undefined
  if (!metaRole || !['organizer', 'guest'].includes(metaRole)) {
    return { error: 'No valid role in auth metadata' }
  }

  const admin = createAdminClient()
  const { error } = await admin.from('profiles').upsert({
    id:        user.id,
    email:     user.email ?? '',
    full_name: user.user_metadata?.full_name ?? '',
    role:      metaRole,
  }, { onConflict: 'id' })

  if (error) return { error: error.message }
  return { role: metaRole }
}
