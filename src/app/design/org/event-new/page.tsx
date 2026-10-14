'use client'

import { useState } from 'react'
import { CalendarClock, Check, ImagePlus, Lock, MapPin, Plus, ShieldCheck, Ticket, Trash2, Wallet } from 'lucide-react'
import { Badge, Button, Card, CardBody, CardHeader, Field, Input, PageHeader, Select, Switch, Textarea } from '@/components/kit'
import { cn } from '@/lib/cn'

type Tier = { id: number; name: string; price: string; qty: string; ends: string; vip: boolean }

export default function EventNewPrototype() {
  const [secret, setSecret] = useState(true)
  const [approval, setApproval] = useState(false)
  const [idOnly, setIdOnly] = useState(false)
  const [tiers, setTiers] = useState<Tier[]>([
    { id: 1, name: 'Early bird', price: '1800', qty: '60', ends: '2026-10-15T23:59', vip: false },
    { id: 2, name: 'General', price: '2500', qty: '200', ends: '', vip: false },
    { id: 3, name: 'VIP', price: '6000', qty: '40', ends: '', vip: true },
  ])
  const update = (id: number, patch: Partial<Tier>) => setTiers(t => t.map(x => (x.id === id ? { ...x, ...patch } : x)))

  const checklist = [
    { label: 'Identity verified', ok: true },
    { label: 'Title, date and city', ok: true },
    { label: 'At least one ticket type', ok: true },
    { label: 'Payment account selected', ok: false },
    { label: 'Cover image', ok: false },
  ]
  const done = checklist.filter(c => c.ok).length

  return (
    <div className="k-fade-up">
      <PageHeader
        eyebrow="New event"
        title="Create your event"
        description="Everything saves as a draft. Publish when the checklist is green."
        actions={<><Button variant="ghost">Save draft</Button><Button disabled={done < checklist.length}>Publish event</Button></>}
      />

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card>
            <CardHeader title="The basics" description="What guests see first" />
            <CardBody className="grid gap-4">
              <Field label="Event name">{p => <Input {...p} defaultValue="Rooftop Sunset Session" placeholder="Give it a name people remember" />}</Field>
              <Field label="Description" hint="Vibe, dress code, what is included. 600 characters left.">
                {p => <Textarea {...p} rows={4} defaultValue="Golden hour, a live set from three Karachi DJs, and a skyline you will not forget. Smart casual. No re-entry." />}
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Category">{p => <Select {...p} defaultValue="music"><option value="music">Music</option><option>Social</option><option>Food & Drink</option></Select>}</Field>
                <Field label="City">{p => <Select {...p} defaultValue="karachi"><option value="karachi">Karachi</option><option>Lahore</option><option>Islamabad</option></Select>}</Field>
              </div>
              <Field label="Cover image" hint="1600 x 900 or larger. JPG, PNG or WebP.">
                {() => (
                  <button type="button" className="flex h-36 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line-strong bg-raised text-muted transition-colors hover:border-accent hover:text-fg">
                    <ImagePlus className="h-6 w-6" aria-hidden /><span className="text-sm font-medium">Upload cover</span>
                  </button>
                )}
              </Field>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="When and where" action={<CalendarClock className="h-5 w-5 text-subtle" aria-hidden />} />
            <CardBody className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Starts">{p => <Input {...p} type="datetime-local" defaultValue="2026-10-17T19:30" />}</Field>
                <Field label="Ends">{p => <Input {...p} type="datetime-local" defaultValue="2026-10-17T23:30" />}</Field>
              </div>

              <div className="flex items-start justify-between gap-4 rounded-xl bg-raised p-4 shadow-[inset_0_0_0_1px_rgb(var(--k-line))]">
                <div className="flex gap-3">
                  <Lock className="mt-0.5 h-5 w-5 shrink-0 text-violet" aria-hidden />
                  <div>
                    <p className="text-sm font-medium text-fg">Secret location</p>
                    <p className="mt-0.5 text-[13px] text-muted">Only the area is public. Confirmed guests get the address at the time you choose.</p>
                  </div>
                </div>
                <Switch checked={secret} onChange={setSecret} label="Secret location" />
              </div>

              {secret ? (
                <div className="k-pop grid gap-4 sm:grid-cols-2">
                  <Field label="Public area" hint="Shown to everyone">{p => <Input {...p} leading={<MapPin className="h-4 w-4" />} defaultValue="DHA, Karachi" />}</Field>
                  <Field label="Reveal address at" hint="Guests are notified automatically. Growth plan and above.">{p => <Input {...p} type="datetime-local" defaultValue="2026-10-17T17:00" />}</Field>
                  <Field label="Secret address" className="sm:col-span-2">{p => <Input {...p} defaultValue="Plot 7, Khayaban-e-Shahbaz, Phase 6" />}</Field>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Venue name">{p => <Input {...p} placeholder="The Grand Hall" />}</Field>
                  <Field label="Address">{p => <Input {...p} placeholder="Street, area" />}</Field>
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Tickets" description="Add early bird tiers with a sales cutoff" action={<Ticket className="h-5 w-5 text-subtle" aria-hidden />} />
            <CardBody className="space-y-3">
              {tiers.map(t => (
                <div key={t.id} className="rounded-xl bg-raised p-4 shadow-[inset_0_0_0_1px_rgb(var(--k-line))]">
                  <div className="grid gap-3 sm:grid-cols-[1.4fr_1fr_1fr_auto] sm:items-end">
                    <Field label="Name">{p => <Input {...p} value={t.name} onChange={e => update(t.id, { name: e.target.value })} />}</Field>
                    <Field label="Price (PKR)">{p => <Input {...p} inputMode="numeric" value={t.price} onChange={e => update(t.id, { price: e.target.value })} />}</Field>
                    <Field label="Quantity">{p => <Input {...p} inputMode="numeric" value={t.qty} onChange={e => update(t.id, { qty: e.target.value })} />}</Field>
                    <Button variant="ghost" size="icon" aria-label={`Remove ${t.name}`} onClick={() => setTiers(x => x.filter(y => y.id !== t.id))}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                    <Field label="Stop selling at" optional>{p => <Input {...p} type="datetime-local" value={t.ends} onChange={e => update(t.id, { ends: e.target.value })} />}</Field>
                    <label className="flex h-10 cursor-pointer items-center gap-2 text-sm text-muted">
                      <input type="checkbox" checked={t.vip} onChange={e => update(t.id, { vip: e.target.checked })} className="h-4 w-4 accent-[rgb(var(--k-violet))]" /> VIP perks
                    </label>
                  </div>
                </div>
              ))}
              <Button variant="secondary" leading={<Plus className="h-4 w-4" />} onClick={() => setTiers(t => [...t, { id: Date.now(), name: 'New ticket', price: '0', qty: '', ends: '', vip: false }])}>Add ticket type</Button>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Access and payment" action={<Wallet className="h-5 w-5 text-subtle" aria-hidden />} />
            <CardBody className="divide-y divide-line">
              {[
                { t: 'Approve each guest', d: 'Review every request before they can pay.', v: approval, s: setApproval },
                { t: 'Verified IDs only', d: 'Only guests with a verified ID can register. Growth plan and above.', v: idOnly, s: setIdOnly },
              ].map(r => (
                <div key={r.t} className="flex items-start justify-between gap-4 py-4 first:pt-0">
                  <div><p className="text-sm font-medium text-fg">{r.t}</p><p className="mt-0.5 text-[13px] text-muted">{r.d}</p></div>
                  <Switch checked={r.v} onChange={r.s} label={r.t} />
                </div>
              ))}
              <div className="pt-4">
                <p className="mb-2 text-sm font-medium text-fg">Accept payment to</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {[['JazzCash', '0300 ••• 4567', true], ['Meezan Bank', 'PK36 MEZN ••• 8841', false]].map(([n, d, on]) => (
                    <label key={n as string} className={cn('flex cursor-pointer items-center gap-3 rounded-xl p-3.5 transition-colors', on ? 'bg-accent/8 shadow-[inset_0_0_0_1px_rgb(var(--k-accent)/0.5)]' : 'bg-raised shadow-[inset_0_0_0_1px_rgb(var(--k-line))]')}>
                      <input type="checkbox" defaultChecked={on as boolean} className="h-4 w-4 accent-[rgb(var(--k-accent))]" />
                      <span><span className="block text-sm font-medium text-fg">{n}</span><span className="tnum block text-xs text-muted">{d}</span></span>
                    </label>
                  ))}
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Sticky checklist */}
        <aside className="space-y-4 lg:sticky lg:top-24">
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-[15px] font-semibold text-fg">Ready to publish</h3>
              <span className="tnum text-sm text-muted">{done}/{checklist.length}</span>
            </div>
            <ul className="mt-4 space-y-3">
              {checklist.map(c => (
                <li key={c.label} className="flex items-center gap-3 text-sm">
                  <span className={cn('flex h-5 w-5 items-center justify-center rounded-full', c.ok ? 'bg-success/15 text-success' : 'bg-overlay text-subtle')}>
                    {c.ok ? <Check className="h-3 w-3" aria-hidden /> : <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />}
                  </span>
                  <span className={c.ok ? 'text-fg' : 'text-muted'}>{c.label}</span>
                </li>
              ))}
            </ul>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-accent" aria-hidden /><h3 className="text-sm font-semibold text-fg">Your plan</h3></div>
            <p className="mt-2 text-[13px] text-muted">Free trial: 1 published event and up to 100 registrations. Upgrade to Growth for 10 events and auto location reveal.</p>
            <div className="mt-3 flex items-center gap-2"><Badge tone="accent" dot>9 days left</Badge><Badge tone="neutral">Capacity limit 100</Badge></div>
          </Card>
        </aside>
      </div>
    </div>
  )
}
