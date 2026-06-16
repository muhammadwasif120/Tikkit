import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import VenuePublicClient from '@/components/venue/public/VenuePublicClient'

export default async function VenuePublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  let userProfile: { name?: string; phone?: string } | null = null
  if (user) {
    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('full_name, phone')
      .eq('id', user.id)
      .single()
    if (profile) userProfile = { name: profile.full_name, phone: profile.phone }
  }

  const { data: venue } = await (supabase as any)
    .from('venues')
    .select(`
      id, name, slug, city, address, categories, description,
      photos, instagram, website, phone, capacity, verified, created_at
    `)
    .eq('slug', slug)
    .eq('active', true)
    .single()

  if (!venue) notFound()

  const today = new Date().toISOString().slice(0, 10)
  const in60days = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  const [{ data: programmes }, { data: resources }, { data: instances }] = await Promise.all([
    (supabase as any)
      .from('programmes')
      .select('id, title, description, category, rrule, start_time, duration_mins, capacity, price, tags, cover_image')
      .eq('venue_id', venue.id)
      .eq('active', true),
    (supabase as any)
      .from('resources')
      .select('id, name, description, resource_type, duration_unit_mins, price_per_slot, open_time, close_time, capacity')
      .eq('venue_id', venue.id)
      .eq('active', true),
    (supabase as any)
      .from('programme_instances')
      .select('id, programme_id, date, status')
      .in('programme_id', [])  // populated below
      .gte('date', today)
      .lte('date', in60days)
      .eq('status', 'scheduled')
      .order('date', { ascending: true }),
  ])

  // Re-fetch instances with actual programme ids
  const progIds = (programmes ?? []).map((p: any) => p.id)
  const { data: upcomingInstances } = progIds.length > 0
    ? await (supabase as any)
        .from('programme_instances')
        .select('id, programme_id, date, status')
        .in('programme_id', progIds)
        .gte('date', today)
        .lte('date', in60days)
        .eq('status', 'scheduled')
        .order('date', { ascending: true })
        .limit(30)
    : { data: [] }

  return (
    <VenuePublicClient
      venue={venue}
      programmes={programmes ?? []}
      resources={resources ?? []}
      upcomingInstances={upcomingInstances ?? []}
      userProfile={userProfile}
    />
  )
}
