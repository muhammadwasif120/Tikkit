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
 * Guarantees the profiles row has a role, without ever letting a caller
 * self-elevate to a privileged role.
 *
 * profiles.role is the authoritative source of truth (protected by the
 * protect_profile_role trigger). user_metadata is user-writable, so it may
 * NEVER be used to grant 'admin' or 'staff'. Privileged roles are established
 * only by setting profiles.role directly (SQL / service role by a human).
 *
 * Priority order:
 *   1. Existing profiles.role (via admin client) — always authoritative. If a
 *      valid role is already stored, we keep it and never overwrite it (covers
 *      admin/staff bootstrapped in the DB).
 *   2. metadata.role — accepted ONLY for non-privileged roles (guest/organizer),
 *      to back-fill a profile that has no role yet.
 *   3. hintRole — form selection, guest/organizer only.
 *
 * Writes via service-role, bypassing the trigger. Back-fills metadata to mirror
 * the resolved role (metadata is a mirror only — never trusted for privilege).
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

  // Path 1: existing profiles.role is authoritative — trust it, never overwrite.
  const { data: existingProfile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  const existingRole = existingProfile?.role as string | undefined

  if (existingRole && (ALL_ROLES as readonly string[]).includes(existingRole)) {
    targetRole = existingRole as AnyRole
  } else if (metaRole && (HINT_ROLES as readonly string[]).includes(metaRole)) {
    // Path 2: back-fill from metadata, but ONLY non-privileged roles.
    // admin/staff can never be granted from user-writable metadata.
    targetRole = metaRole as AnyRole
  } else if (hintRole && (HINT_ROLES as readonly string[]).includes(hintRole)) {
    // Path 3: form hint — organizer/guest only, never admin/staff
    targetRole = hintRole
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
