import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Check } from 'lucide-react'
import { MarketingShell } from '@/components/marketing/MarketingShell'
import { CtaBand, Faq, JsonLd, PageHero, Section, SectionHead, faqJsonLd, type FaqItem } from '@/components/marketing/blocks'

type Props = { params: Promise<{ competitor: string }> }

const PAGES = {
  'tikkit-vs-ticketwala': {
    name: 'Ticketwala',
    title: 'Tikkit vs Ticketwala: Best Event Ticketing Platform in Pakistan 2026',
    h1: 'TIKKIT X vs Ticketwala',
    shortTitle: 'Tikkit vs Ticketwala: Why Organizers Are Switching',
    description: 'Comparing TIKKIT X and Ticketwala for event organizers in Pakistan. Guest approval, signed QR tickets, referral tracking and a flat subscription with no cut of your sales.',
    keywords: ['tikkit vs ticketwala', 'ticketwala alternative Pakistan', 'best event ticketing Pakistan', 'event platform Pakistan', 'sell event tickets Pakistan'],
    lead: 'Looking at Ticketwala for your next event? Here is what TIKKIT X is built around, and the questions worth asking any ticketing platform before you commit.',
    faqs: [
      { q: 'Does TIKKIT X take a percentage of my ticket sales?', a: 'No. You pay a flat monthly subscription from PKR 2,999. Guests pay you directly, so your ticket money never sits with us.' },
      { q: 'Can I control exactly who attends?', a: "Yes. Run approval only events, invite only events, secret venues and ID verified only events, and see each guest's attendance history before you approve them." },
      { q: 'Does TIKKIT X support JazzCash and EasyPaisa?', a: 'Yes. Guests pay by bank transfer, JazzCash or EasyPaisa and upload a receipt. You approve it in one tap and the QR ticket is issued.' },
      { q: 'How are tickets protected from sharing?', a: 'Every QR code is signed and single use. The first valid scan admits the guest and any second scan is rejected.' },
      { q: 'Can I try it before paying?', a: 'Yes. Every plan starts with 14 days free and no card.' },
    ] as FaqItem[],
  },
  'tikkit-vs-bookme': {
    name: 'Bookme.pk',
    title: 'Tikkit vs Bookme.pk: Best Bookme Alternative for Events in Pakistan',
    h1: 'TIKKIT X vs Bookme.pk',
    shortTitle: 'Tikkit vs Bookme.pk: The Events-Only Alternative',
    description: 'Looking for a Bookme.pk alternative for events? TIKKIT X is built only for live events, with guest list control, signed QR tickets and referral tracking.',
    keywords: ['tikkit vs bookme', 'bookme alternative Pakistan', 'bookme alternative events', 'event ticketing app Pakistan', 'better than bookme'],
    lead: 'Bookme.pk covers many kinds of booking. TIKKIT X does one thing: help organizers run live events. Here is where that focus shows up.',
    faqs: [
      { q: 'What is the main difference between TIKKIT X and Bookme.pk?', a: 'TIKKIT X is made only for organizers of live events. Every feature, from guest approval to the door scanner, is designed around running an event rather than selling general bookings.' },
      { q: 'Is TIKKIT X suitable for private events?', a: 'Yes. Approval lists, invite only events and secret venues are core features.' },
      { q: 'Does TIKKIT X support JazzCash and EasyPaisa?', a: 'Yes. Guests pay you by bank transfer, JazzCash or EasyPaisa and upload a receipt for you to approve.' },
      { q: 'Can I manage my guest list and my door team?', a: 'Yes. One guest list covers requests, payments, approvals and check-ins, and your gate staff scan from a temporary link with no app download.' },
      { q: 'What does it cost?', a: 'A flat monthly subscription from PKR 2,999 after a 14 day free trial. We do not take a cut of ticket sales.' },
    ] as FaqItem[],
  },
} as const

