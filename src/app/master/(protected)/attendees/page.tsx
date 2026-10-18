import Link from 'next/link'
import { Badge, Button, PageHeader, Table, TableWrap, Td, Th, Tr } from '@/components/kit'
import { requireAdmin } from '@/lib/data/admin'
import { adminRpc } from '@/lib/data/adminRpc'
import { fmtDate } from '@/lib/format'

export const metadata = { title: 'Attendees' }
const PAGE = 50

type Att = { id: string; name: string; email: string | null; phone: string | null; city: string | null; joined: string; last_sign_in: string | null; suspended_at: string | null; id_status: string | null; tier: string | null; score: number | null; attended: number; no_shows: number; registrations: number; is_manager: boolean; open_reports: number }

export default async function AttendeesPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const { q = '', page = '1' } = await searchParams
  const pg = Math.max(1, Number(page) || 1)
  const { supabase } = await requireAdmin()
  const res = await adminRpc<{ total: number; rows: Att[] }>(supabase, 'admin_list_attendees', { p_search: q || null, p_limit: PAGE, p_offset: (pg - 1) * PAGE })
  const rows = res?.rows ?? [], total = res?.total ?? 0
  const pages = Math.max(1, Math.ceil(total / PAGE))
  const href = (p: number) => `/master/attendees?${new URLSearchParams({ ...(q ? { q } : {}), page: String(p) })}`
  return (
    <div className="k-fade-up space-y-6">
      <PageHeader title="Attendees" description={`${total.toLocaleString('en-PK')} ${q ? 'matching' : ''} accounts`} />
      <form className="flex gap-2"><input name="q" defaultValue={q} placeholder="Search name, email or phone" aria-label="Search attendees" className="h-10 w-full max-w-sm rounded-[10px] border border-line-strong bg-raised px-3 text-sm text-fg placeholder:text-subtle focus:border-accent focus:outline-none" /><Button type="submit" variant="secondary">Search</Button></form>
      <TableWrap><Table><thead><tr><Th>Attendee</Th><Th>Tier</Th><Th className="text-right">Tickets</Th><Th className="text-right">Attended</Th><Th>ID</Th><Th>Last seen</Th></tr></thead><tbody>
        {rows.map(a => (
          <Tr key={a.id}>
            <Td><Link href={`/master/users/${a.id}`} className="text-sm font-medium text-fg hover:underline">{a.name}</Link><p className="text-xs text-muted">{a.email} · {a.city ?? 'No city'}</p>
              <div className="mt-1 flex gap-1.5">{a.suspended_at && <Badge tone="danger">Suspended</Badge>}{a.is_manager && <Badge tone="accent">Team manager</Badge>}{a.open_reports > 0 && <Badge tone="warning">{a.open_reports} {a.open_reports === 1 ? 'report' : 'reports'}</Badge>}</div></Td>
            <Td><Badge tone={a.tier === 'trusted' ? 'success' : a.tier === 'regular' ? 'accent' : 'neutral'}>{a.tier ?? 'new'}</Badge><p className="text-xs text-subtle tnum">{a.score ?? 0} pts</p></Td>
            <Td className="text-right tnum text-sm">{a.registrations}</Td>
            <Td className="text-right tnum text-sm">{a.attended}{a.no_shows > 0 && <span className="text-danger"> · {a.no_shows} missed</span>}</Td>
            <Td><Badge tone={a.id_status === 'verified' ? 'success' : a.id_status === 'pending' ? 'warning' : 'neutral'}>{a.id_status ?? 'none'}</Badge></Td>
            <Td className="text-sm text-muted">{a.last_sign_in ? fmtDate(a.last_sign_in) : 'Never'}<p className="text-xs text-subtle">Joined {fmtDate(a.joined)}</p></Td>
          </Tr>
        ))}
        {rows.length === 0 && <Tr><Td colSpan={6} className="py-10 text-center text-sm text-muted">No attendees found.</Td></Tr>}
      </tbody></Table></TableWrap>
      {pages > 1 && <nav aria-label="Pages" className="flex items-center justify-between text-sm"><span className="text-muted">Page {pg} of {pages}</span><span className="flex gap-2">{pg > 1 && <Link href={href(pg - 1)} className="rounded-[10px] bg-raised px-3 py-1.5 text-fg hover:bg-overlay">Previous</Link>}{pg < pages && <Link href={href(pg + 1)} className="rounded-[10px] bg-raised px-3 py-1.5 text-fg hover:bg-overlay">Next</Link>}</span></nav>}
    </div>
  )
}
