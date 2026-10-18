import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/kit'
import { SpaceManage, type Blackout, type Hour, type SBooking, type Space } from '@/components/spaces/SpacesOrganizer'
import { requireOwner } from '@/lib/data/viewer'

export const metadata = { title: 'Space' }

export default async function SpacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase } = await requireOwner()
  const { data: space } = await supabase.from('spaces').select('*').eq('id', id).maybeSingle()
  if (!space) notFound()
  const [{ data: hours }, { data: blackouts }, { data: bookings }] = await Promise.all([
    supabase.from('space_hours').select('*').eq('space_id', id), supabase.from('space_blackouts').select('*').eq('space_id', id).gte('ends_at', new Date().toISOString()).order('starts_at'),
    supabase.from('space_bookings').select('id, attendee_id, starts_at, ends_at, party_size, status, price_due_pkr, notes').eq('space_id', id).gte('ends_at', new Date(Date.now() - 7 * 86_400_000).toISOString()).order('starts_at').limit(100),
  ])
  const rows = (bookings ?? []) as { id: string; attendee_id: string; starts_at: string; ends_at: string; party_size: number; status: string; price_due_pkr: number; notes: string | null }[]
  const ids = [...new Set(rows.map(b => b.attendee_id))]
  const { data: people } = ids.length ? await supabase.from('profiles').select('id, full_name').in('id', ids) : { data: [] as { id: string; full_name: string | null }[] }
  const h = await headers(); const origin = `${h.get('x-forwarded-proto') ?? 'http'}://${h.get('host')}`
  const bks: SBooking[] = rows.map(b => ({ id: b.id, name: people?.find(p => p.id === b.attendee_id)?.full_name ?? 'Guest', starts_at: b.starts_at, ends_at: b.ends_at, party_size: b.party_size, status: b.status, price: b.price_due_pkr, notes: b.notes }))
  return (
    <div className="k-fade-up"><PageHeader eyebrow="Space" title={(space as Space).name} />
      <SpaceManage space={space as Space} hours={(hours ?? []) as Hour[]} blackouts={(blackouts ?? []) as Blackout[]} bookings={bks} origin={origin} /></div>
  )
}
