import { withSentryConfig } from '@sentry/nextjs'

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Type errors now fail the build. Keep the schema types current
    // (supabase gen types typescript --linked --schema public) so this stays green.
    ignoreBuildErrors: false,
  },
  // Remove the X-Powered-By: Next.js header — no reason to advertise the stack
  poweredByHeader: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'eyelcvclqzxhaaxyvgfu.supabase.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'tikkitx.com' }],
        destination: 'https://www.tikkitx.com/:path*',
        permanent: true,
      },
    ]
  },
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(self), microphone=(), geolocation=(), payment=()',
          },
          {
            // HSTS — Vercel also sets this, but belt-and-braces at app level
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ]
  },
}

export default withSentryConfig(nextConfig, {
  // Only used for source-map upload, which needs an org/project + auth
  // token. All three are optional — without them the plugin skips upload
  // (with a warning, not a build failure) rather than blocking the build.
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,

  silent: true, // suppress Sentry CLI build logs

  webpack: {
    treeshake: { removeDebugLogging: true }, // strip Sentry's internal debug logging from the client bundle
  },

  // Don't proxy client-side Sentry requests through a first-party route —
  // keeps this initial rollout simple; revisit if ad-blockers turn out to
  // meaningfully suppress error reporting.
  tunnelRoute: undefined,

  // Next.js sets NEXT_PUBLIC_ vars at build time; the client init file reads
  // NEXT_PUBLIC_SENTRY_DSN directly rather than needing this wrapper to
  // inject anything extra.
  widenClientFileUpload: false,
})
