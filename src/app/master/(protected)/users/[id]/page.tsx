import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Badge, Card, CardBody, CardHeader, PageHeader } from '@/components/kit'
import AccountActions from '@/components/master/AccountActions'
import { requireAdmin } from '@/lib/data/admin'
import { adminRpc } from '@/lib/data/adminRpc'
import { fmtDate, fmtDateTime } from '@/lib/format'

export const metadata = { title: 'Account' }

type Detail = {
  profile: { id: string; role: string; name: string; username: string | null; city: string | null; joined: string; suspended_at: string | null; suspended_reason: string | null; email: string | null; phone: string | null; id_status: string | null; last_sign_in: string | null; company: string | null }
  subscription: { plan_id: string; status: string; trial_ends_at: string | null; current_period_end: string | null; billing_period: string | null } | null
  stats: { events: number; published: number; registrations_received: number; checked_in_received: number; registrations_made: number; attended: number; no_shows: number; tier: string | null }
  recent_events: { id: string; title: string; slug: string | null; status: string; admin_status: string; starts_at: string }[]
  recent_registrations: { id: string; event: string; status: string; created_at: string }[]
  reports_about: { id: string; category: string; status: string; details: string; created_at: string }[]
  reports_made: number
  audit: { action: string; details: Record<string, unknown>; created_at: string }[]
}

const label = (s: string) => s.replace(/_/g, ' ')
const Row = ({ k, v }: { k: string; v: React.ReactNode }) => <div className="flex justify-between gap-4 py-2 text-sm"><dt className="text-muted">{k}</dt><dd className="text-right text-fg">{v}</dd></div>

