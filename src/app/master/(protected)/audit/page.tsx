import { Card, CardBody, PageHeader } from '@/components/kit'
import { requireAdmin } from '@/lib/data/admin'
import { fmtDateTime } from '@/lib/format'

export const metadata = { title: 'Audit log' }

export default async function AuditPage() {
  const { supabase } = await requireAdmin()
  const { data } = await supabase.from('admin_audit_log').select('id, action, entity, entity_id, details, created_at').order('created_at', { ascending: false }).limit(100)
  return (
    <div className="k-fade-up space-y-6"><PageHeader title="Audit log" description="Every admin action and every money or identity change." />
      <Card><CardBody>{(data ?? []).length === 0 ? <p className="text-sm text-muted">Nothing logged yet.</p> : <ul className="divide-y divide-line">{data!.map(a => <li key={a.id} className="py-2.5 text-sm"><span className="font-medium text-fg">{a.action}</span> <span className="text-muted">{a.entity} {a.entity_id}</span><span className="float-right text-xs text-subtle">{fmtDateTime(a.created_at)}</span></li>)}</ul>}</CardBody></Card></div>
  )
}
