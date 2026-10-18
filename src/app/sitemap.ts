import { MetadataRoute } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAllPosts } from '@/lib/blog'

export const revalidate = 3600 // regenerate hourly

// Pakistan's major cities — each gets a dedicated SEO landing page
const CITIES = ['lahore', 'karachi', 'islamabad', 'rawalpindi', 'faisalabad', 'peshawar', 'multan', 'quetta']

// Top event categories — must match slugs used in /explore/[city]/[category] routes
const CATEGORIES = ['music', 'tech', 'art', 'sports', 'food', 'wellness', 'business', 'comedy', 'fashion', 'film']

// Competitor comparison pages
const COMPARE_SLUGS = ['tikkit-vs-ticketwala', 'tikkit-vs-bookme']

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.tikkitx.com'
  const now = new Date()

  // ─── Static top-level routes ──────────────────────────────────────────────
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`,            lastModified: now, changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${baseUrl}/explore`,     lastModified: now, changeFrequency: 'daily',   priority: 0.95 },
    { url: `${baseUrl}/how-it-works`,lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/demo`,        lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/pricing`,     lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${baseUrl}/about`,       lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/contact`,     lastModified: now, changeFrequency: 'yearly',  priority: 0.5 },
    { url: `${baseUrl}/security`,    lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/classes`,     lastModified: now, changeFrequency: 'daily',   priority: 0.7 },
    { url: `${baseUrl}/spaces`,      lastModified: now, changeFrequency: 'daily',   priority: 0.7 },
    { url: `${baseUrl}/blog`,        lastModified: now, changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${baseUrl}/privacy`,     lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${baseUrl}/terms`,       lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
  ]

  // ─── Blog articles ────────────────────────────────────────────────────────
  const blogPosts = getAllPosts()
  const blogRoutes: MetadataRoute.Sitemap = [
    // Listing page per category
    ...['how-to', 'pakistan'].map(cat => ({
      url: `${baseUrl}/blog?category=${cat}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
    // Individual articles
    ...blogPosts.map(post => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: new Date(post.updatedAt ?? post.publishedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.75,
    })),
  ]

  // ─── Programmatic city landing pages ─────────────────────────────────────
  // /explore/lahore, /explore/karachi, etc. — high-intent local search traffic
  const cityRoutes: MetadataRoute.Sitemap = CITIES.map(city => ({
    url: `${baseUrl}/explore/${city}`,
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: 0.9,
  }))

  // ─── Programmatic city + category pages ──────────────────────────────────
  // /explore/lahore/music, /explore/karachi/tech, etc. — long-tail SEO goldmine
  const cityCategoryRoutes: MetadataRoute.Sitemap = CITIES.flatMap(city =>
    CATEGORIES.map(cat => ({
      url: `${baseUrl}/explore/${city}/${cat}`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    }))
  )

  // ─── Competitor comparison pages ─────────────────────────────────────────
  const compareRoutes: MetadataRoute.Sitemap = COMPARE_SLUGS.map(slug => ({
    url: `${baseUrl}/compare/${slug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.75,
  }))

  // ─── Dynamic: published events, organizers, classes and spaces ────────────
  let eventRoutes: MetadataRoute.Sitemap = []
  let organizerRoutes: MetadataRoute.Sitemap = []
  let moduleRoutes: MetadataRoute.Sitemap = []

  try {
    const admin = createAdminClient()
    // Public listings view: published, public, live events only. Secret venues stay indexable (only the area is shown).
    const since = new Date(now); since.setMonth(since.getMonth() - 6)
    const { data: events } = await admin.from('event_listings').select('slug, starts_at').gte('ends_at', since.toISOString()).order('starts_at', { ascending: false }).limit(700)
    eventRoutes = (events ?? []).filter(e => e.slug).map(e => {
      const upcoming = new Date(e.starts_at!) >= now
      return { url: `${baseUrl}/events/${e.slug}`, lastModified: now, changeFrequency: upcoming ? 'daily' as const : 'monthly' as const, priority: upcoming ? 0.85 : 0.4 }
    })

    const { data: orgs } = await admin.from('public_organizers').select('username').not('username', 'is', null).limit(500)
    organizerRoutes = (orgs ?? []).filter(o => o.username).map(o => ({ url: `${baseUrl}/organizer/${o.username}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.7 }))

    // Classes and spaces (modules migration). Empty until it is applied.
    const [{ data: classes }, { data: spaces }] = await Promise.all([
      (admin as unknown as { from: (t: string) => { select: (c: string) => PromiseLike<{ data: { slug: string }[] | null }> } }).from('public_class_series').select('slug'),
      (admin as unknown as { from: (t: string) => { select: (c: string) => PromiseLike<{ data: { slug: string }[] | null }> } }).from('public_spaces').select('slug'),
    ])
    moduleRoutes = [
      ...(classes ?? []).map(c => ({ url: `${baseUrl}/classes/${c.slug}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.7 })),
      ...(spaces ?? []).map(c => ({ url: `${baseUrl}/spaces/${c.slug}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.7 })),
    ]
  } catch {
    // If the database is unreachable at build time, fall back to the static sitemap
  }

  return [
    ...staticRoutes,
    ...blogRoutes,
    ...cityRoutes,
    ...cityCategoryRoutes,
    ...compareRoutes,
    ...eventRoutes,
    ...organizerRoutes,
    ...moduleRoutes,
  ]
}
