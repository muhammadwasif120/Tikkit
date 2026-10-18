import Link from 'next/link'
import { ArrowRight, CalendarClock, Layers, Trophy, Wallet } from 'lucide-react'
import { Badge, Card, CardBody, CardHeader, PageHeader } from '@/components/kit'
import { NextUpCard, type NextUp } from '@/components/attendee/NextUpCard'
import { CollectibleCard } from '@/components/attendee/CollectibleCard'
import { PickCard } from '@/components/attendee/DiscoverFeed'
import { buildAgenda, loadBookings, loadTickets } from '@/lib/attendee'
import { buildDiscovery } from '@/lib/discover'
import { requireAttendee } from '@/lib/data/viewer'
import { fmtDate, fmtTime } from '@/lib/format'

export const metadata = { title: 'Today' }

function until(iso: string) {
  const ms = new Date(iso).getTime() - Date.now()
  if (ms <= 0) return 'Happening now'
  const h = ms / 3_600_000
  if (h < 1) return `In ${Math.max(1, Math.round(ms / 60_000))} minutes`
  if (h < 24) return `In ${Math.round(h)} hours`
  const d = Math.round(h / 24)
  return d === 1 ? 'Tomorrow' : `In ${d} days`
}

const TIER_ORDER = ['new', 'reliable', 'regular', 'trusted']

