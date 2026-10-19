'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Banknote, Check, Eye, MessageCircle, RotateCcw, X } from 'lucide-react'
import { Badge, Button, Card, CardBody, CardHeader, EmptyState, Textarea } from '@/components/kit'
import { createClient } from '@/lib/supabase/client'
import { fmtDate, pkr } from '@/lib/format'
import { DEFAULT_REMINDER, fillReminder, PERIOD_WORD, STATE_LABEL, STATE_TONE, whatsappLink, type MState, type Period } from '@/lib/membership'
import { cn } from '@/lib/cn'

export type Member = {
  id: string; attendee_id: string; full_name: string | null; phone: string | null; product_name: string; billing_period: Period; price_pkr: number
  valid_until: string | null; status: string; state: MState; cycles_paid: number; grace_days: number; last_reminded_at: string | null; reminder_count: number
  pending_payment_id: string | null; sessions_total: number | null; sessions_used: number
}
export type Pending = { id: string; name: string; title: string; note: string | null; amount: number; path: string; reference: string | null; at: string }
export type Account = { method: string; account_title: string; account_number: string; bank_name: string | null }

const readable = (m: string) => (m.match(/^[A-Z_]+(?::[a-z_]+)?: ([\s\S]*)$/)?.[1]) ?? m
const REMIND: MState[] = ['due_soon', 'overdue', 'lapsed', 'awaiting_first']
const TPL_KEY = 'tkx-membership-reminder'
const ago = (iso: string) => { const h = Math.round((Date.now() - new Date(iso).getTime()) / 3_600_000); return h < 1 ? 'just now' : h < 24 ? `${h}h ago` : `${Math.round(h / 24)}d ago` }

