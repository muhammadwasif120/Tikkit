import { createMobileClient, mobileUnauthorized } from '@/lib/supabase/mobile'
import { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  const auth = await createMobileClient(req.headers.get('Authorization'))
  if (!auth) return mobileUnauthorized()
  const { supabase, userId } = auth

  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  if (!profile || !['organizer', 'staff', 'admin'].includes(profile.role)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Fetch organizer's event IDs
  const { data: events } = await supabase
    .from('events')
    .select('id, status')
    .eq('organizer_id', userId)

  const allEventIds = (events ?? []).map((e: any) => e.id)
  const totalEvents = allEventIds.length
  const publishedEvents = (events ?? []).filter((e: any) => e.status === 'published').length
  const draftEvents = (events ?? []).filter((e: any) => e.status === 'draft').length

  let totalGuests = 0
  let pendingApprovals = 0
  let checkedInToday = 0

  if (allEventIds.length > 0) {
    // Total guests (all non-rejected registrations)
    const { count: regCount } = await (supabase as any)
      .from('public_registrations')
      .select('*', { count: 'exact', head: true })
      .in('event_id', allEventIds)
      .not('status', 'eq', 'rejected')

    totalGuests = regCount ?? 0

    // Pending approvals
    const { count: pendingCount } = await (supabase as any)
      .from('public_registrations')
      .select('*', { count: 'exact', head: true })
      .in('event_id', allEventIds)
      .eq('status', 'pending')

    pendingApprovals = pendingCount ?? 0

    // Checked in today
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const { data: guests } = await (supabase as any)
      .from('guests')
      .select('id')
      .in('event_id', allEventIds)
      .eq('status', 'checked_in')
      .gte('checked_in_at', todayStart.toISOString())

    checkedInToday = (guests ?? []).length
  }

  return Response.json({
    stats: {
      totalEvents,
      publishedEvents,
      draftEvents,
      totalGuests,
      pendingApprovals,
      checkedInToday,
    }
  })
}
