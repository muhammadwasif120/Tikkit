import Link from 'next/link'
import { Lock, Mountain } from 'lucide-react'
import { Badge, ButtonLink, Card, EmptyState, PageHeader } from '@/components/kit'
import NewRetreat from '@/components/retreats/NewRetreat'
import { requireOrganizer } from '@/lib/data/viewer'
import { fromLoose } from '@/lib/rpc'
import { fmtDate } from '@/lib/format'

export const metadata = { title: 'Retreats' }

type R = { id: string; title: string; client_company: string | null; destination: string | null; starts_on: string; ends_on: string; status: string }

export default async function RetreatsPage() {
  const { supabase, entitlements } = await requireOrganizer()
  const allowed = entitlements?.limits.retreats !== 0 && entitlements?.limits.retreats !== undefined
  const { data } = await fromLoose(supabase as never, 'retreats').select('id, title, client_company, destination, starts_on, ends_on, status').order('starts_on', { ascending: false })
  const list = (data ?? []) as R[]

  return (
    <div className="k-fade-up">
      <PageHeader title="Retreats" description="Plan multi day trips for companies. Build the itinerary, manage the people and the budget, and share a live schedule." actions={<><Badge tone="magenta">Pro</Badge><NewRetreat locked={!allowed} /></>} />
      {!allowed && (
        <Card className="mb-6"><div className="flex flex-wrap items-center gap-4 p-5"><Lock className="h-5 w-5 text-magenta" aria-hidden /><div className="min-w-0 flex-1"><p className="text-sm font-medium text-fg">Retreat planning is on the Pro plan</p><p className="text-[13px] text-muted">Itineraries, participants, budgets and a shareable schedule for corporate trips.</p></div><ButtonLink href="/dashboard/settings/billing" size="sm">See plans</ButtonLink></div></Card>
      )}
      {list.length === 0 ? (
        <Card><EmptyState icon={<Mountain className="h-6 w-6" />} title="No retreats yet" description="Start with the dates and the destination. We create the days for you." /></Card>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map(r => (
            <li key={r.id}><Link href={`/dashboard/retreats/${r.id}`} className="block rounded-2xl bg-surface p-5 shadow-card transition-colors hover:bg-raised">
              <div className="flex items-center justify-between"><Badge tone={r.status === 'confirmed' ? 'success' : r.status === 'completed' ? 'info' : 'neutral'}>{r.status.replace('_', ' ')}</Badge><span className="tnum text-xs text-subtle">{Math.round((+new Date(r.ends_on) - +new Date(r.starts_on)) / 86_400_000) + 1} days</span></div>
              <h2 className="mt-3 text-lg font-semibold tracking-tight text-fg">{r.title}</h2>
              <p className="mt-1 text-sm text-muted">{[r.client_company, r.destination].filter(Boolean).join(' · ') || 'No client yet'}</p>
              <p className="mt-4 text-xs text-subtle">{fmtDate(r.starts_on, { day: 'numeric', month: 'short' })} to {fmtDate(r.ends_on, { day: 'numeric', month: 'short', year: 'numeric' })}</p>
            </Link></li>
          ))}
        </ul>
      )}
    </div>
  )
}
