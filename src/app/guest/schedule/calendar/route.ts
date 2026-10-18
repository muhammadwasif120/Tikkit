import { NextResponse } from 'next/server'
import { buildAgenda, buildIcs, loadBookings, loadTickets } from '@/lib/attendee'
import { createClient } from '@/lib/supabase/server'

/** Downloads the guest's upcoming events, classes, reservations and retreats as a calendar file. */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Sign in to download your calendar.', { status: 401 })
  const [t, b] = await Promise.all([loadTickets(supabase, user.id), loadBookings(supabase, user.id)])
  const body = buildIcs(buildAgenda(t, b), process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.tikkitx.com')
  return new NextResponse(body, { headers: { 'Content-Type': 'text/calendar; charset=utf-8', 'Content-Disposition': 'attachment; filename="tikkit-x-schedule.ics"', 'Cache-Control': 'private, no-store' } })
}
