import { NextRequest, NextResponse } from 'next/server'
import { updateVerificationStatus } from '@/app/actions/verificationActions'
import type { PayProWebhookPayload } from '@/types/verification'

/**
 * PayPro IPN (Instant Payment Notification) webhook.
 * PayPro POSTs form-encoded or JSON data to this endpoint after payment.
 *
 * BillReference format: "TKT-VRF-{userId[:20]}-{timestamp}"
 * We parse userId from BillReference to route the verification update.
 *
 * Security: set PAYPRO_WEBHOOK_SECRET in Vercel env vars and configure the
 * same value as a custom header (x-paypro-secret) in the PayPro merchant
 * dashboard IPN settings. If the env var is set, any request missing or
 * mismatching the header is rejected before touching the DB.
 */
export async function POST(req: NextRequest) {
  // Pre-shared secret guard — prevents forged IPN calls from marking
  // payments as verified without a real PayPro transaction.
  const webhookSecret = process.env.PAYPRO_WEBHOOK_SECRET
  if (webhookSecret) {
    const provided = req.headers.get('x-paypro-secret')
    if (provided !== webhookSecret) {
      console.warn('paypro webhook: invalid or missing x-paypro-secret header')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  } else {
    console.warn('paypro webhook: PAYPRO_WEBHOOK_SECRET is not set — webhook is unauthenticated')
  }

  let payload: PayProWebhookPayload

  // PayPro sends application/x-www-form-urlencoded or JSON — handle both
  const contentType = req.headers.get('content-type') ?? ''
  try {
    if (contentType.includes('application/json')) {
      payload = await req.json()
    } else {
      const text = await req.text()
      const params = new URLSearchParams(text)
      payload = Object.fromEntries(params.entries()) as unknown as PayProWebhookPayload
    }
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const { BillReference, Status, TransactionID, Amount, PaymentMode } = payload

  if (!BillReference) {
    return NextResponse.json({ error: 'Missing BillReference' }, { status: 400 })
  }

  // Parse userId from BillReference: "TKT-VRF-{userId[:20]}-{timestamp}"
  // Format: TKT-VRF-<20-char-userId-prefix>-<timestamp>
  const parts = BillReference.split('-')
  // ["TKT", "VRF", <userId_part>, <timestamp>]
  if (parts.length < 4 || parts[0] !== 'TKT' || parts[1] !== 'VRF') {
    console.warn('paypro webhook: unrecognised BillReference format:', BillReference)
    return NextResponse.json({ error: 'Invalid BillReference format' }, { status: 400 })
  }

  // userId was sliced to 20 chars — we need the full ID from DB
  // Use the partial userId to look up in verification_sessions by paypro_order_id
  const { createAdminClient } = await import('@/lib/supabase/admin')
  const admin = createAdminClient()

  const { data: session } = await (admin as any)
    .from('verification_sessions')
    .select('user_id')
    .eq('paypro_order_id', BillReference)
    .single()

  if (!session?.user_id) {
    console.warn('paypro webhook: no session found for BillReference:', BillReference)
    // Return 200 to stop PayPro retrying — log only
    return NextResponse.json({ received: true })
  }

  const userId = session.user_id
  const normalizedStatus = (Status ?? '').toLowerCase()

  if (normalizedStatus === 'paid' || normalizedStatus === '1' || normalizedStatus === 'true') {
    try {
      await updateVerificationStatus({
        userId,
        type: 'payment',
        externalId: TransactionID ?? BillReference,
        metadata: {
          amount: Amount,
          payment_mode: PaymentMode ?? 'unknown',
          bill_reference: BillReference,
          webhook_received_at: new Date().toISOString(),
        },
      })
    } catch (err) {
      console.error('paypro webhook: updateVerificationStatus failed', err)
      return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
  } else {
    console.warn(`paypro webhook: payment not successful. Status="${Status}" BillRef="${BillReference}"`)
  }

  // PayPro expects a 200 OK response
  return NextResponse.json({ received: true })
}
