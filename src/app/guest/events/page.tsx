import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MyEventsClient from '@/components/guest/MyEventsClient'

export default async function MyEventsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: registrations } = await supabase
    .from('public_registrations')
    .select('*, event:events(id, title, date_start, date_end, venue_name, secret_venue, cover_image_url, ticket_price, registration_mode, status, organizer:profiles!events_organizer_id_fkey(full_name, company_name))')
    .eq('email', user.email!)
    .order('created_at', { ascending: false })

  // For each approved registration, check if guest record + QR code exists
  const approvedEventIds = (registrations ?? [])
    .filter(r => r.status === 'approved')
    .map(r => r.event_id)

  const { data: guestRecords } = approvedEventIds.length
    ? await supabase
        .from('guests')
        .select('id, event_id, qr_code, status, is_vip')
        .eq('email', user.email!)
        .in('event_id', approvedEventIds)
    : { data: [] }

  const qrMap: Record<string, { qr_code: string; status: string; is_vip: boolean }> = {}
  for (const g of guestRecords ?? []) {
    qrMap[g.event_id] = { qr_code: g.qr_code, status: g.status, is_vip: g.is_vip }
  }

  return <MyEventsClient registrations={registrations ?? []} qrMap={qrMap} userEmail={user.email!} />
}