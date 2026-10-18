import type { Metadata } from 'next'
import { ExploreView } from '@/components/explore/ExploreView'
import { CATEGORY_DB_SLUG, titleCase } from '@/lib/exploreContent'
import { createClient } from '@/lib/supabase/server'

export const revalidate = 120
type Props = { params: Promise<{ city: string; category: string }>; searchParams: Promise<{ q?: string; when?: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city, category } = await params
  const [cityName, catName] = [titleCase(city), titleCase(category)]

  // Pages with no live events stay out of the index so thin pages do not hurt ranked ones.
  const supabase = await createClient()
  const { data: cat } = await supabase.from('event_categories').select('id').eq('slug', CATEGORY_DB_SLUG[category] ?? category).maybeSingle()
  const { count } = cat
    ? await supabase.from('event_listings').select('id', { count: 'exact', head: true }).eq('category_id', cat.id).ilike('city', cityName).gte('ends_at', new Date().toISOString())
    : { count: 0 }

  return {
    title: `${catName} Events & Tickets in ${cityName}`,
    description: `Buy tickets for upcoming ${catName.toLowerCase()} events in ${cityName}. Browse exclusive events and reserve your spot on Tikkit.`,
    alternates: { canonical: `https://www.tikkitx.com/explore/${city}/${category}` },
    robots: (count ?? 0) > 0 ? undefined : { index: false, follow: true },
    openGraph: { title: `${catName} Events in ${cityName} | Tikkit`, description: `Secure tickets for ${catName.toLowerCase()} events in ${cityName}.`, url: `https://www.tikkitx.com/explore/${city}/${category}` },
  }
}

export default async function CityCategoryPage({ params, searchParams }: Props) {
  const [{ city, category }, { q, when }] = await Promise.all([params, searchParams])
  const [cityName, catName] = [titleCase(city), titleCase(category)]
  return <ExploreView city={city} category={category} q={q} when={when} heading={`${catName} events in ${cityName}`} breadcrumb={[{ name: 'Explore Events', url: 'https://www.tikkitx.com/explore' }, { name: `Events in ${cityName}`, url: `https://www.tikkitx.com/explore/${city}` }, { name: `${catName} events`, url: `https://www.tikkitx.com/explore/${city}/${category}` }]} />
}
