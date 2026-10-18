import { PageHeader } from '@/components/kit'
import NotificationsClient from '@/components/attendee/NotificationsClient'
import { requireAttendee } from '@/lib/data/viewer'

export const metadata = { title: 'Notifications' }

export default async function NotificationsPage() {
  const { supabase, profile } = await requireAttendee()
  const { data } = await supabase.from('notifications').select('id, type, title, body, read_at, created_at, events(slug)').eq('user_id', profile.id).order('created_at', { ascending: false }).limit(60)
  return (
    <div className="k-fade-up">
      <PageHeader title="Notifications" description="Updates from organizers and your tickets." />
      <NotificationsClient notes={(data ?? []).map(n => ({ id: n.id, type: n.type, title: n.title, body: n.body, readAt: n.read_at, createdAt: n.created_at, href: n.events?.slug ? `/events/${n.events.slug}` : '/guest/tickets' }))} />
    </div>
  )
}
