'use client'

import Link from 'next/link'
import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { CalendarDays, Lock, MapPin, QrCode, Ticket } from 'lucide-react'
import { Badge, Button, Card, EmptyState, Modal, type BadgeTone } from '@/components/kit'
import { CollectibleCard, type Collectible } from './CollectibleCard'
import { fmtDate, fmtDateTime, fmtTime, pkr } from '@/lib/format'

export type TicketRow = {
  id: string; status: string; token: string; isVip: boolean; ticket: string | null; due: number; plusOne: boolean
  event: { title: string; slug: string | null; startsAt: string; cover: string | null; where: string; secret: boolean }
}
/** An entry that did not turn into a collectible: missed, cancelled, declined or never confirmed. */
export type ClosedRow = {
  id: string; title: string; slug: string | null; startsAt: string; where: string; ticket: string | null
  label: string; detail: string; tone: BadgeTone
}

const STATUS: Record<string, { label: string; tone: BadgeTone; hint?: string }> = {
  requested: { label: 'Requested', tone: 'info', hint: 'Waiting for the organizer' },
  awaiting_payment: { label: 'Payment due', tone: 'warning', hint: 'Send payment and upload proof' },
  payment_submitted: { label: 'Under review', tone: 'warning', hint: 'Your proof is being checked' },
  confirmed: { label: 'Confirmed', tone: 'success' }, waitlisted: { label: 'Waitlisted', tone: 'info' },
}

type Tab = 'upcoming' | 'collection' | 'past'

export default function TicketsClient({ upcoming, collection, closed }: { upcoming: TicketRow[]; collection: Collectible[]; closed: ClosedRow[] }) {
  const [show, setShow] = useState<Tab>('upcoming')
  const [qr, setQr] = useState<TicketRow | null>(null)
  const [open, setOpen] = useState<Collectible | null>(null)
  const tabs: [Tab, string][] = [['upcoming', `Upcoming ${upcoming.length}`], ['collection', `Collection ${collection.length}`], ['past', `Past ${closed.length}`]]

  return (
    <>
      <div role="tablist" aria-label="Tickets" className="mb-5 inline-flex rounded-xl bg-raised p-1 text-[13px] font-medium">
        {tabs.map(([id, label]) => (
          <button key={id} role="tab" aria-selected={show === id} onClick={() => setShow(id)} className={`rounded-lg px-4 py-1.5 ${show === id ? 'bg-surface text-fg shadow-card' : 'text-muted'}`}>{label}</button>
        ))}
      </div>

      {show === 'upcoming' && (upcoming.length === 0
        ? <Card><EmptyState icon={<Ticket className="h-6 w-6" />} title="No upcoming tickets" description="Find something to go to." action={<Link href="/guest/explore" className="text-sm font-medium text-accent hover:underline">See what is on for you</Link>} /></Card>
        : (
          <ul className="space-y-4">
            {upcoming.map(t => {
              const st = STATUS[t.status] ?? { label: t.status, tone: 'neutral' as BadgeTone }
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
                    {t.status === 'confirmed' && <Button size="sm" leading={<QrCode className="h-4 w-4" />} onClick={() => setQr(t)}>Show QR ticket</Button>}
                  </div>
                </li>
              )
            })}
          </ul>
        ))}

      {show === 'collection' && (collection.length === 0
        ? <Card><EmptyState icon={<Ticket className="h-6 w-6" />} title="Your collection starts at the door" description="When you check in, the QR ticket is used up and turns into a collectible card. Only nights you actually attended make it here." action={<Link href="/guest/explore" className="text-sm font-medium text-accent hover:underline">Find a night</Link>} /></Card>
        : (
          <>
            <p className="mb-4 text-sm text-muted">A card for every night you attended. Missed or cancelled events never get one.</p>
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:gap-6">{collection.map(c => <li key={c.id}><CollectibleCard c={c} onClick={() => setOpen(c)} /></li>)}</ul>
          </>
        ))}

      {show === 'past' && (closed.length === 0
        ? <Card><EmptyState icon={<Ticket className="h-6 w-6" />} title="Nothing missed" description="Events you could not make, or that were cancelled, show up here." /></Card>
        : (
          <ul className="space-y-3">
            {closed.map(t => (
              <li key={t.id} className="flex items-center gap-4 rounded-2xl bg-surface/60 p-4 opacity-70 grayscale ring-1 ring-line">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2"><Badge tone={t.tone}>{t.label}</Badge><span className="text-xs text-subtle">{t.detail}</span></div>
                  <h2 className="mt-1.5 truncate text-base font-semibold text-muted">{t.title}</h2>
                  <p className="mt-0.5 text-sm text-subtle">{fmtDate(t.startsAt)} · {fmtTime(t.startsAt)} · {t.where}</p>
                </div>
              </li>
            ))}
          </ul>
        ))}

      <Modal open={!!qr} onClose={() => setQr(null)} title={qr?.event.title ?? ''} description={qr ? `${qr.ticket ?? 'Ticket'}${qr.isVip ? ' · VIP' : ''}` : undefined}>
        {qr && <div className="flex flex-col items-center gap-3"><div className="rounded-2xl bg-white p-4"><QRCodeSVG value={qr.token} size={230} /></div><p className="text-center text-xs text-muted">Show this at the door. It works once and cannot be shared. After you check in it becomes a collectible.</p></div>}
      </Modal>
      <Modal open={!!open} onClose={() => setOpen(null)} title={open?.title ?? ''} description={open ? `Attended ${open.attendedAt ? fmtDateTime(open.attendedAt) : fmtDate(open.startsAt)}` : undefined}>
        {open && (
          <div className="mx-auto max-w-[280px]">
            <CollectibleCard c={open} />
            <p className="mt-4 text-center text-sm text-muted">No. {open.serial} of {open.total} guests through the door · {open.ticket ?? 'Ticket'}{open.paid ? ` · ${pkr(open.paid)}` : ''}</p>
          </div>
        )}
      </Modal>
    </>
  )
}
