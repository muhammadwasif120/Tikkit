import { Card, PageHeader } from '@/components/kit'
import { requireAdmin } from '@/lib/data/admin'
import { rpcLoose } from '@/lib/rpc'
import { pkr } from '@/lib/format'

type Overview = { organizers: number; attendees: number; events_by_status: Record<string, number>; registrations_by_status: Record<string, number>; gross_ticket_sales_pkr: number; commissions_accrued_pkr: number; pending_id_reviews: number; pending_subscription_payments: number; subscriptions: Record<string, number> }

export default async function MasterOverview() {
  const { supabase } = await requireAdmin()
  const [{ data }, mods] = await Promise.all([supabase.rpc('master_overview'), rpcLoose(supabase as never, 'master_modules_overview')])
  const o = (data ?? {}) as unknown as Overview
  const m = (mods.data ?? null) as Record<string, unknown> | null
  const kv = (r: Record<string, number> | undefined) => Object.entries(r ?? {}).map(([k, v]) => `${k.replace('_', ' ')} ${v}`).join(' · ') || 'none'
  const cards: [string, string, string?][] = [
    ['Organizers', String(o.organizers ?? 0)], ['Attendees', String(o.attendees ?? 0)], ['Gross ticket sales', pkr(o.gross_ticket_sales_pkr)], ['Commissions accrued', pkr(o.commissions_accrued_pkr)],
    ['ID reviews waiting', String(o.pending_id_reviews ?? 0), '/master/verification'], ['Payments waiting', String(o.pending_subscription_payments ?? 0), '/master/payments'],
  ]
  return (
    <div className="k-fade-up space-y-6">
      <PageHeader title="Overview" description="Everything happening on the platform." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{cards.map(([k, v, href]) => <Card key={k} className="p-5"><p className="text-[13px] text-muted">{k}</p><p className="mt-2 tnum text-3xl font-semibold tracking-tight text-fg">{v}</p>{href && <a href={href} className="mt-1 inline-block text-xs text-accent hover:underline">Review</a>}</Card>)}</div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5"><p className="text-sm font-semibold text-fg">Events</p><p className="mt-2 text-sm text-muted">{kv(o.events_by_status)}</p><p className="mt-4 text-sm font-semibold text-fg">Registrations</p><p className="mt-2 text-sm text-muted">{kv(o.registrations_by_status)}</p></Card>
        <Card className="p-5"><p className="text-sm font-semibold text-fg">Plans</p><p className="mt-2 text-sm text-muted">{kv(o.subscriptions)}</p>{m && <><p className="mt-4 text-sm font-semibold text-fg">Modules</p><p className="mt-2 text-sm text-muted">Classes {kv(m.class_series_by_status as Record<string, number>)} · Spaces {kv(m.spaces_by_status as Record<string, number>)} · Retreats {kv(m.retreats_by_status as Record<string, number>)}</p></>}</Card>
      </div>
    </div>
  )
}
