import * as Sentry from '@sentry/nextjs'

// Browser-side error capture. NEXT_PUBLIC_ prefix so the DSN reaches the
// client bundle — a Sentry DSN is meant to be public (write-only), same as
// how Supabase's anon key is public. No-op until the env var is set.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV,
  tracesSampleRate: 0,
  // userInfo already defaults to false; httpBodies isn't applicable client-side
  // (no server request/response bodies to capture here) but set for parity
  // with the server/edge configs.
  dataCollection: {
    userInfo: false,
    httpBodies: [],
  },
  debug: false,
})

// Required by the SDK to instrument App Router client-side navigations.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
