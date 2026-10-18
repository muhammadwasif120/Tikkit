import type { Metadata } from 'next'
import { MarketingShell } from '@/components/marketing/MarketingShell'
import { CtaBand, JsonLd, PageHero, Section, SectionHead } from '@/components/marketing/blocks'

export const metadata: Metadata = {
  title: 'About',
  description: 'TIKKIT X is built by Two Bit Digital Ltd in Karachi. We make ticketing and guest management tools for Pakistani event organizers.',
  alternates: { canonical: 'https://www.tikkitx.com/about' },
  robots: { index: true, follow: true },
}

const jsonLd = [
  {
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
    foundingDate: '2024',
    foundingLocation: { '@type': 'Place', name: 'Karachi, Pakistan' },
    address: { '@type': 'PostalAddress', addressLocality: 'Karachi', addressCountry: 'PK' },
    description: 'Tikkit X is a Pakistani event management and ticketing platform built by Two Bit Digital Ltd. Guest lists, QR check-in, JazzCash & EasyPaisa payments. built for Pakistani organizers.',
    founder: {
      '@type': 'Person',
      '@id': 'https://www.tikkitx.com/#founder',
      name: 'Muhammad Wasif',
      jobTitle: 'Founder & CEO',
      url: 'https://www.tikkitx.com/about',
      worksFor: { '@id': 'https://www.tikkitx.com/#organization' },
    },
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
  },
  {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': 'https://www.tikkitx.com/#founder',
    name: 'Muhammad Wasif',
    jobTitle: 'Founder & CEO',
    url: 'https://www.tikkitx.com/about',
    worksFor: {
      '@type': 'Organization',
      '@id': 'https://www.tikkitx.com/#organization',
      name: 'Two Bit Digital Ltd',
    },
    knowsAbout: [
      'Event Management',
      'Event Ticketing',
      'Software Product Development',
      'Pakistan Tech Startups',
    ],
  },
]

const facts = [
  ['Company', 'Two Bit Digital Ltd'],
  ['Based in', 'Karachi, Pakistan'],
  ['Cities', 'Karachi, Lahore, Islamabad'],
  ['Founded', '2024'],
]

const beliefs = [
  { title: 'Organizers stay in control', body: 'You set the rules, approve the guests and keep your money. We build the tools, not the gatekeeping.' },
  { title: 'Built for how Pakistan pays', body: 'JazzCash, EasyPaisa and bank transfers are the norm, so the product starts there instead of treating them as an afterthought.' },
  { title: 'Respect the private night', body: 'Some of the best events are small, hidden and invite only. Secret venues and approval lists are core features, not workarounds.' },
]

export default function AboutPage() {
  return (
    <MarketingShell>
      <JsonLd data={jsonLd} />
      <PageHero
        eyebrow="About"
        title="Made in Karachi, for the people who throw the best nights"
        lead="TIKKIT X started with private and underground parties, where a spreadsheet and a WhatsApp group were the only tools on offer. We built the product we wanted at the door."
      />
      <Section className="pt-0">
        <SectionHead eyebrow="What we believe" title="Three ideas behind the product" />
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {beliefs.map(b => (
            <div key={b.title} className="rounded-2xl bg-surface p-6 shadow-card">
              <h3 className="text-lg font-semibold text-fg">{b.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{b.body}</p>
            </div>
          ))}
        </div>
      </Section>
      <Section className="pt-0">
        <div className="grid gap-8 rounded-3xl bg-surface p-8 shadow-card sm:p-12 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-magenta">Founder</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-fg">Muhammad Wasif</h2>
            <p className="mt-1 text-sm text-muted">Founder and CEO, Two Bit Digital Ltd</p>
            <p className="mt-5 text-[15px] leading-relaxed text-muted">
              Muhammad leads Two Bit Digital and the product. The goal is simple: give Pakistani organizers the tools that global platforms take for granted, and keep them local and reliable.
            </p>
          </div>
          <dl className="grid content-start gap-4">
            {facts.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 border-b border-line pb-3 last:border-0">
                <dt className="text-sm text-muted">{k}</dt><dd className="text-sm font-medium text-fg">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Section>
      <CtaBand />
    </MarketingShell>
  )
}
