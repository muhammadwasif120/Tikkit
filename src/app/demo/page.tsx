import type { Metadata } from 'next'
import { MarketingShell } from '@/components/marketing/MarketingShell'
import { DemoWorkspace } from '@/components/marketing/demo/DemoWorkspace'
import { CtaBand, Container, PageHero } from '@/components/marketing/blocks'

export const metadata: Metadata = {
  title: 'Product tour',
  description: 'Try the TIKKIT X organizer workspace with a guided tour: events, guest approvals, the door scanner, promoters, classes, spaces and retreats.',
  alternates: { canonical: 'https://www.tikkitx.com/demo' },
}

export default function DemoPage() {
  return (
    <MarketingShell>
      <PageHero eyebrow="Product tour" title="Try it before you sign up" lead="A live, clickable workspace with sample data. Follow the guided tour, or jump straight to any section." />
      <Container className="pb-16"><DemoWorkspace /></Container>
      <CtaBand />
    </MarketingShell>
  )
}
