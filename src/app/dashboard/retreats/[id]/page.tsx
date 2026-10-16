import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { Badge, PageHeader } from '@/components/kit'
import RetreatBuilder, { type BDay, type BItem, type BLine, type BPerson, type BRetreat, type BTask, type BUpdate } from '@/components/retreats/RetreatBuilder'
import { requireOrganizer } from '@/lib/data/viewer'
import { fmtDate } from '@/lib/format'

export const metadata = { title: 'Retreat' }

export default async function RetreatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase } = await requireOrganizer()
  const { data: retreat } = await supabase.from('retreats').select('*').eq('id', id).maybeSingle()
  if (!retreat) notFound()

  const [days, items, people, lines, tasks, updates] = await Promise.all([
    supabase.from('retreat_days').select('*').eq('retreat_id', id).order('day_number'),
    supabase.from('retreat_items').select('*').eq('retreat_id', id),
    supabase.from('retreat_participants').select('*').eq('retreat_id', id).order('created_at'),
    supabase.from('retreat_budget_lines').select('*').eq('retreat_id', id).order('created_at'),
    supabase.from('retreat_tasks').select('*').eq('retreat_id', id).order('due_date', { nullsFirst: false }),
    supabase.from('retreat_updates').select('*').eq('retreat_id', id).order('created_at', { ascending: false }).limit(30),
  ])
  const h = await headers()
  const origin = `${h.get('x-forwarded-proto') ?? 'http'}://${h.get('host')}`
  const r = retreat as { title: string; client_company: string | null; destination: string | null; starts_on: string; ends_on: string; status: string }

  return (
    <div className="k-fade-up">
      <PageHeader eyebrow={r.client_company ?? 'Retreat'} title={r.title} description={`${r.destination ? `${r.destination} · ` : ''}${fmtDate(r.starts_on, { day: 'numeric', month: 'short' })} to ${fmtDate(r.ends_on, { day: 'numeric', month: 'short', year: 'numeric' })}`} actions={<Badge tone={r.status === 'confirmed' ? 'success' : 'neutral'}>{r.status.replace('_', ' ')}</Badge>} />
      <RetreatBuilder retreat={retreat as unknown as BRetreat} days={(days.data ?? []) as unknown as BDay[]} items={(items.data ?? []) as unknown as BItem[]} people={(people.data ?? []) as unknown as BPerson[]} lines={(lines.data ?? []) as unknown as BLine[]} tasks={(tasks.data ?? []) as unknown as BTask[]} updates={(updates.data ?? []) as unknown as BUpdate[]} origin={origin} />
    </div>
  )
}
