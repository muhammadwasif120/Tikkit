import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { updateVerificationStatus } from '@/app/actions/verificationActions'
import type { DiditWebhookPayload } from '@/types/verification'

export async function POST(req: NextRequest) {
  const rawBody = await req.text()

  // Verify HMAC-SHA256 signature
  const secret = process.env.DIDIT_WEBHOOK_SECRET
  if (!secret) {
    console.error('didit webhook: missing DIDIT_WEBHOOK_SECRET')
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
  }
  
  const signature = req.headers.get('x-didit-signature') ?? ''
  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex')
    
  if (signature !== expected) {
    console.warn('didit webhook: invalid signature')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let payload: DiditWebhookPayload
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { session_id, status, vendor_data } = payload

  // vendor_data is the user_id we passed when creating the session
  const userId = vendor_data
  if (!userId || !session_id) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  if (status === 'approved') {
    try {
      await updateVerificationStatus({
        userId,
        type: 'id',
        externalId: session_id,
        metadata: {
          document_type: payload.kyc?.document_type ?? 'CNIC',
          liveness_passed: payload.liveness?.passed ?? null,
          webhook_received_at: new Date().toISOString(),
        },
      })
    } catch (err) {
      console.error('didit webhook: updateVerificationStatus failed', err)
      return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
  } else if (status === 'declined' || status === 'expired') {
    // Mark session failed — user will need to retry
    console.warn(`didit webhook: session ${session_id} status=${status} for user ${userId}`)
    // Optionally update verification_session status to 'failed' here
  }

  return NextResponse.json({ received: true })
}
