import type { Metadata } from 'next'
import CorporatePage from './CorporateClient'

export const metadata: Metadata = {
  title: 'Corporate Event Management in Pakistan — Tikkit for Business',
  description: 'Enterprise-grade corporate event management for Pakistan. Streamline conferences, product launches, town halls, and networking events with dynamic QR check-in, guest approval, and real-time analytics.',
  keywords: ['corporate event management Pakistan', 'corporate events Lahore', 'corporate events Karachi', 'business event ticketing Pakistan', 'corporate conference management Pakistan', 'B2B event platform Pakistan'],
  openGraph: {
    title: 'Corporate Event Management in Pakistan | Tikkit for Business',
    description: 'Manage corporate conferences, product launches, and networking events in Pakistan. Dynamic QR, guest approval, analytics. Built for enterprise teams.',
    url: 'https://www.tikkitx.com/corporate',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Tikkit Corporate Event Management Pakistan' }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@tikkitx',
    title: 'Corporate Event Management in Pakistan | Tikkit',
    description: 'Conferences, product launches, networking events. Enterprise-grade event management for Pakistan.',
  },
  alternates: {
    canonical: 'https://www.tikkitx.com/corporate',
  },
}

export default function Page() {
  return <CorporatePage />
}
