import Link from 'next/link'
import { Building2 } from 'lucide-react'
import { Badge, Card, EmptyState, PageHeader } from '@/components/kit'
import { NewSpace, type Space } from '@/components/spaces/SpacesOrganizer'
import { requireOrganizer } from '@/lib/data/viewer'
import { pkr } from '@/lib/format'

export const metadata = { title: 'Spaces' }

export default async function SpacesPage() {
  const { supabase, entitlements } = await requireOrganizer()
  const { data } = await supabase.from('spaces').select('*').order('created_at', { ascending: false })
  const list = (data ?? []) as Space[]
  return (
    <div className="k-fade-up">
      <PageHeader title="Spaces" description="Rooms, courts, studios and tables guests can reserve by the slot." actions={<NewSpace locked={entitlements?.limits.spaces === 0} />} />
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
