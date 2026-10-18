import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'
import type { BadgeTone } from '@/components/kit'
import type { ClosedRow, TicketRow } from '@/components/attendee/TicketsClient'
import type { Collectible } from '@/components/attendee/CollectibleCard'
import type { ModRow, RetreatLink } from '@/components/attendee/ModuleBookings'

type Supa = SupabaseClient<Database>

type EventJoin = {
  title: string; slug: string | null; starts_at: string; ends_at: string | null; status: string; cover_image_url: string | null
  venue_name: string | null; area_label: string | null; city: string | null; is_secret_venue: boolean; category_id: string | null; organizer_id: string
}

export type UpcomingTicket = TicketRow & { endsAt: string }
export type TicketState = { upcoming: UpcomingTicket[]; collection: Collectible[]; closed: ClosedRow[] }

/**
 * Sorts every registration into what a guest should see:
 *  upcoming    a live ticket (QR once confirmed)
 *  collection  a night they attended, the QR is spent and becomes a collectible
 *  closed      missed, cancelled, declined or never confirmed, shown greyed out with the reason
 */
export async function loadTickets(supabase: Supa, userId: string): Promise<TicketState> {
  const loose = supabase as unknown as SupabaseClient
  const [{ data }, { data: cats }, { data: col }] = await Promise.all([
    supabase.from('registrations')
      .select('id, status, status_reason, qr_token, is_vip, plus_one, price_due_pkr, price_paid_pkr, checked_in_at, ticket_types(name), events(title, slug, starts_at, ends_at, status, cover_image_url, venue_name, area_label, city, is_secret_venue, category_id, organizer_id)')
      .eq('attendee_id', userId).order('created_at', { ascending: false }),
    supabase.from('event_categories').select('id, icon, color'),
    loose.rpc('my_collectibles'),
  ])
  const catById = new Map((cats ?? []).map(c => [c.id, c]))
  const serial = new Map(((col ?? []) as { registration_id: string; serial: number; attended_total: number }[]).map(c => [c.registration_id, c]))

  const regs = (data ?? []).filter(r => r.events)
  const orgIds = [...new Set(regs.map(r => (r.events as unknown as EventJoin).organizer_id))]
  const { data: orgs } = orgIds.length ? await supabase.from('public_organizers').select('id, company_name, full_name').in('id', orgIds) : { data: [] }
  const orgName = new Map((orgs ?? []).map(o => [o.id as string, (o.company_name || o.full_name) as string | null]))

  const now = Date.now()
  const upcoming: UpcomingTicket[] = []
  const collection: Collectible[] = []
  const closed: (ClosedRow & { sort: number })[] = []

  for (const r of regs) {
    const e = r.events as unknown as EventJoin
    const endsAt = e.ends_at ?? e.starts_at
    const ended = new Date(endsAt).getTime() < now
    const where = e.is_secret_venue ? `Secret location · ${e.area_label ?? e.city ?? ''}` : [e.venue_name, e.area_label ?? e.city].filter(Boolean).join(', ')
    const ticket = (r.ticket_types as unknown as { name: string } | null)?.name ?? null
    const close = (label: string, detail: string, tone: BadgeTone) => closed.push({ id: r.id, title: e.title, slug: e.slug, startsAt: e.starts_at, where, ticket, label, detail, tone, sort: new Date(e.starts_at).getTime() })

    if (r.status === 'checked_in') {
      const s = serial.get(r.id)
      const c = e.category_id ? catById.get(e.category_id) : null
      const total = s?.attended_total ?? 1, n = s?.serial ?? 1
      const rarity: Collectible['rarity'] = n <= 10 ? 'Founding guest' : r.is_vip ? 'VIP' : /early/i.test(ticket ?? '') ? 'Early bird' : total <= 30 ? 'Intimate night' : 'Attended'
      collection.push({
        id: r.id, title: e.title, slug: e.slug, startsAt: e.starts_at, attendedAt: r.checked_in_at, where, cover: e.cover_image_url, color: c?.color ?? null, icon: c?.icon ?? null,
        organizer: orgName.get(e.organizer_id) ?? null, ticket, isVip: r.is_vip, serial: n, total, paid: r.price_paid_pkr, rarity,
      })
    } else if (e.status === 'cancelled' || (r.status === 'cancelled' && /organizer cancelled/i.test(r.status_reason ?? ''))) close('Event cancelled', 'The organizer called it off', 'neutral')
    else if (r.status === 'cancelled') close('Cancelled', 'You cancelled this ticket', 'neutral')
    else if (r.status === 'rejected') close('Declined', 'The organizer did not approve this request', 'danger')
    else if (r.status === 'no_show' || (ended && r.status === 'confirmed')) close('Missed', 'You did not check in, so there is no collectible', 'danger')
    else if (ended) close('Expired', 'This request was never confirmed', 'neutral')
    else upcoming.push({
      id: r.id, status: r.status, token: r.qr_token, isVip: r.is_vip, plusOne: r.plus_one, ticket, due: r.price_due_pkr, endsAt,
      event: { title: e.title, slug: e.slug, startsAt: e.starts_at, cover: e.cover_image_url, secret: e.is_secret_venue, where },
    })
  }
  upcoming.sort((a, b) => +new Date(a.event.startsAt) - +new Date(b.event.startsAt))
  collection.sort((a, b) => +new Date(b.startsAt) - +new Date(a.startsAt))
  closed.sort((a, b) => b.sort - a.sort)
  return { upcoming, collection, closed: closed.map(({ sort: _s, ...c }) => c) }
}

