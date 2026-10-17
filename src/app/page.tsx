import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { ButtonLink } from '@/components/kit'
import { MarketingShell } from '@/components/marketing/MarketingShell'
import { Faq, JsonLd, Section, SectionHead, faqJsonLd, type FaqItem } from '@/components/marketing/blocks'
import { HomeHero } from '@/components/marketing/home/HomeHero'
import { NightSection } from '@/components/marketing/home/NightSection'
import { SunriseTransition } from '@/components/marketing/home/SunriseTransition'
import { DaySection } from '@/components/marketing/home/DaySection'
import { AttendeeStrip, PricingHome, ToolsStrip } from '@/components/marketing/home/HomeSales'
import { Skyline, Stars } from '@/components/marketing/home/scenes'

const TITLE = 'TIKKIT X: Sell Event Tickets and Run the Door in Pakistan'
const DESC = 'QR tickets, a guest list you control, referral tracking and a door scanner, built for event organizers in Karachi, Lahore and Islamabad. Free for 14 days.'

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESC,
  keywords: ['event ticketing Pakistan', 'sell event tickets', 'event management software Pakistan', 'QR tickets', 'guest list management', 'event organizer tools', 'events Karachi', 'events Lahore', 'events Islamabad', 'JazzCash event tickets', 'EasyPaisa event tickets'],
  alternates: { canonical: 'https://www.tikkitx.com' },
  openGraph: {
    title: TITLE, description: DESC, url: 'https://www.tikkitx.com', type: 'website',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'TIKKIT X' }],
  },
  twitter: { card: 'summary_large_image', site: '@tikkitx', title: TITLE, description: DESC, images: ['/og-image.jpg'] },
}

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': 'https://www.tikkitx.com/#organization',
  name: 'Tikkit X',
  alternateName: ['Tikkit', 'TikkitX'],
  legalName: 'Two Bit Digital Ltd',
  url: 'https://www.tikkitx.com',
  logo: { '@type': 'ImageObject', '@id': 'https://www.tikkitx.com/#logo', url: 'https://www.tikkitx.com/tikkit-logo.svg', width: 600, height: 120, caption: 'Tikkit X' },
  image: { '@id': 'https://www.tikkitx.com/#logo' },
  description: 'Event ticketing and guest management for organizers in Pakistan. QR tickets, guest lists, referral tracking and door control.',
  slogan: 'From the underground. For the world.',
  foundingDate: '2024',
  foundingLocation: { '@type': 'Place', name: 'Karachi, Pakistan' },
  address: { '@type': 'PostalAddress', addressLocality: 'Karachi', addressCountry: 'PK' },
  founder: { '@type': 'Person', '@id': 'https://www.tikkitx.com/#founder', name: 'Muhammad Wasif', jobTitle: 'Founder & CEO', url: 'https://www.tikkitx.com/about', worksFor: { '@id': 'https://www.tikkitx.com/#organization' } },
  areaServed: [{ '@type': 'City', name: 'Karachi' }, { '@type': 'City', name: 'Lahore' }, { '@type': 'City', name: 'Islamabad' }, { '@type': 'Country', name: 'Pakistan' }],
  knowsAbout: ['Event Ticketing', 'QR Code Check-in', 'Guest List Management', 'JazzCash Payments', 'EasyPaisa Payments', 'Event Promotion'],
  sameAs: ['https://www.instagram.com/tikkitx', 'https://www.twitter.com/tikkitx', 'https://www.linkedin.com/company/tikkit-x/'],
  contactPoint: { '@type': 'ContactPoint', contactType: 'customer support', email: 'hello@tikkitx.com', availableLanguage: ['English', 'Urdu'] },
}

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': 'https://www.tikkitx.com/#website',
  name: 'Tikkit X',
  url: 'https://www.tikkitx.com',
  publisher: { '@id': 'https://www.tikkitx.com/#organization' },
  potentialAction: { '@type': 'SearchAction', target: { '@type': 'EntryPoint', urlTemplate: 'https://www.tikkitx.com/explore?q={search_term_string}' }, 'query-input': 'required name=search_term_string' },
}

const faqs: FaqItem[] = [
  { q: 'How do my guests pay?', a: 'Guests pay you directly by bank transfer, JazzCash or EasyPaisa and upload a screenshot. You approve it in one tap and the QR ticket is issued. You keep full control of your money.' },
  { q: 'Can I run corporate events and manage a venue?', a: 'Yes. Run conferences, dinners and offsites with approval lists and verified-ID-only guests, plan multi day company retreats on the Pro plan, and let people book your rooms, courts or studios by the slot.' },
  { q: 'Do my guests need an account?', a: 'Yes. Guests sign up once with email, phone, date of birth, city and gender. If you add someone by hand, they sign up with the same email and their ticket appears in their account.' },
  { q: 'Can I run private or secret events?', a: 'Yes. Hide the venue until a time you choose, require approval for every guest, or restrict an event to ID verified guests on the Growth plan.' },
  { q: 'What do my gate staff need?', a: 'Nothing but a link. Send a temporary scanner link to your door team. They can scan tickets and look up guests, and nothing else.' },
  { q: 'What does it cost?', a: 'Every plan starts with a 14 day free trial. After that it is a flat monthly subscription from PKR 2,999. We do not take a cut of your ticket sales.' },
  { q: 'Which cities do you cover?', a: 'We launch in Karachi, Lahore and Islamabad, and organizers in other Pakistani cities can already list events.' },
]

export default function Page() {
  return (
    <MarketingShell>
      <JsonLd data={[organizationSchema, websiteSchema, faqJsonLd(faqs)]} />
      <HomeHero />
      <NightSection />
      <SunriseTransition />
      <DaySection />
      <ToolsStrip />
      <PricingHome />
      <AttendeeStrip />

      <section className="k-day pb-24 pt-16" aria-labelledby="faq-title">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <SectionHead align="center" eyebrow="Questions" title="Good to know" />
          <h2 id="faq-title" className="sr-only">Frequently asked questions</h2>
          <div className="mt-10"><Faq items={faqs} /></div>
        </div>
      </section>

      <section className="k-night relative isolate overflow-hidden py-28 text-center sm:py-36" aria-labelledby="final-title">
        <div aria-hidden className="absolute inset-0 -z-10" style={{ background: 'linear-gradient(180deg, #fff1dc 0%, #f08a6b 18%, #6d2c63 45%, #1b1038 70%, #070911 100%)' }} />
        <Stars className="absolute inset-0 -z-10 opacity-70" count={36} />
        <Skyline className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-28 w-full sm:h-40" />
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 id="final-title" className="text-balance text-4xl font-semibold tracking-tight text-white sm:text-6xl">Your next night. Your next Saturday morning.</h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-white/75">Start free for 14 days. Set up your first event in about ten minutes.</p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <ButtonLink href="/auth/login?flow=organizer-signup" size="lg" trailing={<ArrowRight className="h-4 w-4" />}>Start free trial</ButtonLink>
            <ButtonLink href="/how-it-works" size="lg" variant="secondary">How it works</ButtonLink>
          </div>
        </div>
      </section>
    </MarketingShell>
  )
}
