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
    { url: `${baseUrl}/corporate`,   lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/pulse`,       lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/venue/home`,  lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/venues`,      lastModified: now, changeFrequency: 'weekly',  priority: 0.75 },
    { url: `${baseUrl}/blog`,        lastModified: now, changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${baseUrl}/coming-soon`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${baseUrl}/privacy`,     lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${baseUrl}/terms`,       lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
  ]

  // ─── Blog articles ────────────────────────────────────────────────────────
  const blogPosts = getAllPosts()
  const blogRoutes: MetadataRoute.Sitemap = [
    // Listing page per category
    ...['how-to', 'corporate', 'pulse', 'pakistan'].map(cat => ({
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

  // ─── Dynamic: published events (current + recent past for SEO equity) ─────
  let eventRoutes: MetadataRoute.Sitemap = []
  let pastEventRoutes: MetadataRoute.Sitemap = []
  let organizerRoutes: MetadataRoute.Sitemap = []
  let venueRoutes: MetadataRoute.Sitemap = []

  try {
    const admin = createAdminClient()

    // Six months ago — keep past events for "recap" and historical searches
    const sixMonthsAgo = new Date(now)
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    // Upcoming events — highest priority
    const { data: upcomingEvents } = await admin
      .from('events')
      .select('id, slug, date_start, updated_at')
      .eq('status', 'published')
      .eq('is_private', false)
      .gte('date_start', now.toISOString())
      .order('date_start', { ascending: true })
      .limit(500)

    eventRoutes = (upcomingEvents ?? []).map((ev: any) => ({
      url: `${baseUrl}/guest/explore/${ev.slug || ev.id}`,
      lastModified: ev.updated_at ? new Date(ev.updated_at) : now,
      changeFrequency: 'daily' as const,
      priority: 0.85,
    }))

    // Recent past events — lower priority but still valuable for long-tail
    const { data: pastEvents } = await admin
      .from('events')
      .select('id, slug, date_start, updated_at')
      .eq('status', 'published')
      .eq('is_private', false)
      .gte('date_start', sixMonthsAgo.toISOString())
      .lt('date_start', now.toISOString())
      .order('date_start', { ascending: false })
      .limit(200)

    pastEventRoutes = (pastEvents ?? []).map((ev: any) => ({
      url: `${baseUrl}/guest/explore/${ev.slug || ev.id}`,
      lastModified: ev.updated_at ? new Date(ev.updated_at) : now,
      changeFrequency: 'monthly' as const,
      priority: 0.4,
    }))

    // ─── Public organizer profiles ───────────────────────────────────────────
    const { data: organizers } = await admin
      .from('profiles')
      .select('username, updated_at')
      .eq('role', 'organizer')
      .not('username', 'is', null)
      .neq('username', '')
      .limit(500)

    organizerRoutes = (organizers ?? []).map((org: any) => ({
      url: `${baseUrl}/organizer/${org.username}`,
      lastModified: org.updated_at ? new Date(org.updated_at) : now,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))

    // ─── Public venue pages ──────────────────────────────────────────────────
    const { data: venues } = await (admin as any)
      .from('venues')
      .select('slug, updated_at')
      .eq('active', true)
      .not('slug', 'is', null)
      .limit(500)

    venueRoutes = (venues ?? []).map((v: any) => ({
      url: `${baseUrl}/venue/${v.slug}`,
      lastModified: v.updated_at ? new Date(v.updated_at) : now,
      changeFrequency: 'weekly' as const,
      priority: 0.75,
    }))
  } catch {
    // If DB is unreachable at build time, fall back to static-only sitemap
  }

  return [
    ...staticRoutes,
    ...blogRoutes,
    ...cityRoutes,
    ...cityCategoryRoutes,
    ...compareRoutes,
    ...eventRoutes,
    ...pastEventRoutes,
    ...organizerRoutes,
    ...venueRoutes,
  ]
}
