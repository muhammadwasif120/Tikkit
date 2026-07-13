import { headers } from 'next/headers'

// ─────────────────────────────────────────────────────────────────────────────
// Durable rate limiting (Upstash Redis REST) with an in-memory fallback.
//
// When Redis env vars are present (injected by the Vercel Marketplace Upstash
// integration, or set manually), limits are enforced with a shared fixed-window
// counter that survives serverless cold starts and works across instances.
// When they are absent (e.g. local dev without the vars), we fall back to the
// per-instance in-memory limiter so nothing breaks.
//
// Supports both common env var namings:
//   - Upstash-branded:  UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN
//   - Vercel KV-branded: KV_REST_API_URL / KV_REST_API_TOKEN
// ─────────────────────────────────────────────────────────────────────────────

const REDIS_URL =
  process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || ''
const REDIS_TOKEN =
  process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || ''
const REDIS_ENABLED = Boolean(REDIS_URL && REDIS_TOKEN)

// ─── In-memory fallback ──────────────────────────────────────────────────────
type Bucket = { count: number; resetAt: number }
const store = new Map<string, Bucket>()

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

function checkRateLimitMemory(key: string, limit: number, windowMs: number): boolean {
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

// ─── Durable Upstash Redis limiter (fixed window) ────────────────────────────
async function checkRateLimitRedis(key: string, limit: number, windowMs: number): Promise<boolean> {
  const windowSeconds = Math.max(1, Math.ceil(windowMs / 1000))
  // Bucket the key by window so old counters rotate out and self-expire.
  const windowStart = Math.floor(Date.now() / windowMs)
  const redisKey = `rl:${key}:${windowStart}`

  try {
    // One HTTP round-trip: INCR the counter, and set the TTL only on creation.
    const res = await fetch(`${REDIS_URL}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${REDIS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        ['INCR', redisKey],
        ['EXPIRE', redisKey, String(windowSeconds), 'NX'],
      ]),
      cache: 'no-store',
    })

    // Fail open on limiter/transport errors — rate limiting is defence-in-depth,
    // never the primary auth boundary, so a Redis blip must not lock users out.
    if (!res.ok) return true
    const data = (await res.json()) as Array<{ result?: number; error?: string }>
    const count = data?.[0]?.result
    if (typeof count !== 'number') return true
    return count <= limit
  } catch {
    return true
  }
}

/**
 * Returns true if the request is within the allowed limit.
 * @param key       Unique key (e.g. IP + action)
 * @param limit     Max requests per window
 * @param windowMs  Window duration in ms (default 10 minutes)
 */
export async function checkRateLimit(key: string, limit: number, windowMs = 600_000): Promise<boolean> {
  if (REDIS_ENABLED) return checkRateLimitRedis(key, limit, windowMs)
  return checkRateLimitMemory(key, limit, windowMs)
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
