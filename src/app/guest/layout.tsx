import AttendeeShell from '@/components/attendee/AttendeeShell'
import { requireAttendee } from '@/lib/data/viewer'

export default async function GuestLayout({ children }: { children: React.ReactNode }) {
  const { supabase, profile } = await requireAttendee()
  const { count } = await supabase.from('notifications').select('id', { count: 'exact', head: true }).is('read_at', null)
  return <AttendeeShell name={profile.full_name ?? 'Guest'} avatarUrl={profile.avatar_url} unread={count ?? 0}>{children}</AttendeeShell>
}
