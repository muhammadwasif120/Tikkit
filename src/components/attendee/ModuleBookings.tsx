'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { QRCodeSVG } from 'qrcode.react'
import { Mountain, QrCode } from 'lucide-react'
import { Badge, Button, Modal, type BadgeTone } from '@/components/kit'
import PayProof from '@/components/booking/PayProof'
import { fmtDate, fmtTime, pkr } from '@/lib/format'

export type ModRow = { id: string; kind: 'class_booking' | 'space_booking' | 'pass_purchase'; title: string; when: string | null; status: string; token: string; due: number; organizerId: string; note?: string; past?: boolean; end?: string | null; where?: string; left?: number | null; total?: number | null; validUntil?: string | null }
export type RetreatLink = { id: string; title: string; destination: string | null; starts_on: string; ends_on: string; qr_token: string }
const tone: Record<string, BadgeTone> = { confirmed: 'success', active: 'success', checked_in: 'accent', awaiting_payment: 'warning', payment_submitted: 'warning', requested: 'info', exhausted: 'neutral', expired: 'neutral', no_show: 'danger', rejected: 'danger', cancelled: 'neutral' }
const PAST_LABEL = (status: string) => (status === 'checked_in' ? 'Attended' : status === 'cancelled' ? 'Cancelled' : 'Missed')
const LABEL: Record<string, string> = { class_booking: 'Class', space_booking: 'Reservation', pass_purchase: 'Pass' }

export default function ModuleBookings({ rows, retreats }: { rows: ModRow[]; retreats: RetreatLink[] }) {
  const router = useRouter(); const [qr, setQr] = useState<ModRow | null>(null); const [pay, setPay] = useState<ModRow | null>(null)
  if (rows.length === 0 && retreats.length === 0) return null
  return (
    <section className="mt-10" aria-labelledby="more-title">
      <h2 id="more-title" className="mb-4 text-lg font-semibold tracking-tight text-fg">Classes, passes and reservations</h2>
      <ul className="space-y-3">
        {rows.filter(r => !r.past || r.kind === 'pass_purchase').map(r => (
          <li key={r.id} className="rounded-2xl bg-surface p-4 shadow-card">
            <div className="flex flex-wrap items-center gap-3">
              <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><Badge tone="neutral">{LABEL[r.kind]}</Badge><Badge tone={tone[r.status] ?? 'neutral'}>{r.status.replace('_', ' ')}</Badge></div><p className="mt-1.5 truncate text-sm font-medium text-fg">{r.title}</p><p className="text-xs text-muted">{r.when ? `${fmtDate(r.when)} · ${fmtTime(r.when)}` : r.note}{r.due ? ` · ${pkr(r.due)}` : ''}</p></div>
              {r.status === 'awaiting_payment' && <Button size="sm" onClick={() => setPay(pay?.id === r.id ? null : r)}>Pay now</Button>}
              {['confirmed'].includes(r.status) && r.kind !== 'pass_purchase' && <Button size="sm" leading={<QrCode className="h-4 w-4" />} onClick={() => setQr(r)}>QR</Button>}
            </div>
            {pay?.id === r.id && <div className="mt-4"><PayProof kind={r.kind} subjectId={r.id} organizerId={r.organizerId} amount={r.due} onDone={() => { setPay(null); router.refresh() }} /></div>}
          </li>
        ))}
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
