import type { Metadata } from 'next'
import CorporatePage from './CorporateClient'

export const metadata: Metadata = {
  title: 'Corporate Event Management in Pakistan — Tikkit for Business',
  description: 'Plan, manage and report on corporate events in Pakistan with Tikkit. Verified check-in, digital invitations, real-time analytics and post-event reports — built for teams in Lahore, Karachi and Islamabad.',
  keywords: [
    'corporate event management Pakistan',
    'corporate events Lahore',
    'corporate events Karachi',
    'corporate events Islamabad',
    'annual dinner Pakistan',
    'conference management Pakistan',
    'business event ticketing Pakistan',
    'corporate guest list management',
    'post-event report Pakistan',
    'corporate dinner Pakistan',
    'corporate conference Lahore',
    'how to manage corporate event Pakistan',
  ],
  openGraph: {
    title: 'Corporate Event Management in Pakistan | Tikkit for Business',
    description: 'Manage corporate conferences, annual dinners, and product launches in Pakistan. Verified QR check-in, guest approval, real-time analytics. Built for enterprise teams in Lahore, Karachi, Islamabad.',
    url: 'https://www.tikkitx.com/corporate',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Tikkit Corporate Event Management Pakistan' }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@tikkitx',
    title: 'Corporate Event Management in Pakistan | Tikkit',
    description: 'Annual dinners, conferences, product launches. Enterprise-grade event management for Pakistan — Lahore, Karachi, Islamabad.',
  },
  alternates: {
    canonical: 'https://www.tikkitx.com/corporate',
  },
}

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How do I manage a guest list for a large corporate event in Pakistan?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Use a digital registration system like Tikkit that gives every attendee a unique QR code. Your check-in team scans codes at the door — no manual list, no clipboard. The dashboard updates in real time and exports a full attendance report automatically.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is the best event management software for corporate events in Pakistan?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Tikkit for Business is designed specifically for corporate event management in Pakistan. It handles invitations, digital registration, QR check-in (including offline), real-time analytics, and automated post-event reports — all in one platform.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can Tikkit handle offline check-in at venues without WiFi?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Yes. Tikkit's check-in works offline. Download the guest list before the event, scan QR codes without internet, and all data syncs automatically when connectivity returns. Essential for Islamabad venues and event spaces with unreliable WiFi.",
      },
    },
    {
      '@type': 'Question',
      name: 'How do I generate a post-event report after a corporate dinner?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Tikkit generates your post-event report automatically. After your event closes, go to your dashboard and click Reports. Download attendance data, check-in rate, no-shows, and ticket breakdown as a PDF or CSV — ready for leadership within minutes of the event ending.',
      },
    },
    {
      '@type': 'Question',
      name: 'Does Tikkit support CNIC verification for secure corporate events?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Yes. Tikkit's organiser verification system uses CNIC identity confirmation. Verified organisers can create events with CNIC-verified guest lists — essential for high-security functions, board events, and government-adjacent corporate gatherings.",
      },
    },
  ],
}

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <CorporatePage />
    </>
  )
}
