import type { Metadata } from 'next'
import { MarketingShell } from '@/components/marketing/MarketingShell'
import { ProductMock } from '@/components/marketing/ProductMock'
import { CtaBand, Container, PageHero, Section, SectionHead } from '@/components/marketing/blocks'

export const metadata: Metadata = {
  title: 'Product tour',
  description: 'See how TIKKIT X works for organizers: sales, approvals, the door scanner and promoter tracking in one workspace.',
  alternates: { canonical: 'https://www.tikkitx.com/demo' },
}

const tour = [
  ['Sales and approvals', 'See tickets sold, revenue and every request waiting on you. Approve a payment in one tap and the QR ticket is issued.'],
  ['The door', 'Door staff open a scanner link on their phone. Each scan shows who is admitted, who is a VIP and who already came in.'],
  ['Promoters', 'Give every promoter a link, a code and a QR. Their sales and commission are tracked for you.'],
  ['Your crowd', 'Guest score shows attendance history and verified IDs before you approve someone.'],
]

export default function DemoPage() {
  return (
    <MarketingShell>
      <PageHero eyebrow="Product tour" title="See it in action" lead="A quick look at the workspace organizers use to sell tickets and run the door." />
      <Container className="pb-8"><ProductMock /></Container>
      <Section><SectionHead eyebrow="What you are looking at" title="Four things that save a night" />
        <div className="mt-10 grid gap-4 sm:grid-cols-2">{tour.map(([t, b]) => <div key={t} className="rounded-2xl bg-surface p-6 shadow-card"><h3 className="text-base font-semibold text-fg">{t}</h3><p className="mt-2 text-sm leading-relaxed text-muted">{b}</p></div>)}</div></Section>
      <CtaBand />
    </MarketingShell>
  )
}
