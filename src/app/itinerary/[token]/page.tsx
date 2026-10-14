import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import ItineraryView from '@/components/retreats/ItineraryView'
import { createClient } from '@/lib/supabase/server'
import { rpcLoose } from '@/lib/rpc'
import type { SharedRetreat } from '@/lib/retreats'

export const metadata: Metadata = { title: 'Retreat itinerary', robots: { index: false, follow: false } }

export default async function SharedItinerary({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = await createClient()
  const { data } = await rpcLoose(supabase as never, 'get_shared_retreat', { p_token: token })
  if (!data) notFound()
  return <ItineraryView retreat={data as SharedRetreat} />
}
