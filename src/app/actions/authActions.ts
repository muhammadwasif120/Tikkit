'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'

// Roles the auth metadata can legitimately carry
const ALL_ROLES    = ['organizer', 'guest', 'admin', 'staff'] as const
// Roles the login form is allowed to suggest as a hint
// (admin / staff can ONLY come from auth metadata, never from a form selection)
const HINT_ROLES   = ['organizer', 'guest'] as const

type AnyRole  = typeof ALL_ROLES[number]
type HintRole = typeof HINT_ROLES[number]

/**
 * Guarantees the profiles row has the correct role.
 *
 * Priority order:
 *   1. raw_user_meta_data from auth.users (via admin client — bypasses JWT cache)
 *   2. hintRole — form selection, only used when metadata has NO role at all
 *      and only for 'organizer' / 'guest' (admin/staff can't be self-claimed)
 *
 * Writes via service-role, bypassing protect_profile_role trigger.
 * Back-fills metadata so future logins need no hint.
 */
export async function ensureProfileRole(hintRole?: HintRole) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const admin = createAdminClient()

  // Read raw auth.users row — more reliable than the session JWT
  const { data: authData } = await admin.auth.admin.getUserById(user.id)
  const authUser = authData?.user
  const rawMeta  = authUser?.user_metadata ?? {}
  const metaRole = rawMeta.role as string | undefined

  // Determine target role
  let targetRole: AnyRole | undefined

  if (metaRole && (ALL_ROLES as readonly string[]).includes(metaRole)) {
    // Metadata has a valid role — always trust it (covers admin/staff too)
    targetRole = metaRole as AnyRole
  } else if (hintRole && (HINT_ROLES as readonly string[]).includes(hintRole)) {
    // Metadata absent — use form hint (organizer/guest only, never admin/staff)
    targetRole = hintRole
  }

  if (!targetRole) return { error: 'Cannot determine correct role' }

  // Upsert the profile (creates if missing, corrects role if wrong)
  const { error: upsertError } = await admin.from('profiles').upsert({
    id:        user.id,
    email:     authUser?.email ?? user.email ?? '',
    full_name: rawMeta.full_name ?? authUser?.email?.split('@')[0] ?? '',
    role:      targetRole,
  }, { onConflict: 'id' })

  if (upsertError) return { error: upsertError.message }

  // Back-fill metadata so future logins need no hint
  if (!metaRole || !(ALL_ROLES as readonly string[]).includes(metaRole)) {
    await admin.auth.admin.updateUserById(user.id, {
      user_metadata: { ...rawMeta, role: targetRole },
    })
  }

  return { role: targetRole }
}
