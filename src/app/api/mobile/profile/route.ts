import { createMobileClient, mobileUnauthorized, mobileBadRequest } from '@/lib/supabase/mobile'
import { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  const auth = await createMobileClient(req.headers.get('Authorization'))
  if (!auth) return mobileUnauthorized()
  const { supabase, userId } = auth

  // Core profile — confirmed columns only
  const { data: profile, error } = await (supabase as any)
    .from('profiles')
    .select('id, full_name, email, role, avatar_url, username, phone_number, company_name, city, notification_preferences')
    .eq('id', userId)
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })

  let guestExtras: Record<string, any> = {}

  if (profile?.role === 'guest') {
    // guest_profiles — bio + social_credits are confirmed; others may exist if migrations ran
    const { data: gp } = await (supabase as any)
      .from('guest_profiles')
      .select('bio, social_credits, instagram_handle, is_discoverable, notification_prefs')
      .eq('id', userId)
      .maybeSingle()

    // Count attended events
    const { count: attendedCount } = await (supabase as any)
      .from('public_registrations')
      .select('id', { count: 'exact', head: true })
      .eq('email', profile.email)
      .in('status', ['approved', 'checked_in'])

    // Count pending / active registrations
    const { count: activeCount } = await (supabase as any)
      .from('public_registrations')
      .select('id', { count: 'exact', head: true })
      .eq('email', profile.email)
      .in('status', ['pending', 'approved'])

    guestExtras = {
      bio: gp?.bio ?? null,
      social_credits: gp?.social_credits ?? 0,
      instagram_handle: gp?.instagram_handle ?? null,
      is_discoverable: gp?.is_discoverable ?? true,
      notification_prefs: gp?.notification_prefs ?? {
        registration_updates: true,
        payment_reminders: true,
        event_reminders: true,
      },
      attended_count: attendedCount ?? 0,
      active_count: activeCount ?? 0,
    }
  }

  return Response.json({ profile, guest_extras: guestExtras })
}

export async function PATCH(req: NextRequest) {
  const auth = await createMobileClient(req.headers.get('Authorization'))
  if (!auth) return mobileUnauthorized()
  const { supabase, userId } = auth

  const body = await req.json().catch(() => null)
  if (!body) return mobileBadRequest('Invalid JSON')

  // ── Profiles table fields ──────────────────────────────────────────────────
  const profileAllowed = ['full_name', 'avatar_url', 'city', 'phone_number', 'company_name', 'username', 'notification_preferences'] as const
  const profileUpdates: Record<string, unknown> = {}
  for (const key of profileAllowed) {
    if (key in body) profileUpdates[key] = body[key]
  }

  // ── guest_profiles table fields ────────────────────────────────────────────
  const guestAllowed = ['bio', 'instagram_handle', 'is_discoverable', 'notification_prefs'] as const
  const guestUpdates: Record<string, unknown> = {}
  for (const key of guestAllowed) {
    if (key in body) guestUpdates[key] = body[key]
  }

  // Username uniqueness check
  if (profileUpdates.username) {
    const { data: existing } = await (supabase as any)
      .from('profiles')
      .select('id')
      .eq('username', profileUpdates.username)
      .neq('id', userId)
      .maybeSingle()
    if (existing) return Response.json({ error: 'Username already taken' }, { status: 409 })
  }

  // Apply profiles update
  let updatedProfile: any = null
  if (Object.keys(profileUpdates).length > 0) {
    const { data, error } = await (supabase as any)
      .from('profiles')
      .update({ ...profileUpdates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select('id, full_name, email, role, avatar_url, username, phone_number, company_name, city, notification_preferences')
      .single()
    if (error) return Response.json({ error: error.message }, { status: 500 })
    updatedProfile = data
  }

  // Apply guest_profiles update (upsert)
  if (Object.keys(guestUpdates).length > 0) {
    await (supabase as any)
      .from('guest_profiles')
      .upsert({ id: userId, ...guestUpdates, updated_at: new Date().toISOString() })
  }

  return Response.json({ profile: updatedProfile, ok: true })
}

// ── DELETE: soft-delete account ──────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const auth = await createMobileClient(req.headers.get('Authorization'))
  if (!auth) return mobileUnauthorized()
  const { supabase, userId } = auth

  // Soft delete — anonymise personal data, keep records for analytics
  await (supabase as any)
    .from('profiles')
    .update({ full_name: 'Deleted User', avatar_url: null, phone_number: null })
    .eq('id', userId)

  await (supabase as any)
    .from('guest_profiles')
    .upsert({ id: userId, bio: null, instagram_handle: null, is_discoverable: false })
    .catch(() => {})

  // Sign out (invalidates session; user flow ends here)
  await supabase.auth.signOut()

  return Response.json({ ok: true })
}
