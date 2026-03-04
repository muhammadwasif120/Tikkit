import { createClient } from '@/lib/supabase/server'
import ExploreClient from '@/components/guest/ExploreClient'
import { getPublicEvents } from '@/app/actions/guestCreditActions'

export default async function ExplorePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const events = await getPublicEvents(40)

  const myEvents = user ? await (async () => {
    const { data } = await supabase
      .from('public_registrations')
      .select('id, status, event:events(id, title, date_start, cover_image_url, venue_name)')
      .eq('email', user.email)
      .not('status', 'in', '("rejected","cancelled")')
      .order('created_at', { ascending: false })
      .limit(10)
    return (data ?? []).filter(r => {
      const eventDate = (r.event as any)?.date_start
      return eventDate && new Date(eventDate) >= new Date()
    })
  })() : []

  return <ExploreClient events={events} myEvents={myEvents} />
}
