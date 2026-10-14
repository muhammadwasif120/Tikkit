import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { Badge, PageHeader } from '@/components/kit'
import RetreatBuilder from '@/components/retreats/RetreatBuilder'
import { requireOrganizer } from '@/lib/data/viewer'
import { fromLoose } from '@/lib/rpc'
import { fmtDate } from '@/lib/format'

export const metadata = { title: 'Retreat' }

export default async function RetreatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase } = await requireOrganizer()
  const q = (t: string) => fromLoose(supabase as never, t)
  const { data: retreat } = await q('retreats').select('*').eq('id', id).maybeSingle()
  if (!retreat) notFound()

  const [days, items, people, lines, tasks, updates] = await Promise.all([
    q('retreat_days').select('*').eq('retreat_id', id).order('day_number'),
    q('retreat_items').select('*').eq('retreat_id', id),
    q('retreat_participants').select('*').eq('retreat_id', id).order('created_at'),
    q('retreat_budget_lines').select('*').eq('retreat_id', id).order('created_at'),
    q('retreat_tasks').select('*').eq('retreat_id', id).order('due_date', { nullsFirst: false }),
    q('retreat_updates').select('*').eq('retreat_id', id).order('created_at', { ascending: false }).limit(30),
  ])
  const h = await headers()
  const origin = `${h.get('x-forwarded-proto') ?? 'http'}://${h.get('host')}`
  const r = retreat as { title: string; client_company: string | null; destination: string | null; starts_on: string; ends_on: string; status: string }

  return (
    <div className="k-fade-up">
      <PageHeader eyebrow={r.client_company ?? 'Retreat'} title={r.title} description={`${r.destination ? `${r.destination} · ` : ''}${fmtDate(r.starts_on, { day: 'numeric', month: 'short' })} to ${fmtDate(r.ends_on, { day: 'numeric', month: 'short', year: 'numeric' })}`} actions={<Badge tone={r.status === 'confirmed' ? 'success' : 'neutral'}>{r.status.replace('_', ' ')}</Badge>} />
      <RetreatBuilder retreat={retreat as never} days={(days.data ?? []) as never} items={(items.data ?? []) as never} people={(people.data ?? []) as never} lines={(lines.data ?? []) as never} tasks={(tasks.data ?? []) as never} updates={(updates.data ?? []) as never} origin={origin} />
    </div>
  )
}
