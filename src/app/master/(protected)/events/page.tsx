import Link from 'next/link'
import { Badge, PageHeader, Table, TableWrap, Td, Th, Tr } from '@/components/kit'
import EventStatus from '@/components/master/EventStatus'
import { requireAdmin } from '@/lib/data/admin'
import { fmtDate } from '@/lib/format'

export const metadata = { title: 'Events' }

export default async function MasterEvents() {
  const { supabase } = await requireAdmin()
  const { data } = await supabase.from('events').select('id, title, slug, status, admin_status, starts_at, city, organizer_id').order('created_at', { ascending: false }).limit(100)
  const ids = [...new Set((data ?? []).map(e => e.organizer_id))]
  const { data: ops } = ids.length ? await supabase.from('organizer_profiles').select('id, company_name').in('id', ids) : { data: [] }
  return (
    <div className="k-fade-up space-y-6"><PageHeader title="Events" description="Suspend or flag events that break the rules. Suspended events disappear from the public site." />
      <TableWrap><Table><thead><tr><Th>Event</Th><Th>Organizer</Th><Th>Date</Th><Th>Status</Th><Th>Moderation</Th></tr></thead><tbody>{(data ?? []).map(e => (
        <Tr key={e.id}><Td>{e.slug ? <Link href={`/events/${e.slug}`} className="text-sm font-medium text-fg hover:underline" target="_blank">{e.title}</Link> : <span className="text-sm text-fg">{e.title}</span>}<p className="text-xs text-muted">{e.city}</p></Td><Td className="text-sm text-muted">{ops?.find(o => o.id === e.organizer_id)?.company_name}</Td><Td className="text-sm text-muted">{fmtDate(e.starts_at)}</Td><Td><Badge tone={e.status === 'published' ? 'success' : 'neutral'}>{e.status}</Badge></Td><Td><EventStatus id={e.id} value={e.admin_status} /></Td></Tr>))}</tbody></Table></TableWrap></div>
  )
}
