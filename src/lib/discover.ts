import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'
import { fmtDate, fmtTime } from '@/lib/format'

type Supa = SupabaseClient<Database>

export type Pick = {
  key: string
  kind: 'event' | 'class' | 'space'
  href: string
  title: string
  when: string | null
  where: string
  price: number | null
  priceNote: string
  category: string | null
  categoryIcon: string | null
  color: string | null
  cover: string | null
  organizer: string | null
  organizerId: string | null
  eventId: string | null
  saved: boolean
  following: boolean
  reason: string
  score: number
}

export type Discovery = {
  forYou: Pick[]
  different: Pick[]
  categories: { id: string; name: string; icon: string | null; color: string | null; selected: boolean }[]
  hasHistory: boolean
}

const REG_WEIGHT: Record<string, number> = { checked_in: 3, confirmed: 2, payment_submitted: 1.5, awaiting_payment: 1.5, requested: 1, waitlisted: 0.5, no_show: 0.5 }
const BOOK_WEIGHT: Record<string, number> = { checked_in: 3, confirmed: 2.5, payment_submitted: 1.5, awaiting_payment: 1.5, requested: 1 }

const bump = (m: Map<string, number>, k: string | null | undefined, w: number) => { if (k) m.set(k, (m.get(k) ?? 0) + w) }

/**
 * Builds a feed from what the guest has attended and booked, what they favourite and follow, and the
 * categories they chose. A few picks always come from outside their usual categories so the feed
 * does not shut people into one taste: someone who paints may still like a punk gig.
 */
