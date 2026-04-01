import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://www.tikkitx.com'

  const allowPublicRules = [
    '/',
    '/how-it-works',
    '/corporate',
    '/pulse',
    '/coming-soon',
  ]

  const disallowPrivateRules = [
    '/dashboard/',
    '/api/',
    '/auth/',
    '/guest/',
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
