// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs'

// DSN read from env, not hardcoded — Sentry.init() is a documented no-op when
// unset, so this ships safely regardless of environment, and the DSN can be
// rotated without a code change.
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,

  // Errors only for now — no performance tracing, to stay well within the
  // free tier and avoid surprise usage as real traffic grows. Raise this
  // later (e.g. 0.1) if request-latency tracing is wanted too.
  tracesSampleRate: 0,

  // Server actions here regularly carry CNIC numbers, phone numbers, and
  // payment-screenshot data in request bodies. httpBodies collects ALL
  // request/response bodies by default with no field-level scrubbing (unlike
  // headers/cookies/query params, which filter sensitive keys automatically)
  // — explicitly disabled. userInfo already defaults to false; set here for
  // clarity, not because the default would otherwise differ.
  dataCollection: {
    userInfo: false,
    httpBodies: [],
  },

  debug: false,
})
