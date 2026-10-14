'use client'

import { useState } from 'react'
import { Check, Minus } from 'lucide-react'
import { Badge, ButtonLink } from '@/components/kit'
import { cn } from '@/lib/cn'

type Cell = string | boolean
const plans = [
  { id: 'starter', name: 'Starter', monthly: 2999, annual: 29990, blurb: 'Occasional or first-time organizers' },
  { id: 'growth', name: 'Growth', monthly: 7999, annual: 79990, blurb: 'Active organizers with promoters', featured: true },
  { id: 'pro', name: 'Pro', monthly: 12999, annual: 129990, blurb: 'Agencies, venues and multi-brand teams' },
] as const

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

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {plans.map(p => (
          <div key={p.id} className={cn('flex flex-col rounded-2xl bg-surface p-6 shadow-card', 'featured' in p && p.featured && 'k-gradient-ring')}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-fg">{p.name}</h3>
              {'featured' in p && p.featured && <Badge tone="magenta">Recommended</Badge>}
            </div>
            <p className="mt-1 text-sm text-muted">{p.blurb}</p>
            <p className="mt-6 text-4xl font-semibold tracking-tight tnum text-fg">
              PKR {fmt(annual ? Math.round(p.annual / 12) : p.monthly)}
              <span className="text-sm font-normal text-muted"> /month</span>
            </p>
            <p className="mt-1 h-5 text-xs text-subtle">{annual ? `Billed PKR ${fmt(p.annual)} a year` : 'Billed monthly'}</p>
            <ButtonLink href={`/auth/login?flow=organizer-signup&plan=${p.id}`} className="mt-6" variant={'featured' in p && p.featured ? 'primary' : 'secondary'}>
              Start 14 day free trial
            </ButtonLink>
          </div>
        ))}
      </div>

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
