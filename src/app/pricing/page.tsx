import type { Metadata } from 'next'
import { MarketingShell } from '@/components/marketing/MarketingShell'
import { CtaBand, Faq, JsonLd, Section, SectionHead, faqJsonLd, type FaqItem } from '@/components/marketing/blocks'
import { SplitWords, Reveal } from '@/components/marketing/home/motion'
import { PricingClient } from './PricingClient'

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Simple monthly plans for event organizers in Pakistan, from PKR 2,999. 14 day free trial, no card needed, and no cut of your ticket sales.',
  alternates: { canonical: 'https://www.tikkitx.com/pricing' },
  robots: { index: true, follow: true },
}

const faqs: FaqItem[] = [
  { q: 'Is there a free trial?', a: 'Yes. Every plan starts with 14 days free and no card. You can create events, approve guests and scan tickets during the trial.' },
  { q: 'Do you take a cut of my ticket sales?', a: 'No. You pay a flat subscription. Guests pay you directly by bank transfer, JazzCash or EasyPaisa, and the money never passes through us.' },
  { q: 'How do I pay for my plan?', a: 'By bank transfer to the Two Bit Digital account. Upload the screenshot, we approve it, and your plan activates. Each payment gets a numbered invoice.' },
  { q: 'Can I switch plans or cancel?', a: 'Yes. Upgrade whenever you need more room. Cancel at the end of any billing period and keep access until it runs out.' },
  { q: 'What does annual billing save?', a: 'You pay for ten months and get twelve. Starter is PKR 29,990 a year, Growth PKR 79,990 and Pro PKR 129,990.' },
  { q: 'Do guests pay anything?', a: 'No. Guests never pay TIKKIT X. They only pay the ticket price you set, to you.' },
]

export default function PricingPage() {
  return (
    <MarketingShell>
      <JsonLd data={faqJsonLd(faqs)} />
      <section className="relative isolate overflow-hidden pb-10 pt-16 text-center sm:pt-24" aria-labelledby="pricing-title">
        <div aria-hidden className="k-aurora absolute -left-[10%] top-[-30%] -z-10 h-[60vh] w-[70vw]" style={{ background: 'radial-gradient(closest-side, rgb(34 211 238 / 0.18), transparent)' }} />
        <div aria-hidden className="k-aurora absolute -right-[10%] top-[-20%] -z-10 h-[55vh] w-[60vw]" style={{ animationDelay: '-6s', background: 'radial-gradient(closest-side, rgb(214 96 236 / 0.18), transparent)' }} />
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Pricing</p>
          <h1 id="pricing-title" className="mt-4 text-balance text-5xl font-semibold tracking-tight text-fg sm:text-6xl"><SplitWords text="One flat price." /> <br /><SplitWords text="Your ticket money stays yours." wordClassName="k-gradient-text" delay={0.3} /></h1>
          <Reveal delay={0.5}><p className="mx-auto mt-5 max-w-xl text-lg text-muted">Pick the plan that fits how often you host. Every plan includes QR tickets, approvals and the Event Day scanner.</p></Reveal>
        </div>
      </section>
      <Section className="pt-0"><PricingClient /></Section>
      <Section className="pt-0">
        <div className="rounded-3xl bg-surface p-8 text-center shadow-card sm:p-12">
          <p className="text-lg text-fg sm:text-xl">An organizer selling 300 tickets at PKR 2,000 handles PKR 600,000.</p>
          <p className="mx-auto mt-3 max-w-2xl text-muted">Growth is about 1.3 percent of that. One extra sale from a promoter pays for several days of the plan.</p>
        </div>
      </Section>
      <Section className="pt-0">
        <div className="mx-auto max-w-3xl">
          <SectionHead align="center" eyebrow="Questions" title="Pricing FAQ" />
          <div className="mt-8"><Faq items={faqs} /></div>
        </div>
      </Section>
      <CtaBand />
    </MarketingShell>
  )
}
