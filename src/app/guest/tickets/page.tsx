import { PageHeader } from '@/components/kit'
import TicketsClient from '@/components/attendee/TicketsClient'
import ModuleBookings from '@/components/attendee/ModuleBookings'
import { loadBookings, loadTickets } from '@/lib/attendee'
import { requireAttendee } from '@/lib/data/viewer'

export const metadata = { title: 'My tickets' }

export default async function TicketsPage() {
  const { supabase, profile } = await requireAttendee()
  const [t, b] = await Promise.all([loadTickets(supabase, profile.id), loadBookings(supabase, profile.id)])
  return (
    <div className="k-fade-up">
      <PageHeader title="My tickets" description="Live tickets, your collection and the nights you missed." />
      <TicketsClient upcoming={t.upcoming} collection={t.collection} closed={t.closed} />
      <ModuleBookings rows={b.rows} retreats={b.retreats} />
    </div>
  )
}