export type Bookings = { rows: ModRow[]; retreats: RetreatLink[] }

/** Classes, passes, reservations and retreat invites. */
export async function loadBookings(supabase: Supa, userId: string): Promise<Bookings> {
  const now = Date.now()
  const [cb, sb, pp, rt] = await Promise.all([
    supabase.from('class_bookings').select('id, status, qr_token, price_due_pkr, organizer_id, class_sessions(starts_at, ends_at), class_series(title, venue_name, area_label, city)').eq('attendee_id', userId).not('status', 'in', '(rejected)').order('created_at', { ascending: false }).limit(30),
    supabase.from('space_bookings').select('id, status, qr_token, price_due_pkr, organizer_id, starts_at, ends_at, spaces(name, address, area_label, city)').eq('attendee_id', userId).not('status', 'in', '(rejected)').order('starts_at', { ascending: false }).limit(30),
    supabase.from('pass_purchases').select('id, status, qr_token, price_due_pkr, organizer_id, sessions_total, sessions_used, valid_until, pass_products(name)').eq('attendee_id', userId).in('status', ['awaiting_payment', 'payment_submitted', 'active']).limit(20),
    supabase.rpc('my_retreats'),
  ])
  type A = Record<string, unknown>
  const isPast = (w: string | null) => !!w && new Date(w).getTime() < now
  const place = (a: A | null, ...keys: string[]) => keys.map(k => a?.[k] as string | null).filter(Boolean).join(', ')
  const rows: ModRow[] = [
    ...((cb.data ?? []) as unknown as A[]).map(r => {
      const s = r.class_sessions as A | null; const when = (s?.starts_at as string) ?? null
      return { id: r.id as string, kind: 'class_booking' as const, title: ((r.class_series as A | null)?.title as string) ?? 'Class', when, end: (s?.ends_at as string) ?? null, where: place(r.class_series as A | null, 'venue_name', 'area_label'), status: r.status as string, token: r.qr_token as string, due: r.price_due_pkr as number, organizerId: r.organizer_id as string, past: isPast(when) }
    }),
    ...((sb.data ?? []) as unknown as A[]).map(r => ({ id: r.id as string, kind: 'space_booking' as const, title: ((r.spaces as A | null)?.name as string) ?? 'Space', when: r.starts_at as string, end: r.ends_at as string, where: place(r.spaces as A | null, 'address', 'area_label'), status: r.status as string, token: r.qr_token as string, due: r.price_due_pkr as number, organizerId: r.organizer_id as string, past: isPast(r.starts_at as string) })),
    ...((pp.data ?? []) as unknown as A[]).map(r => ({
      id: r.id as string, kind: 'pass_purchase' as const, title: ((r.pass_products as A | null)?.name as string) ?? 'Pass', when: null, status: r.status as string, token: r.qr_token as string, due: r.price_due_pkr as number, organizerId: r.organizer_id as string,
      note: r.sessions_total === null ? 'Unlimited sessions' : `${(r.sessions_total as number) - (r.sessions_used as number)} sessions left`,
      left: r.sessions_total === null ? null : (r.sessions_total as number) - (r.sessions_used as number), total: (r.sessions_total as number | null) ?? null, validUntil: (r.valid_until as string) ?? null,
    })),
  ]
  const retreats = ((rt.data ?? []) as { retreat_id: string; title: string; destination: string | null; starts_on: string; ends_on: string; qr_token: string }[])
    .map(r => ({ id: r.retreat_id, title: r.title, destination: r.destination, starts_on: r.starts_on, ends_on: r.ends_on, qr_token: r.qr_token }))
  return { rows, retreats }
}

