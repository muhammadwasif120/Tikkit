import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://www.tikkitx.com'

  const allowPublicRules = [
    '/',
    '/explore',
    '/how-it-works',
    '/corporate',
    '/pulse',
    '/coming-soon',
    '/privacy',
    '/terms',
    '/organizer/',
    '/guest/explore/',
  ]

  const disallowPrivateRules = [
    '/dashboard/',
    '/api/',
    '/auth/',
    '/guest/profile',
    '/guest/settings',
    '/guest/my-events',
    '/staff/',
    '/master/',
    '/register/',
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
