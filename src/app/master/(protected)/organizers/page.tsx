import { Badge, PageHeader, Table, TableWrap, Td, Th, Tr } from '@/components/kit'
import { requireAdmin } from '@/lib/data/admin'
import { fmtDate } from '@/lib/format'

export const metadata = { title: 'Organizers' }

export default async function OrganizersPage() {
  const { supabase } = await requireAdmin()
  const [{ data: profiles }, { data: ops }, { data: subs }, { data: priv }, { data: events }] = await Promise.all([
    supabase.from('profiles').select('id, full_name, city, created_at').eq('role', 'organizer').order('created_at', { ascending: false }),
    supabase.from('organizer_profiles').select('id, company_name'), supabase.from('organizer_subscriptions').select('organizer_id, plan_id, status, trial_ends_at, current_period_end'),
    supabase.from('profile_private').select('id, id_status, email'), supabase.from('events').select('organizer_id, status'),
  ])
  return (
    <div className="k-fade-up space-y-6"><PageHeader title="Organizers" description={`${profiles?.length ?? 0} accounts`} />
      <TableWrap><Table><thead><tr><Th>Organizer</Th><Th>Plan</Th><Th>ID</Th><Th className="text-right">Published</Th><Th>Joined</Th></tr></thead><tbody>{(profiles ?? []).map(p => { const s = subs?.find(x => x.organizer_id === p.id); const pr = priv?.find(x => x.id === p.id); return (
        <Tr key={p.id}><Td><p className="text-sm font-medium text-fg">{ops?.find(o => o.id === p.id)?.company_name ?? p.full_name}</p><p className="text-xs text-muted">{pr?.email} · {p.city}</p></Td>
          <Td><Badge tone={s?.status === 'active' ? 'success' : s?.status === 'trial' ? 'info' : 'warning'}>{s?.plan_id} {s?.status}</Badge></Td><Td><Badge tone={pr?.id_status === 'verified' ? 'success' : pr?.id_status === 'pending' ? 'warning' : 'neutral'}>{pr?.id_status}</Badge></Td>
          <Td className="text-right"><span className="tnum text-sm">{events?.filter(e => e.organizer_id === p.id && e.status === 'published').length ?? 0}</span></Td><Td className="text-sm text-muted">{fmtDate(p.created_at)}</Td></Tr>) })}</tbody></Table></TableWrap></div>
  )
}
