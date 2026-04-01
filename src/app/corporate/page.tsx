import type { Metadata } from 'next'
import CorporatePage from './CorporateClient'

export const metadata: Metadata = {
  title: 'Corporate Event Management',
  description: 'Enterprise-grade event management for corporate teams. Streamline conferences, town halls, and team events with Tikkit\'s secure, analytics-driven platform.',
  openGraph: {
    title: 'Corporate Event Management | Tikkit',
    description: 'Enterprise-grade event management for corporate teams. Streamline conferences, town halls, and team events with Tikkit\'s secure, analytics-driven platform.',
    url: 'https://www.tikkitx.com/corporate',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Tikkit Corporate Event Management' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Corporate Event Management | Tikkit',
    description: 'Enterprise-grade event management for corporate teams.',
  },
  alternates: {
    canonical: 'https://www.tikkitx.com/corporate',
  },
}

export default function Page() {
  return <CorporatePage />
}
