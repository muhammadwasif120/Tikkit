'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarDays, Heart, MapPin, UserCheck } from 'lucide-react'
import { Badge, Button, Card, EmptyState } from '@/components/kit'
import { toggleFollow, toggleSaved } from '@/app/actions/attendeeActions'
import { fmtDate, fmtTime, pkr } from '@/lib/format'

export type SavedEvent = { id: string; slug: string; title: string; startsAt: string; where: string; price: number | null; cover: string | null }
export type Followed = { id: string; name: string; username: string | null; city: string | null; logo: string | null; upcoming: number }

export default function SavedClient({ events, orgs }: { events: SavedEvent[]; orgs: Followed[] }) {
  const router = useRouter()
  const [gone, setGone] = useState<Set<string>>(new Set())
  const [, start] = useTransition()
  const drop = (key: string, fn: () => Promise<{ ok: boolean }>) => { setGone(g => new Set(g).add(key)); start(async () => { const r = await fn(); if (!r.ok) setGone(g => { const n = new Set(g); n.delete(key); return n }); else router.refresh() }) }
  const ev = events.filter(e => !gone.has(e.id)), og = orgs.filter(o => !gone.has(o.id))

  return (
    <div className="space-y-10">
      <section aria-labelledby="saved-title">
        <h2 id="saved-title" className="mb-3 text-lg font-semibold tracking-tight text-fg">Saved events</h2>
        {ev.length === 0 ? <Card><EmptyState icon={<Heart className="h-6 w-6" />} title="Nothing saved yet" description="Tap the heart on an event in For you to keep it here." action={<Link href="/guest/explore" className="text-sm font-medium text-accent hover:underline">Find events</Link>} /></Card> : (
          <ul className="space-y-3">
            {ev.map(e => (
              <li key={e.id} className="flex items-center gap-4 rounded-2xl bg-surface p-3 shadow-card ring-1 ring-line">
                <div className="h-20 w-24 shrink-0 overflow-hidden rounded-xl bg-raised">{e.cover
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={e.cover} alt="" className="h-full w-full object-cover" /> : <div className="h-full w-full" style={{ backgroundImage: 'var(--k-glow)' }} />}</div>
                <div className="min-w-0 flex-1">
                  <Link href={`/events/${e.slug}`} className="block truncate text-sm font-semibold text-fg hover:underline">{e.title}</Link>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-muted"><CalendarDays className="h-3.5 w-3.5" aria-hidden />{fmtDate(e.startsAt)} · {fmtTime(e.startsAt)}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-muted"><MapPin className="h-3.5 w-3.5" aria-hidden />{e.where}</p>
                  {e.price !== null && <p className="mt-1 text-xs font-medium text-fg">{e.price === 0 ? 'Free' : `From ${pkr(e.price)}`}</p>}
                </div>
                <Button size="sm" variant="secondary" onClick={() => drop(e.id, () => toggleSaved(e.id, false))}>Remove</Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="follow-title" data-tour="following">
        <h2 id="follow-title" className="mb-3 text-lg font-semibold tracking-tight text-fg">Organizers you follow</h2>
        {og.length === 0 ? <Card><EmptyState icon={<UserCheck className="h-6 w-6" />} title="Not following anyone" description="Follow an organizer on any card in For you. Their events rank higher for you." /></Card> : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {og.map(o => (
              <li key={o.id} className="flex items-center gap-3 rounded-2xl bg-surface p-4 shadow-card ring-1 ring-line">
                <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-accent/12 text-sm font-semibold text-accent">{o.logo
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={o.logo} alt="" className="h-full w-full object-cover" /> : o.name[0]}</span>
                <div className="min-w-0 flex-1">
                  {o.username ? <Link href={`/organizer/${o.username}`} className="block truncate text-sm font-semibold text-fg hover:underline">{o.name}</Link> : <p className="truncate text-sm font-semibold text-fg">{o.name}</p>}
                  <p className="text-xs text-muted">{[o.city, o.upcoming ? `${o.upcoming} upcoming` : null].filter(Boolean).join(' · ') || 'Organizer'}</p>
                </div>
                <Badge tone="accent">Following</Badge>
                <Button size="sm" variant="secondary" onClick={() => drop(o.id, () => toggleFollow(o.id, false))}>Unfollow</Button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
