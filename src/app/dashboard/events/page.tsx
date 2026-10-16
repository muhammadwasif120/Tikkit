import Link from 'next/link'
import { CalendarDays, Plus } from 'lucide-react'
import { Badge, ButtonLink, Card, EmptyState, PageHeader, Progress, Table, TableWrap, Td, Th, Tr } from '@/components/kit'
import { requireOrganizer } from '@/lib/data/viewer'
import { fmtDate, fmtTime, pkrShort } from '@/lib/format'
import { cn } from '@/lib/cn'

export const metadata = { title: 'Events' }

const TABS = [
  { id: 'all', label: 'All' }, { id: 'upcoming', label: 'Upcoming' }, { id: 'draft', label: 'Drafts' }, { id: 'past', label: 'Past' },
] as const

const tone = { draft: 'neutral', published: 'success', completed: 'info', cancelled: 'danger', archived: 'neutral' } as const

export default async function EventsPage({ searchParams }: { searchParams: Promise<{ show?: string }> }) {
  const { show = 'all' } = await searchParams
  const { supabase, orgId } = await requireOrganizer()

  const { data: events } = await supabase
    .from('events')
    .select('id, title, slug, city, starts_at, status, capacity, cover_image_url, admin_status')
    .eq('organizer_id', orgId)
    .order('starts_at', { ascending: false })

  const ids = (events ?? []).map(e => e.id)
  const { data: regs } = ids.length
    ? await supabase.from('registrations').select('event_id, status, price_paid_pkr').in('event_id', ids).limit(10000)
    : { data: [] as { event_id: string; status: string; price_paid_pkr: number | null }[] }

  const stats = new Map<string, { taken: number; revenue: number; pending: number }>()
  for (const r of regs ?? []) {
    const s = stats.get(r.event_id) ?? { taken: 0, revenue: 0, pending: 0 }
    if (['confirmed', 'checked_in', 'no_show'].includes(r.status)) { s.taken++; s.revenue += r.price_paid_pkr ?? 0 }
    if (['requested', 'payment_submitted'].includes(r.status)) s.pending++
    stats.set(r.event_id, s)
  }

  const now = Date.now()
  const list = (events ?? []).filter(e =>
    show === 'draft' ? e.status === 'draft'
    : show === 'upcoming' ? e.status === 'published' && new Date(e.starts_at).getTime() >= now
    : show === 'past' ? new Date(e.starts_at).getTime() < now && e.status !== 'draft'
    : true)

  return (
    <div className="k-fade-up">
      <PageHeader
        title="Events"
        description="Everything you have created, published or run."
        actions={<ButtonLink href="/dashboard/events/new" leading={<Plus className="h-4 w-4" />}>New event</ButtonLink>}
      />

      <nav aria-label="Filter events" className="mb-4 flex gap-2 overflow-x-auto">
        {TABS.map(t => (
          <Link key={t.id} href={t.id === 'all' ? '/dashboard/events' : `/dashboard/events?show=${t.id}`} aria-current={show === t.id ? 'page' : undefined}
            className={cn('whitespace-nowrap rounded-full px-4 py-1.5 text-[13px] font-medium ring-1 transition-colors',
              show === t.id ? 'bg-accent/12 text-accent ring-accent/40' : 'text-muted ring-line hover:text-fg')}>
            {t.label}
          </Link>
        ))}
      </nav>

      {list.length === 0 ? (
        <Card>
          <EmptyState icon={<CalendarDays className="h-6 w-6" />} title={show === 'all' ? 'No events yet' : 'Nothing here'}
            description={show === 'all' ? 'Create your first event and start selling tickets.' : 'Try another filter.'}
            action={show === 'all' ? <ButtonLink href="/dashboard/events/new">New event</ButtonLink> : undefined} />
        </Card>
      ) : (
        <TableWrap>
          <Table>
            <thead>
              <tr><Th>Event</Th><Th>Date</Th><Th>Status</Th><Th className="min-w-[160px]">Sold</Th><Th className="text-right">Revenue</Th></tr>
            </thead>
            <tbody>
              {list.map(e => {
                const s = stats.get(e.id) ?? { taken: 0, revenue: 0, pending: 0 }
                return (
                  <Tr key={e.id}>
                    <Td>
                      <Link href={`/dashboard/events/${e.id}`} className="flex items-center gap-3">
                        {e.cover_image_url
                          // eslint-disable-next-line @next/next/no-img-element
                          ? <img src={e.cover_image_url} alt="" className="h-11 w-16 rounded-lg object-cover" />
                          : <span className="grid h-11 w-16 place-items-center rounded-lg bg-raised text-subtle"><CalendarDays className="h-4 w-4" /></span>}
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-fg hover:underline">{e.title}</span>
                          <span className="block truncate text-xs text-muted">{e.city ?? 'No city yet'}</span>
                        </span>
                      </Link>
                    </Td>
                    <Td><span className="text-sm text-fg">{fmtDate(e.starts_at)}</span><span className="block text-xs text-muted">{fmtTime(e.starts_at)}</span></Td>
                    <Td>
                      <div className="flex flex-wrap gap-1.5">
                        <Badge tone={tone[e.status]}>{e.status}</Badge>
                        {e.admin_status !== 'live' && <Badge tone="danger">{e.admin_status}</Badge>}
                        {s.pending > 0 && <Badge tone="warning">{s.pending} pending</Badge>}
                      </div>
                    </Td>
                    <Td>
                      <div className="flex items-center gap-3">
                        <span className="tnum w-16 text-sm text-fg">{s.taken}{e.capacity ? ` / ${e.capacity}` : ''}</span>
                        {e.capacity ? <div className="w-20"><Progress value={Math.min(100, Math.round((s.taken / e.capacity) * 100))} /></div> : null}
                      </div>
                    </Td>
                    <Td className="text-right"><span className="tnum text-sm text-fg">{pkrShort(s.revenue)}</span></Td>
                  </Tr>
                )
              })}
            </tbody>
          </Table>
        </TableWrap>
      )}
    </div>
  )
}
