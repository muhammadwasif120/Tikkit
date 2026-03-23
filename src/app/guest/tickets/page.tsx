import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TicketsClient from '@/components/guest/TicketsClient'
import GuestLoader from '@/components/guest/GuestLoader'

async function TicketsData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  const { data: guestsData } = await supabase
    .from('guests')
    .select(`
      id, status, qr_code, checked_in_at, event_id,
      event:events (
        id, title, date_start, venue_name, secret_venue, venue_reveal_at, cover_image_url
      )
    `)
    .eq('email', user.email!)
    .in('status', ['confirmed', 'registered', 'checked_in'])
    .order('created_at', { ascending: false })

  const tickets = (guestsData ?? []).map((gst: any) => ({
    registrationId: gst.id,
    eventId:        gst.event?.id ?? '',
    eventTitle:     gst.event?.title ?? 'Event',
    eventDate:      gst.event?.date_start ?? new Date().toISOString(),
    eventVenue:     gst.event?.venue_name ?? null,
    secretVenue:    gst.event?.secret_venue ?? false,
    venueRevealAt:  gst.event?.venue_reveal_at ?? null,
    guestName:      profile?.full_name ?? user.email ?? 'Guest',
    ticketCode:     gst.qr_code,
    status:         gst.status as 'confirmed' | 'registered',
    checkedIn:      gst.status === 'checked_in' || !!gst.checked_in_at,
    checkInTime:    gst.checked_in_at ?? null,
  }))

  return <TicketsClient tickets={tickets} />
}

export default function TicketsPage() {
  return (
    <Suspense fallback={<GuestLoader />}>
      <TicketsData />
    </Suspense>
  )
}
