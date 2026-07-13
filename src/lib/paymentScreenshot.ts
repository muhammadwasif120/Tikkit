import { createAdminClient } from '@/lib/supabase/admin'

// Payment screenshots contain bank/wallet transaction details and personal
// names. The `payment-screenshots` bucket is PRIVATE — nothing reads the stored
// value directly. Instead, server code that has already authorized the viewer
// (the event's organizer, an admin, or the owning guest) calls
// signPaymentScreenshot() to mint a short-lived signed URL for display.
//
// SERVER-ONLY: this imports the service-role client. Never import from a
// client component.

const BUCKET = 'payment-screenshots'
const SIGNED_TTL_SECONDS = 60 * 60 // 1 hour — page is re-rendered on each load

/**
 * Extract the in-bucket object key from a stored reference, which may be either
 * a legacy public URL (…/object/public/payment-screenshots/<key>) or a bare
 * object key (what we store going forward). Returns null for unrecognised URLs.
 */
function extractKey(stored: string): string | null {
  const publicMarker = `/object/public/${BUCKET}/`
  const signMarker = `/object/sign/${BUCKET}/`
  for (const marker of [publicMarker, signMarker]) {
    const idx = stored.indexOf(marker)
    if (idx !== -1) return stored.slice(idx + marker.length).split('?')[0]
  }
  // Not a Supabase storage URL we recognise → treat as a raw object key,
  // unless it's some other absolute URL (in which case refuse).
  if (/^https?:\/\//i.test(stored)) return null
  return stored.replace(/^\/+/, '')
}

/**
 * Resolve a stored payment-screenshot reference to a short-lived signed URL.
 *
 * The caller MUST have already verified the viewer is allowed to see this
 * screenshot. Returns null on any failure so the UI shows no image rather than
 * a broken/leaking link.
 */
export async function signPaymentScreenshot(
  stored: string | null | undefined
): Promise<string | null> {
  if (!stored) return null
  const key = extractKey(stored)
  if (!key) return null
  try {
    const admin = createAdminClient()
    const { data, error } = await admin.storage
      .from(BUCKET)
      .createSignedUrl(key, SIGNED_TTL_SECONDS)
    if (error || !data?.signedUrl) return null
    return data.signedUrl
  } catch {
    return null
  }
}
