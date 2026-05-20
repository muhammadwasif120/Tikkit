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
 *   2. Existing profiles.role (via admin client) — handles accounts whose role
 *      was set directly in the DB (e.g. admin bootstrapped via SQL) but whose
 *      auth metadata was never back-filled.  We trust it and back-fill metadata
 *      so future logins always hit path 1 instead.
 *   3. hintRole — form selection, only used when both metadata and existing
 *      profile have NO valid role, and only for 'organizer' / 'guest'
 *      (admin/staff can NEVER be self-claimed from a form).
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
    // Path 1: metadata has a valid role — always trust it (covers admin/staff too)
    targetRole = metaRole as AnyRole
  } else {
    // Path 2: metadata absent — read the existing profile row via service-role.
    // This handles accounts bootstrapped by SQL (e.g. manual admin setup) whose
    // auth metadata was never populated.  We read it, trust it, and back-fill
    // metadata below so next login always goes through path 1.
    const { data: existingProfile } = await admin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    const existingRole = existingProfile?.role as string | undefined

    if (existingRole && (ALL_ROLES as readonly string[]).includes(existingRole)) {
      targetRole = existingRole as AnyRole
    } else if (hintRole && (HINT_ROLES as readonly string[]).includes(hintRole)) {
      // Path 3: form hint — organizer/guest only, never admin/staff
      targetRole = hintRole
    }
  }

  if (!targetRole) return { error: 'Cannot determine correct role' }

  // Step 1: create the profile row if it doesn't exist yet.
  // ignoreDuplicates=true means we NEVER overwrite existing profile data
  // (name, phone, company, etc.) — only a fresh INSERT happens here.
  await admin.from('profiles').upsert({
    id:        user.id,
    email:     authUser?.email ?? user.email ?? '',
    full_name: rawMeta.full_name ?? authUser?.email?.split('@')[0] ?? '',
    role:      targetRole,
  }, { onConflict: 'id', ignoreDuplicates: true })

  // Step 2: fix ONLY the role column on the existing row.
  // This is the only field we're allowed to change here — all other profile
  // data (name, avatar, company, etc.) stays exactly as the user set it.
  const { error: updateError } = await admin
    .from('profiles')
    .update({ role: targetRole })
    .eq('id', user.id)

  if (updateError) return { error: updateError.message }

  // Back-fill metadata whenever it was absent or wrong, so future logins
  // always hit the fast path (metadata check) without needing DB/hint fallbacks.
  if (metaRole !== targetRole) {
    await admin.auth.admin.updateUserById(user.id, {
      user_metadata: { ...rawMeta, role: targetRole },
    })
  }

  return { role: targetRole }
}
