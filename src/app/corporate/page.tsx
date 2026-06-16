import type { Metadata } from 'next'
import CorporatePage from './CorporateClient'

export const metadata: Metadata = {
  title: 'Corporate Event Management Pakistan | TIKKIT X for Business',
  description: 'Plan, manage and report on corporate events in Pakistan with TIKKIT X. Verified QR check-in via the TIKKIT X app, vendor coordination through Vendor X, venue discovery, real-time analytics, and post-event reports — built for enterprise teams in Lahore, Karachi and Islamabad.',
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
    'corporate event venue Karachi',
    'corporate event venue Lahore',
    'book venue corporate event Pakistan',
    'event vendor management Pakistan',
    'corporate event app Pakistan',
    'QR check-in corporate event Pakistan',
    'annual dinner management software Pakistan',
    'corporate retreat planning Pakistan',
    'team event management platform Pakistan',
    'event ticketing enterprise Pakistan',
    'corporate event analytics Pakistan',
    'product launch event management Pakistan',
  ],
  openGraph: {
    title: 'Corporate Event Management in Pakistan | TIKKIT X for Business',
    description: 'Manage corporate conferences, annual dinners, and product launches in Pakistan. Verified QR check-in via the TIKKIT X app, Vendor X integration, venue booking, real-time analytics. Built for enterprise teams in Lahore, Karachi, Islamabad.',
    url: 'https://www.tikkitx.com/corporate',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'TIKKIT X Corporate Event Management Pakistan' }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@tikkitx',
    title: 'Corporate Event Management in Pakistan | TIKKIT X',
    description: 'Annual dinners, conferences, product launches, team retreats. Enterprise event management with Vendor X, venue booking, and TIKKIT X app check-in — Lahore, Karachi, Islamabad.',
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
        text: 'Use TIKKIT X — every guest registers and receives a unique QR pass in the TIKKIT X app on their phone. Your check-in team scans codes at the door — no manual list, no clipboard, no paper. The dashboard updates in real time and exports a full attendance report automatically after the event.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is the best event management software for corporate events in Pakistan?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'TIKKIT X for Business is designed specifically for corporate event management in Pakistan. It handles invitations, digital registration, QR check-in via the TIKKIT X mobile app (including offline), vendor coordination through Vendor X, venue discovery and booking, real-time analytics, and automated post-event reports — all in one platform.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I book a venue for my corporate event through TIKKIT X?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. The TIKKIT X Venues platform gives you access to vetted event spaces across Pakistan — hotel ballrooms, conference centres, rooftop venues, and private dining rooms. Browse availability, send an enquiry, and coordinate the booking directly through the platform without separate phone calls or email chains.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I manage vendors for a corporate event in Pakistan?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'TIKKIT X includes Vendor X — a built-in vendor coordination system. Find photographers, AV teams, caterers, and security with verified event histories. Manage quotes, invoices, and payments from a single dashboard. No missed WhatsApp messages, no lost receipts, no end-of-event bill surprises.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can TIKKIT X handle offline check-in at venues without WiFi?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Yes. TIKKIT X check-in works offline. Download the guest list before the event, and your team scans TIKKIT X QR passes without internet. All data syncs automatically when connectivity returns. Essential for Islamabad venues and hotel ballrooms with unreliable WiFi.",
      },
    },
    {
      '@type': 'Question',
      name: 'How do I generate a post-event report after a corporate dinner?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'TIKKIT X generates your post-event report automatically. After your event closes, go to your dashboard and click Reports. Download attendance data, check-in rate, no-shows, and ticket breakdown as a PDF or CSV — ready for leadership within minutes of the event ending.',
      },
    },
    {
      '@type': 'Question',
      name: 'Does TIKKIT X support CNIC verification for secure corporate events?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Yes. TIKKIT X organiser verification uses CNIC identity confirmation. Verified organisers can create events with CNIC-verified guest lists — essential for high-security functions, board events, diplomatic gatherings, and government-adjacent corporate events in Pakistan.",
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
