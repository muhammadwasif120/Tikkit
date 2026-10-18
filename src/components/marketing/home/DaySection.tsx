'use client'

import { useState } from 'react'
import { ArrowRight, Briefcase, Building2, Check, ChevronDown, Sparkles } from 'lucide-react'
import { ButtonLink } from '@/components/kit'
import { Marquee, Reveal } from './motion'
import { cn } from '@/lib/cn'

function Tile({ eyebrow, title, body, pro, children, delay = 0 }: { eyebrow: string; title: string; body: string; pro?: boolean; children: React.ReactNode; delay?: number }) {
  return (
    <Reveal delay={delay} className="flex flex-col overflow-hidden rounded-3xl bg-surface shadow-card">
      <div className="min-h-[280px] bg-gradient-to-b from-overlay/60 to-transparent p-5">{children}</div>
      <div className="p-6 pt-3">
        <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">{eyebrow}{pro && <span className="rounded-full bg-magenta/14 px-2 py-0.5 text-[10px] tracking-wide text-magenta">Pro</span>}</p>
        <h3 className="mt-2 text-xl font-semibold tracking-tight text-fg">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
      </div>
    </Reveal>
  )
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const CLASSES: Record<string, { t: string; n: string; left: string; pass?: boolean }[]> = {
  Mon: [{ t: '7:00 am', n: 'Morning yoga', left: '4 spots', pass: true }, { t: '6:30 pm', n: 'Pottery basics', left: '2 spots' }],
  Tue: [{ t: '6:00 pm', n: 'Salsa for beginners', left: '6 spots', pass: true }],
  Wed: [{ t: '7:00 am', n: 'Morning yoga', left: '3 spots', pass: true }, { t: '7:00 pm', n: 'Sketching night', left: 'Full' }],
  Thu: [{ t: '6:30 pm', n: 'Pottery basics', left: '5 spots' }],
  Fri: [{ t: '7:00 am', n: 'Morning yoga', left: '8 spots', pass: true }, { t: '5:00 pm', n: 'Boxing fundamentals', left: '3 spots', pass: true }],
  Sat: [{ t: '10:00 am', n: 'Family art workshop', left: '9 spots' }, { t: '4:00 pm', n: 'Sunset run club', left: '12 spots', pass: true }],
  Sun: [{ t: '9:00 am', n: 'Brunch and breathwork', left: '7 spots' }],
}
function ClassSchedule() {
  const [d, setD] = useState('Sat')
  return (
    <div>
      <div role="tablist" aria-label="Day of the week" className="flex gap-1">{DAYS.map(x => <button key={x} role="tab" aria-selected={d === x} onClick={() => setD(x)} className={cn('flex-1 rounded-lg py-1.5 text-xs font-medium transition-colors', d === x ? 'bg-accent text-accent-fg' : 'bg-raised text-muted hover:text-fg')}>{x}</button>)}</div>
      <ul key={d} className="mt-3 space-y-2">
        {CLASSES[d].map(c => (
          <li key={c.n + c.t} className="k-pop-in flex items-center gap-3 rounded-xl bg-raised px-3 py-2.5 shadow-card">
            <span className="tnum w-16 text-xs font-semibold text-accent">{c.t}</span>
            <span className="flex-1 text-sm font-medium text-fg">{c.n}</span>
            {c.pass && <span className="rounded-full bg-violet/14 px-1.5 py-0.5 text-[10px] font-medium text-violet">Pass</span>}
            <span className={cn('text-[11px]', c.left === 'Full' ? 'text-danger' : 'text-muted')}>{c.left}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-subtle">Drop in or use a 10 class pack.</p>
    </div>
  )
}

const SLOTS = [['10:00', true], ['11:00', false], ['12:00', true], ['2:00', true], ['3:00', false], ['4:00', true], ['5:00', true], ['6:00', true]] as const
function SpaceSlots() {
  const [pick, setPick] = useState('4:00')
  return (
    <div>
      <div className="flex items-center justify-between"><p className="text-sm font-semibold text-fg">Studio One</p><span className="text-xs text-muted">Sat, 18 Oct</span></div>
      <div role="radiogroup" aria-label="Time slots" className="mt-3 grid grid-cols-4 gap-2">
        {SLOTS.map(([t, free]) => <button key={t} role="radio" aria-checked={pick === t} disabled={!free} onClick={() => setPick(t)} className={cn('rounded-lg py-2 text-xs font-medium ring-1 transition-colors', !free ? 'cursor-not-allowed text-subtle line-through ring-line opacity-50' : pick === t ? 'bg-accent text-accent-fg ring-accent' : 'bg-raised text-fg ring-line hover:bg-overlay')}>{t}</button>)}
      </div>
      <div className="mt-4 rounded-xl bg-raised p-3 shadow-card"><p className="text-xs text-muted">Your booking</p><p className="mt-0.5 text-sm font-medium text-fg">{pick} pm · 1 hour · PKR 3,000</p><p className="mt-1 text-xs text-success">Pay by transfer, confirmed after review</p></div>
    </div>
  )
}

const TRIP = [
  { d: 'Day 1', t: 'Arrive and settle in', items: ['8:00 am Pickup from Islamabad', '1:00 pm Lunch at the lodge', '7:00 pm Welcome dinner'] },
  { d: 'Day 2', t: 'Team day', items: ['9:00 am Strategy session', '2:00 pm Valley hike', '8:00 pm Bonfire'] },
  { d: 'Day 3', t: 'Wrap up', items: ['9:30 am Breakfast', '11:00 am Closing circle', '1:00 pm Drive back'] },
]
function RetreatDays() {
  const [open, setOpen] = useState(1)
  return (
    <div>
      <div className="flex items-center justify-between"><p className="text-sm font-semibold text-fg">Hunza Offsite</p><span className="rounded-full bg-success/12 px-2 py-0.5 text-[11px] font-medium text-success">12 of 18 confirmed</span></div>
      <ul className="mt-3 space-y-2">
        {TRIP.map((x, i) => (
          <li key={x.d} className="overflow-hidden rounded-xl bg-raised shadow-card">
            <button onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i} className="flex w-full items-center gap-2 px-3 py-2.5 text-left"><span className="text-[11px] font-semibold uppercase text-accent">{x.d}</span><span className="flex-1 text-sm font-medium text-fg">{x.t}</span><ChevronDown className={cn('h-4 w-4 text-subtle transition-transform', open === i && 'rotate-180')} /></button>
            {open === i && <ul className="k-pop-in space-y-1 px-3 pb-3 text-xs text-muted">{x.items.map(it => <li key={it} className="flex items-center gap-2"><Check className="h-3 w-3 text-success" />{it}</li>)}</ul>}
          </li>
        ))}
      </ul>
    </div>
  )
}

function Segment({ icon: Icon, tone, title, lead, points, cta }: { icon: typeof Briefcase; tone: 'accent' | 'magenta'; title: string; lead: string; points: string[]; cta: { href: string; label: string } }) {
  return (
    <Reveal className="relative overflow-hidden rounded-3xl bg-surface p-7 shadow-card sm:p-9">
      <div aria-hidden className={cn('absolute -right-16 -top-16 h-56 w-56 rounded-full blur-3xl', tone === 'magenta' ? 'bg-magenta/15' : 'bg-accent/15')} />
      <span className={cn('relative grid h-11 w-11 place-items-center rounded-2xl', tone === 'magenta' ? 'bg-magenta/12 text-magenta' : 'bg-accent/12 text-accent')}><Icon className="h-5 w-5" aria-hidden /></span>
      <h3 className="relative mt-5 text-2xl font-semibold tracking-tight text-fg">{title}</h3>
      <p className="relative mt-2 text-[15px] leading-relaxed text-muted">{lead}</p>
      <ul className="relative mt-5 space-y-2.5 text-sm text-fg">{points.map(p => <li key={p} className="flex gap-2.5"><Check className={cn('mt-0.5 h-4 w-4 shrink-0', tone === 'magenta' ? 'text-magenta' : 'text-accent')} aria-hidden />{p}</li>)}</ul>
      <div className="relative mt-7"><ButtonLink href={cta.href} variant="secondary" trailing={<ArrowRight className="h-4 w-4" />}>{cta.label}</ButtonLink></div>
    </Reveal>
  )
}

export function DaySection() {
  return (
    <section data-section="day" className="k-day relative overflow-hidden pb-16 pt-6 sm:pb-24" aria-labelledby="day-title">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Marquee items={['Sports days', 'Workshops', 'Yoga and fitness', 'Brunches', 'Markets', 'Conferences', 'Corporate offsites', 'Retreats']} className="text-fg/70" />
        <div className="mx-auto mt-16 max-w-2xl text-center">
          <Reveal><p className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-accent"><Sparkles className="h-3.5 w-3.5" aria-hidden />In daylight</p></Reveal>
          <Reveal delay={0.08}><h2 id="day-title" className="mt-3 text-balance text-4xl font-semibold tracking-tight text-fg sm:text-5xl">Days run on schedules, passes and bookings.</h2></Reveal>
          <Reveal delay={0.16}><p className="mt-4 text-lg text-muted">Classes, rooms and company trips live in the same workspace as your nights.</p></Reveal>
        </div>
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          <Tile eyebrow="Classes" title="Recurring, with passes" body="Weekly classes, drop in booking and pass packs your regulars actually buy." delay={0}><ClassSchedule /></Tile>
          <Tile eyebrow="Spaces" title="Rooms that book themselves" body="Open hours, live slots and no double booking. Guests pick a time and pay by proof." delay={0.1}><SpaceSlots /></Tile>
          <Tile eyebrow="Retreats" title="Multi day trips, planned live" body="Itinerary, people, budget and a shareable schedule for company offsites." pro delay={0.2}><RetreatDays /></Tile>
        </div>

        <div className="mt-24 grid gap-5 lg:grid-cols-2">
          <Segment icon={Briefcase} tone="magenta" title="Corporate events" lead="Conferences, dinners and offsites without the spreadsheet chaos."
            points={['Approval lists and verified-ID-only events', 'Company retreats with a shareable itinerary (Pro)', 'Team managers who can approve guests and run the door', 'White label tickets and pages for agencies (Pro)']}
            cta={{ href: '/auth/login?flow=organizer-signup', label: 'Plan a corporate event' }} />
          <Segment icon={Building2} tone="accent" title="Venue management" lead="Fill your room, court or studio, slot by slot, and know who walks in."
            points={['Opening hours and a live slot grid', 'Approve requests or confirm instantly', 'Payments by proof, QR check in at the door', 'Closed dates and no double booking']}
            cta={{ href: '/spaces', label: 'See bookable spaces' }} />
        </div>
      </div>
    </section>
  )
}
