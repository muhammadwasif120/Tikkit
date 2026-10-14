import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ArrowRight, BarChart3, Bell, Check, EyeOff, QrCode, Receipt, ShieldCheck, Share2, Ticket, Users,
} from 'lucide-react'
import { Badge, ButtonLink } from '@/components/kit'
import { MarketingShell } from '@/components/marketing/MarketingShell'
import { ProductMock } from '@/components/marketing/ProductMock'
import { CtaBand, Faq, JsonLd, Section, SectionHead, Container, faqJsonLd, type FaqItem } from '@/components/marketing/blocks'

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

const cities = [
  ['Karachi', 'karachi'], ['Lahore', 'lahore'], ['Islamabad', 'islamabad'], ['Rawalpindi', 'rawalpindi'],
  ['Faisalabad', 'faisalabad'], ['Peshawar', 'peshawar'], ['Multan', 'multan'], ['Quetta', 'quetta'],
] as const

const faqs: FaqItem[] = [
  { q: 'How do my guests pay?', a: 'Guests pay you directly by bank transfer, JazzCash or EasyPaisa and upload a screenshot. You approve it in one tap and the QR ticket is issued. You keep full control of your money.' },
  { q: 'Do my guests need an account?', a: 'Yes. Guests sign up once with email, phone, date of birth, city and gender. It keeps your guest list real and lets us build a trust score for repeat attendees.' },
  { q: 'Can I run private or secret events?', a: 'Yes. Hide the venue until a time you choose, require approval for every guest, or restrict an event to ID verified guests on the Growth plan.' },
  { q: 'What do my gate staff need?', a: 'Nothing but a link. Send a temporary scanner link to your door team. They can scan tickets and look up guests, and nothing else.' },
  { q: 'What does it cost?', a: 'Every plan starts with a 14 day free trial. After that it is a flat monthly subscription from PKR 2,999. We do not take a cut of your ticket sales.' },
  { q: 'Which cities do you cover?', a: 'We launch in Karachi, Lahore and Islamabad, and organizers in other Pakistani cities can already list events.' },
]

const features = [
  { icon: Ticket, title: 'Tickets that fit your night', body: 'Early bird, general, VIP, free, invite only. Set caps, cutoffs and who can buy what.', span: 'lg:col-span-2' },
  { icon: Users, title: 'One guest list', body: 'Requests, payments, approvals and check-ins in a single view. Bulk approve in seconds.', span: '' },
  { icon: QrCode, title: 'Event Day', body: 'A fast scanner, a live count and instant guest lookup. Your whole door team on one screen.', span: '' },
  { icon: Share2, title: 'Promoters and referrals', body: 'Give every promoter a link, a code and a QR. See who sold what and what you owe them.', span: 'lg:col-span-2', tone: 'magenta' as const },
  { icon: EyeOff, title: 'Secret locations', body: 'Keep the venue hidden and reveal it to confirmed guests at the time you pick.', span: '' },
  { icon: Bell, title: 'Announcements', body: 'Push updates to everyone who registered. Door times, dress code, a change of plan.', span: '' },
  { icon: ShieldCheck, title: 'Guest score', body: 'See how reliable each guest has been before you approve them. Attended, no shows, ID verified.', span: '' },
  { icon: Receipt, title: 'Vendors and invoices', body: 'Keep your sound, security and catering contacts and their invoices next to your events.', span: '' },
  { icon: BarChart3, title: 'Analytics', body: 'Sales by day, by tier and by promoter. Export to Excel when your accountant asks.', span: '' },
]

const steps = [
  { n: '01', title: 'Create your event', body: 'Add details, tickets and rules. Hide the location if you want. Publish when ready.' },
  { n: '02', title: 'Approve and sell', body: 'Guests register and upload proof. You approve in one tap, or let promoters bring people in.' },
  { n: '03', title: 'Run the door', body: 'Scan QR tickets, watch the live count, and see exactly who came.' },
]

const plans = [
  { name: 'Starter', price: '2,999', note: 'For your first events', points: ['3 events a month', '150 guests per event', '2 gate staff links'] },
  { name: 'Growth', price: '7,999', note: 'Most organizers pick this', points: ['10 events a month', '1,000 guests per event', 'Automatic location reveal', 'Unlimited promoters'], featured: true },
  { name: 'Pro', price: '12,999', note: 'Agencies and venues', points: ['Unlimited events', 'Unlimited guests', 'White label tickets', 'Commission statements'] },
]