export type AgendaItem = {
  key: string; kind: 'event' | 'class' | 'space' | 'retreat'; title: string; start: string; end: string | null; allDay?: boolean
  where: string; href: string; status: string; secret?: boolean; token?: string
}

/** Everything the guest is going to, in date order. Pending requests are included so nothing is a surprise. */
export function buildAgenda(t: TicketState, b: Bookings): AgendaItem[] {
  const items: AgendaItem[] = []
  for (const u of t.upcoming) items.push({ key: `e-${u.id}`, kind: 'event', title: u.event.title, start: u.event.startsAt, end: u.endsAt, where: u.event.where, href: u.event.slug ? `/events/${u.event.slug}` : '/guest/tickets', status: u.status, secret: u.event.secret, token: u.status === 'confirmed' ? u.token : undefined })
  for (const r of b.rows) {
    if (r.past || r.kind === 'pass_purchase' || !r.when || ['cancelled', 'rejected', 'no_show'].includes(r.status)) continue
    items.push({ key: `${r.kind}-${r.id}`, kind: r.kind === 'class_booking' ? 'class' : 'space', title: r.title, start: r.when, end: r.end ?? null, where: r.where ?? '', href: '/guest/tickets', status: r.status, token: r.status === 'confirmed' ? r.token : undefined })
  }
  for (const r of b.retreats) if (new Date(r.ends_on).getTime() + 86_400_000 > Date.now()) items.push({ key: `r-${r.id}`, kind: 'retreat', title: r.title, start: `${r.starts_on}T00:00:00+05:00`, end: `${r.ends_on}T23:59:00+05:00`, allDay: true, where: r.destination ?? '', href: `/itinerary/me/${r.qr_token}`, status: 'confirmed' })
  return items.sort((a, b) => +new Date(a.start) - +new Date(b.start))
}

const ics = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')
const stamp = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

/** An .ics calendar of the agenda. Secret venues stay secret. */
export function buildIcs(items: AgendaItem[], origin: string): string {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//TIKKIT X//Schedule//EN', 'CALSCALE:GREGORIAN', 'X-WR-CALNAME:My TIKKIT X schedule']
  for (const i of items) {
    const end = i.end ?? new Date(new Date(i.start).getTime() + 2 * 3_600_000).toISOString()
    lines.push('BEGIN:VEVENT', `UID:${i.key}@tikkitx.com`, `DTSTAMP:${stamp(new Date().toISOString())}`)
    if (i.allDay) { lines.push(`DTSTART;VALUE=DATE:${i.start.slice(0, 10).replace(/-/g, '')}`, `DTEND;VALUE=DATE:${new Date(new Date(end).getTime() + 86_400_000).toISOString().slice(0, 10).replace(/-/g, '')}`) }
    else lines.push(`DTSTART:${stamp(i.start)}`, `DTEND:${stamp(end)}`)
    lines.push(`SUMMARY:${ics(i.title)}`)
    if (i.where) lines.push(`LOCATION:${ics(i.secret ? 'Secret location, revealed by the organizer' : i.where)}`)
    lines.push(`URL:${origin}${i.href}`, `DESCRIPTION:${ics(i.status === 'confirmed' ? 'Confirmed. Open My tickets for your QR.' : `Status: ${i.status.replace('_', ' ')}`)}`, 'END:VEVENT')
  }
  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}

/** A Google Calendar link for one item. */
export function googleCalendarUrl(i: AgendaItem): string {
  const end = i.end ?? new Date(new Date(i.start).getTime() + 2 * 3_600_000).toISOString()
  const d = i.allDay ? `${i.start.slice(0, 10).replace(/-/g, '')}/${new Date(new Date(end).getTime() + 86_400_000).toISOString().slice(0, 10).replace(/-/g, '')}` : `${stamp(i.start)}/${stamp(end)}`
  const q = new URLSearchParams({ action: 'TEMPLATE', text: i.title, dates: d, location: i.secret ? '' : i.where })
  return `https://calendar.google.com/calendar/render?${q.toString()}`
}
