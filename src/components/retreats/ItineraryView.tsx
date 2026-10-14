'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { CalendarPlus, Check, ExternalLink, MapPin, MessageCircle } from 'lucide-react'
import { Badge, Button, Logo } from '@/components/kit'
import { KIND, icsForDay, mapsUrl, type RetreatDay, type RetreatItem, type SharedRetreat } from '@/lib/retreats'
import { fmtDate, fmtTime } from '@/lib/format'
import { cn } from '@/lib/cn'

type Props = {
  retreat: SharedRetreat
  /** Set for a participant's own view. */
  me?: { name: string; room: string | null; dietary: string | null; checkedIn: string[] }
  updates?: { body: string; created_at: string }[]
}

const isoDay = (d: string) => d.slice(0, 10)

/** Interactive, read only itinerary. Used for the shared link and for participants. */
export default function ItineraryView({ retreat, me, updates = [] }: Props) {
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' })
  const firstActive = retreat.days.find(d => isoDay(d.date) >= today) ?? retreat.days[0]
  const [dayId, setDayId] = useState(firstActive?.id)
  const [open, setOpen] = useState<string | null>(null)
  const strip = useRef<HTMLDivElement>(null)
  const day = retreat.days.find(d => d.id === dayId) ?? retreat.days[0]
  const accent = retreat.accent_color ?? '#22D3EE'

  useEffect(() => { strip.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' }) }, [dayId])

  const now = Date.now()
  const nowItem = useMemo(() => day?.items.find(i => i.starts_at && new Date(i.starts_at).getTime() <= now && new Date(i.ends_at ?? i.starts_at).getTime() >= now), [day, now])
  const download = (d: RetreatDay) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([icsForDay(retreat.title, d)], { type: 'text/calendar' })); a.download = `${retreat.title}-day-${d.day_number}.ics`; a.click() }

  return (
    <div className="min-h-screen bg-canvas text-fg" style={{ ['--retreat' as string]: accent }}>
      <header className="relative overflow-hidden border-b border-line">
        {retreat.cover_image_url
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={retreat.cover_image_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />
          : <div className="absolute inset-0" style={{ backgroundImage: 'var(--k-glow)' }} />}
        <div className="absolute inset-0 bg-gradient-to-t from-canvas via-canvas/70 to-canvas/30" aria-hidden />
        <div className="relative mx-auto max-w-3xl px-4 pb-10 pt-6 sm:px-6">
          <div className="flex items-center justify-between">
            {retreat.organizer?.logo_url
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={retreat.organizer.logo_url} alt={retreat.organizer.name} className="h-8 object-contain" /> : <span className="text-sm font-medium text-muted">{retreat.organizer?.name}</span>}
            <Logo compact />
          </div>
          <p className="mt-14 text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: accent }}>{retreat.client_company ?? 'Company retreat'}</p>
          <h1 className="mt-2 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">{retreat.title}</h1>
          <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[15px] text-muted">
            {retreat.destination && <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" aria-hidden />{retreat.destination}</span>}
            <span>{fmtDate(retreat.starts_on, { day: 'numeric', month: 'short' })} to {fmtDate(retreat.ends_on, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            <span>{retreat.days.length} days</span>
          </p>
          {retreat.description && <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-muted">{retreat.description}</p>}
          {me && <div className="mt-6 inline-flex flex-wrap gap-2 rounded-2xl bg-surface/80 p-3 text-sm shadow-card backdrop-blur"><span className="font-medium text-fg">Hi {me.name}</span>{me.room && <Badge tone="info">Room {me.room}</Badge>}{me.dietary && <Badge tone="success">{me.dietary}</Badge>}</div>}
        </div>
      </header>

      <div className="sticky top-0 z-20 border-b border-line bg-canvas/85 backdrop-blur-xl">
        <div ref={strip} role="tablist" aria-label="Days" className="mx-auto flex max-w-3xl gap-2 overflow-x-auto px-4 py-3 sm:px-6">
          {retreat.days.map(d => {
            const on = d.id === day?.id
            return (
              <button key={d.id} role="tab" aria-selected={on} onClick={() => setDayId(d.id)}
                className={cn('flex min-w-[68px] shrink-0 flex-col items-center rounded-xl px-3 py-2 text-center transition-colors', on ? 'text-canvas' : 'bg-surface text-muted hover:text-fg')}
                style={on ? { background: accent } : undefined}>
                <span className="text-[11px] font-medium uppercase tracking-wider opacity-80">Day {d.day_number}</span>
                <span className="tnum text-lg font-semibold">{fmtDate(d.date, { day: 'numeric' })}</span>
                <span className="text-[11px] opacity-80">{fmtDate(d.date, { month: 'short' })}</span>
              </button>
            )
          })}
        </div>
      </div>

      <main className="mx-auto max-w-3xl px-4 pb-24 pt-8 sm:px-6">
        {updates.length > 0 && (
          <section aria-label="Updates" className="mb-8 rounded-2xl bg-surface p-5 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: accent }}>Latest update</p>
            <p className="mt-2 whitespace-pre-line text-[15px] text-fg">{updates[0].body}</p>
            <p className="mt-1 text-xs text-subtle">{fmtDate(updates[0].created_at)} at {fmtTime(updates[0].created_at)}</p>
          </section>
        )}

        {day && (
          <section aria-labelledby="day-title">
            <div className="flex items-start justify-between gap-4">
              <div><h2 id="day-title" className="text-2xl font-semibold tracking-tight">{day.title && day.title !== `Day ${day.day_number}` ? day.title : `Day ${day.day_number}`}</h2><p className="text-sm text-muted">{fmtDate(day.date, { weekday: 'long', day: 'numeric', month: 'long' })}</p></div>
              {day.items.some(i => i.starts_at) && <Button variant="secondary" size="sm" leading={<CalendarPlus className="h-4 w-4" />} onClick={() => download(day)}>Add to calendar</Button>}
            </div>
            {day.summary && <p className="mt-3 text-[15px] text-muted">{day.summary}</p>}

            {day.items.length === 0 ? <p className="mt-10 rounded-2xl bg-surface p-8 text-center text-muted shadow-card">Nothing planned for this day yet.</p> : (
              <ol className="relative mt-8 space-y-4 border-l border-line pl-6">
                {day.items.map(i => <Item key={i.id} item={i} accent={accent} live={nowItem?.id === i.id} open={open === i.id} onToggle={() => setOpen(open === i.id ? null : i.id)} done={me?.checkedIn.includes(i.id)} />)}
              </ol>
            )}
          </section>
        )}

        {retreat.documents && retreat.documents.length > 0 && (
          <section className="mt-12"><h2 className="text-lg font-semibold">Documents</h2><ul className="mt-3 space-y-2">{retreat.documents.map(d => <li key={d.id} className="rounded-xl bg-surface px-4 py-3 text-sm shadow-card">{d.name}</li>)}</ul></section>
        )}

        {retreat.organizer?.whatsapp && (
          <a href={`https://wa.me/${retreat.organizer.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
            className="mt-12 flex items-center justify-center gap-2 rounded-2xl bg-surface px-5 py-4 text-sm font-medium shadow-card hover:bg-raised"><MessageCircle className="h-4 w-4" aria-hidden />Questions? Message {retreat.organizer.name} on WhatsApp</a>
        )}
      </main>
    </div>
  )
}

function Item({ item: i, accent, live, open, onToggle, done }: { item: RetreatItem; accent: string; live: boolean; open: boolean; onToggle: () => void; done?: boolean }) {
  const k = KIND[i.kind]
  return (
    <li className="relative">
      <span className="absolute -left-[31px] top-4 grid h-4 w-4 place-items-center rounded-full ring-4 ring-canvas" style={{ background: live ? accent : 'rgb(var(--k-line-strong))' }} aria-hidden>{live && <span className="h-1.5 w-1.5 animate-ping rounded-full bg-canvas" />}</span>
      <button onClick={onToggle} aria-expanded={open} className={cn('w-full rounded-2xl bg-surface p-4 text-left shadow-card transition-colors hover:bg-raised', live && 'ring-1')} style={live ? { ['--tw-ring-color' as string]: accent } : undefined}>
        <div className="flex items-start gap-3">
          <span className="text-xl leading-none" aria-hidden>{k.emoji}</span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {i.starts_at && <span className="tnum text-sm font-semibold" style={{ color: accent }}>{fmtTime(i.starts_at)}{i.ends_at ? ` to ${fmtTime(i.ends_at)}` : ''}</span>}
              <Badge tone="neutral">{k.label}</Badge>
              {live && <Badge tone="success" dot>Happening now</Badge>}
              {i.status === 'done' && <Badge tone="info">Done</Badge>}{i.status === 'skipped' && <Badge tone="danger">Cancelled</Badge>}
              {done && <span className="inline-flex items-center gap-1 text-xs text-success"><Check className="h-3.5 w-3.5" />Checked in</span>}
            </div>
            <h3 className="mt-1.5 text-base font-semibold">{i.title}</h3>
            {i.location_name && <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted"><MapPin className="h-3.5 w-3.5" aria-hidden />{i.location_name}</p>}
          </div>
        </div>
        {open && (
          <div className="k-fade-up mt-3 space-y-3 border-t border-line pt-3 text-sm">
            {i.description && <p className="whitespace-pre-line text-muted">{i.description}</p>}
            {i.location_address && <p className="text-muted">{i.location_address}</p>}
            {(i.location_name || i.latitude !== null) && <a href={mapsUrl(i)} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="inline-flex items-center gap-1.5 font-medium hover:underline" style={{ color: accent }}><ExternalLink className="h-3.5 w-3.5" aria-hidden />Open in Maps</a>}
          </div>
        )}
      </button>
    </li>
  )
}
