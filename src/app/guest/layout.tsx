import AttendeeShell from '@/components/attendee/AttendeeShell'
import { requireAttendee } from '@/lib/data/viewer'

export default async function GuestLayout({ children }: { children: React.ReactNode }) {
  const { supabase, profile } = await requireAttendee()
  const [{ count }, { data: team }] = await Promise.all([
    supabase.from('notifications').select('id', { count: 'exact', head: true }).is('read_at', null),
    supabase.from('organizer_team_members').select('id').eq('user_id', profile.id).eq('status', 'active').limit(1).maybeSingle(),
  ])
  return <AttendeeShell name={profile.full_name ?? 'Guest'} avatarUrl={profile.avatar_url} unread={count ?? 0} isManager={!!team}>{children}</AttendeeShell>
}
