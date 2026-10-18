import Link from 'next/link'
import { AlertTriangle, CalendarClock, ShieldCheck, Users } from 'lucide-react'
import { Badge, Card, CardBody, CardHeader, PageHeader, Progress, StatCard, Table, TableWrap, Td, Th, Tr } from '@/components/kit'
import { requireAdmin } from '@/lib/data/admin'
import { adminRpc, type Dash, type UpcomingEvent } from '@/lib/data/adminRpc'
import { fmtDate, fmtTime, pkr } from '@/lib/format'

export const metadata = { title: 'Overview' }

const n = (v: number | undefined) => (v ?? 0).toLocaleString('en-PK')
const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 100) : 0)

function Mini({ label, value, hint, href, tone }: { label: string; value: string; hint?: string; href?: string; tone?: 'warning' }) {
  const body = <><p className="text-[13px] text-muted">{label}</p><p className={`mt-1.5 tnum text-2xl font-semibold tracking-tight ${tone === 'warning' ? 'text-warning' : 'text-fg'}`}>{value}</p>{hint && <p className="mt-1 text-xs text-subtle">{hint}</p>}</>
  return href ? <Link href={href}><Card className="p-4 transition-colors hover:bg-raised">{body}</Card></Link> : <Card className="p-4">{body}</Card>
}

