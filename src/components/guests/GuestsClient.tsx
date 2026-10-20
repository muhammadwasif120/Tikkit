'use client'

import ReportButton from '@/components/reports/ReportButton'
import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Download, ExternalLink, Search, ShieldCheck, Star, UserPlus, X } from 'lucide-react'
import {
  Avatar, Badge, Button, Card, EmptyState, Field, Input, Modal, Select, Table, TableWrap, Td, Th, Tr, type BadgeTone,
} from '@/components/kit'
import { createClient } from '@/lib/supabase/client'
import { fmtDate, fmtTime, pkr, relative } from '@/lib/format'
import { cn } from '@/lib/cn'

export type GuestRow = {
  id: string; eventId: string; eventTitle: string; name: string; phone: string | null; email: string | null
  status: string; isVip: boolean; ticket: string | null; due: number; paid: number | null; createdAt: string
  plusOne: boolean; tier: string | null; idVerified: boolean; avatar?: string | null; attendeeId?: string | null
  submission: { id: string; path: string; reference: string | null; amount: number } | null
}
export type EventOpt = { id: string; title: string; tickets: { id: string; name: string }[] }

const FILTERS = [
  { id: 'all', label: 'All' }, { id: 'pending', label: 'Needs review' }, { id: 'awaiting', label: 'Awaiting payment' },
  { id: 'confirmed', label: 'Confirmed' }, { id: 'checked_in', label: 'Checked in' }, { id: 'closed', label: 'Closed' },
] as const
type Filter = typeof FILTERS[number]['id']

const matches = (f: Filter, s: string) =>
  f === 'all' ? true : f === 'pending' ? ['requested', 'payment_submitted'].includes(s)
  : f === 'awaiting' ? s === 'awaiting_payment' : f === 'confirmed' ? s === 'confirmed'
  : f === 'checked_in' ? s === 'checked_in' : ['rejected', 'cancelled', 'no_show', 'waitlisted'].includes(s)

const STATUS: Record<string, { label: string; tone: BadgeTone }> = {
  requested: { label: 'Requested', tone: 'info' }, awaiting_payment: { label: 'Awaiting payment', tone: 'neutral' },
  payment_submitted: { label: 'Payment received', tone: 'warning' }, confirmed: { label: 'Confirmed', tone: 'success' },
  checked_in: { label: 'Checked in', tone: 'accent' }, rejected: { label: 'Rejected', tone: 'danger' },
  cancelled: { label: 'Cancelled', tone: 'neutral' }, waitlisted: { label: 'Waitlisted', tone: 'info' }, no_show: { label: 'No show', tone: 'danger' },
}
const TIER: Record<string, { label: string; tone: BadgeTone }> = {
  new: { label: 'New', tone: 'info' }, reliable: { label: 'Reliable', tone: 'violet' }, regular: { label: 'Regular', tone: 'violet' }, trusted: { label: 'Trusted', tone: 'magenta' },
}

const readable = (m: string) => (m.match(/^[A-Z_]+(?::[a-z_]+)?: ([\s\S]*)$/)?.[1]) ?? m

