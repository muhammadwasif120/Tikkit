import type { Metadata } from 'next'
import { Database, Lock, QrCode, ScanLine } from 'lucide-react'
import { MarketingShell } from '@/components/marketing/MarketingShell'
import { CtaBand, Faq, JsonLd, PageHero, Section, SectionHead, faqJsonLd, type FaqItem } from '@/components/marketing/blocks'

export const metadata: Metadata = {
  title: 'Security',
  description: 'How TIKKIT X protects your tickets, guests and payments: signed single use QR codes, payment receipt checks and encrypted guest data.',
  alternates: { canonical: 'https://www.tikkitx.com/security' },
  robots: { index: true, follow: true },
}

const faqs: FaqItem[] = [
  { q: 'Can someone screenshot a QR ticket and share it?', a: 'No. Every TIKKIT X QR code is cryptographically signed and single use. The moment a ticket is scanned at the door it is marked as used. Any later scan of the same code, screenshot or original, is rejected.' },
  { q: 'What happens if the internet goes down at check-in?', a: 'The scanner works offline. Your guest list is downloaded to the device before the event. Scans are recorded locally and synced when the connection returns.' },
  { q: 'How does TIKKIT X verify JazzCash and EasyPaisa payments?', a: 'Guests upload a screenshot of their transfer receipt when they register. You verify it with one tap from your dashboard. Duplicate transaction IDs are flagged automatically so one receipt cannot register two guests.' },
  { q: 'Can I see who has and has not checked in?', a: 'Yes. Your dashboard shows live check-in status for every guest: who is inside, who has not arrived, and who was turned away.' },
  { q: 'Is guest data stored securely?', a: 'Guest data lives in an encrypted Postgres database with row level security. Only you and the team members you authorise can see your guest list.' },
]

const pillars = [
  { icon: QrCode, title: 'Signed QR tickets', body: 'Each ticket carries a signature tied to the guest, the event and the ticket. It cannot be forged or duplicated, and the scanner checks it in milliseconds.' },
  { icon: ScanLine, title: 'One scan, one entry', body: 'The first valid scan admits the guest and locks the ticket. A second attempt shows who was admitted and when.' },
  { icon: Lock, title: 'Receipt checks', body: 'Payment proofs are reviewed by you. Duplicate transaction IDs are caught before a ticket is issued.' },
  { icon: Database, title: 'Locked down data', body: 'Row level security means every query is limited to the organizer who owns the data. Gate staff links can only scan and look up guests.' },
]

export default function SecurityPage() {
  return (
    <MarketingShell>
      <JsonLd data={faqJsonLd(faqs)} />
      <PageHero eyebrow="Security" title="Built so a screenshot is worth nothing" lead="Door fraud and fake receipts are the two ways events lose money. Here is how we shut both down." />
      <Section className="pt-0">
        <div className="grid gap-4 sm:grid-cols-2">
          {pillars.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-2xl bg-surface p-6 shadow-card">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent/12 text-accent"><Icon className="h-5 w-5" aria-hidden /></span>
              <h2 className="mt-5 text-lg font-semibold text-fg">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
            </div>
          ))}
        </div>
      </Section>
      <Section className="pt-0">
        <div className="mx-auto max-w-3xl">
          <SectionHead eyebrow="Questions" title="Security FAQ" />
          <div className="mt-8"><Faq items={faqs} /></div>
        </div>
      </Section>
      <CtaBand />
    </MarketingShell>
  )
}
