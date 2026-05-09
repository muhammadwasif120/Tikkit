import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import PublicExploreClient from '@/components/public/PublicExploreClient'

export const revalidate = 120

type Props = {
  params: Promise<{ city: string }>
}

// ─── City-specific SEO content ────────────────────────────────────────────────

const CITY_CONTENT: Record<string, { intro: string; categories: string[] }> = {
  lahore: {
    intro: `Lahore is Pakistan's cultural capital — and its events scene reflects it. From intimate jazz nights and rooftop parties in DHA and Gulberg, to sold-out tech conferences and fashion trunk shows, there's always something happening. Browse upcoming concerts, food festivals, corporate networking nights, art exhibitions, and private brand activations in Lahore. Whether you're looking for this weekend's best night out or planning ahead, Tikkit lists every verified event in the city with secure online ticketing, JazzCash and EasyPaisa payment support, and instant QR entry.`,
    categories: ['music', 'food', 'tech', 'art', 'business', 'fashion'],
  },
  karachi: {
    intro: `Karachi hosts Pakistan's largest events — by scale, by production value, and by audience. The city's business concentration makes it the natural home for national product launches, corporate conferences, and brand activations, while its coastline and DHA venues set the stage for rooftop nights and private parties. Browse upcoming events in Karachi: concerts at waterfront venues, startup summits in Clifton, corporate dinners in Saddar, and exclusive gatherings across the city. Tikkit lists verified events with secure ticketing, JazzCash and EasyPaisa payments, and real-time QR entry management.`,
    categories: ['business', 'music', 'tech', 'food', 'sports', 'art'],
  },
  islamabad: {
    intro: `Islamabad has a quieter but discerning events culture. The capital draws wellness retreats, diplomatic social events, high-end corporate dinners, and curated arts experiences unlike anywhere else in Pakistan. F-6, F-7, and the Blue Area host the city's most exclusive gatherings — from mindfulness and yoga retreats to government-sector networking events and private gallery openings. Browse upcoming events in Islamabad on Tikkit, with verified organizers, secure online ticketing, and QR-based entry. Find wellness workshops, tech meetups, cultural evenings, and more.`,
    categories: ['wellness', 'business', 'art', 'tech', 'food', 'music'],
  },
  rawalpindi: {
    intro: `Rawalpindi's events scene blends its close ties with Islamabad's professional crowd and its own strong local culture. From corporate networking nights and product launches to community gatherings and live performances, the twin-city region offers a growing calendar of verified events. Browse upcoming events in Rawalpindi on Tikkit, with secure ticketing and QR entry.`,
    categories: ['business', 'music', 'food', 'tech', 'art', 'sports'],
  },
  faisalabad: {
    intro: `Faisalabad's growing business and industrial community has built a dynamic local events scene. From corporate seminars and trade exhibitions to cultural festivals and community gatherings, the city's event calendar is expanding fast. Browse upcoming events in Faisalabad on Tikkit, with verified organizers and secure online ticketing.`,
    categories: ['business', 'food', 'music', 'tech', 'art', 'sports'],
  },
  peshawar: {
    intro: `Peshawar's rich cultural heritage shapes a unique local events landscape. Arts and heritage events, community gatherings, business conferences, and food festivals reflect the city's distinct identity. Browse upcoming events in Peshawar on Tikkit and secure your tickets online.`,
    categories: ['art', 'food', 'business', 'music', 'tech', 'sports'],
  },
  multan: {
    intro: `Multan's events calendar spans cultural festivals, religious celebrations, business seminars, and community gatherings. The City of Saints has a growing appetite for live events and experiences. Browse upcoming events in Multan on Tikkit, with online ticketing and secure QR entry.`,
    categories: ['food', 'art', 'business', 'music', 'sports', 'tech'],
  },
  quetta: {
    intro: `Quetta's events scene reflects its unique cultural mix and growing professional community. From business networking events and educational conferences to cultural exhibitions and community gatherings, Quetta is building a more active live-events calendar. Browse upcoming events in Quetta on Tikkit.`,
    categories: ['business', 'food', 'art', 'music', 'tech', 'sports'],
  },
}

