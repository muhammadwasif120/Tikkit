import { createClient } from '@/lib/supabase/server'
import AnalyticsClient from '@/components/analytics/AnalyticsClient'

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: events } = await supabase
    .from('events')
    .select('id, title, capacity, status, date_start, ticket_price, budget')
    .eq('organizer_id', user!.id)

  const eventIds = events?.map(e => e.id) ?? []

  const { data: guests } = await supabase
    .from('guests')
    .select('*')
    .in('event_id', eventIds.length > 0 ? eventIds : ['none'])

  const { data: scanLogs } = await supabase
    .from('scan_logs')
    .select('event_id, scan_type, scanned_at')
    .in('event_id', eventIds.length > 0 ? eventIds : ['none'])

  const { data: discountCodes } = await supabase
    .from('discount_codes')
    .select('*')
    .in('event_id', eventIds.length > 0 ? eventIds : ['none'])

  return (
    <AnalyticsClient
      events={events ?? []}
      guests={guests ?? []}
      scanLogs={scanLogs ?? []}
      discountCodes={discountCodes ?? []}
    />
  )
}