export default async function MasterOverview() {
  const { supabase } = await requireAdmin()
  const [d, upcoming] = await Promise.all([adminRpc<Dash>(supabase, 'admin_dashboard'), adminRpc<UpcomingEvent[]>(supabase, 'admin_upcoming_events', { p_days: 30, p_limit: 8 })])
  if (!d) return <div className="k-fade-up"><PageHeader title="Overview" description="Could not load the numbers. Check that the latest database migration has been applied." /></div>

  const a = d.accounts, e = d.events, r = d.registrations
  const orgSpark = d.signups_30d.map(x => x.organizers), attSpark = d.signups_30d.map(x => x.attendees)
  const needs = d.reports.open + d.reports.reviewing + d.pending.id_reviews + d.pending.subscription_payments

  return (
    <div className="k-fade-up space-y-8">
      <PageHeader title="Overview" description="Who is on the platform, what is happening, and what needs you." />

      {needs > 0 && (
        <section aria-label="Needs attention" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Mini label="Open reports" value={n(d.reports.open + d.reports.reviewing)} hint={`${n(d.reports.last_7d)} new this week`} href="/master/reports" tone={d.reports.open ? 'warning' : undefined} />
          <Mini label="ID reviews waiting" value={n(d.pending.id_reviews)} href="/master/verification" tone={d.pending.id_reviews ? 'warning' : undefined} />
          <Mini label="Plan payments waiting" value={n(d.pending.subscription_payments)} href="/master/payments" tone={d.pending.subscription_payments ? 'warning' : undefined} />
          <Mini label="Events flagged or suspended" value={n(e.flagged_or_suspended)} href="/master/events" />
        </section>
      )}

      <section aria-labelledby="acc" className="space-y-3">
        <h2 id="acc" className="text-lg font-semibold tracking-tight text-fg">Accounts</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Link href="/master/organizers"><StatCard label="Organizer accounts" value={n(a.organizers)} icon={<ShieldCheck className="h-4 w-4" />} spark={orgSpark} hint={`+${n(a.organizers_30d)} in 30 days${a.suspended_organizers ? ` · ${a.suspended_organizers} suspended` : ''}`} /></Link>
          <Link href="/master/attendees"><StatCard label="Attendee accounts" value={n(a.attendees)} icon={<Users className="h-4 w-4" />} tone="magenta" spark={attSpark} hint={`+${n(a.attendees_30d)} in 30 days${a.suspended_attendees ? ` · ${a.suspended_attendees} suspended` : ''}`} /></Link>
          <Mini label="Active organizers" value={n(d.activity.organizers_active_30d)} hint={`${n(d.activity.organizers_with_upcoming)} have an upcoming event · ${n(d.activity.organizers_never_published)} never published`} />
          <Mini label="Team managers" value={n(a.managers)} hint="Attendee accounts acting for an organizer" />
        </div>
      </section>

      <section aria-labelledby="ev" className="space-y-3">
        <h2 id="ev" className="text-lg font-semibold tracking-tight text-fg">Events and attendance</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Mini label="Upcoming events" value={n(e.upcoming)} hint={`${n(e.next_7d)} in 7 days · ${n(e.next_30d)} in 30 days`} href="/master/events" />
          <Mini label="Happening now" value={n(e.happening_now)} />
          <Mini label="Registrations for upcoming" value={n(r.for_upcoming_events)} hint="Requests, unpaid and confirmed" />
          <Mini label="Unique attendees" value={n(r.unique_attendees)} hint={`${n(d.activity.attendees_attended)} have attended an event · ${n(d.activity.attendees_never_registered)} never registered`} />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card><CardHeader title="Events by status" /><CardBody className="space-y-2 text-sm">
            {([['Published', e.published], ['Completed', e.completed], ['Drafts', e.draft], ['Cancelled', e.cancelled]] as const).map(([k, v]) => <div key={k} className="flex items-center gap-3"><span className="w-24 text-muted">{k}</span><Progress value={pct(v, e.total)} className="flex-1" /><span className="w-10 text-right tnum text-fg">{n(v)}</span></div>)}
            <p className="pt-1 text-xs text-subtle">{n(e.created_30d)} events created in the last 30 days.</p>
          </CardBody></Card>
          <Card><CardHeader title="Registrations" description={`${n(r.last_30d)} in the last 30 days`} /><CardBody className="space-y-2 text-sm">
            {([['Confirmed', r.confirmed], ['Checked in', r.checked_in], ['Waiting on an organizer', r.awaiting_review], ['No shows', r.no_show]] as const).map(([k, v]) => <div key={k} className="flex items-center gap-3"><span className="w-40 text-muted">{k}</span><Progress value={pct(v, r.total)} className="flex-1" tone={k === 'No shows' ? 'danger' : 'accent'} /><span className="w-12 text-right tnum text-fg">{n(v)}</span></div>)}
            <p className="pt-1 text-xs text-subtle">{pct(r.checked_in, r.checked_in + r.no_show)}% of guests who were due at the door turned up.</p>
          </CardBody></Card>
        </div>
      </section>

      <section aria-labelledby="up" className="space-y-3">
        <div className="flex items-center justify-between"><h2 id="up" className="flex items-center gap-2 text-lg font-semibold tracking-tight text-fg"><CalendarClock className="h-5 w-5 text-accent" aria-hidden />Next up</h2><Link href="/master/events" className="text-sm font-medium text-accent hover:underline">All upcoming events</Link></div>
        {(upcoming ?? []).length === 0 ? <Card><CardBody><p className="text-sm text-muted">No published events in the next 30 days.</p></CardBody></Card> : (
          <TableWrap><Table><thead><tr><Th>Event</Th><Th>Organizer</Th><Th>When</Th><Th className="text-right">Guests</Th></tr></thead><tbody>
            {(upcoming ?? []).map(x => <Tr key={x.id}><Td><p className="text-sm font-medium text-fg">{x.title}</p><p className="text-xs text-muted">{x.city}</p></Td><Td><Link href={`/master/users/${x.organizer_id}`} className="text-sm text-fg hover:underline">{x.organizer}</Link></Td><Td className="text-sm text-muted">{fmtDate(x.starts_at)} · {fmtTime(x.starts_at)}</Td><Td className="text-right tnum text-sm">{n(x.registrations)}{x.capacity ? <span className="text-subtle"> / {x.capacity}</span> : ''}</Td></Tr>)}
          </tbody></Table></TableWrap>
        )}
      </section>

      <section aria-labelledby="mon" className="space-y-3">
        <h2 id="mon" className="text-lg font-semibold tracking-tight text-fg">Plans and modules</h2>
        <div className="grid gap-4 lg:grid-cols-3">
          <Card><CardHeader title="Plans" description="Organizer subscriptions" /><CardBody className="space-y-1.5 text-sm">
            {d.plans.length === 0 ? <p className="text-muted">None yet.</p> : d.plans.map(p => <div key={p.plan + p.status} className="flex items-center justify-between"><span className="capitalize text-fg">{p.plan}</span><span className="flex items-center gap-2"><Badge tone={p.status === 'active' ? 'success' : p.status === 'trial' ? 'info' : 'warning'}>{p.status}</Badge><span className="w-8 text-right tnum text-fg">{p.count}</span></span></div>)}
            <p className="pt-2 text-xs text-subtle">{n(d.subscriptions.trials_ending_7d)} trials end in the next 7 days. {n(d.subscriptions.expired_or_grace)} expired, in grace or cancelled.</p>
          </CardBody></Card>
          <Card><CardHeader title="Module adoption" description="Beyond events" /><CardBody className="space-y-2 text-sm">
            {([['Classes', d.modules.classes.series, d.modules.classes.organizers, `${n(d.modules.classes.bookings)} bookings`], ['Spaces', d.modules.spaces.spaces, d.modules.spaces.organizers, `${n(d.modules.spaces.bookings)} bookings`], ['Retreats', d.modules.retreats.retreats, d.modules.retreats.organizers, `${n(d.modules.retreats.participants)} participants`]] as const).map(([k, count, orgs, hint]) => <div key={k}><p className="flex justify-between text-fg"><span>{k}</span><span className="tnum">{n(count)}</span></p><p className="text-xs text-subtle">{n(orgs)} {orgs === 1 ? 'organizer' : 'organizers'} · {hint}</p></div>)}
          </CardBody></Card>
          <Card><CardHeader title="Money" description="What TIKKIT X actually earns" /><CardBody className="space-y-3 text-sm">
            <div><p className="text-muted">Subscription revenue</p><p className="tnum text-2xl font-semibold text-fg">{pkr(d.subscriptions.revenue_pkr)}</p><p className="text-xs text-subtle">{pkr(d.subscriptions.revenue_30d_pkr)} in the last 30 days</p></div>
            <div className="border-t border-line pt-3"><p className="text-muted">Ticket value paid organizer to guest</p><p className="tnum text-lg font-semibold text-fg">{pkr(d.ticket_value.total_pkr)}</p><p className="text-xs text-subtle">For information only. TIKKIT X does not handle or hold this money.</p></div>
          </CardBody></Card>
        </div>
      </section>

      <section aria-labelledby="mix" className="space-y-3">
        <h2 id="mix" className="text-lg font-semibold tracking-tight text-fg">Where it is happening</h2>
        <div className="grid gap-4 lg:grid-cols-3">
          <Card><CardHeader title="Cities" description="By registrations" /><CardBody className="space-y-1.5 text-sm">{d.cities.length === 0 ? <p className="text-muted">No data yet.</p> : d.cities.map(c => <div key={c.city} className="flex justify-between"><span className="text-fg">{c.city}</span><span className="text-muted tnum">{n(c.registrations)} guests · {n(c.events)} events</span></div>)}</CardBody></Card>
          <Card><CardHeader title="Categories" description="By events" /><CardBody className="space-y-1.5 text-sm">{d.categories.length === 0 ? <p className="text-muted">No data yet.</p> : d.categories.map(c => <div key={c.category} className="flex justify-between"><span className="text-fg">{c.category}</span><span className="text-muted tnum">{n(c.events)} events · {n(c.registrations)} guests</span></div>)}</CardBody></Card>
          <Card><CardHeader title="Top organizers" description="Registrations, last 90 days" /><CardBody className="space-y-1.5 text-sm">{d.top_organizers.length === 0 ? <p className="text-muted">No data yet.</p> : d.top_organizers.map(o => <div key={o.id} className="flex justify-between gap-3"><Link href={`/master/users/${o.id}`} className="truncate text-fg hover:underline">{o.name}</Link><span className="shrink-0 text-muted tnum">{n(o.registrations)} guests · {n(o.events)} events</span></div>)}</CardBody></Card>
        </div>
      </section>
    </div>
  )
}
