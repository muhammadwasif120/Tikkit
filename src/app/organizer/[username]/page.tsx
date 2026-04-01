import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import PublicOrganizerProfile, {
  type PublicProfile,
  type PublicEvent,
} from '@/components/organizer/PublicOrganizerProfile'
import SkeletonEventDetail from '@/components/guest/SkeletonEventDetail'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>
}): Promise<Metadata> {
  const { username } = await params
  const supabase = await createClient()

  const { data: rows } = await (supabase as any)
    .rpc('get_public_organizer_profile', { p_lookup: username })
  const profile = (rows as any[])?.[0] ?? null
  if (!profile) return { title: 'Organizer Not Found — Tikkit' }

  const displayName = profile.company_name || profile.full_name || username
  const canonicalUrl = `https://www.tikkitx.com/organizer/${username}`
  const description = `Discover events hosted by ${displayName} on Tikkit — Pakistan's premier event platform.`

  return {
    title: `${displayName} — Events on Tikkit`,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: `${displayName} — Events on Tikkit`,
      description,
      url: canonicalUrl,
      images: profile.logo_url || profile.cover_image_url
        ? [{ url: profile.logo_url || profile.cover_image_url, alt: displayName }]
        : [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Tikkit Event Organizer' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${displayName} — Events on Tikkit`,
      description,
      images: profile.logo_url || profile.cover_image_url
        ? [profile.logo_url || profile.cover_image_url]
        : ['/og-image.jpg'],
    },
  }
}

async function OrganizerData({ username }: { username: string }) {
  const supabase = await createClient()

  // 1. Fetch profile via SECURITY DEFINER RPC — bypasses RLS for public reads.
  //    Accepts either a username slug or a UUID (ID fallback for organizers
  //    who haven't set a username yet).
  const { data: rows } = await (supabase as any)
    .rpc('get_public_organizer_profile', { p_lookup: username })

  const profile = (rows as any[])?.[0] ?? null
  if (!profile) notFound()

  // 2. Fetch published + completed events
  const { data: eventsData } = await supabase
    .from('events')
    .select('id, slug, title, date_start, cover_image_url, venue_name, capacity, status')
    .eq('organizer_id', profile.id)
    .in('status', ['published', 'completed'])
    .order('date_start', { ascending: false })

  const events = eventsData ?? []
  const eventIds = events.map(e => e.id)

  // 3. Batch guest counts via security-definer RPC (bypasses RLS safely)
  //    Falls back to 0 gracefully if the function hasn't been created yet.
  const guestCountMap: Record<string, number> = {}
  if (eventIds.length > 0) {
    try {
      const { data: counts } = await supabase
        .rpc('get_public_event_guest_counts', { p_event_ids: eventIds })
      for (const row of (counts ?? [])) {
        guestCountMap[row.event_id] = Number(row.guest_count)
      }
    } catch {
      // RPC not yet available — fill bars will render empty
    }
  }

  const enrichedEvents: PublicEvent[] = events.map(ev => ({
    id:              ev.id,
    slug:            (ev as any).slug   ?? null,
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

  const displayName = publicProfile.company_name || publicProfile.full_name || username
  const canonicalUrl = `https://www.tikkitx.com/organizer/${username}`

  const profileSchema = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    '@id': canonicalUrl,
    url: canonicalUrl,
    name: `${displayName} on Tikkit`,
    mainEntity: {
      '@type': 'Organization',
      '@id': `${canonicalUrl}#organizer`,
      name: displayName,
      url: canonicalUrl,
      ...(publicProfile.logo_url ? { logo: publicProfile.logo_url } : {}),
      ...(publicProfile.cover_image_url ? { image: publicProfile.cover_image_url } : {}),
      memberOf: { '@id': 'https://www.tikkitx.com/#organization' },
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(profileSchema) }}
      />
      <PublicOrganizerProfile profile={publicProfile} events={enrichedEvents} />
    </>
  )
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
