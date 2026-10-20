import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { MembersClient, type Member, type Pending, type Account } from '@/components/classes/MembersClient'
import { PageHeader } from '@/components/kit'
import { requireOwner } from '@/lib/data/viewer'

export const metadata = { title: 'Members and payments' }

type Row = { id: string; kind: 'pass_purchase' | 'class_booking' | 'space_booking'; subject_id: string; payer_id: string; amount_pkr: number; screenshot_path: string; reference: string | null; created_at: string }

export default async function MembersPage() {
  const { supabase, profile } = await requireOwner()
  if (!profile) notFound()
  const [{ data: roster }, { data: pays }, { data: accounts }, { data: org }] = await Promise.all([
    supabase.rpc('membership_roster'),
    supabase.from('product_payments').select('id, kind, subject_id, payer_id, amount_pkr, screenshot_path, reference, created_at').eq('status', 'submitted').order('created_at'),
    supabase.from('payment_accounts').select('method, account_title, account_number, bank_name').eq('is_active', true).limit(3),
    supabase.from('organizer_profiles').select('company_name').eq('id', profile.id).maybeSingle(),
  ])
  const rows = (pays ?? []) as Row[]
  const ids = (k: Row['kind']) => rows.filter(r => r.kind === k).map(r => r.subject_id)
  const [{ data: passes }, { data: classes }, { data: spaces }, { data: people }] = await Promise.all([
    ids('pass_purchase').length ? supabase.from('pass_purchases').select('id, billing_period, pass_products(name)').in('id', ids('pass_purchase')) : { data: [] },
    ids('class_booking').length ? supabase.from('class_bookings').select('id, class_series(title), class_sessions(starts_at)').in('id', ids('class_booking')) : { data: [] },
    ids('space_booking').length ? supabase.from('space_bookings').select('id, starts_at, spaces(name)').in('id', ids('space_booking')) : { data: [] },
    rows.length ? supabase.from('profiles').select('id, full_name').in('id', [...new Set(rows.map(r => r.payer_id))]) : { data: [] },
  ])
  type Any = Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any
  const what = (r: Row): { title: string; note: string | null } => {
    if (r.kind === 'pass_purchase') { const p = (passes as Any[] | null)?.find(x => x.id === r.subject_id); return { title: p?.pass_products?.name ?? 'Pass', note: p?.billing_period ? 'Membership payment' : 'Pass' } }
    if (r.kind === 'class_booking') { const c = (classes as Any[] | null)?.find(x => x.id === r.subject_id); return { title: c?.class_series?.title ?? 'Class', note: 'Class drop in' } }
    const sp = (spaces as Any[] | null)?.find(x => x.id === r.subject_id); return { title: sp?.spaces?.name ?? 'Space', note: 'Space reservation' }
  }
  const pending: Pending[] = rows.map(r => ({ id: r.id, name: (people as { id: string; full_name: string | null }[] | null)?.find(p => p.id === r.payer_id)?.full_name ?? (roster as { attendee_id: string; full_name: string | null }[] | null)?.find(m => m.attendee_id === r.payer_id)?.full_name ?? 'Guest', ...what(r), amount: r.amount_pkr, path: r.screenshot_path, reference: r.reference, at: r.created_at }))
  const h = await headers(); const origin = `${h.get('x-forwarded-proto') ?? 'http'}://${h.get('host')}`
  return (
    <div className="k-fade-up">
      <PageHeader eyebrow="Classes" title="Members and payments" description="Check receipts, see who has paid, and remind late members on WhatsApp." />
      <MembersClient members={(roster ?? []) as Member[]} pending={pending} accounts={(accounts ?? []) as Account[]} origin={origin} company={org?.company_name ?? null} />
    </div>
  )
}
