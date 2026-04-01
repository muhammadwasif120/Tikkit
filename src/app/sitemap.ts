import { MetadataRoute } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'

export const revalidate = 3600 // regenerate hourly

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Canonical www domain — must match the baseUrl in robots.ts and layout metadataBase
  const baseUrl = 'https://www.tikkitx.com'

  // ─── Static routes ────────────────────────────────────────────────────────
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/explore`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/how-it-works`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/corporate`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/pulse`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/coming-soon`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
  ]

  // ─── Dynamic: published public events ─────────────────────────────────────
  // Uses admin client so RLS does not filter out valid published rows.
  // Only emits events with status=published and is_private=false.
  let eventRoutes: MetadataRoute.Sitemap = []
  let organizerRoutes: MetadataRoute.Sitemap = []

  try {
    const admin = createAdminClient()

    const { data: events } = await admin
      .from('events')
      .select('id, slug, date_start, updated_at')
      .eq('status', 'published')
      .eq('is_private', false)
      .gte('date_start', new Date().toISOString())
      .order('date_start', { ascending: true })
      .limit(500)

    eventRoutes = (events ?? []).map((ev: any) => ({
      url: `${baseUrl}/guest/explore/${ev.slug || ev.id}`,
      lastModified: ev.updated_at ? new Date(ev.updated_at) : new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    }))

    // ─── Dynamic: public organizer profiles ─────────────────────────────────
    // Only emit organizers who have set a username (slug).
    const { data: organizers } = await admin
      .from('profiles')
      .select('username, updated_at')
      .eq('role', 'organizer')
      .not('username', 'is', null)
      .neq('username', '')
      .limit(500)

    organizerRoutes = (organizers ?? []).map((org: any) => ({
      url: `${baseUrl}/organizer/${org.username}`,
      lastModified: org.updated_at ? new Date(org.updated_at) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))
  } catch {
    // If DB is unreachable at build time, fall back to static-only sitemap
  }

  return [...staticRoutes, ...eventRoutes, ...organizerRoutes]
}
