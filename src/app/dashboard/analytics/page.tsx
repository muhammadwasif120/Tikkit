import Link from 'next/link'
import { BarChart3, Lock } from 'lucide-react'
import { Badge, BarChart, ButtonLink, Card, CardBody, CardHeader, EmptyState, PageHeader, Progress, StatCard, Table, TableWrap, Td, Th, Tr } from '@/components/kit'
import { requireOrganizer } from '@/lib/data/viewer'
import { fmtDate, pkr, pkrShort, pkDay } from '@/lib/format'
import { cn } from '@/lib/cn'

export const metadata = { title: 'Analytics' }

const SOLD = ['confirmed', 'checked_in', 'no_show']

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ event?: string }> }) {
  const { event: eventId } = await searchParams
  const { supabase, profile, entitlements } = await requireOrganizer()
  const full = entitlements?.limits.full_analytics === true

  const { data: events } = await supabase.from('events').select('id, title').eq('organizer_id', profile.id).neq('status', 'draft').order('starts_at', { ascending: false })
  let q = supabase.from('registrations').select('status, price_paid_pkr, created_at, approved_at, ticket_type_id, referrer_id, event_id, ticket_types(name)').limit(20000)
  if (eventId) q = q.eq('event_id', eventId)
  const { data: regs } = await q

  const rows = regs ?? []
  if (rows.length === 0) {
    return (
      <div className="k-fade-up"><PageHeader title="Analytics" description="Sales, check-ins and promoter results." />
        <Card><EmptyState icon={<BarChart3 className="h-6 w-6" />} title="No data yet" description="Numbers appear as soon as guests register for your events." action={<ButtonLink href="/dashboard/events">View events</ButtonLink>} /></Card></div>
    )
  }

  const sold = rows.filter(r => SOLD.includes(r.status))
  const revenue = sold.reduce((s, r) => s + (r.price_paid_pkr ?? 0), 0)
  const checked = rows.filter(r => r.status === 'checked_in').length
  const live = rows.filter(r => !['cancelled', 'rejected'].includes(r.status)).length

  const days: { label: string; key: string; value: number }[] = []
  for (let i = 29; i >= 0; i--) { const d = new Date(Date.now() - i * 86_400_000); days.push({ label: i % 5 === 0 ? fmtDate(d, { day: 'numeric', month: 'short' }) : '', key: pkDay(d), value: 0 }) }
  for (const r of sold) { const b = days.find(d => d.key === pkDay(r.approved_at ?? r.created_at)); if (b) b.value++ }

  const funnel = [['Registered', live], ['Payment received', rows.filter(r => ['payment_submitted', ...SOLD].includes(r.status)).length], ['Confirmed', sold.length], ['Checked in', checked]] as const

  const byTicket = new Map<string, { name: string; n: number; rev: number }>()
  for (const r of sold) { const k = r.ticket_type_id ?? 'none'; const t = byTicket.get(k) ?? { name: r.ticket_types?.name ?? 'Ticket', n: 0, rev: 0 }; t.n++; t.rev += r.price_paid_pkr ?? 0; byTicket.set(k, t) }
  const byRef = new Map<string, number>()
  for (const r of sold) if (r.referrer_id) byRef.set(r.referrer_id, (byRef.get(r.referrer_id) ?? 0) + 1)
  const refIds = [...byRef.keys()]
  const { data: refs } = refIds.length ? await supabase.from('referrers').select('id, name').in('id', refIds) : { data: [] as { id: string; name: string }[] }
  const referredShare = sold.length ? Math.round(([...byRef.values()].reduce((a, b) => a + b, 0) / sold.length) * 100) : 0

  return (
    <div className="k-fade-up">
      <PageHeader title="Analytics" description="Sales, check-ins and promoter results." actions={!full ? <Badge tone="magenta">Basic plan view</Badge> : undefined} />
      <nav aria-label="Filter by event" className="mb-6 flex gap-2 overflow-x-auto">
        {[{ id: '', title: 'All events' }, ...(events ?? []).slice(0, 8)].map(e => (
          <Link key={e.id || 'all'} href={e.id ? `/dashboard/analytics?event=${e.id}` : '/dashboard/analytics'} aria-current={(eventId ?? '') === e.id ? 'page' : undefined}
            className={cn('whitespace-nowrap rounded-full px-4 py-1.5 text-[13px] font-medium ring-1', (eventId ?? '') === e.id ? 'bg-accent/12 text-accent ring-accent/40' : 'text-muted ring-line hover:text-fg')}>{e.title}</Link>
        ))}
      </nav>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Tickets sold" value={String(sold.length)} />
        <StatCard tone="magenta" label="Revenue" value={pkrShort(revenue)} />
        <StatCard label="Average ticket" value={pkr(sold.length ? Math.round(revenue / sold.length) : 0)} />
        <StatCard label="Check-in rate" value={`${sold.length ? Math.round((checked / sold.length) * 100) : 0}%`} hint={`${checked} of ${sold.length}`} />
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2"><CardHeader title="Tickets sold, last 30 days" /><CardBody><BarChart data={days.map(d => ({ label: d.label, value: d.value }))} /></CardBody></Card>
        <Card><CardHeader title="Funnel" description="From sign up to the door" />
          <CardBody className="space-y-4">{funnel.map(([k, v]) => <div key={k}><div className="mb-1.5 flex justify-between text-sm"><span className="text-muted">{k}</span><span className="tnum text-fg">{v}</span></div><Progress value={funnel[0][1] ? Math.round((v / funnel[0][1]) * 100) : 0} /></div>)}</CardBody></Card>
      </div>

      {full ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Card><CardHeader title="By ticket type" />
            <TableWrap className="rounded-none shadow-none"><Table><thead><tr><Th>Ticket</Th><Th className="text-right">Sold</Th><Th className="text-right">Revenue</Th></tr></thead>
              <tbody>{[...byTicket.values()].sort((a, b) => b.rev - a.rev).map(t => <Tr key={t.name}><Td className="text-sm text-fg">{t.name}</Td><Td className="text-right"><span className="tnum text-sm">{t.n}</span></Td><Td className="text-right"><span className="tnum text-sm">{pkr(t.rev)}</span></Td></Tr>)}</tbody></Table></TableWrap></Card>
          <Card><CardHeader title="Promoters" description={`${referredShare}% of sales were referred`} />
            <CardBody>{refIds.length === 0 ? <p className="text-sm text-muted">No referred sales yet.</p> : <ul className="divide-y divide-line">{[...byRef.entries()].sort((a, b) => b[1] - a[1]).map(([id, n], i) => <li key={id} className="flex items-center gap-3 py-2.5 text-sm"><span className={cn('tnum w-4 font-semibold', i === 0 ? 'text-magenta' : 'text-subtle')}>{i + 1}</span><span className="flex-1 text-fg">{refs?.find(r => r.id === id)?.name ?? 'Promoter'}</span><span className="tnum text-muted">{n} tickets</span></li>)}</ul>}</CardBody></Card>
        </div>
      ) : (
        <Card className="mt-6"><CardBody className="flex flex-wrap items-center gap-4"><Lock className="h-5 w-5 text-magenta" aria-hidden /><div className="min-w-0 flex-1"><p className="text-sm font-medium text-fg">Ticket type and promoter breakdowns are on Growth</p><p className="text-[13px] text-muted">See which tickets and which promoters bring in the money.</p></div><ButtonLink href="/dashboard/settings/billing" size="sm">Upgrade</ButtonLink></CardBody></Card>
      )}
    </div>
  )
}
