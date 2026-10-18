import Link from 'next/link'
import { Building2, Lock } from 'lucide-react'
import { Badge, ButtonLink, Card, EmptyState, PageHeader } from '@/components/kit'
import { NewSpace, type Space } from '@/components/spaces/SpacesOrganizer'
import { requireOwner } from '@/lib/data/viewer'
import { pkr } from '@/lib/format'

export const metadata = { title: 'Spaces' }

export default async function SpacesPage() {
  const { supabase, entitlements } = await requireOwner()
  const { data } = await supabase.from('spaces').select('*').order('created_at', { ascending: false })
  const list = (data ?? []) as Space[]
  return (
    <div className="k-fade-up">
      <PageHeader title="Spaces" description="Rooms, courts, studios and tables guests can reserve by the slot." actions={<><Badge tone="magenta">Pro</Badge><NewSpace locked={entitlements?.limits.spaces === 0} /></>} />
      {entitlements?.limits.spaces === 0 && (
        <Card className="mb-6"><div className="flex flex-wrap items-center gap-4 p-5"><Lock className="h-5 w-5 text-magenta" aria-hidden /><div className="min-w-0 flex-1"><p className="text-sm font-medium text-fg">Space reservations are part of the Pro plan</p><p className="text-sm text-muted">Upgrade to open your rooms, courts or studios for booking. Spaces you already published stay live.</p></div><ButtonLink href="/dashboard/settings/billing" size="sm">See plans</ButtonLink></div></Card>
      )}
      {list.length === 0 ? <Card><EmptyState icon={<Building2 className="h-6 w-6" />} title="No spaces yet" description="Add a space, set its opening hours and start taking reservations." /></Card> : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{list.map(s => (
          <li key={s.id}><Link href={`/dashboard/spaces/${s.id}`} className="block rounded-2xl bg-surface p-5 shadow-card transition-colors hover:bg-raised">
            <div className="flex items-center justify-between"><Badge tone={s.status === 'published' ? 'success' : 'neutral'}>{s.status}</Badge><span className="tnum text-sm text-fg">{s.price_pkr_per_slot ? pkr(s.price_pkr_per_slot) : 'Free'}</span></div>
            <h2 className="mt-3 text-lg font-semibold tracking-tight text-fg">{s.name}</h2><p className="mt-1 text-sm capitalize text-muted">{s.kind} · {s.slot_minutes} min slots</p><p className="mt-3 text-xs text-subtle">{[s.area_label, s.city].filter(Boolean).join(', ')}</p>
          </Link></li>))}</ul>
      )}
    </div>
  )
}
