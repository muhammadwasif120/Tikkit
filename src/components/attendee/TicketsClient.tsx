'use client'

import Link from 'next/link'
import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { CalendarDays, Lock, MapPin, QrCode, Ticket } from 'lucide-react'
import { Badge, Button, Card, EmptyState, Modal, type BadgeTone } from '@/components/kit'
import { fmtDate, fmtTime, pkr } from '@/lib/format'

export type TicketRow = {
  id: string; status: string; token: string; isVip: boolean; ticket: string | null; due: number; plusOne: boolean
  event: { title: string; slug: string | null; startsAt: string; cover: string | null; where: string; secret: boolean }
}

const STATUS: Record<string, { label: string; tone: BadgeTone; hint?: string }> = {
  requested: { label: 'Requested', tone: 'info', hint: 'Waiting for the organizer' },
  awaiting_payment: { label: 'Payment due', tone: 'warning', hint: 'Send payment and upload proof' },
  payment_submitted: { label: 'Under review', tone: 'warning', hint: 'Your proof is being checked' },
  confirmed: { label: 'Confirmed', tone: 'success' }, checked_in: { label: 'Checked in', tone: 'accent' },
  waitlisted: { label: 'Waitlisted', tone: 'info' }, no_show: { label: 'Missed', tone: 'danger' },
  rejected: { label: 'Declined', tone: 'danger' }, cancelled: { label: 'Cancelled', tone: 'neutral' },
}

export default function TicketsClient({ upcoming, past }: { upcoming: TicketRow[]; past: TicketRow[] }) {
  const [show, setShow] = useState<'upcoming' | 'past'>('upcoming')
  const [qr, setQr] = useState<TicketRow | null>(null)
  const list = show === 'upcoming' ? upcoming : past
  return (
    <>
      <div role="tablist" aria-label="Tickets" className="mb-5 inline-flex rounded-xl bg-raised p-1 text-[13px] font-medium">
        {([['upcoming', `Upcoming ${upcoming.length}`], ['past', `Past ${past.length}`]] as const).map(([id, label]) => (
          <button key={id} role="tab" aria-selected={show === id} onClick={() => setShow(id)} className={`rounded-lg px-4 py-1.5 ${show === id ? 'bg-surface text-fg shadow-card' : 'text-muted'}`}>{label}</button>
        ))}
      </div>
      {list.length === 0 ? (
        <Card><EmptyState icon={<Ticket className="h-6 w-6" />} title={show === 'upcoming' ? 'No upcoming tickets' : 'No past events yet'} description="Find something to go to." action={<Link href="/explore" className="text-sm font-medium text-accent hover:underline">Explore events</Link>} /></Card>
      ) : (
        <ul className="space-y-4">
          {list.map(t => {
            const st = STATUS[t.status] ?? { label: t.status, tone: 'neutral' as BadgeTone }
            const live = ['confirmed', 'checked_in'].includes(t.status)
            return (
              <li key={t.id} className="overflow-hidden rounded-2xl bg-surface shadow-card">
                <div className="flex gap-4 p-4">
                  <div className="hidden h-24 w-32 shrink-0 overflow-hidden rounded-xl bg-raised sm:block">
                    {t.event.cover
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={t.event.cover} alt="" className="h-full w-full object-cover" /> : <div className="h-full w-full" style={{ backgroundImage: 'var(--k-glow)' }} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2"><Badge tone={st.tone}>{st.label}</Badge>{t.isVip && <Badge tone="magenta">VIP</Badge>}{t.plusOne && <Badge tone="info">+1</Badge>}</div>
                    <h2 className="mt-2 truncate text-base font-semibold text-fg">{t.event.slug ? <Link href={`/events/${t.event.slug}`} className="hover:underline">{t.event.title}</Link> : t.event.title}</h2>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-muted"><CalendarDays className="h-3.5 w-3.5" aria-hidden />{fmtDate(t.event.startsAt)} · {fmtTime(t.event.startsAt)}</p>
                    <p className="mt-0.5 flex items-center gap-1.5 truncate text-sm text-muted">{t.event.secret ? <Lock className="h-3.5 w-3.5 text-violet" aria-hidden /> : <MapPin className="h-3.5 w-3.5" aria-hidden />}{t.event.where}</p>
                    <p className="mt-1 text-xs text-subtle">{t.ticket ?? 'Ticket'} · {t.due === 0 ? 'Free' : pkr(t.due)}{st.hint ? ` · ${st.hint}` : ''}</p>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 border-t border-line px-4 py-3">
                  {t.status === 'awaiting_payment' && <Link href={`/events/${t.event.slug}`} className="text-sm font-medium text-accent hover:underline">Pay now</Link>}
                  {live && <Button size="sm" leading={<QrCode className="h-4 w-4" />} onClick={() => setQr(t)}>Show QR ticket</Button>}
                </div>
              </li>
            )
          })}
        </ul>
      )}
      <Modal open={!!qr} onClose={() => setQr(null)} title={qr?.event.title ?? ''} description={qr ? `${qr.ticket ?? 'Ticket'}${qr.isVip ? ' · VIP' : ''}` : undefined}>
        {qr && <div className="flex flex-col items-center gap-3"><div className="rounded-2xl bg-white p-4"><QRCodeSVG value={qr.token} size={230} /></div><p className="text-center text-xs text-muted">Show this at the door. It works once and cannot be shared.</p></div>}
      </Modal>
    </>
  )
}