type Slug = keyof typeof PAGES

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { competitor } = await params
  const page = PAGES[competitor as Slug]
  if (!page) return { title: 'Compare TIKKIT X', alternates: { canonical: `https://www.tikkitx.com/compare/${competitor}` } }
  const url = `https://www.tikkitx.com/compare/${competitor}`
  return {
    title: page.title,
    description: page.description,
    keywords: [...page.keywords],
    alternates: { canonical: url },
    openGraph: { title: page.shortTitle, description: page.description, url, type: 'article', images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: page.title }] },
    twitter: { card: 'summary_large_image', title: page.shortTitle, description: page.description, images: ['/og-image.jpg'] },
  }
}

const strengths = [
  { title: 'Your money stays yours', body: 'Guests pay you directly and you approve each payment. We charge a flat subscription, never a cut.' },
  { title: 'Control over who comes', body: 'Approval lists, invite only events, secret venues and ID verified only events.' },
  { title: 'Guest score', body: "See each guest's attendance history and no shows before you say yes." },
  { title: 'Signed, single use QR tickets', body: 'A screenshot cannot get a second person in.' },
  { title: 'Promoters and commissions', body: 'Links, codes and QR for every promoter, with commissions tracked for you.' },
  { title: 'A door team on a link', body: 'Gate staff scan and look up guests from a temporary link. No accounts, no app.' },
]

const questions = [
  'Do they take a percentage of every ticket, and when do you get paid?',
  'Can you approve guests before they get a ticket?',
  'Can you hide the venue until a time you choose?',
  "Can you see a guest's attendance history?",
  'Can you track which promoter sold which ticket?',
  'Can your door team scan without creating accounts?',
]

export default async function ComparePage({ params }: Props) {
  const { competitor } = await params
  const page = PAGES[competitor as Slug]
  if (!page) notFound()
  const url = `https://www.tikkitx.com/compare/${competitor}`

  return (
    <MarketingShell>
      <JsonLd data={[
        { '@context': 'https://schema.org', '@type': 'Article', headline: page.shortTitle, description: page.description, url, publisher: { '@type': 'Organization', '@id': 'https://www.tikkitx.com/#organization', name: 'Tikkit X' }, about: [{ '@type': 'SoftwareApplication', name: 'Tikkit X', url: 'https://www.tikkitx.com' }, { '@type': 'SoftwareApplication', name: page.name }] },
        { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.tikkitx.com' }, { '@type': 'ListItem', position: 2, name: page.shortTitle, item: url }] },
        faqJsonLd(page.faqs),
      ]} />
      <PageHero eyebrow="Compare" title={page.h1} lead={page.lead} />

      <Section className="pt-0">
        <SectionHead title="What TIKKIT X is built around" />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {strengths.map(s => (
            <div key={s.title} className="rounded-2xl bg-surface p-6 shadow-card">
              <Check className="h-5 w-5 text-accent" aria-hidden />
              <h3 className="mt-4 text-base font-semibold text-fg">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section className="pt-0">
        <div className="rounded-3xl bg-surface p-8 shadow-card sm:p-12">
          <SectionHead eyebrow="Before you choose" tone="magenta" title={`Questions to ask ${page.name} or any platform`} lead="Features and pricing change, so check each provider's current offer. These are the things that matter on event day." />
          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {questions.map(q => (
              <li key={q} className="flex gap-3 rounded-xl bg-canvas/60 p-4 text-sm text-fg shadow-card">
                <span aria-hidden className="mt-0.5 text-magenta">?</span>{q}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm text-subtle">With TIKKIT X, the answer to every one of these is yes, on a flat subscription.</p>
        </div>
      </Section>

      <Section className="pt-0">
        <div className="mx-auto max-w-3xl">
          <SectionHead align="center" eyebrow="Questions" title="Frequently asked" />
          <div className="mt-8"><Faq items={page.faqs} /></div>
          <p className="mt-6 text-center text-xs text-subtle">Comparisons are based on public information and may change. {page.name} is a trademark of its owner and is not affiliated with TIKKIT X.</p>
        </div>
      </Section>
      <CtaBand />
    </MarketingShell>
  )
}
