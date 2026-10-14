import { notFound, permanentRedirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/** Old event address. Kept so existing links and search rankings carry over to /events/<slug>. */
export default async function LegacyEventRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const isUuid = /^[0-9a-f-]{36}$/i.test(id)
  if (!isUuid) permanentRedirect(`/events/${id}`)
  const { data } = await supabase.from('event_listings').select('slug').eq('id', id).maybeSingle()
  if (!data?.slug) notFound()
  permanentRedirect(`/events/${data.slug}`)
}
