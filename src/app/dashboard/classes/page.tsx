import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { Badge, Card, EmptyState, PageHeader } from '@/components/kit'
import { NewSeries, type Series } from '@/components/classes/ClassesOrganizer'
import { requireOwner } from '@/lib/data/viewer'
import { pkr } from '@/lib/format'

export const metadata = { title: 'Classes' }
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default async function ClassesPage() {
  const { supabase, entitlements } = await requireOwner()
  const { data } = await supabase.from('class_series').select('*').order('created_at', { ascending: false })
  const list = (data ?? []) as Series[]
  const lim = entitlements?.limits.classes
  return (
    <div className="k-fade-up">
      <PageHeader title="Classes" description="Workshops and recurring classes with drop in booking and pass packs." actions={<NewSeries locked={lim === 0} />} />
      {list.length === 0 ? <Card><EmptyState icon={<Sparkles className="h-6 w-6" />} title="No classes yet" description="Create a weekly class. Guests book a session and pay with proof or a pass." /></Card> : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{list.map(s => (
          <li key={s.id}><Link href={`/dashboard/classes/${s.id}`} className="block rounded-2xl bg-surface p-5 shadow-card transition-colors hover:bg-raised">
            <div className="flex items-center justify-between"><Badge tone={s.status === 'published' ? 'success' : 'neutral'}>{s.status}</Badge><span className="tnum text-sm text-fg">{s.drop_in_price_pkr ? pkr(s.drop_in_price_pkr) : 'Free'}</span></div>
            <h2 className="mt-3 text-lg font-semibold tracking-tight text-fg">{s.title}</h2>
            <p className="mt-1 text-sm text-muted">{s.weekdays.map(d => DAYS[d]).join(', ')} at {s.start_time.slice(0, 5)}</p>
            <p className="mt-3 text-xs text-subtle">{[s.instructor_name, s.city].filter(Boolean).join(' · ')}</p>
          </Link></li>))}</ul>
      )}
    </div>
  )
}
