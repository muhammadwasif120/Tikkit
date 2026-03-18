import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import PublicExploreClient from '@/components/public/PublicExploreClient'

export const revalidate = 120 // re-fetch every 2 minutes

export default async function ExplorePage() {
  const supabase = await createClient()
  const admin = createAdminClient()

  // Fire auth check, events, and categories all in parallel
  const [
    { data: { user } },
    { data: rawEvents },
    { data: categories },
  ] = await Promise.all([
    supabase.auth.getUser(),
    admin
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
      .limit(50),
    admin
      .from('event_categories')
      .select('id, name, icon, color')
      .order('name', { ascending: true }),
  ])

  // Redirect logged-in users to their correct home
  if (user) {
    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', user.id).single()
    const role = (profile as any)?.role ?? 'guest'
    redirect(role === 'guest' ? '/guest/explore' : '/dashboard')
  }

  // Batch registration counts (depends on events result — unavoidable)
  let regCounts: Record<string, number> = {}
  const events = rawEvents ?? []
  if (events.length > 0) {
    const { data: regRows } = await admin
      .from('public_registrations')
      .select('event_id')
      .in('event_id', events.map((e: any) => e.id))
      .neq('status', 'rejected')

    for (const row of regRows ?? []) {
      regCounts[row.event_id] = (regCounts[row.event_id] ?? 0) + 1
    }
  }

  const enrichedEvents = events.map((e: any) => ({
    ...e,
    registered_count: regCounts[e.id] ?? 0,
  }))

  return (
    <PublicExploreClient
      events={enrichedEvents}
      categories={categories ?? []}
    />
  )
}
