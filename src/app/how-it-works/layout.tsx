import type { Metadata } from 'next'

const TITLE = 'How TIKKIT X Works: Sell Event Tickets Online in Pakistan'

export const metadata: Metadata = {
  title: TITLE,
  description: 'Go live in about ten minutes. Create your event, approve guests, sell tickets by JazzCash, EasyPaisa or bank transfer, and scan QR tickets at the door. 14 day free trial.',
  keywords: ['sell tickets online Pakistan', 'how to sell event tickets Pakistan', 'event ticketing platform Pakistan', 'create event page Pakistan', 'QR ticket scanning Pakistan'],
  alternates: { canonical: 'https://www.tikkitx.com/how-it-works' },
  openGraph: {
    title: TITLE,
    description: 'Create an event, set your guest list rules, sell tickets and scan QR codes at the door. Built for Pakistani event organizers.',
    url: 'https://www.tikkitx.com/how-it-works',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'How TIKKIT X works' }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@tikkitx',
    title: TITLE,
    description: 'Create, approve, sell and scan. Everything an organizer needs for a live event in Pakistan.',
    images: ['/og-image.jpg'],
  },
}

export default function HowItWorksLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
