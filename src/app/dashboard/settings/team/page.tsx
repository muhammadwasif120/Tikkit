import TeamAccess from '@/components/settings/TeamAccess'
import { requireOrganizer } from '@/lib/data/viewer'

export const metadata = { title: 'Team access' }

export default async function TeamSettings() {
  const { supabase, profile, entitlements } = await requireOrganizer()
  const { data } = await supabase.from('organizer_team_members').select('id, email, status, invited_at').eq('organizer_id', profile.id).order('invited_at', { ascending: false })
  const lim = entitlements?.limits.team_members
  return <TeamAccess members={((data ?? []) as { id: string; email: string; status: string; invited_at: string }[]).map(m => ({ id: m.id, email: m.email, status: m.status, invitedAt: m.invited_at }))} limit={typeof lim === 'number' ? (lim < 0 ? null : lim) : 0} />
}