export default function GuestsClient({ rows, events, initialEvent, initialFilter }: { rows: GuestRow[]; events: EventOpt[]; initialEvent: string; initialFilter: string }) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [filter, setFilter] = useState<Filter>((FILTERS.find(f => f.id === initialFilter)?.id) ?? 'all')
  const [eventId, setEventId] = useState(initialEvent)
  const [q, setQ] = useState('')
  const [sel, setSel] = useState<Set<string>>(new Set())
  const [proof, setProof] = useState<{ row: GuestRow; url: string | null } | null>(null)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  const visible = useMemo(() => rows.filter(r =>
    (!eventId || r.eventId === eventId) && matches(filter, r.status) &&
    (!q.trim() || (r.name + ' ' + (r.phone ?? '') + ' ' + (r.email ?? '')).toLowerCase().includes(q.trim().toLowerCase()))),
  [rows, eventId, filter, q])

  const counts = useMemo(() => Object.fromEntries(FILTERS.map(f => [f.id, rows.filter(r => (!eventId || r.eventId === eventId) && matches(f.id, r.status)).length])), [rows, eventId])

  const run = (fn: () => Promise<{ message?: string } | null | void>) => {
    setError(null)
    start(async () => {
      const err = await fn()
      if (err && err.message) return setError(readable(err.message))
      setSel(new Set()); router.refresh()
    })
  }

  const approve = (r: GuestRow) => run(async () => {
    const { error: e } = r.status === 'payment_submitted' && r.submission
      ? await supabase.rpc('review_payment', { p_submission: r.submission.id, p_approve: true })
      : await supabase.rpc('review_registration', { p_registration: r.id, p_approve: true })
    return e
  })
  const reject = (r: GuestRow) => {
    const reason = prompt(`Reason for declining ${r.name} (optional)`)
    if (reason === null) return
    run(async () => {
      const { error: e } = r.status === 'payment_submitted' && r.submission
        ? await supabase.rpc('review_payment', { p_submission: r.submission.id, p_approve: false, p_reason: reason || undefined })
        : await supabase.rpc('review_registration', { p_registration: r.id, p_approve: false, p_reason: reason || undefined })
      return e
    })
  }
  const bulkApprove = () => run(async () => {
    for (const r of visible.filter(x => sel.has(x.id) && ['requested', 'payment_submitted'].includes(x.status))) {
      const { error: e } = r.status === 'payment_submitted' && r.submission
        ? await supabase.rpc('review_payment', { p_submission: r.submission.id, p_approve: true })
        : await supabase.rpc('review_registration', { p_registration: r.id, p_approve: true })
      if (e) return e
    }
  })
  const toggleVip = (r: GuestRow) => run(async () => (await supabase.from('registrations').update({ is_vip: !r.isVip }).eq('id', r.id)).error)
  const cancel = (r: GuestRow) => { if (confirm(`Cancel ${r.name}'s registration?`)) run(async () => (await supabase.rpc('cancel_registration', { p_registration: r.id })).error) }

  async function openProof(r: GuestRow) {
    if (!r.submission) return
    setProof({ row: r, url: null })
    const { data } = await supabase.storage.from('payment-proofs').createSignedUrl(r.submission.path, 300)
    setProof({ row: r, url: data?.signedUrl ?? null })
  }

  function exportCsv() {
    const head = ['Name', 'Phone', 'Email', 'Event', 'Ticket', 'Status', 'VIP', 'Paid PKR', 'Registered']
    const body = visible.map(r => [r.name, r.phone ?? '', r.email ?? '', r.eventTitle, r.ticket ?? '', r.status, r.isVip ? 'yes' : '', String(r.paid ?? 0), r.createdAt])
    // a leading = + - @ would run as a formula in Excel, so neutralise it
    const cell = (c: string) => `"${(/^[=+\-@\t\r]/.test(c) ? `'${c}` : c).replace(/"/g, '""')}"`
    const csv = [head, ...body].map(l => l.map(cell).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'guests.csv'; a.click()
  }

  const allSel = visible.length > 0 && visible.every(r => sel.has(r.id))
  const selReviewable = visible.filter(r => sel.has(r.id) && ['requested', 'payment_submitted'].includes(r.status)).length

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="w-full sm:w-72"><Input leading={<Search className="h-4 w-4" />} placeholder="Search name, phone or email" aria-label="Search guests" value={q} onChange={e => setQ(e.target.value)} /></div>
        <div className="w-full sm:w-64">
          <Select aria-label="Filter by event" value={eventId} onChange={e => setEventId(e.target.value)}>
            <option value="">All events</option>
            {events.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
          </Select>
        </div>
        <div className="ml-auto flex gap-2">
          <Button variant="secondary" leading={<Download className="h-4 w-4" />} onClick={exportCsv} disabled={visible.length === 0}>Export</Button>
          <Button leading={<UserPlus className="h-4 w-4" />} onClick={() => setAdding(true)} disabled={events.length === 0}>Add guest</Button>
        </div>
      </div>

      <div role="tablist" aria-label="Guest status" className="mb-4 flex gap-2 overflow-x-auto">
        {FILTERS.map(f => (
          <button key={f.id} role="tab" aria-selected={filter === f.id} onClick={() => setFilter(f.id)}
            className={cn('flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-1.5 text-[13px] font-medium ring-1 transition-colors',
              filter === f.id ? 'bg-accent/12 text-accent ring-accent/40' : 'text-muted ring-line hover:text-fg')}>
            {f.label}<span className="tnum text-[11px] opacity-70">{counts[f.id]}</span>
          </button>
        ))}
      </div>

      {error && <p role="alert" className="mb-4 rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>}

      {sel.size > 0 && (
        <div className="sticky top-20 z-20 mb-4 flex items-center gap-3 rounded-xl bg-overlay px-4 py-3 shadow-pop" role="status">
          <span className="text-sm text-fg">{sel.size} selected</span>
          <Button size="sm" onClick={bulkApprove} loading={pending} disabled={selReviewable === 0} leading={<Check className="h-4 w-4" />}>Approve {selReviewable || ''}</Button>
          <Button size="sm" variant="ghost" onClick={() => setSel(new Set())}>Clear</Button>
        </div>
      )}

      {visible.length === 0 ? (
        <Card><EmptyState icon={<UserPlus className="h-6 w-6" />} title="No guests here" description={rows.length === 0 ? 'Registrations appear as soon as people sign up for your events.' : 'Try another filter or search.'} /></Card>
      ) : (
        <TableWrap>
          <Table>
            <thead>
              <tr>
                <Th className="w-10"><input type="checkbox" aria-label="Select all" checked={allSel} onChange={() => setSel(allSel ? new Set() : new Set(visible.map(r => r.id)))} className="h-4 w-4 accent-[rgb(var(--k-accent))]" /></Th>
                <Th>Guest</Th><Th>Ticket</Th><Th>Status</Th><Th>Trust</Th><Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {visible.map(r => {
                const st = STATUS[r.status] ?? { label: r.status, tone: 'neutral' as BadgeTone }
                const reviewable = ['requested', 'payment_submitted'].includes(r.status)
                return (
                  <Tr key={r.id}>
                    <Td><input type="checkbox" aria-label={`Select ${r.name}`} checked={sel.has(r.id)} onChange={() => setSel(s => { const n = new Set(s); if (n.has(r.id)) n.delete(r.id); else n.add(r.id); return n })} className="h-4 w-4 accent-[rgb(var(--k-accent))]" /></Td>
                    <Td>
                      <div className="flex items-center gap-3">
                        <Avatar name={r.name} src={r.avatar} size={36} />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-fg">{r.name}{r.plusOne && <span className="ml-1.5 text-xs text-muted">+1</span>}</p>
                          <p className="truncate text-xs text-muted">{r.phone ?? r.email ?? '—'} · {r.eventTitle}</p>
                        </div>
                      </div>
                    </Td>
                    <Td>
                      <span className="flex items-center gap-1.5 text-sm text-fg">{r.ticket ?? 'Ticket'}{r.isVip && <Badge tone="magenta" className="px-1.5 py-0 text-[10px]">VIP</Badge>}</span>
                      <span className="tnum block text-xs text-muted">{pkr(r.due)}</span>
                    </Td>
                    <Td>
                      <Badge tone={st.tone}>{st.label}</Badge>
                      <span className="mt-1 block text-xs text-subtle" title={`${fmtDate(r.createdAt)} ${fmtTime(r.createdAt)}`}>{relative(r.createdAt)}</span>
                    </Td>
                    <Td>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {r.tier && <Badge tone={TIER[r.tier]?.tone ?? 'neutral'}>{TIER[r.tier]?.label ?? r.tier}</Badge>}
                        {r.idVerified && <span title="ID verified" className="text-success"><ShieldCheck className="h-4 w-4" aria-label="ID verified" /></span>}
                      </div>
                    </Td>
                    <Td className="text-right">
                      <div className="flex justify-end gap-1.5">
                        {r.attendeeId && <ReportButton kind="attendee" subjectId={r.attendeeId} subjectName={r.name} icon />}
                        {r.status === 'payment_submitted' && r.submission && <Button size="sm" variant="ghost" onClick={() => openProof(r)} leading={<ExternalLink className="h-3.5 w-3.5" />}>Proof</Button>}
                        {reviewable && <Button size="sm" onClick={() => approve(r)} loading={pending}>Approve</Button>}
                        {reviewable && <Button size="sm" variant="ghost" aria-label={`Decline ${r.name}`} onClick={() => reject(r)}><X className="h-4 w-4" /></Button>}
                        {!reviewable && !['rejected', 'cancelled', 'checked_in'].includes(r.status) && (
                          <>
                            <Button size="sm" variant="ghost" aria-label={r.isVip ? 'Remove VIP' : 'Mark VIP'} onClick={() => toggleVip(r)}><Star className={cn('h-4 w-4', r.isVip && 'fill-current text-magenta')} /></Button>
                            <Button size="sm" variant="ghost" onClick={() => cancel(r)}>Cancel</Button>
                          </>
                        )}
                      </div>
                    </Td>
                  </Tr>
                )
              })}
            </tbody>
          </Table>
        </TableWrap>
      )}

      <Modal open={!!proof} onClose={() => setProof(null)} title="Payment proof" description={proof ? `${proof.row.name} · ${pkr(proof.row.submission?.amount)}${proof.row.submission?.reference ? ` · Ref ${proof.row.submission.reference}` : ''}` : undefined}>
        {proof && (
          <div className="space-y-4">
            {proof.url
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={proof.url} alt="Payment screenshot" className="max-h-[55vh] w-full rounded-xl object-contain bg-raised" />
              : <div className="grid h-48 place-items-center rounded-xl bg-raised text-sm text-muted">Loading proof</div>}
            <div className="flex justify-end gap-2">
              <Button variant="danger" onClick={() => { const r = proof.row; setProof(null); reject(r) }}>Decline</Button>
              <Button onClick={() => { const r = proof.row; setProof(null); approve(r) }}>Approve payment</Button>
            </div>
          </div>
        )}
      </Modal>

      <AddGuest open={adding} onClose={() => setAdding(false)} events={events} defaultEvent={eventId} onDone={() => { setAdding(false); router.refresh() }} />
    </>
  )
}

function AddGuest({ open, onClose, events, defaultEvent, onDone }: { open: boolean; onClose: () => void; events: EventOpt[]; defaultEvent: string; onDone: () => void }) {
  const supabase = useMemo(() => createClient(), [])
  const [f, setF] = useState({ event: defaultEvent || events[0]?.id || '', name: '', phone: '', email: '', ticket: '', vip: false, plusOne: false })
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const tickets = events.find(e => e.id === f.event)?.tickets ?? []

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(null)
    if (!f.name.trim()) return setError('Enter the guest name.')
    setBusy(true)
    const { error: err } = await supabase.rpc('add_manual_registration', {
      p_event: f.event, p_full_name: f.name.trim(), p_phone: f.phone.trim() || undefined, p_email: f.email.trim() || undefined,
      p_ticket_type: f.ticket || undefined, p_source: 'manual', p_is_vip: f.vip, p_plus_one: f.plusOne,
    })
    setBusy(false)
    if (err) return setError(readable(err.message))
    setF(p => ({ ...p, name: '', phone: '', email: '', vip: false, plusOne: false })); onDone()
  }

  return (
    <Modal open={open} onClose={onClose} title="Add a guest" description="For friends, sponsors and walk ins. They get a confirmed QR ticket right away.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Event">{p => <Select {...p} value={f.event} onChange={e => setF({ ...f, event: e.target.value, ticket: '' })}>{events.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}</Select>}</Field>
        <Field label="Full name">{p => <Input {...p} value={f.name} onChange={e => setF({ ...f, name: e.target.value })} />}</Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Phone" optional>{p => <Input {...p} type="tel" value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} />}</Field>
          <Field label="Email" optional>{p => <Input {...p} type="email" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} />}</Field>
        </div>
        <Field label="Ticket" optional>
          {p => <Select {...p} value={f.ticket} onChange={e => setF({ ...f, ticket: e.target.value })}><option value="">No ticket type</option>{tickets.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</Select>}
        </Field>
        <div className="flex gap-6 text-sm text-muted">
          <label className="flex cursor-pointer items-center gap-2"><input type="checkbox" checked={f.vip} onChange={e => setF({ ...f, vip: e.target.checked })} className="h-4 w-4 accent-[rgb(var(--k-magenta))]" /> VIP</label>
          <label className="flex cursor-pointer items-center gap-2"><input type="checkbox" checked={f.plusOne} onChange={e => setF({ ...f, plusOne: e.target.checked })} className="h-4 w-4 accent-[rgb(var(--k-accent))]" /> Plus one</label>
        </div>
        {error && <p role="alert" className="text-sm text-danger">{error}</p>}
        <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={onClose}>Cancel</Button><Button type="submit" loading={busy}>Add guest</Button></div>
      </form>
    </Modal>
  )
}
