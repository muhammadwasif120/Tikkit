import type { Metadata } from 'next'
import { ArrowRight, Mail, MessageCircle } from 'lucide-react'
import { MarketingShell } from '@/components/marketing/MarketingShell'
import { Container, PageHero } from '@/components/marketing/blocks'

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Talk to the TIKKIT X team. We reply on WhatsApp and email within a few hours, seven days a week.',
  alternates: { canonical: 'https://www.tikkitx.com/contact' },
  robots: { index: true, follow: true },
}

const WA_NUMBER = '13074434195'
const WA_ORGANISER = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent('Hi TIKKIT X, I want to run an event')}`
const WA_GENERAL = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent('Hi TIKKIT X, I have a question')}`

export default function ContactPage() {
  const card = 'group flex items-center gap-4 rounded-2xl p-5 shadow-card transition-colors'
  return (
    <MarketingShell>
      <PageHero eyebrow="Contact" title="Talk to a real person" lead="We reply within a few hours, seven days a week. WhatsApp is the fastest way." />
      <Container className="pb-24">
        <div className="grid max-w-3xl gap-4">
          <a href={WA_ORGANISER} target="_blank" rel="noopener noreferrer" className={`${card} bg-accent text-accent-fg hover:bg-accent/90`}>
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-accent-fg/10"><MessageCircle className="h-6 w-6" aria-hidden /></span>
            <span className="flex-1"><span className="block text-base font-semibold">I want to run an event</span><span className="block text-sm opacity-75">WhatsApp. Opens a chat right away.</span></span>
            <ArrowRight className="h-5 w-5 opacity-70 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </a>
          <a href={WA_GENERAL} target="_blank" rel="noopener noreferrer" className={`${card} bg-surface hover:bg-raised`}>
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-success/12 text-success"><MessageCircle className="h-6 w-6" aria-hidden /></span>
            <span className="flex-1"><span className="block text-base font-semibold text-fg">I have a question</span><span className="block text-sm text-muted">WhatsApp. For guests and general enquiries.</span></span>
            <ArrowRight className="h-5 w-5 text-subtle transition-transform group-hover:translate-x-0.5" aria-hidden />
          </a>
          <a href="mailto:hello@tikkitx.com" className={`${card} bg-surface hover:bg-raised`}>
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-overlay text-muted"><Mail className="h-6 w-6" aria-hidden /></span>
            <span className="flex-1"><span className="block text-base font-semibold text-fg">hello@tikkitx.com</span><span className="block text-sm text-muted">Email, for partnerships and longer questions.</span></span>
            <ArrowRight className="h-5 w-5 text-subtle transition-transform group-hover:translate-x-0.5" aria-hidden />
          </a>
        </div>
        <p className="mt-8 text-sm text-subtle">Two Bit Digital Ltd, Karachi, Pakistan.</p>
      </Container>
    </MarketingShell>
  )
}
