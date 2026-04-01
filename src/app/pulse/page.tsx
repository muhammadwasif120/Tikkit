import type { Metadata } from 'next'
import PulsePage from './PulseClient'

export const metadata: Metadata = {
  title: 'Pulse — Experiences Worth Showing Up For',
  description: 'Host wellness retreats, yoga sessions, hiking trips, and mindful experiences with Tikkit Pulse. Simple tools for creators who lead with intention.',
  openGraph: {
    title: 'Pulse — Experiences Worth Showing Up For | Tikkit',
    description: 'Host wellness retreats, yoga sessions, hiking trips, and mindful experiences with Tikkit Pulse. Simple tools for creators who lead with intention.',
    url: 'https://www.tikkitx.com/pulse',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Tikkit Pulse — Wellness Event Hosting' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pulse — Experiences Worth Showing Up For | Tikkit',
    description: 'Host wellness retreats, yoga sessions, and mindful experiences with Tikkit Pulse.',
  },
  alternates: {
    canonical: 'https://www.tikkitx.com/pulse',
  },
}

export default function Page() {
  return <PulsePage />
}
