'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { encrypt } from '@/lib/encrypt'

export type CompleteProfileInput = {
  phone: string
  idType: 'cnic' | 'passport'
  idNumber: string
  country: string
  city: string
  company?: string   // organizer only
  dob?: string        // guest only
  gender?: string      // guest only
}

/**
 * Writes the mandatory signup fields (phone, ID, city, and role-specific
 * fields).
 *
 * Two ways to authorize the call:
 *  1. A real session (the normal case — the complete-profile page is only
 *     reachable while logged in, and signUp() returns a session immediately
 *     when email confirmation is off).
 *  2. `bootstrapUserId` — used ONLY when there is no session yet, i.e. right
 *     after signUp() with email confirmation pending. This is deliberately
 *     narrow: it's only accepted for a freshly-created auth user (<10 min
 *     old) whose profile has no phone_number yet. That means it can only ever
 *     "claim" a brand-new, still-incomplete profile — never overwrite an
 *     already-completed one — so a guessed/replayed id can't be used to
 *     tamper with someone else's account. UUIDs aren't practically guessable
 *     anyway, but this keeps the endpoint safe even if one ever leaked.
 *
 * Writes go through the service-role client either way, so the actual insert
 * never depends on session state. Never trust a role passed by the client:
 * it's re-read from the trigger-protected profiles.role column.
 */
export async function completeSignupProfile(
  input: CompleteProfileInput,
  bootstrapUserId?: string
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const { data: { user: sessionUser } } = await supabase.auth.getUser()
  const admin = createAdminClient()

  let userId: string
  if (sessionUser) {
    userId = sessionUser.id
  } else if (bootstrapUserId) {
    const { data: authRow } = await admin.auth.admin.getUserById(bootstrapUserId)
    const createdAt = authRow?.user?.created_at ? new Date(authRow.user.created_at) : null
    const isFresh = createdAt ? Date.now() - createdAt.getTime() < 10 * 60 * 1000 : false
    if (!isFresh) return { error: 'Not authenticated' }

    const { data: existingProfile } = await admin
      .from('profiles').select('phone_number').eq('id', bootstrapUserId).single()
    if ((existingProfile as any)?.phone_number) return { error: 'Not authenticated' }

    userId = bootstrapUserId
  } else {
    return { error: 'Not authenticated' }
  }

  const { data: existing } = await admin
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  const role = existing?.role
  if (role !== 'organizer' && role !== 'guest') {
    return { error: 'Profile completion is not applicable for this account type' }
  }

  // Server-side validation — the client form also validates, but a request
  // can bypass client JS entirely, so mandatory fields are enforced here too.
  const phone    = input.phone?.trim()
  const idNumber = input.idNumber?.trim()
  const city     = input.city?.trim()

  if (!phone)    return { error: 'Phone number is required' }
  if (!idNumber) return { error: input.idType === 'passport' ? 'Passport number is required' : 'CNIC is required' }
  if (!city)     return { error: 'City is required' }

  if (role === 'organizer' && !input.company?.trim()) {
    return { error: 'Company or brand name is required' }
  }
  if (role === 'guest' && (!input.dob || !input.gender)) {
    return { error: 'Date of birth and gender are required' }
  }

  const { error: profileErr } = await admin
    .from('profiles')
    .update({
      phone_number:    phone,
      company_name:    role === 'organizer' ? input.company!.trim() : null,
      id_type:         input.idType,
      // CNIC is encrypted at rest (matches the dedicated CNIC verification
      // flow in cnicActions.ts). Passport is stored as-is — there is no
      // encrypted-passport flow elsewhere in the codebase to match yet.
      cnic_number:     input.idType === 'cnic'     ? encrypt(idNumber) : null,
      passport_number: input.idType === 'passport' ? idNumber          : null,
      country:         input.country || 'Pakistan',
      city,
    } as any)
    .eq('id', userId)

  if (profileErr) {
    console.error('completeSignupProfile: profiles update failed:', profileErr.message)
    return { error: 'Could not save your details. Please try again.' }
  }

  if (role === 'guest') {
    const { error: gpErr } = await admin
      .from('guest_profiles')
      .upsert({
        id:            userId,
        date_of_birth: input.dob,
        gender:        input.gender,
      } as any, { onConflict: 'id', ignoreDuplicates: false })

    if (gpErr) {
      console.error('completeSignupProfile: guest_profiles upsert failed:', gpErr.message)
      return { error: 'Could not save your details. Please try again.' }
    }
  }

  return { success: true }
}

/**
 * Loads the authenticated user's role + current profile fields, for
 * prefilling the complete-profile form and (if the caller wants it)
 * determining completeness.
 */
export async function getProfileForCompletion(): Promise<{
  role: 'organizer' | 'guest' | null
  phone_number: string | null
  city: string | null
  country: string | null
  company_name: string | null
  id_type: string | null
  hasIdOnFile: boolean
  dob: string | null
  gender: string | null
} | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('role, phone_number, city, country, company_name, id_type, cnic_number, passport_number')
    .eq('id', user.id)
    .single()

  if (!profile || (profile.role !== 'organizer' && profile.role !== 'guest')) return null

  let dob: string | null = null
  let gender: string | null = null
  if (profile.role === 'guest') {
    const { data: gp } = await admin
      .from('guest_profiles')
      .select('date_of_birth, gender')
      .eq('id', user.id)
      .maybeSingle()
    dob = (gp as any)?.date_of_birth ?? null
    gender = (gp as any)?.gender ?? null
  }

  return {
    role:         profile.role as 'organizer' | 'guest',
    phone_number: profile.phone_number,
    city:         profile.city,
    country:      profile.country,
    company_name: profile.company_name,
    id_type:      profile.id_type,
    hasIdOnFile:  !!(profile.cnic_number || profile.passport_number),
    dob,
    gender,
  }
}
