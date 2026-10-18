'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { CalendarDays, Check, Heart, MapPin, Sparkles, Ticket } from 'lucide-react'
import { Badge, EmptyState } from '@/components/kit'
import { toggleFollow, toggleInterest, toggleSaved } from '@/app/actions/attendeeActions'
import { pkr } from '@/lib/format'
import { cn } from '@/lib/cn'
import type { Pick } from '@/lib/discover'

const KIND = { event: 'Event', class: 'Class', space: 'Space' } as const

export function PickCard({ p }: { p: Pick }) {
  const tint = p.color ?? '#22d3ee'
  const [saved, setSaved] = useState(p.saved)
  const [following, setFollowing] = useState(p.following)
  const [, start] = useTransition()
  const save = () => { const on = !saved; setSaved(on); start(async () => { const r = await toggleSaved(p.eventId!, on); if (!r.ok) setSaved(!on) }) }
  const follow = () => { const on = !following; setFollowing(on); start(async () => { const r = await toggleFollow(p.organizerId!, on); if (!r.ok) setFollowing(!on) }) }
  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl bg-surface shadow-card ring-1 ring-line transition-[transform,background-color] duration-150 hover:-translate-y-0.5 hover:bg-raised">
      <div className="relative aspect-[16/9] overflow-hidden bg-raised">
        {p.cover
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={p.cover} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
          : <div className="grid h-full w-full place-items-center" style={{ backgroundImage: `radial-gradient(120% 100% at 20% 0%, ${tint}55, transparent 60%), radial-gradient(90% 90% at 100% 100%, ${tint}33, transparent 60%)` }}>
              <span className="text-5xl opacity-90" aria-hidden>{p.categoryIcon ?? (p.kind === 'space' ? '🏛️' : '✨')}</span>
            </div>}
        <div className="absolute left-3 top-3 flex gap-1.5"><Badge tone={p.kind === 'event' ? 'accent' : p.kind === 'class' ? 'violet' : 'magenta'}>{KIND[p.kind]}</Badge></div>
        {p.eventId && (
          <button type="button" onClick={save} aria-pressed={saved} aria-label={saved ? 'Remove from saved' : 'Save event'}
            className="absolute right-3 top-3 z-10 grid h-8 w-8 cursor-pointer place-items-center rounded-full bg-canvas/70 text-fg backdrop-blur transition-colors hover:bg-canvas">
            <Heart className={cn('h-4 w-4', saved && 'fill-magenta text-magenta')} aria-hidden />
          </button>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="inline-flex w-fit items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-0.5 text-[11px] font-medium text-accent"><Sparkles className="h-3 w-3" aria-hidden />{p.reason}</p>
        <h3 className="mt-2.5 line-clamp-2 text-base font-semibold leading-snug tracking-tight text-fg">
          <Link href={p.href} className="after:absolute after:inset-0 after:content-['']">{p.title}</Link>
        </h3>
        {p.when && <p className="mt-1.5 flex items-center gap-1.5 text-[13px] text-muted"><CalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden />{p.when}</p>}
        {p.where && <p className="mt-1 flex items-center gap-1.5 truncate text-[13px] text-muted"><MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden /><span className="truncate">{p.where}</span></p>}
        <div className="mt-auto flex items-center justify-between gap-2 pt-4 text-sm">
          {p.organizerId
            ? <button type="button" onClick={follow} aria-pressed={following} className="relative z-10 flex min-w-0 cursor-pointer items-center gap-1.5 text-left text-muted hover:text-fg"><span className="truncate">{p.organizer}</span><span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1', following ? 'bg-accent/12 text-accent ring-accent/40' : 'ring-line')}>{following ? 'Following' : 'Follow'}</span></button>
            : <span className="truncate text-muted">{p.organizer}</span>}
          {p.price !== null && <span className="tnum shrink-0 font-semibold text-fg">{p.price === 0 ? 'Free' : `${p.priceNote} ${pkr(p.price)}`}</span>}
        </div>
      </div>
    </div>
  )
}

type Tab = 'all' | 'event' | 'class' | 'space'

export function InterestChips({ categories }: { categories: { id: string; name: string; icon: string | null; selected: boolean }[] }) {
  const [sel, setSel] = useState(() => new Set(categories.filter(c => c.selected).map(c => c.id)))
  const [, start] = useTransition()
  const flip = (id: string) => {
    const on = !sel.has(id)
    setSel(prev => { const n = new Set(prev); if (on) n.add(id); else n.delete(id); return n })
    start(async () => { const r = await toggleInterest(id, on); if (!r.ok) setSel(prev => { const n = new Set(prev); if (on) n.delete(id); else n.add(id); return n }) })
  }
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Your interests">
      {categories.map(c => {
        const on = sel.has(c.id)
        return (
          <button key={c.id} type="button" aria-pressed={on} onClick={() => flip(c.id)}
            className={cn('inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium ring-1 transition-colors', on ? 'bg-accent/12 text-accent ring-accent/40' : 'text-muted ring-line hover:text-fg')}>
            {on ? <Check className="h-3.5 w-3.5" aria-hidden /> : <span aria-hidden>{c.icon}</span>}{c.name}
          </button>
        )
      })}
    </div>
  )
}

export function DiscoverFeed({ forYou, different }: { forYou: Pick[]; different: Pick[] }) {
  const [tab, setTab] = useState<Tab>('all')
  const show = (l: Pick[]) => l.filter(p => tab === 'all' || p.kind === tab)
  const a = show(forYou), b = show(different)
  const count = (k: Tab) => [...forYou, ...different].filter(p => k === 'all' || p.kind === k).length
  return (
    <>
      <div role="tablist" aria-label="What to show" className="mb-6 inline-flex flex-wrap rounded-xl bg-raised p-1 text-[13px] font-medium">
        {([['all', 'All'], ['event', 'Events'], ['class', 'Classes'], ['space', 'Spaces']] as const).map(([id, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={cn('cursor-pointer rounded-lg px-4 py-1.5', tab === id ? 'bg-surface text-fg shadow-card' : 'text-muted')}>{label} <span className="tnum text-subtle">{count(id)}</span></button>
        ))}
      </div>
      {a.length === 0 && b.length === 0 ? (
        <EmptyState icon={<Ticket className="h-6 w-6" />} title="Nothing here yet" description="Follow a few interests above and check back." />
      ) : (
        <>
          {a.length > 0 && <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{a.map(p => <li key={p.key}><PickCard p={p} /></li>)}</ul>}
          {b.length > 0 && (
            <section className="mt-12" aria-labelledby="different-title">
              <h2 id="different-title" className="text-lg font-semibold tracking-tight text-fg">Something different</h2>
              <p className="mb-4 mt-1 text-sm text-muted">Outside what you usually go to, in case it is your thing.</p>
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{b.map(p => <li key={p.key}><PickCard p={p} /></li>)}</ul>
            </section>
          )}
        </>
      )}
    </>
  )
}
