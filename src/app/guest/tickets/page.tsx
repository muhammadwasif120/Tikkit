import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TicketsClient from '@/components/guest/TicketsClient'

export default async function TicketsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  const { data: registrations } = await supabase
    .from('public_registrations')
    .select(`
      id, status, check_in_time,
      event:events (
        id, title, date_start, venue_name, secret_venue, venue_reveal_at, cover_image_url
      )
    `)
    .eq('email', user.email!)
    .in('status', ['confirmed', 'registered', 'approved'])
    .order('created_at', { ascending: false })

  const tickets = (registrations ?? []).map((reg: any) => ({
    registrationId: reg.id,
    eventId:        reg.event?.id ?? '',
    eventTitle:     reg.event?.title ?? 'Event',
    eventDate:      reg.event?.date_start ?? new Date().toISOString(),
    eventVenue:     reg.event?.venue_name ?? null,
    secretVenue:    reg.event?.secret_venue ?? false,
    venueRevealAt:  reg.event?.venue_reveal_at ?? null,
    guestName:      profile?.full_name ?? user.email ?? 'Guest',
    ticketCode:     `TIKKIT-${reg.id.replace(/-/g, '').slice(0, 16).toUpperCase()}`,
    status:         reg.status as 'confirmed' | 'registered',
    checkedIn:      !!reg.check_in_time,
    checkInTime:    reg.check_in_time ?? null,
  }))

  return <TicketsClient tickets={tickets} />
}
