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

  // Third-party noise, not app bugs — comes from the host app's own injected
  // code when the site is opened inside an in-app browser (e.g. a
  // link-in-bio click from Instagram/Facebook), not from anything we ship.
  // Confirmed from a real production event: Instagram's in-app-browser
  // bridge script (sendDataToNative / sendPageHideMessage in the stack, but
  // ignoreErrors matches on the exception message, not stack frames) throwing
  // when its own native message-handler bridge isn't present. Unactionable —
  // filtered so it doesn't consume error quota or dilute real signal.
  ignoreErrors: [
    /window\.webkit\.messageHandlers/,
  ],
})

// Required by the SDK to instrument App Router client-side navigations.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
