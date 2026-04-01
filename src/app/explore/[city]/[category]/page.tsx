import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import PublicExploreClient from '@/components/public/PublicExploreClient'

export const revalidate = 120 

type Props = {
  params: Promise<{ city: string; category: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params
  const cityStr = resolvedParams.city
  const catStr = resolvedParams.category
  
  const formattedCity = cityStr.charAt(0).toUpperCase() + cityStr.slice(1).replace(/-/g, ' ')
  const formattedCat = catStr.charAt(0).toUpperCase() + catStr.slice(1).replace(/-/g, ' ')
  
  return {
    title: `${formattedCat} in ${formattedCity} | Tickets & Events | Tikkit`,
    description: `Buy tickets for upcoming ${formattedCat.toLowerCase()} in ${formattedCity}. Browse the best exclusive events and reserve your spot on Tikkit.`,
    alternates: { canonical: `https://www.tikkitx.com/explore/${cityStr}/${catStr}` },
    openGraph: {
      title: `${formattedCat} Events in ${formattedCity} | Tikkit`,
      description: `Secure tickets for ${formattedCat.toLowerCase()} events in ${formattedCity}.`,
      url: `https://www.tikkitx.com/explore/${cityStr}/${catStr}`,
    },
  }
}

export default async function CityCategoryExplorePage({ params }: Props) {
  const resolvedParams = await params
  const city = resolvedParams.city.replace(/-/g, ' ')
  const categorySlug = resolvedParams.category.replace(/-/g, ' ')

  const supabase = await createClient()
  const admin = createAdminClient()

  // Find category ID based on name match
  const { data: categories } = await admin
    .from('event_categories')
    .select('id, name, icon, color')
    .order('name', { ascending: true })
    
  const targetCat = categories?.find(c => c.name.toLowerCase() === categorySlug.toLowerCase())

  const [
    { data: { user } },
    { data: rawEvents },
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
      .eq(targetCat ? 'category_id' : 'id', targetCat ? targetCat.id : '00000000-0000-0000-0000-000000000000') // hack to return 0 if cat not found
      .gte('date_start', new Date().toISOString())
      .or(`venue_name.ilike.%${city}%,title.ilike.%${city}%`)
      .order('date_start', { ascending: true })
      .limit(50),
  ])

  if (user) {
    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', user.id).single()
    const role = (profile as any)?.role ?? 'guest'
    redirect(role === 'guest' ? `/guest/explore` : '/dashboard')
  }

  const regCounts: Record<string, number> = {}
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

  const catName = targetCat ? targetCat.name : categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1)
  const cityName = city.charAt(0).toUpperCase() + city.slice(1)

  return (
    <PublicExploreClient
      events={enrichedEvents}
      categories={categories ?? []}
      titleOverride={`${catName} in ${cityName}`}
    />
  )
}
