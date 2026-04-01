import type { Metadata } from 'next'
import { getWaitlistCount } from '@/app/actions/waitlistActions'
import { ComingSoonClient } from './ComingSoonClient'

export const metadata: Metadata = {
  title: 'Coming Soon — Tikkit X',
  description: 'The smartest event management platform in Pakistan is almost here. Join the waitlist for early access.',
  openGraph: {
    title: 'Coming Soon — Tikkit X',
    description: 'The smartest event management platform in Pakistan is almost here. Join the waitlist for early access.',
    url: 'https://www.tikkitx.com/coming-soon',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Tikkit — Coming Soon' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Coming Soon — Tikkit X',
    description: 'The smartest event management platform in Pakistan is almost here. Join the waitlist for early access.',
  },
  alternates: {
    canonical: 'https://www.tikkitx.com/coming-soon',
  },
}

export default async function ComingSoonPage() {
  const count = await getWaitlistCount()
  return <ComingSoonClient initialCount={count} />
}
