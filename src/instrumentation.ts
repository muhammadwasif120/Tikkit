import * as Sentry from '@sentry/nextjs'

// Registers Sentry for the server and edge runtimes. Runs once per server
// instance at boot. If SENTRY_DSN is unset, Sentry.init() is a documented
// no-op — nothing is captured or sent, and nothing throws. Safe to deploy
// before a Sentry project exists.
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../sentry.server.config')
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config')
  }
}

export const onRequestError = Sentry.captureRequestError
