import BillingClient from '@/components/settings/BillingClient'
import { requireOwner } from '@/lib/data/viewer'

export const metadata = { title: 'Plan and billing' }

export default async function BillingSettings() {
  const { supabase, profile, entitlements: e } = await requireOwner()
  const [{ data: plans }, { data: pays }, { data: invs }, { data: sub }] = await Promise.all([
    supabase.from('plans').select('id, name, price_pkr_month, price_pkr_year').eq('is_purchasable', true).order('sort'),
    supabase.from('subscription_payments').select('id, plan_id, period, amount_pkr, status, created_at, reject_reason').eq('organizer_id', profile.id).order('created_at', { ascending: false }),
    supabase.from('subscription_invoices').select('id, number, amount_pkr, period, issued_at, plan_id').eq('organizer_id', profile.id).order('issued_at', { ascending: false }),
    supabase.from('organizer_subscriptions').select('trial_ends_at, current_period_end, status').eq('organizer_id', profile.id).maybeSingle(),
  ])
  const lim = (k: string) => { const v = e?.limits[k]; return typeof v === 'number' ? (v < 0 ? null : v) : null }
  const u = e?.usage ?? {}
  return (
    <BillingClient
      plans={(plans ?? []).map(p => ({ id: p.id, name: p.name, month: p.price_pkr_month, year: p.price_pkr_year }))}
      current={{ planId: e?.plan_id ?? 'trial', state: e?.state ?? 'expired', endsAt: sub?.status === 'trial' ? sub.trial_ends_at : sub?.current_period_end ?? null }}
      usage={[
        { label: 'Events this month', used: u.events_this_month ?? 0, limit: lim('events_per_month') },
        { label: 'Gate staff links', used: u.gate_links ?? 0, limit: lim('gate_staff_links') },
        { label: 'Promoters', used: u.promoters ?? 0, limit: lim('promoters') },
        { label: 'Vendors', used: u.vendors ?? 0, limit: lim('vendors') },
      ]}
      payments={(pays ?? []).map(p => ({ id: p.id, plan: p.plan_id, period: p.period, amount: p.amount_pkr, status: p.status, createdAt: p.created_at, reason: p.reject_reason }))}
      invoices={(invs ?? []).map(i => ({ id: i.id, number: i.number, amount: i.amount_pkr, period: i.period, issuedAt: i.issued_at, plan: i.plan_id }))}
      accountDetails={process.env.NEXT_PUBLIC_BILLING_ACCOUNT ?? null}
    />
  )
}
