import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import PublicExploreClient from '@/components/public/PublicExploreClient'

export const revalidate = 120 // re-fetch every 2 minutes

export default async function ExplorePage() {
  // If the visitor is already logged in → send them to their home
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', user.id).single()
    const role = (profile as any)?.role ?? 'guest'
    redirect(role === 'guest' ? '/guest/explore' : '/dashboard')
  }

  // Use service-role client so RLS doesn't block public reads
  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  // Fetch published, non-private events with organizer details
  const { data: rawEvents } = await admin
    .from('events')
    .select(`
      id, title, date_start, cover_image_url, venue_name,
      ticket_price, registration_mode, category_id,
      capacity, organizer_id,
      organizer:profiles!events_organizer_id_fkey(
        full_name, company_name, username, logo_url
      )
    `)
    .eq('status', 'published')
    .eq('is_private', false)
    .gte('date_start', new Date().toISOString())
    .order('date_start', { ascending: true })
    .limit(50)

  const events = rawEvents ?? []

  // Batch registration counts for each event
  let regCounts: Record<string, number> = {}
  if (events.length > 0) {
    const eventIds = events.map((e: any) => e.id)
    const { data: regRows } = await admin
      .from('public_registrations')
      .select('event_id')
      .in('event_id', eventIds)
      .neq('status', 'rejected')

    for (const row of regRows ?? []) {
      regCounts[row.event_id] = (regCounts[row.event_id] ?? 0) + 1
    }
  }

  const enrichedEvents = events.map((e: any) => ({
    ...e,
    registered_count: regCounts[e.id] ?? 0,
  }))

  // Fetch all categories for filter pills
  const { data: categories } = await admin
    .from('event_categories')
    .select('id, name, icon, color')
    .order('name', { ascending: true })

  return (
    <PublicExploreClient
      events={enrichedEvents}
      categories={categories ?? []}
    />
  )
}
