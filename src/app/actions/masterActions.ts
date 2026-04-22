'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { safeDecrypt } from '@/lib/encrypt'

// ─── Auth guard ───────────────────────────────────────────────────────────────
// Server actions are called directly via POST — they bypass all layout-level
// auth checks. Every sensitive action must call this before touching any data.
export async function requireAdmin(): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') throw new Error('Forbidden')
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type MasterOrg = {
  id: string
  name: string
  username: string
  email: string
  phone: string
  events: number
  active: number
  status: 'active' | 'review' | 'suspended'
  joined: string
}

export type MasterEvt = {
  id: string
  title: string
  org: string
  orgId: string
  username: string
  date: string
  status: 'live' | 'draft' | 'suspended' | 'ended'
  registered: number
  capacity: number
  cat: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function mapEventStatus(s: string): MasterEvt['status'] {
  if (s === 'published') return 'live'
  if (s === 'cancelled') return 'suspended'
  if (s === 'completed') return 'ended'
  return 'draft'
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export async function getMasterOrganizers(): Promise<MasterOrg[]> {
  await requireAdmin()
  const supabase = createAdminClient()

  const [{ data: profiles }, { data: events }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, company_name, email, phone_number, username, created_at, admin_status')
      .eq('role', 'organizer')
      .order('created_at', { ascending: false }),
    supabase
      .from('events')
      .select('organizer_id, status'),
  ])

  // Build event count map per organizer
  const countMap: Record<string, { total: number; active: number }> = {}
  for (const e of events ?? []) {
    const id = (e as any).organizer_id
    if (!countMap[id]) countMap[id] = { total: 0, active: 0 }
    countMap[id].total++
    if ((e as any).status === 'published') countMap[id].active++
  }

  return (profiles ?? []).map((p: any) => ({
    id: p.id,
    name: p.company_name || p.full_name || 'Unnamed',
    username: p.username || '',
    email: p.email || '',
    phone: p.phone_number || '',
    events: countMap[p.id]?.total ?? 0,
    active: countMap[p.id]?.active ?? 0,
    status: (p.admin_status as MasterOrg['status']) ?? 'active',
    joined: p.created_at ?? '',
  }))
}

export async function getMasterEvents(): Promise<MasterEvt[]> {
  await requireAdmin()
  const supabase = createAdminClient()

  const { data: events } = await supabase
    .from('events')
    .select('id, title, status, date_start, capacity, organizer_id, organizer:profiles!events_organizer_id_fkey(full_name, company_name, username)')
    .order('date_start', { ascending: false })

  if (!events?.length) return []

  // Batch guest counts from both tables in parallel
  const eventIds = events.map((e: any) => e.id)
  const [{ data: guests }, { data: pubRegs }] = await Promise.all([
    supabase.from('guests').select('event_id').in('event_id', eventIds),
    supabase.from('public_registrations').select('event_id').in('event_id', eventIds),
  ])

  const guestMap: Record<string, number> = {}
  for (const g of guests ?? []) {
    const eid = (g as any).event_id
    guestMap[eid] = (guestMap[eid] || 0) + 1
  }
  for (const r of pubRegs ?? []) {
    const eid = (r as any).event_id
    guestMap[eid] = (guestMap[eid] || 0) + 1
  }

  return events.map((e: any) => {
    const org = e.organizer as any
    return {
      id: e.id,
      title: e.title,
      org: org?.company_name || org?.full_name || 'Unknown',
      orgId: e.organizer_id,
      username: org?.username || '',
      date: e.date_start,
      status: mapEventStatus(e.status),
      registered: guestMap[e.id] || 0,
      capacity: e.capacity,
      cat: '',
    }
  })
}

// ─── Detail types ────────────────────────────────────────────────────────────

export type OrgProfile = {
  id: string
  full_name: string
  company_name: string | null
  email: string
  phone_number: string | null
  username: string | null
  avatar_url: string | null
  cover_image_url: string | null
  logo_url: string | null
  admin_status: 'active' | 'review' | 'suspended'
  created_at: string
}

export type OrgEvent = {
  id: string
  title: string
  status: string          // raw DB status: draft / published / completed / cancelled
  date_start: string
  date_end: string | null
  venue_name: string | null
  cover_image_url: string | null
  capacity: number
  registered: number
  attended: number
}

export type EventGuest = {
  id: string
  full_name: string
  email: string | null
  phone: string | null
  gender: string | null
  status: string
  is_vip: boolean
  checked_in_at: string | null
  source: 'invited' | 'registered'
}

// ─── Detail queries ──────────────────────────────────────────────────────────

export async function getMasterOrgProfile(orgId: string): Promise<OrgProfile | null> {
  await requireAdmin()
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('profiles')
    .select('id, full_name, company_name, email, phone_number, username, avatar_url, cover_image_url, logo_url, admin_status, created_at')
    .eq('id', orgId)
    .single()
  if (!data) return null
  const p = data as any
  return {
    id: p.id,
    full_name: p.full_name,
    company_name: p.company_name,
    email: p.email,
    phone_number: p.phone_number,
    username: p.username,
    avatar_url: p.avatar_url,
    cover_image_url: p.cover_image_url,
    logo_url: p.logo_url,
    admin_status: p.admin_status ?? 'active',
    created_at: p.created_at,
  }
}

export async function getMasterOrgEvents(orgId: string): Promise<OrgEvent[]> {
  await requireAdmin()
  const supabase = createAdminClient()

  const { data: events } = await supabase
    .from('events')
    .select('id, title, status, date_start, date_end, venue_name, cover_image_url, capacity')
    .eq('organizer_id', orgId)
    .order('date_start', { ascending: false })

  if (!events?.length) return []

  const eventIds = (events as any[]).map(e => e.id)

  const [{ data: guests }, { data: regs }] = await Promise.all([
    supabase.from('guests').select('event_id, status').in('event_id', eventIds),
    supabase.from('public_registrations').select('event_id, status').in('event_id', eventIds),
  ])

  const countMap: Record<string, { total: number; attended: number }> = {}
  for (const g of guests ?? []) {
    const id = (g as any).event_id
    if (!countMap[id]) countMap[id] = { total: 0, attended: 0 }
    countMap[id].total++
    if ((g as any).status === 'checked_in') countMap[id].attended++
  }
  for (const r of regs ?? []) {
    const id = (r as any).event_id
    if (!countMap[id]) countMap[id] = { total: 0, attended: 0 }
    if ((r as any).status !== 'rejected') countMap[id].total++
    if ((r as any).status === 'checked_in') countMap[id].attended++
  }

  return (events as any[]).map(e => ({
    id: e.id,
    title: e.title,
    status: e.status,
    date_start: e.date_start,
    date_end: e.date_end,
    venue_name: e.venue_name,
    cover_image_url: e.cover_image_url,
    capacity: e.capacity,
    registered: countMap[e.id]?.total ?? 0,
    attended: countMap[e.id]?.attended ?? 0,
  }))
}

export async function getMasterEventGuests(eventId: string): Promise<EventGuest[]> {
  await requireAdmin()
  const supabase = createAdminClient()

  const [{ data: invited }, { data: registered }] = await Promise.all([
    supabase
      .from('guests')
      .select('id, full_name, email, phone, gender, status, is_vip, checked_in_at')
      .eq('event_id', eventId)
      .order('full_name'),
    supabase
      .from('public_registrations')
      .select('id, full_name, email, phone, gender, status, checked_in_at')
      .eq('event_id', eventId)
      .order('full_name'),
  ])

  const result: EventGuest[] = [
    ...(invited ?? []).map((g: any) => ({
      id: g.id, full_name: g.full_name, email: g.email, phone: g.phone,
      gender: g.gender, status: g.status, is_vip: g.is_vip ?? false,
      checked_in_at: g.checked_in_at, source: 'invited' as const,
    })),
    ...(registered ?? []).map((r: any) => ({
      id: r.id, full_name: r.full_name, email: r.email, phone: r.phone,
      gender: r.gender, status: r.status, is_vip: false,
      checked_in_at: r.checked_in_at, source: 'registered' as const,
    })),
  ]
  return result.sort((a, b) => a.full_name.localeCompare(b.full_name))
}

// ─── Platform Analytics ──────────────────────────────────────────────────────

export type PlatformAnalytics = {
  kpis: {
    totalOrganizers: number
    newOrgsThisMonth: number
    orgGrowth: number | null        // % vs last month, null if no prior data
    totalEvents: number
    newEventsThisMonth: number
    totalRegistrations: number
    newRegsThisMonth: number
    regGrowth: number | null
    liveEvents: number
    avgFillRate: number
  }
  topOrganizers: Array<{
    id: string
    name: string
    username: string
    totalEvents: number
    totalRegistrations: number
    avgFillRate: number
    liveEvents: number
  }>
  categoryBreakdown: Array<{
    name: string
    icon: string | null
    eventCount: number
    registrations: number
    avgFillRate: number
  }>
  topEventsByFill: Array<{
    id: string; title: string; org: string
    capacity: number; registered: number; fillRate: number; status: string
  }>
  topEventsByRegs: Array<{
    id: string; title: string; org: string
    registered: number; capacity: number; status: string
  }>
  registrationTrend: Array<{ label: string; count: number }>
  statusDistribution: Record<string, number>
}

export async function getMasterAnalytics(): Promise<PlatformAnalytics> {
  await requireAdmin()
  const supabase = createAdminClient()

  // NOTE: These 4 bulk queries + JS aggregation is intentional — avoids N+1.
  // A future optimisation would be Supabase RPCs/views for server-side aggregation.
  const now = new Date()
  const startOfMonth     = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

  const [
    { data: profiles },
    { data: events },
    { data: guests },
    { data: regs },
  ] = await Promise.all([
    supabase.from('profiles').select('id, created_at').eq('role', 'organizer'),
    supabase.from('events').select(`
      id, title, status, capacity, created_at, organizer_id,
      organizer:profiles!events_organizer_id_fkey(full_name, company_name, username),
      category:event_categories!events_category_id_fkey(id, name, icon)
    `),
    supabase.from('guests').select('id, event_id, status, created_at'),
    supabase.from('public_registrations').select('id, event_id, status, created_at'),
  ])

  const evts = (events ?? []) as any[]

  // ── Registration map ──
  const regMap: Record<string, number> = {}
  const allRegDates: string[] = []

  for (const g of guests ?? []) {
    const id = (g as any).event_id
    regMap[id] = (regMap[id] || 0) + 1
    allRegDates.push((g as any).created_at)
  }
  for (const r of regs ?? []) {
    const id = (r as any).event_id
    if ((r as any).status !== 'rejected') {
      regMap[id] = (regMap[id] || 0) + 1
    }
    allRegDates.push((r as any).created_at)
  }

  // ── KPIs — single-pass counters ──
  let newOrgsThisMonth = 0, newOrgsLastMonth = 0
  for (const p of profiles ?? []) {
    const d = new Date((p as any).created_at)
    if (d >= startOfMonth) newOrgsThisMonth++
    else if (d >= startOfLastMonth) newOrgsLastMonth++
  }
  const totalOrganizers = (profiles ?? []).length
  const orgGrowth       = newOrgsLastMonth === 0 ? null : Math.round(((newOrgsThisMonth - newOrgsLastMonth) / newOrgsLastMonth) * 100)

  let newEventsThisMonth = 0, liveEvents = 0
  for (const e of evts) {
    if (new Date(e.created_at) >= startOfMonth) newEventsThisMonth++
    if (e.status === 'published') liveEvents++
  }
  const totalEvents = evts.length

  const totalRegistrations = Object.values(regMap).reduce((a, b) => a + b, 0)
  let newRegsThisMonth = 0, newRegsLastMonth = 0
  for (const d of allRegDates) {
    const dt = new Date(d)
    if (dt >= startOfMonth) newRegsThisMonth++
    else if (dt >= startOfLastMonth) newRegsLastMonth++
  }
  const regGrowth = newRegsLastMonth === 0 ? null : Math.round(((newRegsThisMonth - newRegsLastMonth) / newRegsLastMonth) * 100)

  const eventsWithCap = evts.filter(e => e.capacity > 0)
  const avgFillRate   = eventsWithCap.length > 0
    ? Math.round(eventsWithCap.reduce((a, e) => a + ((regMap[e.id] || 0) / e.capacity * 100), 0) / eventsWithCap.length)
    : 0

  // ── Top organizers ──
  const orgMap: Record<string, { name: string; username: string; events: number; live: number; totalRegs: number; totalCap: number }> = {}
  for (const e of evts) {
    const id = e.organizer_id
    if (!orgMap[id]) {
      const o = e.organizer as any
      orgMap[id] = { name: o?.company_name || o?.full_name || 'Unknown', username: o?.username || '', events: 0, live: 0, totalRegs: 0, totalCap: 0 }
    }
    orgMap[id].events++
    if (e.status === 'published') orgMap[id].live++
    orgMap[id].totalRegs += regMap[e.id] || 0
    orgMap[id].totalCap  += e.capacity || 0
  }
  const topOrganizers = Object.entries(orgMap)
    .map(([id, o]) => ({
      id, name: o.name, username: o.username,
      totalEvents: o.events, totalRegistrations: o.totalRegs, liveEvents: o.live,
      avgFillRate: o.totalCap > 0 ? Math.round((o.totalRegs / o.totalCap) * 100) : 0,
    }))
    .sort((a, b) => b.totalRegistrations - a.totalRegistrations)
    .slice(0, 12)

  // ── Category breakdown ──
  const catMap: Record<string, { name: string; icon: string | null; events: number; regs: number; cap: number }> = {}
  for (const e of evts) {
    const cat = e.category as any
    const key = cat?.id || '_none'
    if (!catMap[key]) catMap[key] = { name: cat?.name || 'Uncategorised', icon: cat?.icon || null, events: 0, regs: 0, cap: 0 }
    catMap[key].events++
    catMap[key].regs += regMap[e.id] || 0
    catMap[key].cap  += e.capacity || 0
  }
  const categoryBreakdown = Object.values(catMap)
    .map(c => ({ name: c.name, icon: c.icon, eventCount: c.events, registrations: c.regs, avgFillRate: c.cap > 0 ? Math.round((c.regs / c.cap) * 100) : 0 }))
    .sort((a, b) => b.registrations - a.registrations)

  // ── Top events ──
  const eventsList = evts.map(e => ({
    id: e.id, title: e.title, org: (e.organizer as any)?.company_name || (e.organizer as any)?.full_name || 'Unknown',
    capacity: e.capacity, registered: regMap[e.id] || 0, status: e.status,
    fillRate: e.capacity > 0 ? Math.round(((regMap[e.id] || 0) / e.capacity) * 100) : 0,
  }))
  const topEventsByFill = [...eventsList].filter(e => e.capacity > 0).sort((a, b) => b.fillRate - a.fillRate).slice(0, 6)
  const topEventsByRegs = [...eventsList].sort((a, b) => b.registered - a.registered).slice(0, 6)

  // ── Registration trend (last 6 months) — single pass over allRegDates ──
  const trendBuckets = Array.from({ length: 6 }, (_, i) => {
    const start = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    const end   = new Date(now.getFullYear(), now.getMonth() - (5 - i) + 1, 1)
    return { start, end, label: start.toLocaleDateString('en-PK', { month: 'short', year: '2-digit' }), count: 0 }
  })
  for (const d of allRegDates) {
    const dt = new Date(d)
    for (const bucket of trendBuckets) {
      if (dt >= bucket.start && dt < bucket.end) { bucket.count++; break }
    }
  }
  const registrationTrend = trendBuckets.map(({ label, count }) => ({ label, count }))

  // ── Status distribution ──
  const statusDistribution: Record<string, number> = { draft: 0, published: 0, completed: 0, cancelled: 0 }
  for (const e of evts) statusDistribution[e.status] = (statusDistribution[e.status] || 0) + 1

  return {
    kpis: { totalOrganizers, newOrgsThisMonth, orgGrowth, totalEvents, newEventsThisMonth, totalRegistrations, newRegsThisMonth, regGrowth, liveEvents, avgFillRate },
    topOrganizers, categoryBreakdown, topEventsByFill, topEventsByRegs, registrationTrend, statusDistribution,
  }
}

// ─── Waitlist ─────────────────────────────────────────────────────────────────

export type WaitlistEntry = {
  id: string
  full_name: string
  email: string
  phone: string | null
  role: 'organizer' | 'guest' | 'both'
  source: string
  created_at: string
}

export async function getWaitlistEntries(): Promise<WaitlistEntry[]> {
  await requireAdmin()
  const supabase = createAdminClient()
  const { data, error } = await (supabase as any)
    .from('platform_waitlist')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) return []
  return data as WaitlistEntry[]
}

