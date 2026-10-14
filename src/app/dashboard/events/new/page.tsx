import { requireOrganizer } from '@/lib/data/viewer'
import EventForm, { emptyEvent } from '@/components/events/EventForm'
import { eventFormContext } from '@/lib/data/events'

export const metadata = { title: 'New event' }

export default async function NewEventPage() {
  const ctx = await eventFormContext(await requireOrganizer())
  return <EventForm mode="create" initial={emptyEvent()} {...ctx} />
}
