'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'

/**
 * Guarantees the profiles row has the correct role, using three layers:
 *
 * 1. Read the user's actual raw_user_meta_data from auth.users via the
 *    admin client — this is the most reliable source, unaffected by JWT
 *    expiry or missing metadata in the session token.
 * 2. If metadata has no role (accounts created before we added it), fall
 *    back to `hintRole` — the role the user selected in the form.
 * 3. Write via the service-role admin client, which bypasses the
 *    protect_profile_role trigger (that trigger only fires for
 *    'authenticated'/'anon', not 'service_role').
 *
 * Also back-fills the auth metadata role so future logins resolve
 * correctly without needing the hint.
 *
 * Security: hintRole is only used when metadata is truly absent.
 * If metadata explicitly says 'guest', hintRole='organizer' is ignored —
 * so a guest cannot use this to self-elevate.
 */
export async function ensureProfileRole(hintRole?: 'organizer' | 'guest') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const admin = createAdminClient()

  // Read the full auth.users row — more reliable than the session JWT
  const { data: authData } = await admin.auth.admin.getUserById(user.id)
  const authUser = authData?.user

  const rawMeta = authUser?.user_metadata ?? {}
  const metaRole = rawMeta.role as string | undefined

  // Determine the target role:
  // - Trust metadata when it has a valid role
  // - Fall back to hint ONLY when metadata has no role at all
  const VALID_ROLES = ['organizer', 'guest'] as const
  type ValidRole = typeof VALID_ROLES[number]

  const targetRole: ValidRole | undefined =
    metaRole && (VALID_ROLES as readonly string[]).includes(metaRole)
      ? metaRole as ValidRole
      : hintRole && (VALID_ROLES as readonly string[]).includes(hintRole)
        ? hintRole
        : undefined

  if (!targetRole) return { error: 'Cannot determine correct role' }

  // Upsert the profile (creates if missing, fixes role if wrong)
  const { error: upsertError } = await admin.from('profiles').upsert({
    id:        user.id,
    email:     authUser?.email ?? user.email ?? '',
    full_name: rawMeta.full_name ?? authUser?.email?.split('@')[0] ?? '',
    role:      targetRole,
  }, { onConflict: 'id' })

  if (upsertError) return { error: upsertError.message }

  // Back-fill metadata role so future logins work without a hint
  if (!metaRole || !(VALID_ROLES as readonly string[]).includes(metaRole)) {
    await admin.auth.admin.updateUserById(user.id, {
      user_metadata: { ...rawMeta, role: targetRole },
    })
  }

  return { role: targetRole }
}