// ─── Support Queries ─────────────────────────────────────────────────────────

export type SupportQuery = {
  id: string
  from_name: string
  from_type: 'organizer' | 'attendee'
  from_id: string | null
  subject: string
  body: string | null
  category: string | null
  status: 'open' | 'in_progress' | 'resolved'
  priority: 'high' | 'medium' | 'low'
  resolved_at: string | null
  created_at: string
}

export async function getSupportQueries(): Promise<SupportQuery[]> {
  await requireAdmin()
  const supabase = createAdminClient()
  const { data, error } = await (supabase as any)
    .from('support_queries')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) return []
  return (data ?? []) as SupportQuery[]
}

export async function updateSupportQueryStatus(
  id: string,
  status: 'open' | 'in_progress' | 'resolved'
): Promise<{ error?: string }> {
  await requireAdmin()
  const supabase = createAdminClient()
  const { error } = await (supabase as any)
    .from('support_queries')
    .update({
      status,
      resolved_at: status === 'resolved' ? new Date().toISOString() : null,
    })
    .eq('id', id)
  return { error: error?.message }
}

export async function createSupportQuery(query: {
  from_name: string
  from_type: 'organizer' | 'attendee'
  from_id?: string | null
  subject: string
  body?: string
  category?: string
  priority?: 'high' | 'medium' | 'low'
}): Promise<{ error?: string; id?: string }> {
  const supabase = createAdminClient()
  const { data, error } = await (supabase as any)
    .from('support_queries')
    .insert({
      from_name: query.from_name,
      from_type: query.from_type,
      from_id: query.from_id ?? null,
      subject: query.subject,
      body: query.body ?? null,
      category: query.category ?? 'other',
      priority: query.priority ?? 'medium',
    })
    .select('id')
    .single()
  return { error: error?.message, id: data?.id }
}

