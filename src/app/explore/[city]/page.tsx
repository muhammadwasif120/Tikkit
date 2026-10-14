import type { Metadata } from 'next'
import { ExploreView } from '@/components/explore/ExploreView'
import { CITY_CONTENT, titleCase } from '@/lib/exploreContent'

export const revalidate = 120
type Props = { params: Promise<{ city: string }>; searchParams: Promise<{ q?: string; when?: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city } = await params
  const name = titleCase(city)
  return {
    title: `Events, Concerts & Experiences in ${name}`,
    description: `Discover the best upcoming events, concerts, private parties, and corporate networking events happening in ${name}. Secure your tickets online with Tikkit.`,
    alternates: { canonical: `https://www.tikkitx.com/explore/${city}` },
    openGraph: { title: `Upcoming Events in ${name} | Tikkit`, description: `Browse exclusive events and secure your tickets in ${name}.`, url: `https://www.tikkitx.com/explore/${city}`, images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: `Events in ${name}, Tikkit` }] },
  }
}

export default async function CityPage({ params, searchParams }: Props) {
  const [{ city }, { q, when }] = await Promise.all([params, searchParams])
  const name = titleCase(city)
  const intro = CITY_CONTENT[city.toLowerCase()]?.intro ?? `Browse upcoming events in ${name} on Tikkit. Find concerts, corporate events, private parties, and more, with secure online ticketing and QR entry.`
  return <ExploreView city={city} q={q} when={when} intro={intro} heading={`Events in ${name}`} breadcrumb={[{ name: 'Explore Events', url: 'https://www.tikkitx.com/explore' }, { name: `Events in ${name}`, url: `https://www.tikkitx.com/explore/${city}` }]} />
}
