import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient()

  // Base URL
  const baseUrl = 'https://tikkitx.com'

  // Static public routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/guest/explore`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/how-it-works`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ]

  // Fetch all active public events — include slug for SEO-friendly URLs
  const { data: events } = await supabase
    .from('events')
    .select('id, slug, updated_at')
    .eq('status', 'published')
    .eq('is_private', false)
    .not('registration_mode', 'eq', 'invite_only')

  const dynamicRoutes: MetadataRoute.Sitemap = (events || []).flatMap((event) => {
    const slugOrId = (event as any).slug || event.id
    const lastMod = new Date((event as any).updated_at || Date.now())
    return [
      {
        url: `${baseUrl}/guest/explore/${slugOrId}`,
        lastModified: lastMod,
        changeFrequency: 'daily' as const,
        priority: 0.8,
      },
      {
        url: `${baseUrl}/register/${event.id}`,
        lastModified: lastMod,
        changeFrequency: 'daily' as const,
        priority: 0.8,
      },
    ]
  })

  return [...staticRoutes, ...dynamicRoutes]
}
