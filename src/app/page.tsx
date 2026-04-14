import type { Metadata } from 'next'
import HomeClient from './HomeClient'

export const metadata: Metadata = {
  title: 'Tikkit — Buy & Sell Event Tickets in Pakistan | Lahore · Karachi · Islamabad',
  description: "Pakistan's #1 event ticketing platform. Discover concerts, parties, tech conferences & corporate events. Sell tickets with dynamic QR, guest approval, and instant payouts. Free to start.",
  keywords: ['buy event tickets Pakistan', 'sell tickets online Pakistan', 'concerts Lahore', 'events Karachi', 'events Islamabad', 'event ticketing app Pakistan', 'event management Pakistan'],
  alternates: { canonical: 'https://www.tikkitx.com' },
  openGraph: {
    title: 'Tikkit — Buy & Sell Event Tickets in Pakistan',
    description: "Pakistan's #1 event ticketing platform. Concerts, parties, tech events in Lahore, Karachi & Islamabad. Dynamic QR, instant payouts.",
    url: 'https://www.tikkitx.com',
    type: 'website',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Tikkit — Event Ticketing Platform Pakistan' }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@tikkitx',
    title: 'Tikkit — Buy & Sell Event Tickets in Pakistan',
    description: "Pakistan's #1 event ticketing platform. Concerts, parties, tech events in Lahore, Karachi & Islamabad.",
    images: ['/og-image.jpg'],
  },
}

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': 'https://www.tikkitx.com/#organization',
  name: 'Tikkit X',
  alternateName: 'Tikkit',
  url: 'https://www.tikkitx.com',
  logo: {
    '@type': 'ImageObject',
    url: 'https://www.tikkitx.com/tikkit-logo.svg',
    width: 600,
    height: 120,
  },
  description: "Pakistan's #1 event ticketing and management platform — buy tickets for concerts, parties, tech conferences, and exclusive events in Lahore, Karachi, Islamabad, and nationwide.",
  foundingLocation: { '@type': 'Place', name: 'Lahore, Pakistan' },
  areaServed: [
    { '@type': 'City', name: 'Lahore' },
    { '@type': 'City', name: 'Karachi' },
    { '@type': 'City', name: 'Islamabad' },
    { '@type': 'Country', name: 'Pakistan' },
  ],
  sameAs: [
    'https://www.instagram.com/tikkitx',
    'https://www.twitter.com/tikkitx',
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer support',
    availableLanguage: ['English', 'Urdu'],
  },
}

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': 'https://www.tikkitx.com/#website',
  name: 'Tikkit X',
  url: 'https://www.tikkitx.com',
  publisher: { '@id': 'https://www.tikkitx.com/#organization' },
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: 'https://www.tikkitx.com/explore?q={search_term_string}',
    },
    'query-input': 'required name=search_term_string',
  },
}

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <HomeClient />
    </>
  )
}
