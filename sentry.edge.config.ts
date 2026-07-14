import * as Sentry from '@sentry/nextjs'

// Covers middleware.ts and any edge-runtime routes. Same no-op-when-unset
// behaviour as sentry.server.config.ts.
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
  tracesSampleRate: 0,
  sendDefaultPii: false,
  debug: false,
})
