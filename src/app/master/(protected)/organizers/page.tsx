import Link from 'next/link'
import { Badge, Button, PageHeader, Table, TableWrap, Td, Th, Tr } from '@/components/kit'
import { requireAdmin } from '@/lib/data/admin'
import { adminRpc } from '@/lib/data/adminRpc'
import { fmtDate } from '@/lib/format'

export const metadata = { title: 'Organizers' }

type Org = { id: string; name: string; contact: string; email: string | null; city: string | null; joined: string; last_sign_in: string | null; suspended_at: string | null; plan: string | null; plan_status: string | null; id_status: string | null; events_total: number; events_published: number; events_upcoming: number; last_event_at: string | null; registrations: number; checked_in: number; classes: number; spaces: number; retreats: number; open_reports: number }

export default async function OrganizersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = '' } = await searchParams
  const { supabase } = await requireAdmin()
  const rows = (await adminRpc<Org[]>(supabase, 'admin_list_organizers', { p_search: q || null })) ?? []
  const active = rows.filter(o => o.events_upcoming > 0).length
  return (
    <div className="k-fade-up space-y-6">
      <PageHeader title="Organizers" description={`${rows.length} ${q ? 'matching' : ''} accounts · ${active} with an upcoming event · ${rows.filter(o => o.suspended_at).length} suspended`} />
      <form className="flex gap-2"><input name="q" defaultValue={q} placeholder="Search name, company or email" aria-label="Search organizers" className="h-10 w-full max-w-sm rounded-[10px] border border-line-strong bg-raised px-3 text-sm text-fg placeholder:text-subtle focus:border-accent focus:outline-none" /><Button type="submit" variant="secondary">Search</Button></form>
      <TableWrap><Table><thead><tr><Th>Organizer</Th><Th>Plan</Th><Th>ID</Th><Th className="text-right">Events</Th><Th className="text-right">Guests</Th><Th>Modules</Th><Th>Last seen</Th></tr></thead><tbody>
        {rows.map(o => (
          <Tr key={o.id}>
            <Td><Link href={`/master/users/${o.id}`} className="text-sm font-medium text-fg hover:underline">{o.name}</Link><p className="text-xs text-muted">{o.email} · {o.city ?? 'No city'}</p>
              <div className="mt-1 flex gap-1.5">{o.suspended_at && <Badge tone="danger">Suspended</Badge>}{o.open_reports > 0 && <Badge tone="warning">{o.open_reports} {o.open_reports === 1 ? 'report' : 'reports'}</Badge>}</div></Td>
            <Td><Badge tone={o.plan_status === 'active' ? 'success' : o.plan_status === 'trial' ? 'info' : 'warning'}>{o.plan ?? 'none'} {o.plan_status ?? ''}</Badge></Td>
            <Td><Badge tone={o.id_status === 'verified' ? 'success' : o.id_status === 'pending' ? 'warning' : 'neutral'}>{o.id_status ?? 'none'}</Badge></Td>
            <Td className="text-right tnum text-sm">{o.events_published}<span className="text-subtle"> / {o.events_total}</span>{o.events_upcoming > 0 && <p className="text-xs text-accent">{o.events_upcoming} upcoming</p>}</Td>
            <Td className="text-right tnum text-sm">{o.registrations}<p className="text-xs text-subtle">{o.checked_in} attended</p></Td>
            <Td className="text-xs text-muted">{[o.classes && `${o.classes} classes`, o.spaces && `${o.spaces} spaces`, o.retreats && `${o.retreats} retreats`].filter(Boolean).join(', ') || 'None'}</Td>
            <Td className="text-sm text-muted">{o.last_sign_in ? fmtDate(o.last_sign_in) : 'Never'}<p className="text-xs text-subtle">Joined {fmtDate(o.joined)}</p></Td>
          </Tr>
        ))}
        {rows.length === 0 && <Tr><Td colSpan={7} className="py-10 text-center text-sm text-muted">No organizers found.</Td></Tr>}
      </tbody></Table></TableWrap>
    </div>
  )
}