// ─── Mutations ───────────────────────────────────────────────────────────────

export async function setOrgAdminStatus(
  orgId: string,
  status: 'active' | 'review' | 'suspended'
): Promise<{ error?: string }> {
  await requireAdmin()
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('profiles')
    .update({ admin_status: status } as any)
    .eq('id', orgId)
  return { error: error?.message }
}

// ─── CNIC Verifications ──────────────────────────────────────────────────────

export type CnicVerification = {
  id: string
  full_name: string | null
  email: string
  role: string
  cnic_number: string
  cnic_expiry: string
  cnic_image_url: string
  cnic_status: 'pending' | 'verified' | 'rejected'
  cnic_submitted_at: string
  cnic_reject_reason: string | null
}

export async function getMasterCnicVerifications(): Promise<CnicVerification[]> {
  await requireAdmin()
  const supabase = createAdminClient()
  const { data, error } = await (supabase as any)
    .from('profiles')
    .select('id, full_name, email, role, cnic_number, cnic_expiry, cnic_image_url, cnic_status, cnic_submitted_at, cnic_reject_reason')
    .in('cnic_status', ['pending', 'verified', 'rejected'])
    .not('cnic_number', 'is', null)
    .order('cnic_submitted_at', { ascending: false })
  if (error) { console.error('getMasterCnicVerifications:', error); return [] }

  // Generate short-lived (1 hour) signed URLs on demand — never store long-lived URLs
  // Also decrypt CNIC numbers (stored encrypted at rest)
  const rows = (data ?? []) as CnicVerification[]
  await Promise.all(rows.map(async (row) => {
    row.cnic_number = safeDecrypt(row.cnic_number) ?? row.cnic_number
    if (!row.cnic_image_url) return
    // If still an old full URL (https://...), leave as-is for backward compat
    if (row.cnic_image_url.startsWith('http')) return
    const { data: signed } = await (supabase as any).storage
      .from('cnic-documents')
      .createSignedUrl(row.cnic_image_url, 60 * 60)  // 1 hour
    if (signed?.signedUrl) row.cnic_image_url = signed.signedUrl
  }))

  return rows
}

