'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { QRCodeSVG } from 'qrcode.react'
import { Mountain, QrCode } from 'lucide-react'
import { Badge, Button, Modal, type BadgeTone } from '@/components/kit'
import PayProof from '@/components/booking/PayProof'
import { canPayRenewal, PERIOD_WORD, STATE_LABEL, STATE_TONE, type MState, type Period } from '@/lib/membership'
import { createClient } from '@/lib/supabase/client'
import { fmtDate, fmtTime, pkr } from '@/lib/format'

export type ModRow = { id: string; kind: 'class_booking' | 'space_booking' | 'pass_purchase'; title: string; when: string | null; status: string; token: string; due: number; organizerId: string; note?: string; past?: boolean; end?: string | null; where?: string; left?: number | null; total?: number | null; validUntil?: string | null; period?: Period; graceDays?: number; mstate?: MState }
export type RetreatLink = { id: string; title: string; destination: string | null; starts_on: string; ends_on: string; qr_token: string }
const tone: Record<string, BadgeTone> = { confirmed: 'success', active: 'success', checked_in: 'accent', awaiting_payment: 'warning', payment_submitted: 'warning', requested: 'info', exhausted: 'neutral', expired: 'neutral', no_show: 'danger', rejected: 'danger', cancelled: 'neutral' }
const PAST_LABEL = (status: string) => (status === 'checked_in' ? 'Attended' : status === 'cancelled' ? 'Cancelled' : 'Missed')
const LABEL: Record<string, string> = { class_booking: 'Class', space_booking: 'Reservation', pass_purchase: 'Pass' }
const readable = (m: string) => (m.match(/^[A-Z_]+(?::[a-z_]+)?: ([\s\S]*)$/)?.[1]) ?? m

export default function ModuleBookings({ rows, retreats }: { rows: ModRow[]; retreats: RetreatLink[] }) {
  const router = useRouter(); const [qr, setQr] = useState<ModRow | null>(null); const [pay, setPay] = useState<ModRow | null>(null)
  const [err, setErr] = useState<string | null>(null)
  if (rows.length === 0 && retreats.length === 0) return null
  async function stop(r: ModRow) {
    if (!confirm(`Stop ${r.title}? You can join again later.`)) return
    setErr(null)
    const { error } = await createClient().rpc('stop_membership', { p_pass: r.id })
    if (error) return setErr(readable(error.message))
    router.refresh()
  }
  return (
    <section className="mt-10" aria-labelledby="more-title">
      <h2 id="more-title" className="mb-4 text-lg font-semibold tracking-tight text-fg">Classes, passes and reservations</h2>
      {err && <p role="alert" className="mb-3 text-sm text-danger">{err}</p>}
      <ul className="space-y-3">
        {rows.filter(r => !r.past || r.kind === 'pass_purchase').map(r => {
          const member = r.kind === 'pass_purchase' && !!r.period
          const payable = r.status === 'awaiting_payment' || (member && !!r.mstate && canPayRenewal(r.mstate))
          return (
          <li key={r.id} className="rounded-2xl bg-surface p-4 shadow-card">
            <div className="flex flex-wrap items-center gap-3">
              <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><Badge tone="neutral">{member ? 'Membership' : LABEL[r.kind]}</Badge>{member && r.mstate ? <Badge tone={STATE_TONE[r.mstate]}>{STATE_LABEL[r.mstate]}</Badge> : <Badge tone={tone[r.status] ?? 'neutral'}>{r.status.replace('_', ' ')}</Badge>}</div><p className="mt-1.5 truncate text-sm font-medium text-fg">{r.title}</p>
                {member ? <p className="text-xs text-muted">{r.mstate === 'lapsed' ? `Lapsed on ${r.validUntil ? fmtDate(r.validUntil) : ''}. Pay to book classes again.` : r.mstate === 'awaiting_first' || r.mstate === 'pending_first' ? 'Pay to start your membership' : `${r.mstate === 'overdue' ? 'Was due' : 'Paid until'} ${r.validUntil ? fmtDate(r.validUntil) : ''}`} · {pkr(r.due)} / {PERIOD_WORD[r.period!]}{r.mstate === 'overdue' && r.graceDays ? ` · lapses ${r.graceDays} days after the due date` : ''}</p>
                  : <p className="text-xs text-muted">{r.when ? `${fmtDate(r.when)} · ${fmtTime(r.when)}` : r.note}{r.due ? ` · ${pkr(r.due)}` : ''}</p>}</div>
              {payable && <Button size="sm" onClick={() => setPay(pay?.id === r.id ? null : r)}>{member && r.status !== 'awaiting_payment' ? 'Pay for next ' + PERIOD_WORD[r.period!] : 'Pay now'}</Button>}
              {['confirmed'].includes(r.status) && r.kind !== 'pass_purchase' && <Button size="sm" leading={<QrCode className="h-4 w-4" />} onClick={() => setQr(r)}>QR</Button>}
              {member && r.status !== 'awaiting_payment' && <Button size="sm" variant="ghost" onClick={() => stop(r)}>Stop</Button>}
            </div>
            {pay?.id === r.id && <div className="mt-4"><PayProof kind={r.kind} subjectId={r.id} organizerId={r.organizerId} amount={r.due} onDone={() => { setPay(null); router.refresh() }} /></div>}
          </li>
        ) })}
        {rows.filter(r => r.past && r.kind !== 'pass_purchase').map(r => (
          <li key={r.id} className="rounded-2xl bg-surface/60 p-4 opacity-70 ring-1 ring-line">
            <div className="flex items-center gap-2"><Badge tone="neutral">{LABEL[r.kind]}</Badge><Badge tone={r.status === 'checked_in' ? 'accent' : 'danger'}>{PAST_LABEL(r.status)}</Badge></div>
            <p className="mt-1.5 truncate text-sm font-medium text-muted">{r.title}</p>
            <p className="text-xs text-subtle">{r.when ? `${fmtDate(r.when)} · ${fmtTime(r.when)}` : ''}</p>
          </li>
        ))}
        {retreats.map(r => (
          <li key={r.id}><Link href={`/itinerary/me/${r.qr_token}`} className="flex items-center gap-3 rounded-2xl bg-surface p-4 shadow-card transition-colors hover:bg-raised"><span className="grid h-10 w-10 place-items-center rounded-xl bg-magenta/12 text-magenta"><Mountain className="h-5 w-5" /></span><div className="min-w-0 flex-1"><p className="text-sm font-medium text-fg">{r.title}</p><p className="text-xs text-muted">{[r.destination, `${fmtDate(r.starts_on, { day: 'numeric', month: 'short' })} to ${fmtDate(r.ends_on, { day: 'numeric', month: 'short' })}`].filter(Boolean).join(' · ')}</p></div><Badge tone="magenta">My schedule</Badge></Link></li>
        ))}
      </ul>
      <Modal open={!!qr} onClose={() => setQr(null)} title={qr?.title ?? ''} description={qr?.when ? `${fmtDate(qr.when)} at ${fmtTime(qr.when)}` : undefined}>
        {qr && <div className="flex flex-col items-center gap-3"><div className="rounded-2xl bg-white p-4"><QRCodeSVG value={qr.token} size={230} /></div><p className="text-center text-xs text-muted">Show this at the door.</p></div>}
      </Modal>
    </section>
  )
}
