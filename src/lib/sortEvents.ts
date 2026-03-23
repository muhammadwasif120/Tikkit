import { getEffectiveStatus } from './eventStatus'

type SortableEvent = {
  status: string
  date_start: string
  date_end?: string | null
}

function eventPriority(e: SortableEvent): 0 | 1 | 2 {
  const s = getEffectiveStatus(e)
  if (s === 'published')                    return 0  // live  → top
  if (s === 'completed' || s === 'archived') return 2  // ended → bottom
  return 1                                            // draft / upcoming
}

export function sortEvents<T extends SortableEvent>(events: T[]): T[] {
  return [...events].sort((a, b) => {
    const pa = eventPriority(a)
    const pb = eventPriority(b)
    if (pa !== pb) return pa - pb

    const aTime = new Date(a.date_start).getTime()
    const bTime = new Date(b.date_start).getTime()
    // Live/upcoming: soonest first; Ended: most recent first
    return pa === 2 ? bTime - aTime : aTime - bTime
  })
}
