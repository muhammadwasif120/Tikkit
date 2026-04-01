import type { Metadata } from 'next'
import HomeClient from './HomeClient'

export const metadata: Metadata = {
  title: 'Tikkit — Event Management for Pakistan',
  description: 'Create, manage, and sell tickets for your events. Guest lists, QR check-in, upfront payments — built for Pakistan.',
  openGraph: {
    title: 'Tikkit — Event Management for Pakistan',
    description: 'Create, manage, and sell tickets for your events. Guest lists, QR check-in, upfront payments — built for Pakistan.',
    url: 'https://www.tikkitx.com',
    type: 'website',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Tikkit — Event Management Platform for Pakistan' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tikkit — Event Management for Pakistan',
    description: 'Create, manage, and sell tickets for your events. Guest lists, QR check-in, upfront payments — built for Pakistan.',
    images: ['/og-image.jpg'],
  },
  alternates: { canonical: 'https://www.tikkitx.com' },
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
    url: 'https://www.tikkitx.com/icons/favicon-32.png',
    width: 32,
    height: 32,
  },
  description: 'Pakistan\'s premier event management platform — discover, host, and register for exclusive events across Karachi, Lahore, Islamabad, and nationwide.',
  areaServed: {
    '@type': 'Country',
    name: 'Pakistan',
  },
  sameAs: [
    'https://www.instagram.com/tikkitx',
    'https://www.twitter.com/tikkitx',
  ],
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
