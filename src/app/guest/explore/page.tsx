import { Suspense } from 'react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Explore Live Events Pakistan',
  description: 'Discover the best upcoming concerts, private parties, corporate networking, and exclusive experiences in Karachi, Lahore, Islamabad, and across Pakistan.',
  alternates: { canonical: 'https://www.tikkitx.com/explore' },
  openGraph: {
    title: 'Explore Live Events Pakistan | Tikkit',
    description: 'Discover the best upcoming concerts, private parties, corporate networking, and exclusive experiences across Pakistan.',
    url: 'https://www.tikkitx.com/explore',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Explore Live Events in Pakistan — Tikkit' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Explore Live Events Pakistan | Tikkit',
    description: 'Discover the best upcoming concerts, private parties, corporate networking, and exclusive experiences across Pakistan.',
    images: ['/og-image.jpg'],
  },
}
import { createClient } from '@/lib/supabase/server'
import ExploreClient from '@/components/guest/ExploreClient'
import SkeletonExplore from '@/components/guest/SkeletonExplore'
import { getPublicEvents } from '@/app/actions/guestCreditActions'
import { getTopOrganizers } from '@/app/actions/organizerActions'
import { getEventCategories, getUserCategoryOrder } from '@/app/actions/behaviourActions'
import { getUserFavouriteEventIds } from '@/app/actions/eventFavouriteActions'

async function ExploreData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch all data in parallel
  const [events, topOrganizers, categories, favouritedEventIds] = await Promise.all([
    getPublicEvents(60),
    getTopOrganizers(12),
    getEventCategories(),
    user ? getUserFavouriteEventIds() : Promise.resolve([]),
  ])

  const myEvents = user ? await (async () => {
    const { data } = await supabase
      .from('public_registrations')
      .select('id, status, event:events(id, slug, title, date_start, cover_image_url, venue_name)')
      .eq('email', user.email ?? '')
      .not('status', 'in', '("rejected","cancelled")')
      .order('created_at', { ascending: false })
      .limit(10)
    return (data ?? [])
      .filter(r => {
        const eventDate = (r as any).event?.date_start
        return eventDate && new Date(eventDate) >= new Date()
      })
      .map((r: any) => ({ ...r, status: r.status ?? 'pending' }))
  })() : []

  // Sort events by user's category interest scores (personalised feed)
  const rawEvents = (events as any[])
  let sortedEvents = rawEvents
  if (user) {
    const categoryOrder = await getUserCategoryOrder()
    if (categoryOrder.length > 0) {
      const scoreMap: Record<string, number> = {}
      categoryOrder.forEach(({ category_id, score }) => {
        scoreMap[category_id] = score
      })
      sortedEvents = [...rawEvents].sort((a, b) => {
        const aScore = a.category_id ? (scoreMap[a.category_id] ?? 0) : 0
        const bScore = b.category_id ? (scoreMap[b.category_id] ?? 0) : 0
        if (aScore !== bScore) return bScore - aScore
        return new Date(a.date_start).getTime() - new Date(b.date_start).getTime()
      })
    }
  }

  return (
    <ExploreClient
      events={sortedEvents}
      myEvents={myEvents}
      topOrganizers={topOrganizers}
      categories={categories}
      userId={user?.id ?? null}
      favouritedEventIds={favouritedEventIds}
    />
  )
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<SkeletonExplore />}>
      <ExploreData />
    </Suspense>
  )
}
