/**
 * eventStatus.ts — single source of truth for event lifecycle state.
 *
 * DB status flow:
 *   draft → published → completed → archived
 *
 * Grace windows (applied at read-time AND synced to DB via syncEventStatuses):
 *   published  → completed  : date_end + 12 h has passed
 *   completed  → archived   : date_end + 72 h has passed  (skeleton data retained only)
 */

export type EffectiveStatus = 'draft' | 'published' | 'completed' | 'archived' | 'cancelled'

type StatusableEvent = {
  status: string
  date_start: string
  date_end?: string | null
}

const HOURS = (n: number) => n * 60 * 60 * 1000

/**
 * Returns the real logical status of an event based on current time,
 * regardless of what the DB column currently says.
 */
export function getEffectiveStatus(event: StatusableEvent): EffectiveStatus {
  if (event.status === 'cancelled') return 'cancelled'
  if (event.status === 'draft')     return 'draft'

  const now    = Date.now()
  const endMs  = new Date(event.date_end ?? event.date_start).getTime()

  if (now >= endMs + HOURS(72)) return 'archived'
  if (now >= endMs + HOURS(12)) return 'completed'

  // If the DB already says completed/archived, trust it even within grace window
  if (event.status === 'completed') return 'completed'
  if (event.status === 'archived')  return 'archived'

  return 'published'
}

export const isLive     = (e: StatusableEvent) => getEffectiveStatus(e) === 'published'
export const isEnded    = (e: StatusableEvent) => { const s = getEffectiveStatus(e); return s === 'completed' || s === 'archived' }
export const isArchived = (e: StatusableEvent) => getEffectiveStatus(e) === 'archived'
