// This file configures the initialization of Sentry for edge features
// (middleware.ts, edge routes). Required when running locally too.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs'

// Same reasoning as sentry.server.config.ts — DSN from env, errors only,
// request bodies excluded (middleware sees every request, including ones
// carrying auth/registration payloads).
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
  tracesSampleRate: 0,
  dataCollection: {
    userInfo: false,
    httpBodies: [],
  },
  debug: false,
})
