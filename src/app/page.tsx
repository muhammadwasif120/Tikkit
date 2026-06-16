import type { Metadata } from 'next'
import Link from 'next/link'
import HomeClient from './HomeClient'
import SiteFooter from '@/components/SiteFooter'

export const metadata: Metadata = {
  title: 'TIKKIT X — The Complete Event OS',
  description: 'Six modules. One platform. Events, Vendor X, Venues, Artist Management, Guest App & Analytics — the complete operating system for live events. From the underground. For the world.',
  keywords: ['event management', 'event operating system', 'venue booking platform', 'artist management platform', 'event ticketing platform', 'sell tickets online', 'event organizer tools', 'vendor management events', 'concerts Lahore', 'events Karachi', 'events Islamabad', 'JazzCash event tickets'],
  alternates: { canonical: 'https://www.tikkitx.com' },
  openGraph: {
    title: 'TIKKIT X — The Complete Event OS',
    description: 'Six modules. One platform. Events, Vendor X, Venues, Artist Management, Guest App & Analytics — the complete operating system for live events. From the underground. For the world.',
    url: 'https://www.tikkitx.com',
    type: 'website',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'TIKKIT X — The Complete Event OS' }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@tikkitx',
    title: 'TIKKIT X — The Complete Event OS',
    description: 'Six modules. One platform. Every organiser, vendor, venue, artist, and guest — connected. From the underground. For the world.',
    images: ['/og-image.jpg'],
  },
}

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': 'https://www.tikkitx.com/#organization',
  name: 'Tikkit X',
  alternateName: ['Tikkit', 'TikkitX'],
  legalName: 'Two Bit Digital Ltd',
  url: 'https://www.tikkitx.com',
  logo: {
    '@type': 'ImageObject',
    '@id': 'https://www.tikkitx.com/#logo',
    url: 'https://www.tikkitx.com/tikkit-logo.svg',
    width: 600,
    height: 120,
    caption: 'Tikkit X',
  },
  image: { '@id': 'https://www.tikkitx.com/#logo' },
  description: "The complete event operating system for live events — events, vendor management, venue booking, artist management, guest app, and analytics. Six modules. One platform. From the underground. For the world.",
  slogan: 'From the underground. For the world.',
  foundingDate: '2024',
  foundingLocation: { '@type': 'Place', name: 'Karachi, Pakistan' },
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Karachi',
    addressCountry: 'PK',
  },
  founder: {
    '@type': 'Person',
    '@id': 'https://www.tikkitx.com/#founder',
    name: 'Muhammad Wasif',
    jobTitle: 'Founder & CEO',
    url: 'https://www.tikkitx.com/about',
    worksFor: { '@id': 'https://www.tikkitx.com/#organization' },
  },
  areaServed: [
    { '@type': 'City', name: 'Karachi' },
    { '@type': 'City', name: 'Lahore' },
    { '@type': 'City', name: 'Islamabad' },
    { '@type': 'Country', name: 'Pakistan' },
  ],
  knowsAbout: [
    'Event Management',
    'Event Ticketing',
    'QR Code Check-in',
    'Guest List Management',
    'JazzCash Payments',
    'EasyPaisa Payments',
    'Corporate Events Pakistan',
    'Private Events',
  ],
  sameAs: [
    'https://www.instagram.com/tikkitx',
    'https://www.twitter.com/tikkitx',
    'https://www.linkedin.com/company/tikkit-x/',
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer support',
    email: 'hello@tikkitx.com',
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

const CITIES = [
  { slug: 'lahore',      label: 'Lahore' },
  { slug: 'karachi',     label: 'Karachi' },
  { slug: 'islamabad',   label: 'Islamabad' },
  { slug: 'rawalpindi',  label: 'Rawalpindi' },
  { slug: 'faisalabad',  label: 'Faisalabad' },
  { slug: 'peshawar',    label: 'Peshawar' },
  { slug: 'multan',      label: 'Multan' },
  { slug: 'quetta',      label: 'Quetta' },
]

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

      {/* City browse grid — server-rendered, visible to crawlers + users */}
      <section
        aria-label="Browse events by city"
        style={{
          background: '#050505',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          padding: '4rem 1.5rem',
        }}
      >
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <h2
            style={{
              color: 'rgba(255,255,255,0.35)',
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              marginBottom: '1.5rem',
            }}
          >
            Browse Events by City
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
              gap: '0.75rem',
            }}
          >
            {CITIES.map(c => (
              <Link
                key={c.slug}
                href={`/explore/${c.slug}`}
                style={{
                  display: 'block',
                  padding: '0.75rem 1rem',
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  transition: 'background 0.15s, color 0.15s',
                }}
              >
                Events in {c.label}
              </Link>
            ))}
          </div>
          <div
            style={{
              marginTop: '2rem',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '1.25rem',
            }}
          >
            {[
              { href: '/explore',                        label: 'All events in Pakistan' },
              { href: '/compare/tikkit-vs-ticketwala',   label: 'Tikkit vs Ticketwala' },
              { href: '/compare/tikkit-vs-bookme',       label: 'Tikkit vs Bookme.pk' },
              { href: '/how-it-works',                   label: 'How Tikkit works' },
              { href: '/blog',                           label: 'Event planning guides' },
            ].map(l => (
              <Link
                key={l.href}
                href={l.href}
                style={{
                  color: 'rgba(255,255,255,0.35)',
                  fontSize: '0.8125rem',
                  textDecoration: 'none',
                  borderBottom: '1px solid rgba(255,255,255,0.12)',
                  paddingBottom: 2,
                }}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  )
}
