import { NextResponse } from 'next/server'

// Diagnostic route only — verifies server-side Sentry capture end-to-end.
// Paired with /sentry-example-page. Safe to keep: throws on every call, does
// nothing else, touches no data.
export async function GET() {
  throw new Error('Sentry Example API Route Error — server-side capture test')
  // eslint-disable-next-line no-unreachable
  return NextResponse.json({ ok: true })
}
