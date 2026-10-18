'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArrowRight, BarChart3, Check, QrCode, Share2, Users } from 'lucide-react'
import { ButtonLink } from '@/components/kit'
import { Reveal } from './motion'
import { cn } from '@/lib/cn'

const TOOLS = [
  { icon: Share2, t: 'Promoters', b: 'A link, a code and a QR for every promoter. Commissions tracked for you.' },
  { icon: QrCode, t: 'Door team links', b: 'Staff scan from a temporary link. No accounts, no app.' },
  { icon: BarChart3, t: 'Analytics', b: 'Sales by day, ticket and promoter. Export when your accountant asks.' },
  { icon: Users, t: 'Team access', b: 'Invite managers to approve guests and run the door.' },
]

export function ToolsStrip() {
  return (
    <section className="k-day pb-20" aria-label="More tools">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TOOLS.map((x, i) => (
            <Reveal as="li" key={x.t} delay={i * 0.07} className="rounded-2xl bg-surface p-5 shadow-card">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent/12 text-accent"><x.icon className="h-5 w-5" aria-hidden /></span>
              <h3 className="mt-4 text-base font-semibold text-fg">{x.t}</h3><p className="mt-1.5 text-sm leading-relaxed text-muted">{x.b}</p>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  )
}

const PLANS = [
  { id: 'starter', name: 'Starter', month: 2999, year: 29990, note: 'Your first events', points: ['3 events a month', '150 guests per event', '2 door team links'] },
  { id: 'growth', name: 'Growth', month: 7999, year: 79990, note: 'Most organizers pick this', featured: true, points: ['10 events a month', '1,000 guests per event', 'Automatic location reveal', 'Unlimited promoters', 'Classes and spaces'] },
  { id: 'pro', name: 'Pro', month: 12999, year: 129990, note: 'Agencies, companies and venues', points: ['Unlimited events and guests', 'Retreat itineraries for companies', 'White label tickets and pages', 'Commission statements'] },
]
const fmt = (n: number) => n.toLocaleString('en-PK')

export function PricingHome() {
  const [annual, setAnnual] = useState(true)
  return (
    <section id="pricing" className="k-day relative scroll-mt-20 py-20 sm:py-28" aria-labelledby="pricing-title">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <Reveal><p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Pricing</p></Reveal>
          <Reveal delay={0.08}><h2 id="pricing-title" className="mt-3 text-balance text-4xl font-semibold tracking-tight text-fg sm:text-5xl">One flat price. Your ticket money stays yours.</h2></Reveal>
          <Reveal delay={0.16}><p className="mt-4 text-lg text-muted">Guests pay you directly. We never take a cut. Every plan starts with 14 days free.</p></Reveal>
        </div>
        <div className="mt-8 flex justify-center">
          <div role="group" aria-label="Billing period" className="inline-flex rounded-xl bg-surface p-1 shadow-card">
            {[['Monthly', false], ['Annual', true]].map(([l, v]) => <button key={String(l)} aria-pressed={annual === v} onClick={() => setAnnual(v as boolean)} className={cn('flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors', annual === v ? 'bg-overlay text-fg' : 'text-muted hover:text-fg')}>{l}{v === true && <span className="rounded-full bg-magenta/14 px-2 py-0.5 text-[11px] text-magenta">2 months free</span>}</button>)}
          </div>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {PLANS.map((p, i) => (
            <Reveal key={p.id} delay={i * 0.08} className={cn('flex flex-col rounded-3xl bg-surface p-7 shadow-card', p.featured && 'k-gradient-ring md:-translate-y-3')}>
              <div className="flex items-center justify-between"><h3 className="text-lg font-semibold text-fg">{p.name}</h3>{p.featured && <span className="rounded-full bg-magenta/14 px-2.5 py-0.5 text-xs font-medium text-magenta">Popular</span>}</div>
              <p className="mt-1 text-sm text-muted">{p.note}</p>
              <p className="mt-6 text-4xl font-semibold tracking-tight text-fg tnum">PKR {fmt(annual ? Math.round(p.year / 12) : p.month)}<span className="text-sm font-normal text-muted"> /month</span></p>
              <p className="mt-1 h-5 text-xs text-subtle">{annual ? `Billed PKR ${fmt(p.year)} a year` : 'Billed monthly'}</p>
              <ul className="my-6 flex-1 space-y-2.5 text-sm text-fg">{p.points.map(t => <li key={t} className="flex gap-2.5"><Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />{t}</li>)}</ul>
              <ButtonLink href={`/auth/login?flow=organizer-signup&plan=${p.id}`} variant={p.featured ? 'primary' : 'secondary'}>Start free trial</ButtonLink>
            </Reveal>
          ))}
        </div>
        <p className="mt-8 text-center text-sm text-muted">Selling 300 tickets at PKR 2,000? Growth is about 1.3 percent of the PKR 600,000 you handle. <Link href="/pricing" className="font-medium text-accent hover:underline">Compare every plan</Link></p>
      </div>
    </section>
  )
}

export function AttendeeStrip() {
  return (
    <section className="k-day pb-6" aria-label="For guests">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="flex flex-col items-start justify-between gap-4 rounded-3xl bg-surface p-6 shadow-card sm:flex-row sm:items-center sm:p-8">
          <div><p className="text-lg font-semibold tracking-tight text-fg">Looking for something to go to?</p><p className="mt-1 text-sm text-muted">Browse what is on this week in Karachi, Lahore and Islamabad.</p></div>
          <div className="flex flex-wrap gap-2">
            {['Karachi', 'Lahore', 'Islamabad'].map(c => <Link key={c} href={`/explore/${c.toLowerCase()}`} className="rounded-full bg-raised px-4 py-2 text-sm font-medium text-fg shadow-card transition-colors hover:bg-overlay">{c}</Link>)}
            <ButtonLink href="/explore" trailing={<ArrowRight className="h-4 w-4" />}>Explore events</ButtonLink>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
