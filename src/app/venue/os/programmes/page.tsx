import { createClient } from '@/lib/supabase/server'
import ProgrammeListClient from '@/components/venue/os/ProgrammeListClient'

export default async function ProgrammesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: venue } = await (supabase as any)
    .from('venues')
    .select('id')
    .eq('owner_id', user!.id)
    .single()

  const { data: programmes } = await (supabase as any)
    .from('programmes')
    .select(`
      id, title, category, rrule, start_time, duration_mins,
      capacity, price, active, tags,
      programme_instances(id, date, status, tickets_sold)
    `)
    .eq('venue_id', venue.id)
    .order('created_at', { ascending: false })

  return <ProgrammeListClient programmes={programmes ?? []} />
}
