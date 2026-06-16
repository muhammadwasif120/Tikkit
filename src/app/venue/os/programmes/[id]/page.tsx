import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProgrammeDetailClient from '@/components/venue/os/ProgrammeDetailClient'

export default async function ProgrammeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: venue } = await (supabase as any)
    .from('venues')
    .select('id')
    .eq('owner_id', user!.id)
    .single()

  const { data: programme } = await (supabase as any)
    .from('programmes')
    .select(`
      id, title, description, category, rrule, start_time, duration_mins,
      capacity, price, currency, active, tags, spot_booking_enabled,
      programme_instances(id, date, status, tickets_sold, notes)
    `)
    .eq('id', id)
    .eq('venue_id', venue.id)
    .single()

  if (!programme) notFound()

  // Sort instances by date
  const instances = (programme.programme_instances ?? [])
    .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())

  return <ProgrammeDetailClient programme={{ ...programme, programme_instances: instances }} />
}
