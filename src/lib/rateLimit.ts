import { headers } from 'next/headers'

type Bucket = { count: number; resetAt: number }

// In-memory store — resets per serverless instance. Provides basic abuse
// prevention within a single warm instance.
// TODO(H8): Replace with Upstash Redis (https://upstash.com) or Vercel KV for
// persistent, cross-instance rate limiting on serverless deployments. The
// current implementation is bypassed whenever a new cold-start spins up.
const store = new Map<string, Bucket>()

// Periodically prune expired entries to avoid unbounded growth
const PRUNE_INTERVAL = 60_000
let lastPrune = Date.now()
function maybePrune() {
  const now = Date.now()
  if (now - lastPrune < PRUNE_INTERVAL) return
  lastPrune = now
  for (const [key, bucket] of store) {
    if (now > bucket.resetAt) store.delete(key)
  }
}

/**
 * Returns true if the request is within the allowed limit.
 * @param key    Unique key (e.g. IP + action)
 * @param limit  Max requests per window
 * @param windowMs  Window duration in ms (default 10 minutes)
 */
export function checkRateLimit(key: string, limit: number, windowMs = 600_000): boolean {
  maybePrune()
  const now = Date.now()
  const bucket = store.get(key)
  if (!bucket || now > bucket.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (bucket.count >= limit) return false
  bucket.count++
  return true
}

/**
 * Reads the client IP from Next.js request headers.
 * Returns 'unknown' if IP cannot be determined.
 */
export async function getClientIp(): Promise<string> {
  const headerStore = await headers()
  return (
    headerStore.get('x-forwarded-for')?.split(',')[0].trim() ??
    headerStore.get('x-real-ip') ??
    'unknown'
  )
}
