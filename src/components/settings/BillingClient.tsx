'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Upload } from 'lucide-react'
import { Badge, Button, Card, CardBody, CardHeader, Field, Input, Modal, Progress } from '@/components/kit'
import { createClient } from '@/lib/supabase/client'
import { fmtDate, pkr } from '@/lib/format'
import { cn } from '@/lib/cn'

export type Plan = { id: string; name: string; month: number; year: number }
export type Pay = { id: string; plan: string; period: string; amount: number; status: string; createdAt: string; reason: string | null }
export type Inv = { id: string; number: string; amount: number; period: string; issuedAt: string; plan: string }

const features: Record<string, string[]> = {
  starter: ['3 events a month', '150 guests per event', '2 gate staff links', '3 promoters'],
  growth: ['10 events a month', '1,000 guests per event', 'Automatic location reveal', 'Unlimited promoters and commissions', 'Full guest score and analytics', '3 team managers'],
  pro: ['Unlimited events and guests', 'White label tickets and pages', 'Commission statements', 'Retreat itineraries for companies', 'Unlimited team'],
}
const tone = { submitted: 'warning', approved: 'success', rejected: 'danger' } as const
const readable = (m: string) => (m.match(/^[A-Z_]+(?::[a-z_]+)?: ([\s\S]*)$/)?.[1]) ?? m

