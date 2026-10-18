import type { Metadata } from 'next'
import { ExploreView } from '@/components/explore/ExploreView'

export const metadata: Metadata = {
  title: 'Explore Events in Pakistan: Concerts, Parties & More',
  description: 'Browse upcoming concerts, private parties, corporate networking events, and exclusive experiences in Lahore, Karachi, Islamabad, and across Pakistan. Buy tickets online.',
  keywords: ['events in Pakistan', 'buy tickets Pakistan', 'concerts Pakistan', 'events Lahore', 'events Karachi', 'events Islamabad', 'upcoming events Pakistan', 'things to do Pakistan'],
  alternates: { canonical: 'https://www.tikkitx.com/explore' },
  openGraph: {
    title: 'Explore Events in Pakistan: Concerts, Parties & More | Tikkit',
    description: 'Browse upcoming concerts, private parties, corporate events, and exclusive experiences in Lahore, Karachi, Islamabad and across Pakistan.',
    url: 'https://www.tikkitx.com/explore',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Explore Events in Pakistan, Tikkit' }],
  },
  twitter: { card: 'summary_large_image', site: '@tikkitx', title: 'Explore Events in Pakistan | Tikkit', description: 'Concerts, parties, corporate events across Lahore, Karachi & Islamabad. Buy tickets online.', images: ['/og-image.jpg'] },
}

export const revalidate = 120

export default async function ExplorePage({ searchParams }: { searchParams: Promise<{ q?: string; when?: string }> }) {
  const { q, when } = await searchParams
  return <ExploreView q={q} when={when} heading="Events happening in Pakistan" breadcrumb={[{ name: 'Explore Events', url: 'https://www.tikkitx.com/explore' }]} />
}
