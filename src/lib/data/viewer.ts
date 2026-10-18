import 'server-only'
import { cache } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type Entitlements = {
  state: 'trial' | 'active' | 'grace' | 'expired' | 'cancelled'
  plan_id: string
  trial_ends_at: string | null
  current_period_end: string | null
  limits: Record<string, number | boolean>
  usage: Record<string, number>
}

/** Signed in user with their profile. Cached per request. */
export const getViewer = cache(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, full_name, username, avatar_url, city, ui_theme, is_complete')
    .eq('id', user.id)
    .maybeSingle()
  if (!profile) return null

  return { user, profile, supabase }
})

/**
 * For organizer pages. Owners (and admins) act as themselves. An active team manager acts
 * for the organizer who invited them: orgId is that organizer, isManager is true.
 */
export const requireOrganizer = cache(async () => {
  const viewer = await getViewer()
  if (!viewer) redirect('/auth/login')
  const { supabase, profile } = viewer
  const isOwner = profile.role === 'organizer' || profile.role === 'admin'

  let orgId = profile.id
  if (!isOwner) {
    const { data: m } = await supabase.from('organizer_team_members').select('organizer_id')
      .eq('user_id', profile.id).eq('status', 'active').limit(1).maybeSingle()
    if (!m) redirect('/guest/explore')
    orgId = m.organizer_id
  }
  const isManager = !isOwner

  if (isManager) {
    const [{ data: op }, { count: pending }] = await Promise.all([
      supabase.from('public_organizers').select('company_name, logo_url').eq('id', orgId).maybeSingle(),
      supabase.from('registrations').select('id, events!inner(organizer_id)', { count: 'exact', head: true })
        .eq('events.organizer_id', orgId).in('status', ['requested', 'payment_submitted']),
    ])
    return { ...viewer, orgId, isManager, company: op?.company_name ?? null, logoUrl: op?.logo_url ?? null, entitlements: null as Entitlements | null, pendingCount: pending ?? 0 }
  }

  const [{ data: op }, { data: ent }, { count: pending }] = await Promise.all([
    supabase.from('organizer_profiles').select('company_name, logo_url').eq('id', profile.id).maybeSingle(),
    supabase.rpc('my_entitlements'),
    supabase.from('registrations').select('id', { count: 'exact', head: true }).in('status', ['requested', 'payment_submitted']),
  ])
  return {
    ...viewer, orgId, isManager,
    company: op?.company_name ?? null, logoUrl: op?.logo_url ?? null,
    entitlements: (ent ?? null) as Entitlements | null, pendingCount: pending ?? 0,
  }
})

/** Owner only pages (billing, settings, referrals, new events, modules). Managers go back to the overview. */
export const requireOwner = cache(async () => {
  const org = await requireOrganizer()
  if (org.isManager) redirect('/dashboard')
  return org
})

/** For attendee pages. */
export const requireAttendee = cache(async () => {
  const viewer = await getViewer()
  if (!viewer) redirect('/auth/login')
  if (viewer.profile.role === 'organizer') redirect('/dashboard')
  if (viewer.profile.role === 'admin') redirect('/master')
  return viewer
})

export function planLabel(e: Entitlements | null): { label: string; note: string; tone: 'accent' | 'warning' | 'danger' } {
  if (!e) return { label: 'No plan', note: 'Choose a plan', tone: 'warning' }
  const name = e.plan_id === 'trial' ? 'Free trial' : e.plan_id.charAt(0).toUpperCase() + e.plan_id.slice(1)
  if (e.state === 'trial' && e.trial_ends_at) {
    const days = Math.max(0, Math.ceil((new Date(e.trial_ends_at).getTime() - Date.now()) / 86_400_000))
    return { label: name, note: `${days} days left`, tone: days <= 3 ? 'warning' : 'accent' }
  }
  if (e.state === 'expired') return { label: name, note: 'Expired', tone: 'danger' }
  if (e.state === 'grace') return { label: name, note: 'Renew now', tone: 'warning' }
  if (e.state === 'cancelled') return { label: name, note: 'Cancelled', tone: 'warning' }
  return { label: name, note: 'Active', tone: 'accent' }
}
