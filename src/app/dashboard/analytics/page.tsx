import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import AnalyticsClient from '@/components/analytics/AnalyticsClient'
import DashboardLoader from '@/components/layout/DashboardLoader'

async function AnalyticsData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: events } = await supabase
    .from('events')
    .select('id, title, capacity, status, date_start, ticket_price, budget')
    .eq('organizer_id', user!.id)

  const eventIds = events?.map(e => e.id) ?? []

  const [{ data: guests }, { data: scanLogs }, { data: discountCodes }] = await Promise.all([
    supabase
      .from('guests')
      .select('id, event_id, status, full_name, email, is_vip, waitlist, ticket_price_paid, discount_applied, discount_amount')
      .in('event_id', eventIds.length > 0 ? eventIds : ['none'])
      .limit(2000),
    supabase
      .from('scan_logs')
      .select('event_id, scan_type, scanned_at')
      .in('event_id', eventIds.length > 0 ? eventIds : ['none'])
      .limit(5000),
    supabase
      .from('discount_codes')
      .select('id, event_id, code, discount_type, discount_value, times_used, max_uses')
      .in('event_id', eventIds.length > 0 ? eventIds : ['none'])
      .limit(500),
  ])

  return (
    <AnalyticsClient
      events={(events ?? []).map((e: any) => ({ ...e, ticket_price: e.ticket_price ?? 0 }))}
      guests={(guests ?? []) as any[]}
      scanLogs={(scanLogs ?? []).map((s: any) => ({ ...s, scanned_at: s.scanned_at ?? '' }))}
      discountCodes={discountCodes ?? []}
    />
  )
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<DashboardLoader variant="analytics" />}>
      <AnalyticsData />
    </Suspense>
  )
}