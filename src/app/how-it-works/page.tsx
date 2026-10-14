import Link from 'next/link'
import { ArrowRight, Bell, CalendarPlus, CheckCircle2, CreditCard, QrCode, ScanLine, Search, ShieldCheck, Share2, Star, Upload } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { ButtonLink } from '@/components/kit'
import { MarketingShell } from '@/components/marketing/MarketingShell'
import { CtaBand, Faq, JsonLd, PageHero, Section, SectionHead, faqJsonLd, type FaqItem } from '@/components/marketing/blocks'

type Step = { icon: LucideIcon; title: string; body: string }

const organizer: Step[] = [
  { icon: CalendarPlus, title: 'Create your event', body: 'Add the details, cover image and ticket types. Choose open, approval only or invite only, and hide the venue if you like.' },
  { icon: Share2, title: 'Share and recruit promoters', body: 'Send your event link on WhatsApp and Instagram. Give each promoter their own link, code and QR so every sale is tracked.' },
  { icon: CheckCircle2, title: 'Approve guests', body: 'Guests pay you directly and upload a receipt. Check the payment and their guest score, then approve in one tap.' },
  { icon: Bell, title: 'Keep everyone in the loop', body: 'Post announcements to every registered guest, and reveal a secret location at the exact time you choose.' },
  { icon: ScanLine, title: 'Run the door', body: 'Send your door team a scanner link. Scan QR tickets, watch the live count and look up anyone by name.' },
]

const guest: Step[] = [
  { icon: Search, title: 'Find an event', body: 'Browse by city and category, or open a link from an organizer or promoter.' },
  { icon: CreditCard, title: 'Pay the organizer', body: 'Send the ticket price by bank transfer, JazzCash or EasyPaisa using the organizer\'s details.' },
  { icon: Upload, title: 'Upload your receipt', body: 'Add a screenshot of the transfer. The organizer checks it and approves your ticket.' },
  { icon: QrCode, title: 'Get your QR ticket', body: 'Your signed QR ticket appears in My tickets. Show it at the door.' },
  { icon: Star, title: 'Build your score', body: 'Every event you attend raises your guest score, which helps you get approved for the best nights.' },
]

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
  step: guest.slice(0, 4).map(s => ({ '@type': 'HowToStep', name: s.title, text: s.body })),
}

function Track({ eyebrow, title, steps, tone }: { eyebrow: string; title: string; steps: Step[]; tone?: 'magenta' }) {
  return (
    <Section className="pt-0">
      <SectionHead eyebrow={eyebrow} title={title} tone={tone} />
      <ol className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {steps.map((s, i) => (
          <li key={s.title} className="relative rounded-2xl bg-surface p-6 shadow-card">
            <div className="flex items-center justify-between">
              <span className={`grid h-10 w-10 place-items-center rounded-xl ${tone === 'magenta' ? 'bg-magenta/12 text-magenta' : 'bg-accent/12 text-accent'}`}><s.icon className="h-5 w-5" aria-hidden /></span>
              <span className="tnum text-sm font-semibold text-subtle">{String(i + 1).padStart(2, '0')}</span>
            </div>
            <h3 className="mt-5 text-base font-semibold text-fg">{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
          </li>
        ))}
      </ol>
    </Section>
  )
}

export default function HowItWorksPage() {
  return (
    <MarketingShell>
      <JsonLd data={[howTo, faqJsonLd(faqs)]} />
      <PageHero eyebrow="How it works" title="From first idea to last scan" lead="One flow for the people who host, and one for the people who come." >
        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/auth/login?flow=organizer-signup" trailing={<ArrowRight className="h-4 w-4" />}>Start free trial</ButtonLink>
          <ButtonLink href="/explore" variant="secondary">Browse events</ButtonLink>
        </div>
      </PageHero>
      <Track eyebrow="For organizers" title="Host an event in five steps" steps={organizer} />
      <Track eyebrow="For guests" title="Get into an event in five steps" steps={guest} tone="magenta" />
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
      <CtaBand />
    </MarketingShell>
  )
}
