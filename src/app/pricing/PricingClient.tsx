'use client'

import { useState } from 'react'
import { Check, Minus, Sparkles } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { Badge, ButtonLink } from '@/components/kit'
import { cn } from '@/lib/cn'

type Cell = string | boolean
const plans = [
  { id: 'starter', name: 'Starter', monthly: 2999, annual: 29990, blurb: 'Occasional or first-time organizers' },
  { id: 'growth', name: 'Growth', monthly: 7999, annual: 79990, blurb: 'Active organizers with promoters', featured: true },
  { id: 'pro', name: 'Pro', monthly: 12999, annual: 129990, blurb: 'Agencies, venues and multi-brand teams' },
] as const

const highlights: Record<string, string[]> = {
  starter: ['3 events a month', '150 guests per event', 'QR tickets and the door scanner', '2 gate staff links'],
  growth: ['10 events a month', '1,000 guests per event', 'Unlimited promoters and coupons', 'Your logo, full analytics'],
  pro: ['Unlimited events and guests', 'Spaces, retreats and commission statements', 'White label with your accent', 'Named contact and onboarding'],
}

const rows: { group: string; items: { label: string; v: [Cell, Cell, Cell] }[] }[] = [
  { group: 'Events and guests', items: [
    { label: 'Published events per month', v: ['3', '10', 'Unlimited'] },
    { label: 'Registrations per event', v: ['150', '1,000', 'Unlimited'] },
    { label: 'QR tickets, approvals, guest list, Event Day', v: [true, true, true] },
    { label: 'Gate staff links', v: ['2', '10', 'Unlimited'] },
    { label: 'ID verified only events', v: [false, true, true] },
  ] },
  { group: 'Grow', items: [
    { label: 'Announcements to attendees', v: ['2 per event', 'Unlimited', 'Unlimited'] },
    { label: 'Automatic location reveal', v: [false, true, true] },
    { label: 'Promoters and commissions', v: ['3, flat only', 'Unlimited, all modes', 'Unlimited, all modes'] },
    { label: 'Coupon codes and QR links', v: [false, true, true] },
    { label: 'Commission statements (PDF)', v: [false, false, true] },
    { label: 'Email blasts per month', v: [false, '2,000', '10,000'] },
  ] },
  { group: 'Beyond events', items: [
    { label: 'Classes and passes', v: ['1 series', '5 series', 'Unlimited'] },
    { label: 'Spaces and reservations', v: [false, false, true] },
    { label: 'Retreat planning for companies', v: [false, false, true] },
  ] },
  { group: 'Insight', items: [
    { label: 'Guest score', v: ['Band badge', 'Full history', 'History and repeat guest insights'] },
    { label: 'Analytics', v: ['Basic', 'Full, Excel export', 'Full, per promoter and city'] },
    { label: 'Vendor contacts and invoices', v: ['Up to 10', 'Unlimited', 'Unlimited'] },
  ] },
  { group: 'Brand and support', items: [
    { label: 'Branding', v: ['Powered by TIKKIT X', 'Your logo and cover', 'White label, custom accent'] },
    { label: 'Support', v: ['WhatsApp', 'Priority WhatsApp', 'Named contact and onboarding call'] },
  ] },
]

const fmt = (n: number) => n.toLocaleString('en-PK')

function CellView({ v }: { v: Cell }) {
  if (v === true) return <Check className="mx-auto h-4 w-4 text-accent" aria-label="Included" />
  if (v === false) return <Minus className="mx-auto h-4 w-4 text-subtle" aria-label="Not included" />
  return <span className="text-[13px] text-fg">{v}</span>
}

