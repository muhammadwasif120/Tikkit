import Link from 'next/link'
import { HowSteps } from '@/components/marketing/home/HowSteps'
import { SplitWords } from '@/components/marketing/home/motion'
import { Skyline, Stars } from '@/components/marketing/home/scenes'
import { GUEST_STEPS } from '@/lib/howSteps'
import { ArrowRight, ShieldCheck } from 'lucide-react'
import { ButtonLink } from '@/components/kit'
import { MarketingShell } from '@/components/marketing/MarketingShell'
import { Faq, JsonLd, Section, SectionHead, faqJsonLd, type FaqItem } from '@/components/marketing/blocks'

const faqs: FaqItem[] = [
  { q: 'How do I sell tickets for my event in Pakistan?', a: 'Sign up, create your event page, set your ticket prices in PKR and share the link. Guests register, pay you directly and upload a receipt. You approve each one and a signed QR ticket is issued.' },
  { q: 'Is TIKKIT X free for event organizers?', a: 'Every plan starts with a 14 day free trial. After that it is a flat monthly subscription from PKR 2,999. We do not take a cut of your ticket sales.' },
  { q: 'How does TIKKIT X prevent ticket fraud?', a: 'Every ticket carries a cryptographically signed, single use QR code. A screenshot cannot admit a second person, and duplicate payment receipts are flagged.' },
  { q: 'Can I control who attends my event?', a: 'Yes. Choose open registration, approval required or invite only. You can approve or reject each guest and see their attendance history first.' },
  { q: 'What payment methods are supported?', a: 'Guests pay you by bank transfer, JazzCash or EasyPaisa in PKR and upload a receipt for you to approve.' },
  { q: 'Which cities do you serve?', a: 'We focus on Karachi, Lahore and Islamabad. Organizers from any Pakistani city can create events.' },
  { q: 'What types of events can I host?', a: 'Concerts, parties, tech meetups, corporate evenings, art shows, sports days, comedy nights, workshops and more.' },
  { q: 'How is TIKKIT X different from Bookme or Ticketwala?', a: 'TIKKIT X is built for organizers of live events. You get guest approval, referral tracking, secret venues and a door scanner on a flat subscription, with your ticket money going straight to you.' },
]

const howTo = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'How to book tickets on TIKKIT X',
  description: 'Find an event, pay the organizer, upload your receipt and receive a signed QR ticket.',
  step: GUEST_STEPS.slice(0, 4).map(s => ({ '@type': 'HowToStep', name: s.title, text: s.body })),
}

export default function HowItWorksPage() {
  return (
    <MarketingShell>
      <JsonLd data={[howTo, faqJsonLd(faqs)]} />
      <section className="k-night relative isolate overflow-hidden pb-32 pt-20 text-center sm:pb-48 sm:pt-28" aria-labelledby="how-title">
        <div aria-hidden className="absolute inset-0 -z-10" style={{ background: 'radial-gradient(120% 90% at 50% 0%, #1a1245 0%, #0b0c1c 50%, #070911 85%)' }} />
        <div aria-hidden className="k-aurora absolute -left-[15%] top-[-20%] -z-10 h-[70vh] w-[80vw]" style={{ background: 'radial-gradient(closest-side, rgb(34 211 238 / 0.26), transparent)' }} />
        <div aria-hidden className="k-aurora absolute -right-[15%] top-[-10%] -z-10 h-[65vh] w-[70vw]" style={{ animationDelay: '-6s', background: 'radial-gradient(closest-side, rgb(214 96 236 / 0.26), transparent)' }} />
        <Stars className="absolute inset-0 -z-10" count={28} />
        <Skyline className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-24 w-full sm:h-40" />
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">How it works</p>
          <h1 id="how-title" className="mt-4 text-balance text-5xl font-semibold tracking-tight text-fg sm:text-6xl"><SplitWords text="From first idea" /> <br /><SplitWords text="to last scan." wordClassName="k-gradient-text" delay={0.3} /></h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-muted">One flow for the people who host, and one for the people who come.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/auth/login?flow=organizer-signup" trailing={<ArrowRight className="h-4 w-4" />}>Start free trial</ButtonLink>
            <ButtonLink href="/explore" variant="secondary">Browse events</ButtonLink>
          </div>
        </div>
      </section>
      <Section><HowSteps /></Section>
      <div className="k-day pb-8 pt-16">
      <Section className="pt-0">
        <div className="flex items-start gap-4 rounded-2xl bg-surface p-6 shadow-card sm:p-8">
          <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0 text-accent" aria-hidden />
          <div>
            <h2 className="text-lg font-semibold text-fg">Safe by design</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted">Signed single use tickets, receipt checks and locked down guest data. <Link href="/security" className="text-accent hover:underline">Read how security works</Link>.</p>
          </div>
        </div>
      </Section>
      <Section className="pt-0">
        <div className="mx-auto max-w-3xl">
          <SectionHead align="center" eyebrow="Questions" title="Frequently asked" />
          <div className="mt-8"><Faq items={faqs} /></div>
        </div>
      </Section>
      </div>
      <section className="k-night relative isolate overflow-hidden py-28 text-center sm:py-36" aria-labelledby="how-final">
        <div aria-hidden className="absolute inset-0 -z-10" style={{ background: 'linear-gradient(180deg, #fff1dc 0%, #f08a6b 18%, #6d2c63 45%, #1b1038 70%, #070911 100%)' }} />
        <Stars className="absolute inset-0 -z-10 opacity-70" count={30} />
        <Skyline className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-28 w-full sm:h-40" />
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 id="how-final" className="text-balance text-4xl font-semibold tracking-tight text-white sm:text-6xl">Ready when you are.</h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-white/75">Start free for 14 days. Your first event can be live in about ten minutes.</p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <ButtonLink href="/auth/login?flow=organizer-signup" size="lg" trailing={<ArrowRight className="h-4 w-4" />}>Start free trial</ButtonLink>
            <ButtonLink href="/pricing" size="lg" variant="secondary">See pricing</ButtonLink>
          </div>
        </div>
      </section>
    </MarketingShell>
  )
}
