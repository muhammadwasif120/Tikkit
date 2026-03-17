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

  // Fetch all active public events
  const { data: events } = await supabase
    .from('events')
    .select('id, updated_at')
    .eq('status', 'published')
    .eq('is_private', false)
    .not('registration_mode', 'eq', 'invite_only')

  const dynamicRoutes: MetadataRoute.Sitemap = (events || []).flatMap((event) => {
    return [
      {
        url: `${baseUrl}/guest/explore/${event.id}`,
        lastModified: new Date(event.updated_at || Date.now()),
        changeFrequency: 'daily',
        priority: 0.8,
      },
      {
        url: `${baseUrl}/register/${event.id}`,
        lastModified: new Date(event.updated_at || Date.now()),
        changeFrequency: 'daily',
        priority: 0.8,
      },
    ]
  })

  return [...staticRoutes, ...dynamicRoutes]
}
