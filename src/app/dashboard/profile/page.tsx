import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import OrganizerProfileClient, { type EventWithStats } from '@/components/dashboard/OrganizerProfileClient'
import DashboardLoader from '@/components/layout/DashboardLoader'

async function ProfileData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Separate queries avoid Supabase TS tuple-inference issues with Promise.all
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/auth/login')

  const { data: eventsData } = await supabase
    .from('events')
    .select('id, title, date_start, cover_image_url, venue_name, capacity, status')
    .eq('organizer_id', user.id)
    .order('date_start', { ascending: false })

  const events = eventsData ?? []
  const eventIds = events.map(e => e.id)

  // Fetch all guests for all events in one batch query (no N+1)
  let allGuests: { event_id: string; status: string }[] = []
  if (eventIds.length > 0) {
    const { data } = await supabase
      .from('guests')
      .select('event_id, status')
      .in('event_id', eventIds)
    allGuests = data ?? []
  }

  // Count per event in JS
  const guestMap: Record<string, { total: number; checked_in: number }> = {}
  for (const g of allGuests) {
    if (!guestMap[g.event_id]) guestMap[g.event_id] = { total: 0, checked_in: 0 }
    guestMap[g.event_id].total++
    if (g.status === 'checked_in') guestMap[g.event_id].checked_in++
  }

  const enrichedEvents: EventWithStats[] = events.map(ev => ({
    ...ev,
    guest_count:     guestMap[ev.id]?.total    ?? 0,
    checked_in_count: guestMap[ev.id]?.checked_in ?? 0,
  }))

  return (
    <OrganizerProfileClient
      profile={{
        id:           profile.id,
        full_name:    profile.full_name    ?? null,
        email:        profile.email        ?? user.email ?? '',
        avatar_url:   profile.avatar_url   ?? null,
        phone_number: profile.phone_number ?? null,
        company_name: profile.company_name ?? null,
      }}
      events={enrichedEvents}
    />
  )
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<DashboardLoader variant="detail" />}>
      <ProfileData />
    </Suspense>
  )
}
