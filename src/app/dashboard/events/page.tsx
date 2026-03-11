import { createClient } from '@/lib/supabase/server'
import EventsClient from '@/components/events/EventsClient'

export default async function EventsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: events } = await supabase
    .from('events')
    .select('*, ticket_types(name, price, is_vip)')
    .eq('organizer_id', user!.id)
    .order('date_start', { ascending: false })

  return <EventsClient initialEvents={events ?? []} />
}