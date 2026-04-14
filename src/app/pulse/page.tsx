import type { Metadata } from 'next'
import PulsePage from './PulseClient'

export const metadata: Metadata = {
  title: 'Pulse — Wellness Retreats & Mindful Experiences in Pakistan',
  description: 'Host and discover wellness retreats, yoga sessions, hiking trips, and mindful experiences across Pakistan. Tikkit Pulse is built for wellness creators and conscious communities.',
  keywords: ['wellness retreat Pakistan', 'yoga events Pakistan', 'wellness events Lahore', 'wellness events Islamabad', 'mindfulness events Pakistan', 'retreat organizer Pakistan', 'wellness ticketing Pakistan'],
  openGraph: {
    title: 'Pulse — Wellness Retreats & Mindful Experiences in Pakistan | Tikkit',
    description: 'Discover yoga, wellness retreats, hiking, and mindful experiences across Pakistan. Tikkit Pulse — for creators who lead with intention.',
    url: 'https://www.tikkitx.com/pulse',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Tikkit Pulse — Wellness Events Pakistan' }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@tikkitx',
    title: 'Pulse — Wellness Retreats & Mindful Experiences in Pakistan',
    description: 'Yoga, wellness retreats, hiking, and mindful experiences across Pakistan. Built for wellness creators.',
  },
  alternates: {
    canonical: 'https://www.tikkitx.com/pulse',
  },
}

export default function Page() {
  return <PulsePage />
}
