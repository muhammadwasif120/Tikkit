import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import PublicExploreClient from '@/components/public/PublicExploreClient'

export const revalidate = 120 // re-fetch every 2 minutes

type Props = {
  params: Promise<{ city: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params
  const cityStr = resolvedParams.city
  const formattedCity = cityStr.charAt(0).toUpperCase() + cityStr.slice(1).replace(/-/g, ' ')
  
  return {
    title: `Events, Concerts & Experiences in ${formattedCity} | Tikkit`,
    description: `Discover the best upcoming events, concerts, private parties, and corporate networking events happening in ${formattedCity}. Secure your tickets online with Tikkit.`,
    alternates: { canonical: `https://www.tikkitx.com/explore/${cityStr}` },
    openGraph: {
      title: `Upcoming Events in ${formattedCity} | Tikkit`,
      description: `Browse exclusive events and secure your tickets in ${formattedCity}.`,
      url: `https://www.tikkitx.com/explore/${cityStr}`,
      images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: `Events in ${formattedCity} — Tikkit` }],
    },
  }
}

export default async function CityExplorePage({ params }: Props) {
  const resolvedParams = await params
  const city = resolvedParams.city.replace(/-/g, ' ')

  const supabase = await createClient()
  const admin = createAdminClient()

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
          full_name, company_name, username, logo_url
        )
      `)
      .eq('status', 'published')
      .eq('is_private', false)
      .gte('date_start', new Date().toISOString())
      .or(`venue_name.ilike.%${city}%,title.ilike.%${city}%`)
      .order('date_start', { ascending: true })
      .limit(50),
    admin
      .from('event_categories')
      .select('id, name, icon, color')
      .order('name', { ascending: true }),
  ])

  // Redirect logged-in users to their correct home (or let them stay to browse?)
  // Following the same layout as the main explore page
  if (user) {
    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', user.id).single()
    const role = (profile as any)?.role ?? 'guest'
    redirect(role === 'guest' ? '/guest/explore' : '/dashboard')
  }

  const regCounts: Record<string, number> = {}
  const events = rawEvents ?? []
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
    <PublicExploreClient
      events={enrichedEvents}
      categories={categories ?? []}
      titleOverride={`Events in ${city.charAt(0).toUpperCase() + city.slice(1)}`}
    />
  )
}
