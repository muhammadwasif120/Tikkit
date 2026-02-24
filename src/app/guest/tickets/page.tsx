import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TicketsClient from '@/components/guest/TicketsClient'

export default async function TicketsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/guest-login')

  // Get all approved registrations
  const { data: registrations } = await supabase
    .from('public_registrations')
    .select('id, event_id, status, payment_status, payment_token, event:events(id, title, date_start, date_end, venue_name, secret_venue, cover_image_url, ticket_price, status as event_status)')
    .eq('email', user.email!)
    .eq('status', 'approved')
    .not('payment_status', 'eq', 'pending') // exclude ones awaiting payment
    .order('created_at', { ascending: false })

  // Get corresponding guest records (QR codes)
  const eventIds = (registrations ?? []).map((r: any) => r.event_id)
  const { data: guests } = eventIds.length
    ? await supabase
        .from('guests')
        .select('event_id, qr_code, status, is_vip, checked_in_at, checked_out_at')
        .eq('email', user.email!)
        .in('event_id', eventIds)
    : { data: [] }

  const guestMap: Record<string, any> = {}
  for (const g of guests ?? []) guestMap[g.event_id] = g

  return <TicketsClient registrations={registrations ?? []} guestMap={guestMap} />
}