export default async function TodayPage() {
  const { supabase, profile } = await requireAttendee()
  const [t, b, stats, d] = await Promise.all([
    loadTickets(supabase, profile.id), loadBookings(supabase, profile.id),
    supabase.from('attendee_stats').select('score, tier, attended, streak').eq('id', profile.id).maybeSingle(),
    buildDiscovery(supabase, profile.id, profile.city),
  ])
  const agenda = buildAgenda(t, b)
  const first = agenda.find(a => new Date(a.end ?? a.start).getTime() >= Date.now())
  const next: NextUp | null = first ? { kind: first.kind, title: first.title, start: first.start, where: first.where, secret: !!first.secret, status: first.status, href: first.href, token: first.token ?? null, countdown: until(first.start) } : null
  const week = agenda.filter(a => a !== first && new Date(a.start).getTime() < Date.now() + 7 * 86_400_000).slice(0, 4)

  const attention = [
    ...t.upcoming.filter(u => ['awaiting_payment', 'payment_submitted', 'requested'].includes(u.status)).map(u => ({ key: u.id, title: u.event.title, note: u.status === 'awaiting_payment' ? 'Send payment and upload your receipt' : u.status === 'payment_submitted' ? 'Your receipt is being checked' : 'Waiting for the organizer to approve', cta: u.status === 'awaiting_payment' ? 'Pay now' : 'View', href: u.status === 'awaiting_payment' && u.event.slug ? `/events/${u.event.slug}` : '/guest/tickets', tone: u.status === 'awaiting_payment' ? 'warning' as const : 'info' as const })),
    ...b.rows.filter(r => !r.past && ['awaiting_payment', 'payment_submitted', 'requested'].includes(r.status)).map(r => ({ key: r.id, title: r.title, note: r.status === 'awaiting_payment' ? 'Payment due' : r.status === 'payment_submitted' ? 'Payment under review' : 'Waiting for approval', cta: 'View', href: '/guest/tickets', tone: r.status === 'awaiting_payment' ? 'warning' as const : 'info' as const })),
  ]
  const passes = b.rows.filter(r => r.kind === 'pass_purchase' && r.status === 'active')
  const tier = stats.data?.tier ?? 'new'
  const first_name = (profile.full_name ?? 'there').split(' ')[0]
  const hour = Number(new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hour12: false, timeZone: 'Asia/Karachi' }).format(new Date()))

  return (
    <div className="k-fade-up space-y-8">
      <PageHeader title={`${hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'}, ${first_name}`} description={fmtDate(new Date().toISOString(), { weekday: 'long', day: 'numeric', month: 'long' })} />

      {next ? <NextUpCard n={next} /> : (
        <Card className="k-gradient-ring"><CardBody className="flex flex-wrap items-center justify-between gap-4 p-6">
          <div><p className="text-lg font-semibold text-fg">Nothing planned yet</p><p className="mt-1 text-sm text-muted">Your next night out starts with a look at what is on for you.</p></div>
          <Link href="/guest/explore" className="inline-flex items-center gap-1.5 rounded-[10px] bg-accent px-4 py-2.5 text-sm font-medium text-accent-fg">See what is on <ArrowRight className="h-4 w-4" aria-hidden /></Link>
        </CardBody></Card>
      )}

      {attention.length > 0 && (
        <section aria-labelledby="att-title" data-tour="attention">
          <h2 id="att-title" className="mb-3 text-lg font-semibold tracking-tight text-fg">Needs your attention</h2>
          <ul className="space-y-2">
            {attention.map(a => (
              <li key={a.key}><Link href={a.href} className="flex items-center gap-3 rounded-2xl bg-surface p-4 shadow-card ring-1 ring-line transition-colors hover:bg-raised">
                <Badge tone={a.tone}>{a.cta}</Badge><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-fg">{a.title}</p><p className="text-xs text-muted">{a.note}</p></div><ArrowRight className="h-4 w-4 text-subtle" aria-hidden />
              </Link></li>
            ))}
          </ul>
        </section>
      )}

      {week.length > 0 && (
        <section aria-labelledby="week-title">
          <div className="mb-3 flex items-center justify-between"><h2 id="week-title" className="text-lg font-semibold tracking-tight text-fg">This week</h2><Link href="/guest/schedule" className="text-sm font-medium text-accent hover:underline">Full schedule</Link></div>
          <ul className="divide-y divide-line overflow-hidden rounded-2xl bg-surface shadow-card ring-1 ring-line">
            {week.map(a => (
              <li key={a.key}><Link href={a.href} className="flex items-center gap-4 p-4 hover:bg-raised">
                <div className="w-14 shrink-0 text-center"><p className="text-xs uppercase text-subtle">{fmtDate(a.start, { weekday: 'short' })}</p><p className="text-xl font-semibold tnum text-fg">{fmtDate(a.start, { day: 'numeric' })}</p></div>
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-fg">{a.title}</p><p className="truncate text-xs text-muted">{a.allDay ? 'All day' : fmtTime(a.start)}{a.where ? ` · ${a.secret ? 'Secret location' : a.where}` : ''}</p></div>
                <Badge tone={a.kind === 'event' ? 'accent' : a.kind === 'class' ? 'violet' : 'magenta'}>{a.kind === 'space' ? 'Space' : a.kind[0].toUpperCase() + a.kind.slice(1)}</Badge>
              </Link></li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/guest/wallet" className="group rounded-2xl bg-surface p-5 shadow-card ring-1 ring-line transition-colors hover:bg-raised" data-tour="wallet-card">
          <Wallet className="h-5 w-5 text-accent" aria-hidden />
          <p className="mt-3 text-sm font-semibold text-fg">Wallet</p>
          {passes.length ? <p className="mt-1 text-sm text-muted">{passes[0].title}: <span className="font-medium text-fg">{passes[0].left === null || passes[0].left === undefined ? 'unlimited' : `${passes[0].left} left`}</span></p> : <p className="mt-1 text-sm text-muted">Passes and payment history</p>}
        </Link>
        <Link href="/guest/score" className="group rounded-2xl bg-surface p-5 shadow-card ring-1 ring-line transition-colors hover:bg-raised">
          <Trophy className="h-5 w-5 text-magenta" aria-hidden />
          <p className="mt-3 text-sm font-semibold text-fg">Score</p>
          <p className="mt-1 text-sm text-muted"><span className="font-medium capitalize text-fg">{tier}</span> · {stats.data?.score ?? 0} points{stats.data?.streak ? ` · ${stats.data.streak} night streak` : ''}</p>
        </Link>
        <Link href="/guest/schedule" className="group rounded-2xl bg-surface p-5 shadow-card ring-1 ring-line transition-colors hover:bg-raised">
          <CalendarClock className="h-5 w-5 text-violet" aria-hidden />
          <p className="mt-3 text-sm font-semibold text-fg">Schedule</p>
          <p className="mt-1 text-sm text-muted">{agenda.length} coming up. Add them to your calendar.</p>
        </Link>
      </div>

      {t.collection.length > 0 && (
        <section aria-labelledby="col-title">
          <div className="mb-3 flex items-center justify-between"><h2 id="col-title" className="flex items-center gap-2 text-lg font-semibold tracking-tight text-fg"><Layers className="h-5 w-5 text-magenta" aria-hidden />Your collection <span className="text-sm font-normal text-muted">{t.collection.length} {t.collection.length === 1 ? 'night' : 'nights'}</span></h2><Link href="/guest/tickets" className="text-sm font-medium text-accent hover:underline">See all</Link></div>
          <ul className="grid grid-cols-3 gap-3 sm:gap-5">{t.collection.slice(0, 3).map(c => <li key={c.id}><CollectibleCard c={c} /></li>)}</ul>
        </section>
      )}

      {d.forYou.length > 0 && (
        <section aria-labelledby="fy-title">
          <div className="mb-3 flex items-center justify-between"><h2 id="fy-title" className="text-lg font-semibold tracking-tight text-fg">Picked for you</h2><Link href="/guest/explore" className="text-sm font-medium text-accent hover:underline">See more</Link></div>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{d.forYou.slice(0, 3).map(p => <li key={p.key}><PickCard p={p} /></li>)}</ul>
        </section>
      )}
    </div>
  )
}
