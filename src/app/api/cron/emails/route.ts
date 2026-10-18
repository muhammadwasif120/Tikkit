import { timingSafeEqual } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { processOutbox } from '@/lib/email/outbox'

export const dynamic = 'force-dynamic'

const same = (a: string, b: string) => { const x = Buffer.from(a), y = Buffer.from(b); return x.length === y.length && timingSafeEqual(x, y) }

/** Sends queued emails. Call with `Authorization: Bearer $CRON_SECRET` from a scheduler. */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || !same(req.headers.get('authorization') ?? '', `Bearer ${secret}`)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  return NextResponse.json(await processOutbox())
}
