import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import OrganizerProfileClient, { type EventWithStats } from '@/components/dashboard/OrganizerProfileClient'
import DashboardLoader from '@/components/layout/DashboardLoader'

async function ProfileData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Fetch profile and all events in parallel
  const [profileRes, eventsRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, email, avatar_url, phone_number, company_name, cover_image_url, bio')
      .eq('id', user.id)
      .single(),
    supabase
      .from('events')
      .select('id, title, date_start, cover_image_url, venue_name, capacity, status')
      .eq('organizer_id', user.id)
      .order('date_start', { ascending: false }),
  ])

  const profile = profileRes.data
  if (!profile) redirect('/auth/login')

  const events = eventsRes.data ?? []
  const eventIds = events.map(e => e.id)

  // Fetch all guests for all events in one query (no N+1)
  const { data: allGuests } = eventIds.length > 0
    ? await supabase
        .from('guests')
        .select('event_id, status')
        .in('event_id', eventIds)
    : { data: [] }

  // Count per event
  const guestMap: Record<string, { total: number; checked_in: number }> = {}
  for (const g of allGuests ?? []) {
    if (!guestMap[g.event_id]) guestMap[g.event_id] = { total: 0, checked_in: 0 }
    guestMap[g.event_id].total++
    if (g.status === 'checked_in') guestMap[g.event_id].checked_in++
  }

  const enrichedEvents: EventWithStats[] = events.map(ev => ({
    ...ev,
    guest_count: guestMap[ev.id]?.total ?? 0,
    checked_in_count: guestMap[ev.id]?.checked_in ?? 0,
  }))

  return (
    <OrganizerProfileClient
      profile={{
        id:              profile.id,
        full_name:       profile.full_name       ?? null,
        email:           profile.email           ?? user.email ?? '',
        avatar_url:      profile.avatar_url      ?? null,
        phone_number:    profile.phone_number    ?? null,
        company_name:    profile.company_name    ?? null,
        cover_image_url: profile.cover_image_url ?? null,
        bio:             profile.bio             ?? null,
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
