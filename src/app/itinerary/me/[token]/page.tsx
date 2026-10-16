import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import ItineraryView from '@/components/retreats/ItineraryView'
import { createClient } from '@/lib/supabase/server'
import type { RetreatDay } from '@/lib/retreats'

export const metadata: Metadata = { title: 'My retreat', robots: { index: false, follow: false } }

type Mine = {
  participant: { name: string; room_label: string | null; dietary: string | null }
  retreat: { title: string; client_company: string | null; destination: string | null; starts_on: string; ends_on: string; status: string; cover_image_url: string | null }
  days: RetreatDay[]; checked_in_item_ids: string[]; updates: { body: string; created_at: string }[]
}

/** A participant's own schedule, opened from the link or QR pass they were given. */
export default async function MyItinerary({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = await createClient()
  const { data } = await supabase.rpc('get_participant_itinerary', { p_token: token })
  if (!data) notFound()
  const d = data as Mine
  return (
    <ItineraryView
      retreat={{ ...d.retreat, description: null, city: null, accent_color: null, organizer: null, days: d.days }}
      me={{ name: d.participant.name, room: d.participant.room_label, dietary: d.participant.dietary, checkedIn: d.checked_in_item_ids }}
      updates={d.updates}
    />
  )
}