export async function buildDiscovery(supabase: Supa, userId: string, city: string | null): Promise<Discovery> {
  const nowIso = new Date().toISOString()
  const [regs, books, favEvents, favOrgs, interests, cats, events, classes, spaces, spaceBookings] = await Promise.all([
    supabase.from('registrations').select('event_id, status, events(title, category_id, tags, organizer_id)').eq('attendee_id', userId),
    supabase.from('class_bookings').select('series_id, status, class_series(title, category_id, tags, organizer_id)').eq('attendee_id', userId),
    supabase.from('event_favourites').select('event_id, events(category_id, organizer_id)').eq('user_id', userId),
    supabase.from('organizer_favourites').select('organizer_id').eq('user_id', userId),
    (supabase as unknown as SupabaseClient).from('attendee_interests').select('category_id').eq('user_id', userId),
    supabase.from('event_categories').select('id, name, icon, color, sort').order('sort'),
    supabase.from('event_listings').select('*').gte('ends_at', nowIso).order('starts_at').limit(150),
    supabase.from('public_class_series').select('*').not('next_session_at', 'is', null).order('next_session_at').limit(60),
    supabase.from('public_spaces').select('*').limit(40),
    supabase.from('space_bookings').select('space_id, status, spaces(kind)').eq('attendee_id', userId),
  ])

  const catRows = cats.data ?? []
  const catById = new Map(catRows.map(c => [c.id, c]))
  const chosen = new Set(((interests.data ?? []) as { category_id: string }[]).map(i => i.category_id))

  // ---- taste signals ----
  const affinity = new Map<string, number>()
  const tagAff = new Map<string, number>()
  const history = new Map<string, { title: string; w: number }>() // best example per category, for the reason text
  const remember = (cat: string | null | undefined, title: string | null | undefined, w: number) => {
    if (!cat || !title) return
    const cur = history.get(cat)
    if (!cur || w > cur.w) history.set(cat, { title, w })
  }
  const going = new Set<string>()
  type EvJoin = { title: string | null; category_id: string | null; tags: string[] | null; organizer_id: string } | null
  for (const r of regs.data ?? []) {
    const w = REG_WEIGHT[r.status] ?? 0
    const ev = r.events as unknown as EvJoin
    if (r.event_id && !['cancelled', 'rejected', 'no_show', 'checked_in'].includes(r.status)) going.add(r.event_id)
    if (!ev || w === 0) continue
    bump(affinity, ev.category_id, w)
    for (const t of ev.tags ?? []) bump(tagAff, t, w * 0.5)
    remember(ev.category_id, ev.title, w)
  }
  type SerJoin = { title: string | null; category_id: string | null; tags: string[] | null; organizer_id: string } | null
  for (const b of books.data ?? []) {
    const w = BOOK_WEIGHT[b.status] ?? 0
    const s = b.class_series as unknown as SerJoin
    if (!s || w === 0) continue
    bump(affinity, s.category_id, w)
    for (const t of s.tags ?? []) bump(tagAff, t, w * 0.5)
    remember(s.category_id, s.title, w)
  }
  for (const f of favEvents.data ?? []) bump(affinity, (f.events as unknown as { category_id: string | null } | null)?.category_id, 3)
  for (const c of chosen) bump(affinity, c, 4)

  const followed = new Set((favOrgs.data ?? []).map(o => o.organizer_id))
  const savedIds = new Set((favEvents.data ?? []).map(f => f.event_id))
  const spaceKinds = new Map<string, number>()
  for (const b of spaceBookings.data ?? []) bump(spaceKinds, (b.spaces as unknown as { kind: string } | null)?.kind, BOOK_WEIGHT[b.status] ?? 0)

  const max = Math.max(1, ...affinity.values())
  const aff = (cat: string | null) => (cat ? (affinity.get(cat) ?? 0) / max : 0)
  const maxTag = Math.max(1, ...tagAff.values())
  const tagScore = (tags: string[] | null) => Math.min(1, (tags ?? []).reduce((a, t) => a + (tagAff.get(t) ?? 0), 0) / maxTag)
  const maxKind = Math.max(1, ...spaceKinds.values())

  // organizer names for the cards
  const orgIds = [...new Set([...(events.data ?? []).map(e => e.organizer_id), ...(classes.data ?? []).map(c => c.organizer_id), ...(spaces.data ?? []).map(s => s.organizer_id)].filter(Boolean) as string[])]
  const { data: orgs } = orgIds.length ? await supabase.from('public_organizers').select('id, company_name, full_name').in('id', orgIds) : { data: [] as { id: string | null; company_name: string | null; full_name: string | null }[] }
  const orgName = new Map((orgs ?? []).map(o => [o.id as string, o.company_name || o.full_name || null]))

  const soon = (iso: string | null) => { if (!iso) return 0; const d = Math.max(0, (new Date(iso).getTime() - Date.now()) / 86_400_000); return Math.exp(-d / 14) }
  const sameCity = (c: string | null) => !!city && !!c && c.toLowerCase() === city.toLowerCase()
  const when = (iso: string | null) => (iso ? `${fmtDate(iso)} · ${fmtTime(iso)}` : null)

  const reasonFor = (cat: string | null, tags: string[] | null, org: string | null, taste: number) => {
    if (cat && history.has(cat) && aff(cat) >= 0.25) return `Because you went to ${history.get(cat)!.title}`
    if (cat && chosen.has(cat)) return `You follow ${catById.get(cat)?.name ?? 'this'}`
    const t = (tags ?? []).find(x => (tagAff.get(x) ?? 0) > 0)
    if (t) return `You like ${t}`
    if (org && followed.has(org)) return `From an organizer you follow`
    return taste < 0.25 ? 'Something different' : city ? `Popular in ${city}` : 'Popular right now'
  }

  const picks: Pick[] = []
  for (const e of events.data ?? []) {
    if (!e.id || !e.slug || going.has(e.id)) continue
    const a = aff(e.category_id)
    const taken = e.capacity ? Math.min(1, (e.seats_taken ?? 0) / e.capacity) : 0
    const score = 3 * a + 1.2 * tagScore(e.tags) + (followed.has(e.organizer_id ?? '') ? 1.5 : 0) + (sameCity(e.city) ? 0.6 : 0) + 0.8 * soon(e.starts_at) + 0.3 * taken
    const c = e.category_id ? catById.get(e.category_id) : null
    picks.push({
      key: `e-${e.id}`, kind: 'event', href: `/events/${e.slug}`, title: e.title ?? 'Event', when: when(e.starts_at),
      where: e.is_secret_venue ? `Secret location · ${e.area_label ?? e.city ?? ''}` : [e.venue_name, e.area_label ?? e.city].filter(Boolean).join(', '),
      price: e.min_price_pkr, priceNote: e.min_price_pkr === 0 ? 'Free' : 'From', category: c?.name ?? null, categoryIcon: c?.icon ?? null, color: c?.color ?? null,
      cover: e.cover_image_url, organizer: orgName.get(e.organizer_id ?? '') ?? null,
      organizerId: e.organizer_id, eventId: e.id, saved: savedIds.has(e.id), following: followed.has(e.organizer_id ?? ''),
      reason: reasonFor(e.category_id, e.tags, e.organizer_id, a), score,
    })
  }
  for (const s of classes.data ?? []) {
    if (!s.id || !s.slug) continue
    const a = aff(s.category_id)
    const score = 3 * a + 1.2 * tagScore(s.tags) + (followed.has(s.organizer_id ?? '') ? 1.5 : 0) + (sameCity(s.city) ? 0.6 : 0) + 0.8 * soon(s.next_session_at)
    const c = s.category_id ? catById.get(s.category_id) : null
    picks.push({
      key: `c-${s.id}`, kind: 'class', href: `/classes/${s.slug}`, title: s.title ?? 'Class', when: when(s.next_session_at),
      where: [s.venue_name, s.area_label ?? s.city].filter(Boolean).join(', '), price: s.drop_in_price_pkr, priceNote: 'Drop in', category: c?.name ?? null,
      categoryIcon: c?.icon ?? null, color: c?.color ?? null, cover: s.cover_image_url, organizer: orgName.get(s.organizer_id ?? '') ?? null,
      organizerId: s.organizer_id, eventId: null, saved: false, following: followed.has(s.organizer_id ?? ''),
      reason: reasonFor(s.category_id, s.tags, s.organizer_id, a), score,
    })
  }
  for (const sp of spaces.data ?? []) {
    if (!sp.id || !sp.slug) continue
    const k = (spaceKinds.get(sp.kind ?? '') ?? 0) / maxKind
    const score = 1.2 + 2 * k + (followed.has(sp.organizer_id ?? '') ? 1.5 : 0) + (sameCity(sp.city) ? 0.6 : 0) - (affinity.size ? 0.4 : 0)
    picks.push({
      key: `s-${sp.id}`, kind: 'space', href: `/spaces/${sp.slug}`, title: sp.name ?? 'Space', when: null,
      where: [sp.area_label ?? sp.city, sp.kind].filter(Boolean).join(' · '), price: sp.price_pkr_per_slot, priceNote: `Per ${sp.slot_minutes ?? 60} min`,
      category: null, categoryIcon: null, color: null, cover: (sp.photos ?? [])[0] ?? null, organizer: orgName.get(sp.organizer_id ?? '') ?? null,
      organizerId: sp.organizer_id, eventId: null, saved: false, following: followed.has(sp.organizer_id ?? ''),
      reason: k > 0 ? 'You have booked a space like this' : sameCity(sp.city) ? `Near you in ${sp.city}` : 'Reserve by the hour', score,
    })
  }

  picks.sort((x, y) => y.score - x.score)
  const hasHistory = affinity.size > 0
  // Exploration: well liked or soon, but outside the guest's usual categories.
  const known = (p: Pick) => { const cat = catRows.find(c => c.name === p.category)?.id ?? null; return cat ? aff(cat) : 0 }
  const different = hasHistory
    ? picks.filter(p => p.kind !== 'space' && known(p) < 0.25).sort((x, y) => y.score - x.score).slice(0, 4).map(p => ({ ...p, reason: 'Something different' }))
    : []
  const taken = new Set(different.map(d => d.key))
  const forYou = picks.filter(p => !taken.has(p.key)).slice(0, 18)

  return {
    forYou, different, hasHistory,
    categories: catRows.map(c => ({ id: c.id, name: c.name, icon: c.icon, color: c.color, selected: chosen.has(c.id) })),
  }
}
