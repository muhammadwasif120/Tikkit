import { notFound, permanentRedirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/** Old registration address. Registration now happens on the event page after login. */
export default async function LegacyRegisterRedirect({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params
  const supabase = await createClient()
  if (!/^[0-9a-f-]{36}$/i.test(eventId)) permanentRedirect(`/events/${eventId}`)
  const { data } = await supabase.from('event_listings').select('slug').eq('id', eventId).maybeSingle()
  if (!data?.slug) notFound()
  permanentRedirect(`/events/${data.slug}`)
}
