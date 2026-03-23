import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import EventsClient from '@/components/events/EventsClient'
import DashboardLoader from '@/components/layout/DashboardLoader'
import { sortEvents } from '@/lib/sortEvents'
import { syncEventStatuses } from '@/app/actions/eventStatusSync'

async function EventsData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  syncEventStatuses().catch(() => {})

  const { data: rawEvents } = await supabase
    .from('events')
    .select('*')
    .eq('organizer_id', user!.id)
  const events = sortEvents(rawEvents ?? [])

  const eventIds = events.map(e => e.id)

  // Fetch registrations that need organiser attention:
  //  • status = 'pending'           → EOI awaiting review
  //  • status = 'approved' + payment_status = 'submitted' → payment to confirm
  const { data: pendingRows } = await supabase
    .from('public_registrations')
    .select('event_id')
    .in('event_id', eventIds.length ? eventIds : ['none'])
    .or('status.eq.pending,and(status.eq.approved,payment_status.eq.submitted)')

  const pendingCounts: Record<string, number> = {}
  for (const row of (pendingRows ?? [])) {
    pendingCounts[row.event_id] = (pendingCounts[row.event_id] ?? 0) + 1
  }

  return <EventsClient initialEvents={events} pendingCounts={pendingCounts} />
}

export default function EventsPage() {
  return (
    <Suspense fallback={<DashboardLoader variant="list" />}>
      <EventsData />
    </Suspense>
  )
}