export async function approveCnicVerification(userId: string): Promise<{ error?: string }> {
  await requireAdmin()
  const supabase = createAdminClient()
  const { error } = await (supabase as any)
    .from('profiles')
    .update({
      cnic_status: 'verified',
      is_id_verified: true,
      cnic_reject_reason: null,
    })
    .eq('id', userId)
  if (error) return { error: error?.message }
  return { error: error?.message }
}

// ─── Attendee Accounts ───────────────────────────────────────────────────────

export type MasterAttendee = {
  id: string
  full_name: string
  email: string
  phone_number: string | null
  cnic_number: string | null
  cnic_status: string | null
  is_id_verified: boolean
  created_at: string
  credit_score: number
  total_attended: number
  total_events: number
}

export async function getMasterAttendees(): Promise<MasterAttendee[]> {
  await requireAdmin()
  const supabase = createAdminClient()

  // Fetch all guest profiles
  const { data: guests, error: guestErr } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone_number, created_at, cnic_number, cnic_status, is_id_verified')
    .eq('role', 'guest')
    .order('created_at', { ascending: false })
    .limit(500)

  if (guestErr) console.error("MasterAttendees profiles err:", guestErr)
  if (!guests) return []

  const guestEmails = guests.map((g: any) => g.email).filter(Boolean)
  const guestIds = guests.map((g: any) => g.id)
  
  // Decoupled nested fetches
  const [guestProfilesRes, regsRes] = await Promise.all([
    supabase.from('guest_profiles').select('id, credit_score, total_attended').in('id', guestIds),
    supabase.from('public_registrations').select('email').in('email', guestEmails).not('status', 'eq', 'rejected')
  ])

  if (guestProfilesRes.error) console.error("MasterAttendees profiles err:", guestProfilesRes.error)
  if (regsRes.error) console.error("MasterAttendees regs err:", regsRes.error)

  const regCountMap: Record<string, number> = {}
  for (const r of regsRes.data ?? []) {
    regCountMap[r.email] = (regCountMap[r.email] ?? 0) + 1
  }

  return guests.map((g: any) => {
    const prof = guestProfilesRes.data?.find((p: any) => p.id === g.id)
    return {
      id: g.id,
      full_name: g.full_name,
      email: g.email,
      phone_number: g.phone_number ?? null,
      cnic_number: g.cnic_number ?? null,
      cnic_status: g.cnic_status ?? null,
      is_id_verified: g.is_id_verified ?? false,
      created_at: g.created_at,
      credit_score: prof?.credit_score ?? 0,
      total_attended: prof?.total_attended ?? 0,
      total_events: regCountMap[g.email] ?? 0,
    }
  })
}

