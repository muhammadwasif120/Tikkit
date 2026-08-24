import * as Sentry from '@sentry/react-native'

// Crash / error observability for the native app — mirrors the web app's
// instrumentation-client.ts pattern. No-op until EXPO_PUBLIC_SENTRY_DSN is
// set (a Sentry DSN is meant to be public/write-only, same as the Supabase
// anon key, so EXPO_PUBLIC_* is the right prefix here).
const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN

Sentry.init({
  dsn,
  enabled: !!dsn,
  debug: false,
  environment: __DEV__ ? 'development' : 'production',
  tracesSampleRate: 0,
  sendDefaultPii: false,
})

export { Sentry }
