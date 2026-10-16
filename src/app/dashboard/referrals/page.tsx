import { headers } from 'next/headers'
import { PageHeader } from '@/components/kit'
import ReferralsClient, { type Defaults } from '@/components/referrals/ReferralsClient'
import { requireOwner } from '@/lib/data/viewer'

export const metadata = { title: 'Referrals' }

export default async function ReferralsPage() {
  const { supabase, profile } = await requireOwner()
  const h = await headers()
  const origin = `${h.get('x-forwarded-proto') ?? 'http'}://${h.get('host')}`

  const [{ data: referrers }, { data: links }, { data: coupons }, { data: comms }, { data: events }, { data: def }, { data: sales }] = await Promise.all([
    supabase.from('referrers').select('id, name, phone, email, is_active').order('created_at', { ascending: false }),
    supabase.from('referral_links').select('id, referrer_id, event_id, code, commission_mode, commission_value, buyer_discount_type, buyer_discount_value, uses, is_active, events(title, slug)').order('created_at', { ascending: false }),
    supabase.from('coupons').select('id, code, discount_type, discount_value, uses, max_uses, expires_at, is_active, events(title)').order('created_at', { ascending: false }),
    supabase.from('commissions').select('id, amount_pkr, status, created_at, paid_at, referrer_id, referrers(name), events(title)').order('created_at', { ascending: false }).limit(200),
    supabase.from('events').select('id, title, slug').eq('organizer_id', profile.id).neq('status', 'archived').order('starts_at', { ascending: false }),
    supabase.from('organizer_commission_defaults').select('mode, value, tiers').eq('organizer_id', profile.id).maybeSingle(),
    supabase.from('registrations').select('referrer_id').not('referrer_id', 'is', null).in('status', ['confirmed', 'checked_in', 'no_show']).limit(10000),
  ])

  const sold = new Map<string, number>()
  for (const s of sales ?? []) if (s.referrer_id) sold.set(s.referrer_id, (sold.get(s.referrer_id) ?? 0) + 1)
  const sum = (id: string, st: string[]) => (comms ?? []).filter(c => c.referrer_id === id && st.includes(c.status)).reduce((a, c) => a + c.amount_pkr, 0)

  return (
    <div className="k-fade-up">
      <PageHeader title="Referrals" description="See who sells your tickets and what you owe them. Links, codes and QR codes all attribute sales automatically." />
      <ReferralsClient
        origin={origin}
        events={events ?? []}
        defaults={(def ?? { mode: 'none', value: 0, tiers: null }) as Defaults}
        promoters={(referrers ?? []).map(r => ({ id: r.id, name: r.name, phone: r.phone, email: r.email, active: r.is_active, sold: sold.get(r.id) ?? 0, owed: sum(r.id, ['accrued', 'approved']), paid: sum(r.id, ['paid']) }))}
        links={(links ?? []).map(l => ({ id: l.id, referrerId: l.referrer_id, promoter: (referrers ?? []).find(r => r.id === l.referrer_id)?.name ?? '', eventId: l.event_id, eventTitle: l.events?.title ?? '', eventSlug: l.events?.slug ?? null, code: l.code, mode: l.commission_mode, value: l.commission_value, discountType: l.buyer_discount_type, discountValue: l.buyer_discount_value, uses: l.uses, active: l.is_active }))}
        coupons={(coupons ?? []).map(c => ({ id: c.id, eventTitle: c.events?.title ?? '', code: c.code, type: c.discount_type, value: c.discount_value, uses: c.uses, maxUses: c.max_uses, expires: c.expires_at, active: c.is_active }))}
        commissions={(comms ?? []).map(c => ({ id: c.id, promoter: c.referrers?.name ?? 'Promoter', eventTitle: c.events?.title ?? '', amount: c.amount_pkr, status: c.status, createdAt: c.created_at, paidAt: c.paid_at }))}
      />
    </div>
  )
}
