import type { Metadata } from 'next'
import { ArrowRight, CalendarDays, Mountain, QrCode, Share2, Sparkles, Users } from 'lucide-react'
import { MarketingShell } from '@/components/marketing/MarketingShell'
import { DemoWorkspace } from '@/components/marketing/demo/DemoWorkspace'
import { CtaBand, Container, PageHero, Section, SectionHead } from '@/components/marketing/blocks'
import { Button } from '@/components/kit'
import { startDemo } from '@/app/actions/demoActions'

export const metadata: Metadata = {
  title: 'Product tour',
  description: 'Try the real TIKKIT X organizer workspace with sample data and a guided tour: events, guest approvals, the door, promoters, classes, spaces and retreats.',
  alternates: { canonical: 'https://www.tikkitx.com/demo' },
}

const try_ = [
  [Users, 'Approve a guest', 'Open Guests, review a receipt and approve. The ticket is issued.'],
  [QrCode, 'Run the door', 'Event Day shows tonight\'s check-ins and the gate scanner link.'],
  [Share2, 'Track a promoter', 'Referrals has links, codes and commission per promoter.'],
  [Sparkles, 'Sell a class pass', 'Classes covers series, drop-ins and multi-session passes.'],
  [CalendarDays, 'Book a space', 'Spaces handles hourly reservations with optional approval.'],
  [Mountain, 'Plan a retreat', 'Retreats builds itineraries, participants and budgets.'],
] as const

const notes: Record<string, string> = {
  unavailable: 'The live demo is not available right now. Try the preview below.',
  loggedin: 'You are logged in to your own account. Log out first to try the demo.',
  busy: 'Too many attempts. Wait a few minutes and try again.',
}

export default async function DemoPage({ searchParams }: { searchParams: Promise<{ demo?: string }> }) {
  const { demo } = await searchParams
  const live = process.env.DEMO_ENABLED === '1'
  return (
    <MarketingShell>
      <PageHero eyebrow={live ? 'Live demo' : 'Product tour'} title={live ? 'Try the real thing' : 'See it in action'} lead={live ? 'Step into the real software with sample data, as an organizer running events or as a guest with tickets, passes and a retreat invite. Nothing is emailed, and the data resets every night.' : 'A clickable preview of the organizer workspace with a guided tour.'} />
      {live && (
        <Container className="pb-12">
          <div className="mx-auto flex max-w-xl flex-col items-center gap-3 text-center">
            <form action={startDemo} className="flex flex-col items-stretch gap-3 sm:flex-row">
              <Button type="submit" name="role" value="organizer" size="lg" trailing={<ArrowRight className="h-4 w-4" />}>Demo as an organizer</Button>
              <Button type="submit" name="role" value="attendee" size="lg" variant="secondary" trailing={<ArrowRight className="h-4 w-4" />}>Demo as an attendee</Button>
            </form>
            <p className="text-sm text-subtle">No sign up. A guided tour starts when you arrive.</p>
            {demo && notes[demo] && <p role="status" className="rounded-xl bg-warning/10 px-4 py-3 text-sm text-warning">{notes[demo]}</p>}
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {try_.map(([Icon, t, d]) => (
              <div key={t} className="rounded-2xl bg-surface p-5 shadow-card ring-1 ring-line"><span className="grid h-10 w-10 place-items-center rounded-xl bg-accent/12 text-accent"><Icon className="h-5 w-5" aria-hidden /></span><h3 className="mt-3 font-semibold text-fg">{t}</h3><p className="mt-1 text-sm text-muted">{d}</p></div>
            ))}
          </div>
        </Container>
      )}
      <Section className={live ? 'pt-0' : 'pt-0'}>
        {live && <SectionHead align="center" eyebrow="Preview" title="Or take a quick look first" />}
        <div className={live ? 'mt-8' : ''}><DemoWorkspace autoStart={!live} /></div>
      </Section>
      <CtaBand />
    </MarketingShell>
  )
}
