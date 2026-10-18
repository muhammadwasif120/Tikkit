'use client'

import Link from 'next/link'
import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { CalendarDays, Lock, MapPin, Navigation, QrCode } from 'lucide-react'
import { Badge, Button, Modal } from '@/components/kit'
import { fmtDate, fmtTime } from '@/lib/format'

export type NextUp = {
  kind: 'event' | 'class' | 'space' | 'retreat'; title: string; start: string; where: string; secret: boolean; status: string
  href: string; token: string | null; countdown: string
}

const KIND = { event: 'Event', class: 'Class', space: 'Reservation', retreat: 'Retreat' } as const
const PENDING: Record<string, string> = { requested: 'Waiting for the organizer', awaiting_payment: 'Payment due', payment_submitted: 'Payment under review' }

/** The one thing the guest should look at first: what is next, when, where, and the QR if it is confirmed. */
export function NextUpCard({ n }: { n: NextUp }) {
  const [qr, setQr] = useState(false)
  return (
    <section aria-labelledby="next-title" className="k-gradient-ring relative overflow-hidden rounded-3xl bg-surface p-5 sm:p-7" data-tour="next-up">
      <div aria-hidden className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full opacity-40 blur-3xl" style={{ background: 'radial-gradient(closest-side, rgb(var(--k-accent) / .6), transparent)' }} />
      <div className="relative">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="accent">Next up</Badge><Badge>{KIND[n.kind]}</Badge>
          {PENDING[n.status] && <Badge tone="warning">{PENDING[n.status]}</Badge>}
        </div>
        <p className="mt-4 text-sm font-medium text-accent">{n.countdown}</p>
        <h2 id="next-title" className="mt-1 text-balance text-2xl font-semibold tracking-tight text-fg sm:text-3xl">{n.title}</h2>
        <p className="mt-2 flex items-center gap-1.5 text-sm text-muted"><CalendarDays className="h-4 w-4" aria-hidden />{fmtDate(n.start)} · {fmtTime(n.start)}</p>
        {n.where && <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">{n.secret ? <Lock className="h-4 w-4 text-violet" aria-hidden /> : <MapPin className="h-4 w-4" aria-hidden />}{n.where}</p>}
        <div className="mt-6 flex flex-wrap gap-2">
          {n.token && <Button leading={<QrCode className="h-4 w-4" />} onClick={() => setQr(true)}>Show QR ticket</Button>}
          {!n.secret && n.where && <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(n.where)}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center gap-2 rounded-[10px] bg-raised px-4 text-sm font-medium text-fg hover:bg-overlay"><Navigation className="h-4 w-4" aria-hidden />Directions</a>}
          <Link href={n.href} className="inline-flex h-10 items-center rounded-[10px] px-3 text-sm font-medium text-accent hover:underline">Details</Link>
        </div>
      </div>
      <Modal open={qr} onClose={() => setQr(false)} title={n.title} description={`${fmtDate(n.start)} at ${fmtTime(n.start)}`}>
        {n.token && <div className="flex flex-col items-center gap-3"><div className="rounded-2xl bg-white p-4"><QRCodeSVG value={n.token} size={230} /></div><p className="text-center text-xs text-muted">Show this at the door. It works once and cannot be shared.</p></div>}
      </Modal>
    </section>
  )
}
