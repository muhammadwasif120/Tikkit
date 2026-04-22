import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Explore Events in Pakistan — Concerts, Parties & More | Tikkit',
  description: 'Browse upcoming concerts, private parties, corporate networking events, and exclusive experiences in Lahore, Karachi, Islamabad, and across Pakistan. Buy tickets online.',
  keywords: ['events in Pakistan', 'buy tickets Pakistan', 'concerts Pakistan', 'events Lahore', 'events Karachi', 'events Islamabad', 'upcoming events Pakistan', 'things to do Pakistan'],
  alternates: { canonical: 'https://www.tikkitx.com/explore' },
  openGraph: {
    title: 'Explore Events in Pakistan — Concerts, Parties & More | Tikkit',
    description: 'Browse upcoming concerts, private parties, corporate events, and exclusive experiences in Lahore, Karachi, Islamabad and across Pakistan.',
    url: 'https://www.tikkitx.com/explore',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Explore Events in Pakistan — Tikkit' }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@tikkitx',
    title: 'Explore Events in Pakistan | Tikkit',
    description: 'Concerts, parties, corporate events across Lahore, Karachi & Islamabad. Buy tickets online.',
    images: ['/og-image.jpg'],
  },
}
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import PublicExploreClient from '@/components/public/PublicExploreClient'

export const revalidate = 120 // re-fetch every 2 minutes

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.tikkitx.com' },
    { '@type': 'ListItem', position: 2, name: 'Explore Events', item: 'https://www.tikkitx.com/explore' },
  ],
}

export default async function ExplorePage() {
  const supabase = await createClient()
  const admin = createAdminClient()

  // Fire auth check, events, and categories all in parallel
  const [
    { data: { user } },
    { data: rawEvents },
    { data: categories },
  ] = await Promise.all([
    supabase.auth.getUser(),
    admin
      .from('events')
      .select(`
        id, title, date_start, cover_image_url, venue_name,
        ticket_price, registration_mode, category_id,
        capacity, organizer_id,
        organizer:profiles!events_organizer_id_fkey(
          full_name, company_name, username, logo_url, is_id_verified
        )
      `)
      .eq('status', 'published')
      .eq('is_private', false)
      .gte('date_start', new Date().toISOString())
      .order('date_start', { ascending: true })
      .limit(50),
    admin
      .from('event_categories')
      .select('id, name, icon, color')
      .order('name', { ascending: true }),
  ])

  // Redirect logged-in users to their correct home
  if (user) {
    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', user.id).single()
    const role = (profile as any)?.role ?? 'guest'
    redirect(role === 'guest' ? '/guest/explore' : '/dashboard')
  }

  // Batch registration counts (depends on events result — unavoidable)
  // Only show events from verified organizers on the public explore page
  const verifiedEvents = (rawEvents ?? []).filter((e: any) => e.organizer?.is_id_verified === true)

  const regCounts: Record<string, number> = {}
  const events = verifiedEvents
  if (events.length > 0) {
    const { data: regRows } = await admin
      .from('public_registrations')
      .select('event_id')
      .in('event_id', events.map((e: any) => e.id))
      .neq('status', 'rejected')

    for (const row of regRows ?? []) {
      regCounts[row.event_id] = (regCounts[row.event_id] ?? 0) + 1
    }
  }

  const enrichedEvents = events.map((e: any) => ({
    ...e,
    registered_count: regCounts[e.id] ?? 0,
  }))

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <PublicExploreClient
        events={enrichedEvents}
        categories={categories ?? []}
      />
    </>
  )
}
