import { groupEvents } from '../explore'
import type { EventSummary } from '@/lib/api'

function fakeEvent(id: string, date_start: string): EventSummary {
  return {
    id,
    title: `Event ${id}`,
    description: null,
    date_start,
    date_end: null,
    venue_name: null,
    venue_city: null,
    city: null,
    capacity: null,
    ticket_price: null,
    registration_mode: 'open',
    status: 'published',
    cover_image_url: null,
    organizer_id: 'org-1',
    profiles: null,
    event_categories: null,
  }
}

describe('groupEvents', () => {
  function mockNow(iso: string) {
    jest.useFakeTimers().setSystemTime(new Date(iso))
  }

  afterEach(() => {
    jest.useRealTimers()
  })

  it('buckets an event happening today into "today"', () => {
    mockNow('2026-03-10T09:00:00.000Z')
    const events = [fakeEvent('a', '2026-03-10T18:00:00.000Z')]
    const { today, thisWeek, comingUp } = groupEvents(events)
    expect(today.map(e => e.id)).toEqual(['a'])
    expect(thisWeek).toHaveLength(0)
    expect(comingUp).toHaveLength(0)
  })

  it('buckets an event later in the same week into "thisWeek"', () => {
    mockNow('2026-03-10T09:00:00.000Z') // Tuesday
    const events = [fakeEvent('b', '2026-03-13T18:00:00.000Z')] // Friday, same week
    const { today, thisWeek, comingUp } = groupEvents(events)
    expect(today).toHaveLength(0)
    expect(thisWeek.map(e => e.id)).toEqual(['b'])
    expect(comingUp).toHaveLength(0)
  })

  it('buckets an event beyond this week into "comingUp"', () => {
    mockNow('2026-03-10T09:00:00.000Z')
    const events = [fakeEvent('c', '2026-04-01T18:00:00.000Z')]
    const { today, thisWeek, comingUp } = groupEvents(events)
    expect(today).toHaveLength(0)
    expect(thisWeek).toHaveLength(0)
    expect(comingUp.map(e => e.id)).toEqual(['c'])
  })

  it('preserves every event across the three buckets (none dropped, none duplicated)', () => {
    mockNow('2026-03-10T09:00:00.000Z')
    const events = [
      fakeEvent('today-1', '2026-03-10T20:00:00.000Z'),
      fakeEvent('week-1', '2026-03-12T20:00:00.000Z'),
      fakeEvent('later-1', '2026-05-01T20:00:00.000Z'),
    ]
    const { today, thisWeek, comingUp } = groupEvents(events)
    const total = today.length + thisWeek.length + comingUp.length
    expect(total).toBe(events.length)
  })
})
