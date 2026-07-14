import * as Sentry from '@sentry/nextjs'

// DSN unset → Sentry.init() is a no-op; nothing is captured, nothing throws.
// This makes the integration safe to ship before a Sentry project exists —
// it activates automatically the moment SENTRY_DSN is set in Vercel.
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,

  // Errors only for now — no performance tracing, to stay well within the
  // free tier and avoid surprise usage. Raise this later if you want
  // request-latency tracing too.
  tracesSampleRate: 0,

  // Full request/response bodies can contain PII (payment screenshots,
  // CNIC numbers) — keep captured request data to headers/URL only.
  sendDefaultPii: false,

  // Quieter local dev output; still fully functional if a DSN is set locally.
  debug: false,
})