export default function BillingClient(p: { plans: Plan[]; current: { planId: string; state: string; endsAt: string | null }; usage: { label: string; used: number; limit: number | null }[]; payments: Pay[]; invoices: Inv[]; accountDetails: string | null }) {
  const router = useRouter(); const supabase = useMemo(() => createClient(), [])
  const [annual, setAnnual] = useState(true)
  const [choose, setChoose] = useState<Plan | null>(null)
  const [file, setFile] = useState<File | null>(null); const [ref, setRef] = useState('')
  const [busy, setBusy] = useState(false); const [err, setErr] = useState<string | null>(null)
  const hasOpen = p.payments.some(x => x.status === 'submitted')

  async function pay(e: React.FormEvent) {
    e.preventDefault(); setErr(null)
    if (!choose || !file) return setErr('Attach the transfer screenshot.')
    setBusy(true)
    const { data: { user } } = await supabase.auth.getUser()
    const path = `${user!.id}/${crypto.randomUUID()}.${file.name.split('.').pop()}`
    const up = await supabase.storage.from('subscription-proofs').upload(path, file, { contentType: file.type })
    if (up.error) { setBusy(false); return setErr('The screenshot could not be uploaded.') }
    const { error } = await supabase.rpc('submit_subscription_payment', { p_plan: choose.id, p_period: annual ? 'year' : 'month', p_screenshot_path: path, p_reference: ref.trim() || undefined })
    setBusy(false)
    if (error) return setErr(readable(error.message))
    setChoose(null); setFile(null); setRef(''); router.refresh()
  }

  const amount = choose ? (annual ? choose.year : choose.month) : 0
  return (
    <>
      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><p className="text-[13px] text-muted">Current plan</p><p className="mt-1 text-2xl font-semibold capitalize tracking-tight text-fg">{p.current.planId === 'trial' ? 'Free trial' : p.current.planId}</p></div>
          <div className="text-right"><Badge tone={['trial', 'active'].includes(p.current.state) ? 'success' : 'warning'} dot>{p.current.state}</Badge>{p.current.endsAt && <p className="mt-1 text-xs text-muted">{p.current.state === 'trial' ? 'Trial ends' : 'Renews'} {fmtDate(p.current.endsAt)}</p>}</div>
        </div>
        {hasOpen && <p className="mt-4 rounded-xl bg-warning/10 px-4 py-3 text-sm text-warning">Your payment is being reviewed. Your plan activates as soon as it is approved.</p>}
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {p.usage.map(u => (
            <div key={u.label}><div className="mb-1.5 flex justify-between text-sm"><span className="text-muted">{u.label}</span><span className="tnum text-fg">{u.used}{u.limit ? ` / ${u.limit}` : ' / unlimited'}</span></div>{u.limit ? <Progress value={Math.min(100, Math.round((u.used / u.limit) * 100))} /> : null}</div>
          ))}
        </div>
      </Card>

      <div>
        <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold tracking-tight text-fg">Choose a plan</h2>
          <div role="group" aria-label="Billing period" className="inline-flex rounded-xl bg-raised p-1 text-[13px] font-medium">
            {[['Monthly', false], ['Annual', true]].map(([l, v]) => <button key={String(l)} aria-pressed={annual === v} onClick={() => setAnnual(v as boolean)} className={cn('rounded-lg px-3 py-1.5', annual === v ? 'bg-surface text-fg shadow-card' : 'text-muted')}>{l}{v === true && <span className="ml-1.5 text-magenta">2 months free</span>}</button>)}
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {p.plans.map(pl => (
            <Card key={pl.id} className={cn('flex flex-col p-5', pl.id === 'growth' && 'k-gradient-ring')}>
              <div className="flex items-center justify-between"><h3 className="font-semibold text-fg">{pl.name}</h3>{pl.id === p.current.planId && <Badge tone="accent">Current</Badge>}{pl.id === 'growth' && pl.id !== p.current.planId && <Badge tone="magenta">Popular</Badge>}</div>
              <p className="mt-3 tnum text-2xl font-semibold text-fg">{pkr(annual ? Math.round(pl.year / 12) : pl.month)}<span className="text-sm font-normal text-muted"> /month</span></p>
              <p className="text-xs text-subtle">{annual ? `${pkr(pl.year)} billed yearly` : 'Billed monthly'}</p>
              <ul className="my-4 flex-1 space-y-2 text-sm text-muted">{(features[pl.id] ?? []).map(t => <li key={t} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />{t}</li>)}</ul>
              <Button variant={pl.id === 'growth' ? 'primary' : 'secondary'} disabled={hasOpen} onClick={() => setChoose(pl)}>{pl.id === p.current.planId ? 'Renew' : 'Choose'} {pl.name}</Button>
            </Card>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader title="Payments and invoices" description="Each approved payment gets a numbered invoice" />
        <CardBody>
          {p.payments.length === 0 ? <p className="text-sm text-muted">No payments yet.</p> : (
            <ul className="divide-y divide-line">
              {p.payments.map(x => {
                const inv = p.invoices.find(i => i.plan === x.plan && i.issuedAt >= x.createdAt)
                return (
                  <li key={x.id} className="flex flex-wrap items-center gap-3 py-3 text-sm">
                    <span className="min-w-0 flex-1 capitalize text-fg">{x.plan} · {x.period === 'year' ? 'annual' : 'monthly'}<span className="block text-xs normal-case text-muted">{fmtDate(x.createdAt)}{x.reason ? ` · ${x.reason}` : ''}</span></span>
                    <span className="tnum text-fg">{pkr(x.amount)}</span><Badge tone={tone[x.status as keyof typeof tone] ?? 'neutral'}>{x.status}</Badge>
                    {inv && <a className="text-xs font-medium text-accent hover:underline" href={`/dashboard/settings/billing/invoice/${inv.number}`} target="_blank" rel="noopener">{inv.number}</a>}
                  </li>
                )
              })}
            </ul>
          )}
        </CardBody>
      </Card>

      <Modal open={!!choose} onClose={() => setChoose(null)} title={choose ? `${choose.name}, ${annual ? 'annual' : 'monthly'}` : ''} description={`Send ${pkr(amount)} by bank transfer, then upload the screenshot.`}>
        <form onSubmit={pay} className="space-y-4">
          <div className="rounded-xl bg-raised p-4 text-sm text-fg shadow-[inset_0_0_0_1px_rgb(var(--k-line))]">
            <p className="text-xs font-medium uppercase tracking-wider text-subtle">Pay to</p>
            <p className="mt-1 whitespace-pre-line">{p.accountDetails ?? 'Two Bit Digital Ltd. Account details are shared on WhatsApp when you choose a plan.'}</p>
            {!p.accountDetails && <a className="mt-2 inline-block text-xs font-medium text-accent hover:underline" href="https://wa.me/13074434195?text=Hi%20TIKKIT%20X%2C%20I%20want%20to%20upgrade" target="_blank" rel="noopener noreferrer">Message us on WhatsApp</a>}
          </div>
          <Field label="Transfer screenshot">{x => <label className="flex h-24 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed border-line-strong bg-raised text-sm text-muted hover:border-accent"><Upload className="h-5 w-5" />{file ? file.name : 'Choose a screenshot'}<input {...x} type="file" accept="image/*,application/pdf" className="sr-only" onChange={e => setFile(e.target.files?.[0] ?? null)} /></label>}</Field>
          <Field label="Reference" optional>{x => <Input {...x} value={ref} onChange={e => setRef(e.target.value)} placeholder="Transaction ID" />}</Field>
          {err && <p role="alert" className="text-sm text-danger">{err}</p>}
          <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setChoose(null)}>Cancel</Button><Button type="submit" loading={busy}>Submit payment</Button></div>
        </form>
      </Modal>
    </>
  )
}