export async function rejectCnicVerification(userId: string, reason: string): Promise<{ error?: string }> {
  await requireAdmin()
  const supabase = createAdminClient()
  const { error } = await (supabase as any)
    .from('profiles')
    .update({
      cnic_status: 'rejected',
      is_id_verified: false,
      cnic_reject_reason: reason || 'Could not verify — please resubmit a clearer photo.',
    })
    .eq('id', userId)
  return { error: error?.message }
}

// ─── Platform-wide Registrations ─────────────────────────────────────────────

export type MasterRegistration = {
  id: string
  guest_name: string
  guest_email: string
  guest_phone: string | null
  event_id: string
  event_title: string
  event_date: string
  organizer_name: string
  status: string
  payment_status: string | null
  payment_screenshot_url: string | null
  ticket_price: number | null
  created_at: string
}

export async function getMasterRegistrations(limit = 300): Promise<MasterRegistration[]> {
  await requireAdmin()
  const supabase = createAdminClient()

  const { data: regs, error: rErr } = await supabase
    .from('public_registrations')
    .select('id, status, payment_status, payment_screenshot_url, created_at, full_name, email, phone, event_id')
    .not('status', 'eq', 'rejected')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (rErr) console.error("MasterRegistrations regs err:", rErr)
  if (!regs) return []

  const eventIds = Array.from(new Set(regs.map((r: any) => r.event_id).filter(Boolean)))

  const { data: events, error: eErr } = await supabase
    .from('events')
    .select('id, title, date_start, ticket_price, organizer_id')
    .in('id', eventIds)

  if (eErr) console.error("MasterRegistrations events err:", eErr)

  const orgIds = Array.from(new Set(events?.map((e: any) => e.organizer_id).filter(Boolean) || []))

  const { data: orgs, error: oErr } = await supabase
    .from('profiles')
    .select('id, full_name, company_name')
    .in('id', orgIds)

  if (oErr) console.error("MasterRegistrations orgs err:", oErr)

  return regs.map((r: any) => {
    const ev = events?.find((e: any) => e.id === r.event_id)
    const org = orgs?.find((o: any) => o.id === ev?.organizer_id)

    return {
      id: r.id,
      guest_name: r.full_name ?? '—',
      guest_email: r.email ?? '—',
      guest_phone: r.phone ?? null,
      event_id: r.event_id ?? '',
      event_title: ev?.title ?? 'Unknown Event',
      event_date: ev?.date_start ?? '',
      organizer_name: org?.company_name || org?.full_name || '—',
      status: r.status ?? 'pending',
      payment_status: r.payment_status ?? null,
      payment_screenshot_url: r.payment_screenshot_url ?? null,
      ticket_price: ev?.ticket_price ?? null,
      created_at: r.created_at,
    }
  })
}
