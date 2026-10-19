import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/kit'
import { SeriesManage, type Booking, type Product, type Series, type Session } from '@/components/classes/ClassesOrganizer'
import { requireOwner } from '@/lib/data/viewer'

export const metadata = { title: 'Class' }

export default async function ClassPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase } = await requireOwner()
  const { data: series } = await supabase.from('class_series').select('*').eq('id', id).maybeSingle()
  if (!series) notFound()
  const from = new Date(Date.now() - 86_400_000).toISOString()
  const [{ data: sessions }, { data: products }, { data: bookings }] = await Promise.all([
    supabase.from('class_sessions').select('*').eq('series_id', id).gte('starts_at', from).order('starts_at').limit(60),
    supabase.from('pass_products').select('*').or(`series_id.eq.${id},series_id.is.null`).order('sort'),
    supabase.from('class_bookings').select('id, session_id, status, pass_purchase_id, attendee_id').eq('series_id', id),
  ])
  const ids = [...new Set(((bookings ?? []) as { attendee_id: string }[]).map(b => b.attendee_id))]
  const { data: people } = ids.length ? await supabase.from('profiles').select('id, full_name').in('id', ids) : { data: [] as { id: string; full_name: string | null }[] }
  const h = await headers(); const origin = `${h.get('x-forwarded-proto') ?? 'http'}://${h.get('host')}`
  const bks: Booking[] = ((bookings ?? []) as { id: string; session_id: string; status: string; pass_purchase_id: string | null; attendee_id: string }[]).map(b => ({ id: b.id, session_id: b.session_id, status: b.status, via_pass: !!b.pass_purchase_id, name: people?.find(p => p.id === b.attendee_id)?.full_name ?? 'Guest' }))
  const sess: Session[] = ((sessions ?? []) as Omit<Session, 'booked'>[]).map(s => ({ ...s, booked: bks.filter(b => b.session_id === s.id).length }))
  return (
    <div className="k-fade-up">
      <PageHeader eyebrow="Class" title={(series as Series).title} />
      <SeriesManage series={series as Series} sessions={sess} products={(products ?? []) as Product[]} bookings={bks} origin={origin} />
    </div>
  )
}