export default async function UserDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound()
  const { supabase } = await requireAdmin()
  const d = await adminRpc<Detail>(supabase, 'admin_user_detail', { p_user: id })
  if (!d) notFound()
  const p = d.profile, s = d.stats, isOrg = p.role === 'organizer'
  const display = p.company || p.name

  return (
    <div className="k-fade-up space-y-6">
      <div className="text-sm"><Link href={isOrg ? '/master/organizers' : '/master/attendees'} className="text-muted hover:text-fg">← {isOrg ? 'Organizers' : 'Attendees'}</Link></div>
      <PageHeader title={display} description={`${isOrg ? 'Organizer' : 'Attendee'} · joined ${fmtDate(p.joined)}${p.last_sign_in ? ` · last seen ${fmtDate(p.last_sign_in)}` : ''}`}
        actions={p.role !== 'admin' ? <AccountActions userId={p.id} name={display} role={p.role} suspended={!!p.suspended_at} /> : undefined} />

      {p.suspended_at && <Card className="ring-1 ring-danger/40"><CardBody><p className="text-sm font-semibold text-danger">Suspended {fmtDateTime(p.suspended_at)}</p><p className="mt-1 text-sm text-muted">{p.suspended_reason}</p></CardBody></Card>}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card><CardHeader title="Details" /><CardBody><dl className="divide-y divide-line">
          <Row k="Name" v={p.name} />{p.company && <Row k="Company" v={p.company} />}<Row k="Email" v={p.email ?? '-'} /><Row k="Phone" v={p.phone ?? '-'} /><Row k="City" v={p.city ?? '-'} />
          <Row k="ID" v={<Badge tone={p.id_status === 'verified' ? 'success' : p.id_status === 'pending' ? 'warning' : 'neutral'}>{p.id_status ?? 'none'}</Badge>} />
          {p.username && <Row k="Public page" v={<Link href={`/organizer/${p.username}`} target="_blank" className="text-accent hover:underline">/organizer/{p.username}</Link>} />}
        </dl></CardBody></Card>
        {isOrg ? (
          <Card><CardHeader title="Usage" /><CardBody><dl className="divide-y divide-line">
            <Row k="Plan" v={d.subscription ? <Badge tone={d.subscription.status === 'active' ? 'success' : 'info'}>{d.subscription.plan_id} {d.subscription.status}</Badge> : 'None'} />
            {d.subscription?.trial_ends_at && <Row k="Trial ends" v={fmtDate(d.subscription.trial_ends_at)} />}{d.subscription?.current_period_end && <Row k="Paid until" v={fmtDate(d.subscription.current_period_end)} />}
            <Row k="Events" v={`${s.published} published of ${s.events}`} /><Row k="Registrations received" v={s.registrations_received} /><Row k="Guests who attended" v={s.checked_in_received} />
          </dl></CardBody></Card>
        ) : (
          <Card><CardHeader title="Activity" /><CardBody><dl className="divide-y divide-line">
            <Row k="Tier" v={<Badge>{s.tier ?? 'new'}</Badge>} /><Row k="Tickets" v={s.registrations_made} /><Row k="Attended" v={s.attended} /><Row k="Missed" v={s.no_shows} /><Row k="Reports they sent" v={d.reports_made} />
          </dl></CardBody></Card>
        )}
        <Card><CardHeader title="Reports about this account" description={`${d.reports_about.length} in total`} /><CardBody className="space-y-3">
          {d.reports_about.length === 0 ? <p className="text-sm text-muted">None.</p> : d.reports_about.slice(0, 5).map(r => <div key={r.id} className="text-sm"><div className="flex items-center gap-2"><Badge tone={r.status === 'open' ? 'warning' : r.status === 'actioned' ? 'success' : 'neutral'}>{r.status}</Badge><span className="capitalize text-fg">{label(r.category)}</span></div><p className="mt-1 line-clamp-2 text-muted">{r.details}</p></div>)}
          {d.reports_about.length > 0 && <Link href="/master/reports" className="text-sm font-medium text-accent hover:underline">Open the reports queue</Link>}
        </CardBody></Card>
      </div>

      {isOrg ? (
        <Card><CardHeader title="Recent events" /><CardBody>{d.recent_events.length === 0 ? <p className="text-sm text-muted">No events yet.</p> : <ul className="divide-y divide-line">{d.recent_events.map(e => <li key={e.id} className="flex items-center gap-3 py-2.5 text-sm"><span className="min-w-0 flex-1">{e.slug ? <Link href={`/events/${e.slug}`} target="_blank" className="truncate font-medium text-fg hover:underline">{e.title}</Link> : <span className="text-fg">{e.title}</span>}<span className="block text-xs text-muted">{fmtDate(e.starts_at)}</span></span><Badge tone={e.status === 'published' ? 'success' : 'neutral'}>{e.status}</Badge>{e.admin_status !== 'live' && <Badge tone="danger">{e.admin_status}</Badge>}</li>)}</ul>}</CardBody></Card>
      ) : (
        <Card><CardHeader title="Recent tickets" /><CardBody>{d.recent_registrations.length === 0 ? <p className="text-sm text-muted">No tickets yet.</p> : <ul className="divide-y divide-line">{d.recent_registrations.map(r => <li key={r.id} className="flex items-center gap-3 py-2.5 text-sm"><span className="min-w-0 flex-1 truncate text-fg">{r.event}</span><Badge tone={r.status === 'checked_in' ? 'accent' : r.status === 'confirmed' ? 'success' : r.status === 'no_show' ? 'danger' : 'neutral'}>{label(r.status)}</Badge><span className="text-xs text-muted">{fmtDate(r.created_at)}</span></li>)}</ul>}</CardBody></Card>
      )}

      <Card><CardHeader title="Admin history" description="Every action taken on this account" /><CardBody>{d.audit.length === 0 ? <p className="text-sm text-muted">Nothing yet.</p> : <ul className="divide-y divide-line">{d.audit.map((a, i) => <li key={i} className="flex items-center justify-between gap-3 py-2.5 text-sm"><span className="capitalize text-fg">{label(a.action)}</span><span className="text-xs text-muted">{fmtDateTime(a.created_at)}</span></li>)}</ul>}</CardBody></Card>
    </div>
  )
}
