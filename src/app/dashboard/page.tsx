import { loadGuestAvatars } from '@/lib/data/guestAvatars'
import Link from 'next/link'
import { ArrowRight, CalendarDays, Clock, Coins, MapPin, Megaphone, QrCode, Ticket, Users } from 'lucide-react'
import {
  Avatar, Badge, BarChart, ButtonLink, Card, CardBody, CardHeader, EmptyState, PageHeader, Progress, StatCard,
} from '@/components/kit'
import { requireOrganizer } from '@/lib/data/viewer'
import { fmtDate, fmtDateTime, pkrShort, pkDay, relative } from '@/lib/format'

export const metadata = { title: 'Overview' }

const SOLD = ['confirmed', 'checked_in', 'no_show'] as const

export default async function OverviewPage() {
  const { supabase, profile, orgId, pendingCount, isManager } = await requireOrganizer()

  const since = new Date(Date.now() - 60 * 86_400_000).toISOString()
  const [{ data: events }, { data: sold }, { data: pending }] = await Promise.all([
    supabase.from('events').select('id, title, slug, starts_at, status, capacity, city, is_secret_venue')
      .eq('organizer_id', orgId).order('starts_at', { ascending: true }),
    supabase.from('registrations')
      .select('id, status, price_paid_pkr, approved_at, created_at, event_id, referrer_id, is_vip')
      .in('status', [...SOLD]).gte('created_at', since).limit(5000),
    supabase.from('registrations')
      .select('id, attendee_id, full_name, status, created_at, ticket_types(name), events(title)')
      .in('status', ['requested', 'payment_submitted']).order('created_at', { ascending: true }).limit(6),
  ])

  const avatars = await loadGuestAvatars(supabase)
  const all = events ?? []
  const now = Date.now()
  const upcoming = all.filter(e => e.status === 'published' && new Date(e.starts_at).getTime() >= now)
  const next = upcoming[0]
  const mine = new Set(all.map(e => e.id))
  const rows = (sold ?? []).filter(r => mine.has(r.event_id))

  // last 7 days (Pakistan time) vs the 7 before
  const days: { label: string; key: string; value: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now - i * 86_400_000)
    days.push({ label: fmtDate(d, { weekday: 'short' }), key: pkDay(d), value: 0 })
  }
  const prevStart = pkDay(new Date(now - 13 * 86_400_000))
  const thisStart = days[0].key
  let thisWeek = 0, lastWeek = 0, revenue = 0, revThis = 0, revLast = 0
  for (const r of rows) {
    const k = pkDay(r.approved_at ?? r.created_at)
    const amt = r.price_paid_pkr ?? 0
    revenue += amt
    const bucket = days.find(x => x.key === k)
    if (bucket) { bucket.value++; thisWeek++; revThis += amt }
    else if (k >= prevStart && k < thisStart) { lastWeek++; revLast += amt }
  }
  const pct = (a: number, b: number) => (b === 0 ? (a > 0 ? 100 : undefined) : Math.round(((a - b) / b) * 100))

  // top promoters
  const byRef = new Map<string, number>()
  for (const r of rows) if (r.referrer_id) byRef.set(r.referrer_id, (byRef.get(r.referrer_id) ?? 0) + 1)
  const topIds = [...byRef.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3)
  const { data: refs } = topIds.length
    ? await supabase.from('referrers').select('id, name').in('id', topIds.map(t => t[0]))
    : { data: [] as { id: string; name: string }[] }
  const promoters = topIds.map(([id, n]) => ({ id, n, name: refs?.find(r => r.id === id)?.name ?? 'Promoter' }))

  // next event numbers
  const nextRows = next ? rows.filter(r => r.event_id === next.id) : []
  const nextTaken = nextRows.length
  const firstName = (profile.full_name ?? '').split(' ')[0] || 'there'
  const hour = Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Karachi', hour: 'numeric', hour12: false }).format(new Date()))
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  if (all.length === 0) {
    return (
      <div className="k-fade-up">
        <PageHeader title={`Welcome, ${firstName}`} description="Let's get your first event live." />
        <Card className="mt-6">
          <EmptyState
            icon={<CalendarDays className="h-6 w-6" />}
            title="Create your first event"
            description="Add the details, set your tickets and publish. It takes about ten minutes."
            action={<ButtonLink href="/dashboard/events/new">New event</ButtonLink>}
          />
        </Card>
      </div>
    )
  }

  return (
    <div className="k-fade-up">
      <PageHeader
        eyebrow={fmtDate(new Date(), { weekday: 'long', day: 'numeric', month: 'long' })}
        title={`${greeting}, ${firstName}`}
        description={next
          ? `${next.title} is ${relative(next.starts_at)}.${pendingCount ? ` ${pendingCount} ${pendingCount === 1 ? 'guest is' : 'guests are'} waiting on you.` : ''}`
          : 'You have no upcoming events. Create one to start selling.'}
        actions={
          <>
            {pendingCount > 0 && <ButtonLink href="/dashboard/guests?status=pending" variant="secondary" leading={<Users className="h-4 w-4" />}>Review {pendingCount}</ButtonLink>}
            {isManager ? null : <ButtonLink href="/dashboard/events/new" leading={<CalendarDays className="h-4 w-4" />}>New event</ButtonLink>}
          </>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Key numbers">
        <StatCard label="Tickets sold" value={rows.length.toLocaleString('en-PK')} delta={pct(thisWeek, lastWeek)} hint="vs last week" icon={<Ticket className="h-4 w-4" />} spark={days.map(d => d.value).length > 1 ? days.map(d => d.value) : undefined} />
        <StatCard tone="magenta" label="Revenue" value={pkrShort(revenue)} delta={pct(revThis, revLast)} hint="approved payments" icon={<Coins className="h-4 w-4" />} />
        <StatCard label="Pending approvals" value={String(pendingCount)} hint={pending?.[0] ? `oldest ${relative(pending[0].created_at)}` : 'all clear'} icon={<Clock className="h-4 w-4" />} />
        <StatCard label="Upcoming events" value={String(upcoming.length)} hint={next ? `next ${fmtDate(next.starts_at)}` : 'none scheduled'} icon={<CalendarDays className="h-4 w-4" />} />
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Tickets sold this week" description="Approved and confirmed, all events" />
          <CardBody><BarChart data={days.map(d => ({ label: d.label, value: d.value }))} /></CardBody>
        </Card>

        <Card>
          <CardHeader title="Next up" description={next ? fmtDateTime(next.starts_at) : 'Nothing scheduled'} />
          <CardBody className="space-y-4">
            {next ? (
              <>
                <div>
                  <h4 className="text-lg font-semibold tracking-tight text-fg">{next.title}</h4>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
                    <MapPin className="h-3.5 w-3.5" aria-hidden />
                    {next.is_secret_venue ? 'Secret location' : next.city ?? 'Location to be announced'}
                  </p>
                </div>
                {next.capacity ? (
                  <div>
                    <div className="mb-2 flex items-baseline justify-between text-sm">
                      <span className="text-muted">Capacity</span>
                      <span className="tnum font-medium text-fg">{nextTaken} / {next.capacity}</span>
                    </div>
                    <Progress value={Math.min(100, Math.round((nextTaken / next.capacity) * 100))} />
                  </div>
                ) : <p className="text-sm text-muted">{nextTaken} confirmed so far</p>}
                <div className="flex gap-2">
                  <ButtonLink href={`/dashboard/event-day?event=${next.id}`} size="sm" className="flex-1" leading={<QrCode className="h-4 w-4" />}>Open door</ButtonLink>
                  <ButtonLink href={`/dashboard/events/${next.id}?tab=announce`} size="sm" variant="secondary" className="flex-1" leading={<Megaphone className="h-4 w-4" />}>Announce</ButtonLink>
                </div>
              </>
            ) : (
              <ButtonLink href="/dashboard/events/new" size="sm">Create an event</ButtonLink>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Needs your attention" description="Approve to confirm tickets and issue QR codes"
            action={<ButtonLink href="/dashboard/guests?status=pending" variant="ghost" size="sm" trailing={<ArrowRight className="h-4 w-4" />}>View all</ButtonLink>} />
          {pending && pending.length > 0 ? (
            <ul className="mt-3 divide-y divide-line px-2 pb-2 sm:px-3">
              {pending.map(r => (
                <li key={r.id}>
                  <Link href="/dashboard/guests?status=pending" className="flex items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-raised">
                    <Avatar name={r.full_name} src={r.attendee_id ? avatars.get(r.attendee_id) : null} size={38} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-fg">{r.full_name}</p>
                      <p className="truncate text-xs text-muted">{r.ticket_types?.name ?? 'Ticket'} · {r.events?.title}</p>
                    </div>
                    <Badge tone={r.status === 'payment_submitted' ? 'warning' : 'info'}>
                      {r.status === 'payment_submitted' ? 'Payment received' : 'Awaiting approval'}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <CardBody><p className="text-sm text-muted">Nothing waiting. New requests will show up here.</p></CardBody>
          )}
        </Card>

        <Card>
          <CardHeader title="Top promoters" description="By confirmed tickets" action={<Badge tone="magenta">Last 60 days</Badge>} />
          <CardBody className="space-y-4">
            {promoters.length === 0 && (
              <p className="text-sm text-muted">No referred sales yet. <Link href="/dashboard/referrals" className="text-accent hover:underline">Add a promoter</Link>.</p>
            )}
            {promoters.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3">
                <span className={'tnum w-4 text-sm font-semibold ' + (i === 0 ? 'text-magenta' : 'text-subtle')}>{i + 1}</span>
                <Avatar name={p.name} size={32} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-fg">{p.name}</p>
                  <p className="text-xs text-muted">{p.n} tickets</p>
                </div>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
