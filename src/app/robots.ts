import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://www.tikkitx.com'

  const allowPublicRules = [
    '/',
    '/explore',
    '/explore/',
    '/how-it-works',
    '/blog',
    '/blog/',
    '/privacy',
    '/terms',
    '/demo',
    '/compare/',
    '/organizer/',
    '/events/',
    '/classes',
    '/spaces',
    '/contact',
    '/pricing',
    '/about',
    '/security',
  ]

  const disallowPrivateRules = [
    '/dashboard/',
    '/api/',
    '/auth/',
    '/guest/',
    '/staff/',
    '/promoter/',
    '/itinerary/',
    '/master/',
  ]

  return {
    rules: [
      {
        userAgent: '*',
        allow: allowPublicRules,
        disallow: disallowPrivateRules,
      },
      // Explicitly call out major LLM web scrapers to ensure they follow our permissions
      {
        userAgent: ['GPTBot', 'ChatGPT-User', 'CCBot', 'anthropic-ai', 'PerplexityBot', 'Applebot-Extended'],
        allow: allowPublicRules,
        disallow: disallowPrivateRules,
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