export default function Page() {
  return (
    <MarketingShell>
      <JsonLd data={[organizationSchema, websiteSchema, faqJsonLd(faqs)]} />

      {/* Hero */}
      <section className="pb-16 pt-14 sm:pb-24 sm:pt-24">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <Badge tone="accent" className="mx-auto">Built for organizers in Pakistan</Badge>
            <h1 className="mt-6 text-balance text-4xl font-semibold tracking-tight text-fg sm:text-6xl sm:leading-[1.05]">
              Sell tickets. Run the door.{' '}
              <span className="k-gradient-text">Know your crowd.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-muted">
              QR tickets, a guest list you control and a door scanner your team can use from a link. Made for parties, concerts, workshops and private events in Karachi, Lahore and Islamabad.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <ButtonLink href="/auth/login?flow=organizer-signup" size="lg" trailing={<ArrowRight className="h-4 w-4" />}>Start 14 day free trial</ButtonLink>
              <ButtonLink href="/how-it-works" size="lg" variant="secondary">See how it works</ButtonLink>
            </div>
            <p className="mt-4 text-sm text-subtle">No card needed. Cancel any time.</p>
          </div>
          <div className="mt-16 sm:mt-20"><ProductMock /></div>
        </Container>
      </section>

      {/* Features */}
      <Section id="features">
        <SectionHead eyebrow="Everything in one place" title="The tools an organizer actually uses" lead="No six tabs and a spreadsheet. One workspace from the first ticket to the last scan." />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, body, span, tone }) => (
            <div key={title} className={`group rounded-2xl bg-surface p-6 shadow-card transition-colors hover:bg-raised ${span}`}>
              <span className={`grid h-10 w-10 place-items-center rounded-xl ${tone === 'magenta' ? 'bg-magenta/12 text-magenta' : 'bg-accent/12 text-accent'}`}>
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="mt-5 text-base font-semibold text-fg">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Steps */}
      <Section className="pt-0">
        <SectionHead eyebrow="How it works" title="From idea to full house in three steps" />
        <ol className="mt-12 grid gap-4 md:grid-cols-3">
          {steps.map(s => (
            <li key={s.n} className="rounded-2xl bg-surface p-6 shadow-card">
              <span className="tnum text-sm font-semibold text-accent">{s.n}</span>
              <h3 className="mt-4 text-lg font-semibold text-fg">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
            </li>
          ))}
        </ol>
        <div className="mt-8"><ButtonLink href="/how-it-works" variant="outline" trailing={<ArrowRight className="h-4 w-4" />}>The full walkthrough</ButtonLink></div>
      </Section>

      {/* Guest score band */}
      <Section className="pt-0">
        <div className="grid items-center gap-10 rounded-3xl bg-surface p-8 shadow-card sm:p-12 lg:grid-cols-2">
          <div>
            <SectionHead eyebrow="Guest score" tone="magenta" title="Approve with confidence" lead="Every guest builds a score from the events they attend. You see who shows up, who ghosts and who is ID verified before you say yes." />
            <ul className="mt-6 space-y-3 text-sm text-muted">
              {['Attended and no show history', 'Streaks for guests who always come', 'Optional ID verification badge'].map(t => (
                <li key={t} className="flex items-center gap-2"><Check className="h-4 w-4 text-magenta" aria-hidden />{t}</li>
              ))}
            </ul>
          </div>
          <div aria-hidden className="rounded-2xl bg-canvas/60 p-5 shadow-card">
            {[['Hamza Siddiqui', 'Trusted', 'magenta', '12 attended'], ['Mehreen Qureshi', 'Regular', 'violet', '5 attended'], ['Danish Ali', 'New', 'info', 'First event']].map(([n, b, t, s]) => (
              <div key={n} className="flex items-center justify-between border-b border-line py-3 last:border-0">
                <div><p className="text-sm font-medium text-fg">{n}</p><p className="text-xs text-muted">{s}</p></div>
                <Badge tone={t as 'magenta' | 'violet' | 'info'}>{b}</Badge>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Pricing teaser */}
      <Section className="pt-0">
        <SectionHead align="center" eyebrow="Pricing" title="Simple monthly plans" lead="Every plan starts with 14 days free. We never take a cut of your ticket sales." />
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {plans.map(p => (
            <div key={p.name} className={`rounded-2xl bg-surface p-6 shadow-card ${p.featured ? 'k-gradient-ring' : ''}`}>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-fg">{p.name}</h3>
                {p.featured && <Badge tone="magenta">Popular</Badge>}
              </div>
              <p className="mt-1 text-sm text-muted">{p.note}</p>
              <p className="mt-5 text-3xl font-semibold tracking-tight tnum text-fg">PKR {p.price}<span className="text-sm font-normal text-muted"> /month</span></p>
              <ul className="mt-5 space-y-2.5 text-sm text-muted">
                {p.points.map(t => <li key={t} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />{t}</li>)}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-8 text-center"><ButtonLink href="/pricing" variant="outline" trailing={<ArrowRight className="h-4 w-4" />}>Compare every plan</ButtonLink></div>
      </Section>

      {/* Cities */}
      <Section className="pt-0">
        <SectionHead eyebrow="Find events" title="What is on near you" lead="Browse upcoming events by city." />
        <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {cities.map(([label, slug]) => (
            <li key={slug}>
              <Link href={`/explore/${slug}`} className="flex items-center justify-between rounded-xl bg-surface px-4 py-3.5 text-sm font-medium text-fg shadow-card transition-colors hover:bg-raised">
                {label}<ArrowRight className="h-4 w-4 text-subtle" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      {/* FAQ */}
      <Section className="pt-0">
        <div className="mx-auto max-w-3xl">
          <SectionHead align="center" eyebrow="Questions" title="Good to know" />
          <div className="mt-10"><Faq items={faqs} /></div>
        </div>
      </Section>

      <CtaBand />
    </MarketingShell>
  )
}