export function PricingClient() {
  const [annual, setAnnual] = useState(true)
  const reduce = useReducedMotion()
  return (
    <>
      <div className="flex justify-center">
        <div role="group" aria-label="Billing period" className="inline-flex rounded-xl bg-surface p-1 shadow-card">
          {[['Monthly', false], ['Annual', true]].map(([label, val]) => (
            <button key={String(label)} type="button" aria-pressed={annual === val} onClick={() => setAnnual(val as boolean)}
              className={cn('flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors', annual === val ? 'bg-overlay text-fg' : 'text-muted hover:text-fg')}>
              {label}{val === true && <Badge tone="magenta">2 months free</Badge>}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-3 md:items-stretch">
        {plans.map((p, i) => {
          const featured = 'featured' in p && p.featured
          return (
            <motion.div key={p.id}
              initial={reduce ? false : { opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.55, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              whileHover={reduce ? undefined : { y: -6 }}
              className={cn('relative flex flex-col overflow-hidden rounded-2xl bg-surface p-6 shadow-card', featured ? 'k-gradient-ring md:-my-3 md:py-9' : 'ring-1 ring-line')}>
              {featured && <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-40" style={{ background: 'radial-gradient(70% 100% at 50% 0%, rgb(214 96 236 / 0.18), transparent)' }} />}
              <div className="relative flex items-center justify-between">
                <h3 className="text-lg font-semibold text-fg">{p.name}</h3>
                {featured && <Badge tone="magenta"><Sparkles className="mr-1 h-3 w-3" aria-hidden />Most popular</Badge>}
              </div>
              <p className="relative mt-1 text-sm text-muted">{p.blurb}</p>
              <p className="relative mt-6 text-4xl font-semibold tracking-tight tnum text-fg">
                <motion.span key={annual ? 'a' : 'm'} initial={reduce ? false : { opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className={cn('inline-block', featured && 'k-gradient-text')}>
                  PKR {fmt(annual ? Math.round(p.annual / 12) : p.monthly)}
                </motion.span>
                <span className="text-sm font-normal text-muted"> /month</span>
              </p>
              <p className="relative mt-1 h-5 text-xs text-subtle">{annual ? `Billed PKR ${fmt(p.annual)} a year` : 'Billed monthly'}</p>
              <ul className="relative mt-6 flex-1 space-y-2.5">
                {highlights[p.id].map(h => (
                  <li key={h} className="flex items-start gap-2.5 text-sm text-fg"><Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />{h}</li>
                ))}
              </ul>
              <ButtonLink href={`/auth/login?flow=organizer-signup&plan=${p.id}`} className="relative mt-7" variant={featured ? 'primary' : 'secondary'}>
                Start 14 day free trial
              </ButtonLink>
            </motion.div>
          )
        })}
      </div>

      <Calculator />

      <div className="mt-14 overflow-x-auto rounded-2xl bg-surface shadow-card">
        <table className="w-full min-w-[720px] border-collapse text-left">
          <caption className="sr-only">Plan comparison</caption>
          <thead>
            <tr className="border-b border-line">
              <th scope="col" className="w-[34%] px-5 py-4 text-sm font-medium text-muted">Compare plans</th>
              {plans.map(p => <th key={p.id} scope="col" className="px-3 py-4 text-center text-sm font-semibold text-fg">{p.name}</th>)}
            </tr>
          </thead>
          {rows.map(g => (
            <tbody key={g.group}>
              <tr><th colSpan={4} scope="colgroup" className="bg-raised/60 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-subtle">{g.group}</th></tr>
              {g.items.map(it => (
                <tr key={it.label} className="border-b border-line last:border-0">
                  <th scope="row" className="px-5 py-3.5 text-sm font-normal text-muted">{it.label}</th>
                  {it.v.map((c, i) => <td key={i} className="px-3 py-3.5 text-center"><CellView v={c} /></td>)}
                </tr>
              ))}
            </tbody>
          ))}
        </table>
      </div>
    </>
  )
}

function Calculator() {
  const [tickets, setTickets] = useState(300)
  const [price, setPrice] = useState(2000)
  const [cut, setCut] = useState(5)
  const gross = tickets * price
  const fee = Math.round(gross * cut / 100)
  const flat = 7999
  const saved = Math.max(0, fee - flat)
  const slider = 'h-2 w-full cursor-pointer appearance-none rounded-full bg-raised accent-[rgb(var(--k-accent,34_211_238))]'
  return (
    <div className="mt-14 overflow-hidden rounded-3xl bg-surface p-6 shadow-card ring-1 ring-line sm:p-10">
      <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Keep what you earn</p>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-fg sm:text-4xl">See what a flat price saves you.</h2>
          <p className="mt-3 text-muted">Slide the numbers to match one of your events. The comparison uses an example platform that takes a percentage of every ticket. Set that percentage to whatever you pay today.</p>
          <div className="mt-8 space-y-6">
            {[
              { label: 'Tickets sold', value: tickets, set: setTickets, min: 50, max: 2000, step: 50, show: String(tickets) },
              { label: 'Ticket price (PKR)', value: price, set: setPrice, min: 500, max: 10000, step: 250, show: fmt(price) },
              { label: 'Platform cut today', value: cut, set: setCut, min: 2, max: 10, step: 1, show: `${cut}%` },
            ].map(f => (
              <label key={f.label} className="block">
                <span className="flex justify-between text-sm"><span className="text-muted">{f.label}</span><span className="font-semibold tnum text-fg">{f.show}</span></span>
                <input type="range" min={f.min} max={f.max} step={f.step} value={f.value} onChange={e => f.set(Number(e.target.value))} className={cn(slider, 'mt-2')} />
              </label>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <div className="rounded-2xl bg-raised/60 p-5">
            <p className="text-sm text-muted">Example platform, {cut}% of PKR {fmt(gross)}</p>
            <p className="mt-1 text-3xl font-semibold tnum text-fg">PKR {fmt(fee)}</p>
          </div>
          <div className="k-gradient-ring rounded-2xl bg-surface p-5">
            <p className="text-sm text-muted">TIKKIT X Growth, flat for the month</p>
            <p className="mt-1 text-3xl font-semibold tnum text-fg">PKR {fmt(flat)}</p>
          </div>
          <motion.p key={saved} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.25 }} className="px-1 pt-2 text-lg text-fg">
            {saved > 0 ? <>You keep <span className="k-gradient-text font-semibold tnum">PKR {fmt(saved)}</span> more on this event.</> : 'At this size the two are close. The flat price pulls ahead as you grow.'}
          </motion.p>
        </div>
      </div>
    </div>
  )
}
