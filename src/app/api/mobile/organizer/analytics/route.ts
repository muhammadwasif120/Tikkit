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

  const { data: events } = await (supabase as any)
    .from('events')
    .select('id, title, status, capacity, ticket_price, date_start')
    .eq('organizer_id', userId)
    .order('date_start', { ascending: false })

  const allEventIds = (events ?? []).map((e: any) => e.id)

  if (allEventIds.length === 0) {
    return Response.json({ analytics: { events: [], totalRevenue: 0, totalGuests: 0, avgFillRate: 0 } })
  }

  const [{ data: regs }, { data: scanLogs }] = await Promise.all([
    (supabase as any)
      .from('public_registrations')
      .select('event_id, status, payment_status, ticket_price_paid')
      .in('event_id', allEventIds)
      .not('status', 'eq', 'rejected'),
    (supabase as any)
      .from('scan_logs')
      .select('event_id, scan_type')
      .in('event_id', allEventIds)
      .eq('scan_type', 'entry'),
  ])

  const regsByEvent: Record<string, any[]> = {}
  for (const r of regs ?? []) {
    if (!regsByEvent[r.event_id]) regsByEvent[r.event_id] = []
    regsByEvent[r.event_id].push(r)
  }

  const scansByEvent: Record<string, number> = {}
  for (const s of scanLogs ?? []) {
    scansByEvent[s.event_id] = (scansByEvent[s.event_id] ?? 0) + 1
  }

  let totalRevenue = 0
  let totalGuests = 0
  let fillRateSum = 0
  let fillRateCount = 0

  const analyticsEvents = (events ?? []).map((e: any) => {
    const eventRegs = regsByEvent[e.id] ?? []
    const guestCount = eventRegs.length
    const revenue = eventRegs.reduce((sum: number, r: any) => sum + (r.ticket_price_paid ?? 0), 0)
    const checkedIn = scansByEvent[e.id] ?? 0
    const fillRate = e.capacity ? Math.min(100, Math.round((guestCount / e.capacity) * 100)) : null

    totalRevenue += revenue
    totalGuests += guestCount
    if (fillRate !== null) {
      fillRateSum += fillRate
      fillRateCount++
    }

    return {
      id: e.id,
      title: e.title,
      status: e.status,
      date_start: e.date_start,
      capacity: e.capacity,
      ticket_price: e.ticket_price,
      guestCount,
      revenue,
      checkedIn,
      fillRate,
    }
  })

  return Response.json({
    analytics: {
      events: analyticsEvents,
      totalRevenue,
      totalGuests,
      avgFillRate: fillRateCount > 0 ? Math.round(fillRateSum / fillRateCount) : 0,
    }
  })
}
