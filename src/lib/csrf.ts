import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_ORIGINS = [
  'https://www.tikkitx.com',
  'https://tikkitx.com',
  ...(process.env.NEXT_PUBLIC_APP_URL ? [process.env.NEXT_PUBLIC_APP_URL] : []),
]

/**
 * Verifies the request origin matches an allowed domain.
 * Returns a 403 NextResponse if the origin is disallowed, or null if OK.
 *
 * Requests with no Origin header are allowed — browsers omit it on same-origin
 * navigations and some legitimate server-to-server calls.
 */
export function verifyCsrfOrigin(req: NextRequest): NextResponse | null {
  const origin = req.headers.get('origin')
  if (!origin) return null // same-origin or non-browser caller — allow

  const isLocalhost = origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')
  const isAllowed = isLocalhost || ALLOWED_ORIGINS.includes(origin)

  if (!isAllowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return null
}