const CATEGORY_LABELS: Record<string, string> = {
  music:    'Concerts & Music',
  food:     'Food & Drink',
  tech:     'Tech & Startup',
  art:      'Art & Culture',
  business: 'Business & Networking',
  fashion:  'Fashion & Design',
  wellness: 'Wellness & Retreats',
  sports:   'Sports & Fitness',
  comedy:   'Comedy',
  film:     'Film & Cinema',
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
  const citySlug = resolvedParams.city
  const city = citySlug.replace(/-/g, ' ')
  const cityDisplay = city.charAt(0).toUpperCase() + city.slice(1)

  const cityContent = CITY_CONTENT[citySlug.toLowerCase()] ?? {
    intro: `Browse upcoming events in ${cityDisplay} on Tikkit. Find concerts, corporate events, private parties, and more — with secure online ticketing and QR entry.`,
    categories: ['music', 'business', 'food', 'art', 'tech', 'sports'],
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.tikkitx.com' },
      { '@type': 'ListItem', position: 2, name: 'Explore Events', item: 'https://www.tikkitx.com/explore' },
      { '@type': 'ListItem', position: 3, name: `Events in ${cityDisplay}`, item: `https://www.tikkitx.com/explore/${citySlug}` },
    ],
  }

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
        capacity, organizer_id, slug,
        organizer:profiles!events_organizer_id_fkey(
          full_name, company_name, username, logo_url, is_id_verified
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

  if (user) {
    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', user.id).single()
    const role = (profile as any)?.role ?? 'guest'
    redirect(role === 'guest' ? '/guest/explore' : '/dashboard')
  }

  const verifiedEvents = (rawEvents ?? []).filter((e: any) => e.organizer?.is_id_verified === true)

  const regCounts: Record<string, number> = {}
  if (verifiedEvents.length > 0) {
    const { data: regRows } = await admin
      .from('public_registrations')
      .select('event_id')
      .in('event_id', verifiedEvents.map((e: any) => e.id))
      .neq('status', 'rejected')

    for (const row of regRows ?? []) {
      regCounts[row.event_id] = (regCounts[row.event_id] ?? 0) + 1
    }
  }

  const enrichedEvents = verifiedEvents.map((e: any) => ({
    ...e,
    registered_count: regCounts[e.id] ?? 0,
  }))

  // ItemList schema for event rich results
  const itemListSchema = enrichedEvents.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Upcoming Events in ${cityDisplay}`,
    description: `Browse verified upcoming events in ${cityDisplay} on Tikkit`,
    url: `https://www.tikkitx.com/explore/${citySlug}`,
    itemListElement: enrichedEvents.slice(0, 20).map((e: any, i: number) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Event',
        name: e.title,
        startDate: e.date_start,
        eventStatus: 'https://schema.org/EventScheduled',
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
        location: {
          '@type': 'Place',
          name: e.venue_name ?? cityDisplay,
          address: {
            '@type': 'PostalAddress',
            addressLocality: cityDisplay,
            addressCountry: 'PK',
          },
        },
        ...(e.ticket_price != null && {
          offers: {
            '@type': 'Offer',
            price: e.ticket_price,
            priceCurrency: 'PKR',
            availability: 'https://schema.org/InStock',
            url: `https://www.tikkitx.com/guest/explore/${e.slug ?? e.id}`,
          },
        }),
        url: `https://www.tikkitx.com/guest/explore/${e.slug ?? e.id}`,
        ...(e.cover_image_url && { image: e.cover_image_url }),
        organizer: {
          '@type': 'Organization',
          name: (e.organizer as any)?.company_name ?? (e.organizer as any)?.full_name ?? 'Tikkit Organizer',
        },
      },
    })),
  } : null

  const cityLinks = cityContent.categories.map(cat => ({
    href: `/explore/${citySlug}/${cat}`,
    label: CATEGORY_LABELS[cat] ?? cat,
  }))

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      {itemListSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />
      )}
      <PublicExploreClient
        events={enrichedEvents}
        categories={categories ?? []}
        titleOverride={`${cityDisplay} Events, Concerts & Experiences`}
        cityIntro={cityContent.intro}
        cityLinks={cityLinks}
      />
    </>
  )
}
