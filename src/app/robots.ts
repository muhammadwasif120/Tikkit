import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://tikkitx.com'

  const allowPublicRules = [
    '/',
    '/guest/explore',
    '/register/*',
    '/how-it-works',
    '/guest/events',
  ]

  const disallowPrivateRules = [
    '/dashboard/*',
    '/api/*',
    '/auth/*',
    '/guest/profile',
    '/guest/tickets',
    '/staff/*',
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
