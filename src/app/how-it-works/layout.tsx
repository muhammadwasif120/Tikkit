import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'How Tikkit Works — Sell Event Tickets Online in Pakistan',
  description: 'Learn how to create, manage, and sell tickets for your events in Pakistan. Dynamic QR check-in, guest list approval, instant payouts. Free to start — no subscription needed.',
  keywords: ['sell tickets online Pakistan', 'how to sell event tickets Pakistan', 'event ticketing platform Pakistan', 'create event page Pakistan', 'QR ticket scanning Pakistan'],
  alternates: { canonical: 'https://www.tikkitx.com/how-it-works' },
  openGraph: {
    title: 'How Tikkit Works — Sell Event Tickets Online in Pakistan',
    description: 'Create an event, set your guest list rules, sell tickets, and scan QR codes at the door. Built for Pakistani event organizers. Free to start.',
    url: 'https://www.tikkitx.com/how-it-works',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'How Tikkit Works — Secure Event Ticketing in Pakistan' }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@tikkitx',
    title: 'How Tikkit Works — Sell Event Tickets Online in Pakistan',
    description: 'Create, manage, and sell tickets for your events in Pakistan. Dynamic QR, guest list approval, instant payouts.',
    images: ['/og-image.jpg'],
  },
}

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How do I sell tickets for my event in Pakistan?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Sign up on Tikkit, create your event page (takes under 2 minutes), set your ticket price in PKR, and share your event link. Attendees register directly on the platform and receive a dynamic QR ticket. You get paid upfront.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is Tikkit free for event organizers?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Creating an event and managing free RSVP events is completely free. For paid ticket events, Tikkit charges a small platform fee per ticket sold. There are no monthly subscriptions or setup fees.',
      },
    },
    {
      '@type': 'Question',
      name: 'How does Tikkit prevent ticket fraud?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Tikkit uses Dynamic QR technology — each ticket's QR code refreshes every 15 seconds. This makes screenshot-sharing and duplicate tickets completely useless. Your staff scan the live QR at the door using the Tikkit Scanner.",
      },
    },
    {
      '@type': 'Question',
      name: 'Can I control who attends my event?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Tikkit offers three registration modes: Open (anyone can join), Approval Required (you review each registration), and Invite Only (only specific guests can register). You can approve, reject, or waitlist individual attendees.',
      },
    },
    {
      '@type': 'Question',
      name: 'What payment methods does Tikkit support?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Tikkit supports payments in PKR. The platform is designed for the Pakistani market and integrates with local payment workflows.',
      },
    },
    {
      '@type': 'Question',
      name: 'Which cities in Pakistan does Tikkit operate in?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Tikkit is active across Pakistan with the strongest presence in Lahore, Karachi, and Islamabad. Organizers from any Pakistani city can create events on the platform.',
      },
    },
    {
      '@type': 'Question',
      name: 'What types of events can I host on Tikkit?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Tikkit supports any live event: concerts and music nights, tech conferences and hackathons, corporate networking events, private parties, art exhibitions, sports tournaments, wellness retreats, comedy shows, fashion events, and more.',
      },
    },
    {
      '@type': 'Question',
      name: 'How is Tikkit different from Bookme or Ticketwala?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Tikkit is exclusively focused on curated live events — unlike Bookme which also sells cinema and bus tickets. Tikkit offers organizer-side tools (guest approval, dynamic QR scanning, analytics) that general platforms lack. Tikkit also provides instant payouts rather than delayed settlement.',
      },
    },
  ],
}

export default function HowItWorksLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      {children}
    </>
  )
}
