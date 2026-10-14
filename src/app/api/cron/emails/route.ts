import { NextRequest, NextResponse } from 'next/server'
import { processOutbox } from '@/lib/email/outbox'

export const dynamic = 'force-dynamic'

/** Sends queued emails. Call with `Authorization: Bearer $CRON_SECRET` from a scheduler. */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  return NextResponse.json(await processOutbox())
}
