// Shared types and helpers for the retreat module. The database objects come from
// supabase/migrations/20261016000004_retreats.sql (not in the generated types until applied).

export type ItemKind = 'activity' | 'meal' | 'transport' | 'stay' | 'session' | 'free_time' | 'milestone'
export type ItemStatus = 'planned' | 'confirmed' | 'in_progress' | 'done' | 'skipped'

export const KIND: Record<ItemKind, { label: string; emoji: string }> = {
  activity: { label: 'Activity', emoji: '🎯' }, meal: { label: 'Meal', emoji: '🍽️' }, transport: { label: 'Transport', emoji: '🚐' },
  stay: { label: 'Stay', emoji: '🛏️' }, session: { label: 'Session', emoji: '🎤' }, free_time: { label: 'Free time', emoji: '☕' }, milestone: { label: 'Milestone', emoji: '🏁' },
}
export const KINDS = Object.keys(KIND) as ItemKind[]

export type RetreatItem = {
  id: string; kind: ItemKind; title: string; description: string | null; starts_at: string | null; ends_at: string | null
  location_name: string | null; location_address: string | null; latitude: number | null; longitude: number | null; status: ItemStatus
}
export type RetreatDay = { id: string; day_number: number; date: string; title: string | null; summary: string | null; items: RetreatItem[] }

export type SharedRetreat = {
  title: string; client_company: string | null; description: string | null; destination: string | null; city: string | null
  cover_image_url: string | null; accent_color: string | null; starts_on: string; ends_on: string; status: string
  organizer: { name: string; logo_url: string | null; whatsapp: string | null } | null
  days: RetreatDay[]; documents?: { id: string; name: string }[]
}

export const mapsUrl = (i: Pick<RetreatItem, 'latitude' | 'longitude' | 'location_name' | 'location_address'>) =>
  i.latitude !== null && i.longitude !== null
    ? `https://www.google.com/maps?q=${i.latitude},${i.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([i.location_name, i.location_address].filter(Boolean).join(' '))}`

/** One day of the itinerary as an .ics file the guest can add to their calendar. */
export function icsForDay(retreat: string, day: RetreatDay) {
  const fmt = (iso: string) => iso.replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//TIKKIT X//Retreat//EN']
  for (const i of day.items.filter(x => x.starts_at)) {
    lines.push('BEGIN:VEVENT', `UID:${i.id}@tikkitx.com`, `DTSTAMP:${fmt(new Date().toISOString())}`,
      `DTSTART:${fmt(new Date(i.starts_at!).toISOString())}`, `DTEND:${fmt(new Date(i.ends_at ?? new Date(new Date(i.starts_at!).getTime() + 3_600_000).toISOString()).toISOString())}`,
      `SUMMARY:${i.title.replace(/[,;]/g, ' ')}`, `LOCATION:${(i.location_name ?? '').replace(/[,;]/g, ' ')}`, `DESCRIPTION:${retreat.replace(/[,;]/g, ' ')}`, 'END:VEVENT')
  }
  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}