export function MembersClient({ members, pending, accounts, origin, company }: { members: Member[]; pending: Pending[]; accounts: Account[]; origin: string; company: string | null }) {
  const router = useRouter(); const supabase = useMemo(() => createClient(), [])
  const [busy, start] = useTransition(); const [err, setErr] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'attention' | 'paid'>('attention')
  const [tpl, setTpl] = useState(DEFAULT_REMINDER); const [editTpl, setEditTpl] = useState(false)
  useEffect(() => { try { const v = localStorage.getItem(TPL_KEY); if (v) setTpl(v) } catch { /* private mode */ } }, [])
  const saveTpl = (v: string) => { setTpl(v); try { localStorage.setItem(TPL_KEY, v) } catch { /* private mode */ } }

  const account = accounts[0] ? `${accounts[0].bank_name ?? accounts[0].method} ${accounts[0].account_title}, ${accounts[0].account_number}` : 'my account'
  const attention = members.filter(m => m.state !== 'paid')
  const shown = filter === 'all' ? members : filter === 'paid' ? members.filter(m => m.state === 'paid') : attention
  const count = (s: MState) => members.filter(m => m.state === s).length
  const monthly = members.filter(m => m.state === 'paid' || m.state === 'due_soon' || m.state === 'pending').reduce((a, m) => a + (m.billing_period === 'monthly' ? m.price_pkr : Math.round(m.price_pkr * 4.33)), 0)

  const run = (fn: () => Promise<{ error: { message: string } | null }>) => { setErr(null); start(async () => { const { error } = await fn(); if (error) return setErr(readable(error.message)); router.refresh() }) }
  const review = (p: Pending, approve: boolean) => {
    let reason: string | undefined
    if (!approve) { const r = prompt('Why is it not accepted? The member is told.', 'The screenshot is not clear. Please send it again.'); if (r === null) return; reason = r || undefined }
    run(async () => supabase.rpc('review_product_payment', { p_payment: p.id, p_approve: approve, p_reason: reason }))
  }
  async function view(p: Pending) {
    const { data, error } = await supabase.storage.from('payment-proofs').createSignedUrl(p.path, 120)
    if (error || !data) return setErr('The screenshot could not be opened.')
    window.open(data.signedUrl, '_blank', 'noopener,noreferrer')
  }
  function remind(m: Member) {
    const first = (m.full_name ?? 'there').split(' ')[0]
    const when = m.state === 'awaiting_first' ? 'is due to start your membership' : m.state === 'lapsed' ? `was due on ${m.valid_until ? fmtDate(m.valid_until, { day: 'numeric', month: 'short' }) : 'the due date'} and your membership has lapsed` : `${m.state === 'overdue' ? 'was' : 'is'} due on ${m.valid_until ? fmtDate(m.valid_until, { day: 'numeric', month: 'short' }) : 'the due date'}`
    const text = fillReminder(tpl, { name: first, product: m.product_name, amount: pkr(m.price_pkr), when, account, link: `${origin}/guest/tickets` })
    const url = whatsappLink(m.phone, text)
    if (!url) return setErr(`${m.full_name ?? 'This member'} has no phone number on file.`)
    window.open(url, '_blank', 'noopener,noreferrer')
    run(async () => supabase.rpc('mark_membership_reminded', { p_pass: m.id }))
  }
  const cash = (m: Member) => { const note = prompt(`Record a payment of ${pkr(m.price_pkr)} from ${m.full_name ?? 'this member'}.\nHow was it paid? (optional)`, 'Cash'); if (note === null) return; run(async () => supabase.rpc('record_membership_payment', { p_pass: m.id, p_note: note || undefined })) }
  const stop = (m: Member) => { if (confirm(`Stop ${m.full_name ?? 'this member'}'s membership? They will no longer be able to book with it.`)) run(async () => supabase.rpc('stop_membership', { p_pass: m.id })) }

  return (
    <div className="space-y-8">
      {err && <p role="alert" className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">{err}</p>}

      <Card><CardHeader title="Receipts to check" description="Members pay you directly and send a screenshot. Approve it once the money is in your account." />
        <CardBody>{pending.length === 0 ? <p className="text-sm text-muted">Nothing waiting. New receipts show up here.</p> : (
          <ul className="divide-y divide-line">{pending.map(p => (
            <li key={p.id} className="flex flex-wrap items-center gap-3 py-3">
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-fg">{p.name} <span className="font-normal text-muted">· {p.title}</span></p><p className="text-xs text-muted">{p.note} · {pkr(p.amount)} · {ago(p.at)}{p.reference ? ` · Ref ${p.reference}` : ''}</p></div>
              <Button size="sm" variant="ghost" leading={<Eye className="h-4 w-4" />} onClick={() => view(p)}>Screenshot</Button>
              <Button size="sm" variant="ghost" leading={<X className="h-4 w-4" />} disabled={busy} onClick={() => review(p, false)}>Reject</Button>
              <Button size="sm" leading={<Check className="h-4 w-4" />} loading={busy} onClick={() => review(p, true)}>Approve</Button>
            </li>))}</ul>
        )}</CardBody></Card>

      <section aria-labelledby="mem-title">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div><h2 id="mem-title" className="text-lg font-semibold tracking-tight text-fg">Members</h2><p className="text-sm text-muted">{members.length} active · about {pkr(monthly)} a month from paid and on time members</p></div>
          <div role="tablist" className="flex gap-1 rounded-xl bg-raised p-1">{([['attention', `Needs attention (${attention.length})`], ['paid', `Paid (${count('paid')})`], ['all', 'Everyone']] as const).map(([id, l]) => <button key={id} role="tab" aria-selected={filter === id} onClick={() => setFilter(id)} className={cn('rounded-lg px-3 py-1.5 text-sm font-medium', filter === id ? 'bg-surface text-fg shadow-card' : 'text-muted')}>{l}</button>)}</div>
        </div>

        {members.length === 0 ? <Card><EmptyState icon={<RotateCcw className="h-6 w-6" />} title="No members yet" description="Create a membership under a class, then share the class link. Members who join show up here." /></Card> : shown.length === 0 ? <Card><CardBody><p className="text-sm text-muted">Everyone is paid up.</p></CardBody></Card> : (
          <Card><ul className="divide-y divide-line">{shown.map(m => (
            <li key={m.id} className="flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2"><p className="truncate text-sm font-medium text-fg">{m.full_name ?? 'Member'}</p><Badge tone={STATE_TONE[m.state]}>{STATE_LABEL[m.state]}</Badge></div>
                <p className="mt-0.5 text-xs text-muted">{m.product_name} · {pkr(m.price_pkr)} / {PERIOD_WORD[m.billing_period]}{m.valid_until && m.status !== 'payment_submitted' && m.status !== 'awaiting_payment' ? ` · ${m.state === 'overdue' || m.state === 'lapsed' ? 'was due' : 'paid until'} ${fmtDate(m.valid_until, { day: 'numeric', month: 'short' })}` : ''}{m.sessions_total ? ` · ${m.sessions_used}/${m.sessions_total} sessions` : ''}{m.last_reminded_at ? ` · reminded ${ago(m.last_reminded_at)}` : ''}</p>
              </div>
              {REMIND.includes(m.state) && <Button size="sm" variant="secondary" leading={<MessageCircle className="h-4 w-4" />} disabled={busy} onClick={() => remind(m)} title={m.phone ? undefined : 'No phone number on file'}>Remind on WhatsApp</Button>}
              {m.state !== 'pending' && m.state !== 'pending_first' && <Button size="sm" variant="ghost" leading={<Banknote className="h-4 w-4" />} disabled={busy} onClick={() => cash(m)}>Record payment</Button>}
              <Button size="sm" variant="ghost" disabled={busy} onClick={() => stop(m)}>Stop</Button>
            </li>))}</ul></Card>
        )}
      </section>

      <Card><CardHeader title="Reminder message" description="This opens in WhatsApp ready to send. You press send, so nothing goes out by itself." action={<Button size="sm" variant="ghost" onClick={() => setEditTpl(!editTpl)}>{editTpl ? 'Done' : 'Edit'}</Button>} />
        <CardBody className="space-y-3">
          {editTpl ? (
            <>
              <Textarea rows={4} value={tpl} onChange={e => saveTpl(e.target.value)} aria-label="Reminder message" />
              <p className="text-xs text-muted">Use {'{name}'}, {'{product}'}, {'{amount}'}, {'{when}'}, {'{account}'} and {'{link}'}. <button type="button" className="text-accent hover:underline" onClick={() => saveTpl(DEFAULT_REMINDER)}>Reset to the original</button></p>
            </>
          ) : <p className="rounded-xl bg-raised p-3 text-sm text-muted">{fillReminder(tpl, { name: 'Sara', product: 'Studio membership', amount: pkr(8000), when: 'was due on 25 Oct', account, link: `${origin}/guest/tickets` })}</p>}
          <p className="text-xs text-subtle">{company ? `${company}: ` : ''}Saved on this device. Your payment account comes from Settings, Payments.</p>
        </CardBody></Card>
    </div>
  )
}
