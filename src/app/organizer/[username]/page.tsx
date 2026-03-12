import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PublicOrganizerProfile, {
  type PublicProfile,
  type PublicEvent,
} from '@/components/organizer/PublicOrganizerProfile'
import SkeletonEventDetail from '@/components/guest/SkeletonEventDetail'

async function OrganizerData({ username }: { username: string }) {
  const supabase = await createClient()

  // 1. Fetch profile by username
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, email, company_name, phone_number, logo_url, cover_image_url, username, created_at')
    .eq('username', username)
    .single()

  if (!profile) notFound()

  // 2. Fetch published + completed events
  const { data: eventsData } = await supabase
    .from('events')
    .select('id, title, date_start, cover_image_url, venue_name, capacity, status')
    .eq('organizer_id', profile.id)
    .in('status', ['published', 'completed'])
    .order('date_start', { ascending: false })

  const events = eventsData ?? []
  const eventIds = events.map(e => e.id)

  // 3. Batch guest counts via security-definer RPC (bypasses RLS safely)
  const guestCountMap: Record<string, number> = {}
  if (eventIds.length > 0) {
    const { data: counts } = await supabase
      .rpc('get_public_event_guest_counts', { p_event_ids: eventIds })
    for (const row of counts ?? []) {
      guestCountMap[row.event_id] = Number(row.guest_count)
    }
  }

  const enrichedEvents: PublicEvent[] = events.map(ev => ({
    id:              ev.id,
    title:           ev.title,
    date_start:      ev.date_start,
    cover_image_url: ev.cover_image_url ?? null,
    venue_name:      ev.venue_name      ?? null,
    capacity:        ev.capacity,
    status:          ev.status,
    guest_count:     guestCountMap[ev.id] ?? 0,
  }))

  const publicProfile: PublicProfile = {
    id:              profile.id,
    full_name:       profile.full_name       ?? null,
    email:           profile.email,
    phone_number:    profile.phone_number    ?? null,
    company_name:    profile.company_name    ?? null,
    cover_image_url: profile.cover_image_url ?? null,
    logo_url:        profile.logo_url        ?? null,
    username:        profile.username        ?? null,
    created_at:      profile.created_at,
  }

  return <PublicOrganizerProfile profile={publicProfile} events={enrichedEvents} />
}

export default async function OrganizerProfilePage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  return (
    <Suspense fallback={<SkeletonEventDetail />}>
      <OrganizerData username={username} />
    </Suspense>
  )
}
