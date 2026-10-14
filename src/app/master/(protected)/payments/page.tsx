import { Badge, Card, EmptyState, PageHeader } from '@/components/kit'
import ReviewButtons from '@/components/master/ReviewButtons'
import { requireAdmin } from '@/lib/data/admin'
import { fmtDateTime, pkr } from '@/lib/format'

export const metadata = { title: 'Subscription payments' }

export default async function PaymentsPage() {
  const { supabase } = await requireAdmin()
  const { data } = await supabase.from('subscription_payments').select('id, organizer_id, plan_id, period, amount_pkr, status, screenshot_path, reference, created_at').order('created_at', { ascending: false }).limit(60)
  const ids = [...new Set((data ?? []).map(p => p.organizer_id))]
  const { data: orgs } = ids.length ? await supabase.from('profiles').select('id, full_name').in('id', ids) : { data: [] }
  const { data: ops } = ids.length ? await supabase.from('organizer_profiles').select('id, company_name').in('id', ids) : { data: [] }
  const rows = await Promise.all((data ?? []).map(async p => ({ ...p, url: p.screenshot_path ? (await supabase.storage.from('subscription-proofs').createSignedUrl(p.screenshot_path, 600)).data?.signedUrl ?? null : null })))
  return (
    <div className="k-fade-up space-y-6"><PageHeader title="Subscription payments" description="Check the transfer, then approve. Approval activates the plan and issues an invoice." />
      {rows.length === 0 ? <Card><EmptyState icon={<Badge>0</Badge>} title="No payments yet" /></Card> : <ul className="space-y-3">{rows.map(p => (
        <Card key={p.id}><div className="flex flex-wrap items-center gap-4 p-4">
          {p.url ? <a href={p.url} target="_blank" rel="noopener noreferrer" className="shrink-0">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={p.url} alt="Proof" className="h-20 w-20 rounded-xl object-cover" /></a> : <div className="h-20 w-20 rounded-xl bg-raised" />}
          <div className="min-w-0 flex-1"><p className="text-sm font-medium text-fg">{ops?.find(o => o.id === p.organizer_id)?.company_name ?? orgs?.find(o => o.id === p.organizer_id)?.full_name}</p><p className="text-xs capitalize text-muted">{p.plan_id} · {p.period === 'year' ? 'annual' : 'monthly'} · {fmtDateTime(p.created_at)}{p.reference ? ` · ref ${p.reference}` : ''}</p><p className="mt-1 tnum text-base font-semibold text-fg">{pkr(p.amount_pkr)}</p></div>
          {p.status === 'submitted' ? <ReviewButtons kind="subscription" id={p.id} /> : <Badge tone={p.status === 'approved' ? 'success' : 'danger'}>{p.status}</Badge>}
        </div></Card>))}</ul>}
    </div>
  )
}
