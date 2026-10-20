import Link from 'next/link'
import { Badge, PageHeader, Table, TableWrap, Td, Th, Tr } from '@/components/kit'
import EventStatus from '@/components/master/EventStatus'
import { requireAdmin } from '@/lib/data/admin'
import { adminRpc, type UpcomingEvent } from '@/lib/data/adminRpc'
import { fmtDate, fmtTime } from '@/lib/format'
import { cn } from '@/lib/cn'

export const metadata = { title: 'Events' }

export default async function MasterEvents({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const { view = 'upcoming' } = await searchParams
  const { supabase } = await requireAdmin()
  const upcoming = view === 'upcoming'
  const rows = upcoming ? (await adminRpc<UpcomingEvent[]>(supabase, 'admin_upcoming_events', { p_days: 365, p_limit: 200 })) ?? [] : []
  const { data } = upcoming ? { data: [] } : await supabase.from('events').select('id, title, slug, status, admin_status, starts_at, city, organizer_id').order('created_at', { ascending: false }).limit(150)
  const ids = [...new Set((data ?? []).map(e => e.organizer_id))]
  const { data: ops } = ids.length ? await supabase.from('organizer_profiles').select('id, company_name').in('id', ids) : { data: [] }

  return (
    <div className="k-fade-up space-y-6">
      <PageHeader title="Events" description={upcoming ? `${rows.length} published events coming up, soonest first.` : 'Suspend or flag events that break the rules. Suspended events disappear from the public site.'} />
      <div role="tablist" aria-label="View" className="flex gap-1 text-[13px] font-medium">
        {([['upcoming', 'Upcoming'], ['all', 'All events and moderation']] as const).map(([id, text]) => <Link key={id} href={`/master/events?view=${id}`} role="tab" aria-selected={view === id} className={cn('rounded-lg px-3.5 py-1.5', view === id ? 'bg-raised text-fg' : 'text-muted hover:text-fg')}>{text}</Link>)}
      </div>

      {upcoming ? (
        <TableWrap><Table><thead><tr><Th>Event</Th><Th>Organizer</Th><Th>When</Th><Th className="text-right">Guests</Th><Th className="text-right">Waiting</Th><Th>Moderation</Th></tr></thead><tbody>
          {rows.map(e => (
            <Tr key={e.id}>
              <Td>{e.slug ? <Link href={`/events/${e.slug}`} target="_blank" className="text-sm font-medium text-fg hover:underline">{e.title}</Link> : <span className="text-sm text-fg">{e.title}</span>}<p className="text-xs text-muted">{e.city}{e.visibility === 'private' ? ' · unlisted' : ''}</p></Td>
              <Td><Link href={`/master/users/${e.organizer_id}`} className="text-sm text-fg hover:underline">{e.organizer}</Link></Td>
              <Td className="text-sm text-muted">{fmtDate(e.starts_at)}<p className="text-xs text-subtle">{fmtTime(e.starts_at)}</p></Td>
              <Td className="text-right tnum text-sm">{e.registrations}{e.capacity ? <span className="text-subtle"> / {e.capacity}</span> : ''}<p className="text-xs text-subtle">{e.confirmed} confirmed</p></Td>
              <Td className="text-right tnum text-sm">{e.awaiting > 0 ? <span className="text-warning">{e.awaiting}</span> : <span className="text-subtle">0</span>}</Td>
              <Td><EventStatus id={e.id} value={e.admin_status as 'live' | 'flagged' | 'suspended'} /></Td>
            </Tr>
          ))}
          {rows.length === 0 && <Tr><Td colSpan={6} className="py-10 text-center text-sm text-muted">No upcoming published events.</Td></Tr>}
        </tbody></Table></TableWrap>
      ) : (
        <TableWrap><Table><thead><tr><Th>Event</Th><Th>Organizer</Th><Th>Date</Th><Th>Status</Th><Th>Moderation</Th></tr></thead><tbody>
          {(data ?? []).map(e => (
            <Tr key={e.id}><Td>{e.slug ? <Link href={`/events/${e.slug}`} className="text-sm font-medium text-fg hover:underline" target="_blank">{e.title}</Link> : <span className="text-sm text-fg">{e.title}</span>}<p className="text-xs text-muted">{e.city}</p></Td>
              <Td><Link href={`/master/users/${e.organizer_id}`} className="text-sm text-muted hover:underline">{ops?.find(o => o.id === e.organizer_id)?.company_name}</Link></Td><Td className="text-sm text-muted">{fmtDate(e.starts_at)}</Td><Td><Badge tone={e.status === 'published' ? 'success' : 'neutral'}>{e.status}</Badge></Td><Td><EventStatus id={e.id} value={e.admin_status} /></Td></Tr>
          ))}
        </tbody></Table></TableWrap>
      )}
    </div>
  )
}
