import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import GuestsPageClient from '@/components/guests/GuestsPageClient'
import DashboardLoader from '@/components/layout/DashboardLoader'

async function GuestsData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: events } = await supabase
    .from('events')
    .select('id, title, status')
    .eq('organizer_id', user!.id)
    .order('date_start', { ascending: false })

  const eventIds = events?.map(e => e.id) ?? []

  const { data: guests } = await supabase
    .from('guests')
    .select('*')
    .in('event_id', eventIds.length > 0 ? eventIds : ['none'])
    .order('created_at', { ascending: false })

  return (
    <GuestsPageClient
      events={events ?? []}
      initialGuests={guests ?? []}
    />
  )
}

export default function GuestsPage() {
  return (
    <Suspense fallback={<DashboardLoader variant="list" />}>
      <GuestsData />
    </Suspense>
  )
}