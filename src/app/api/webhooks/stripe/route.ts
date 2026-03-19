import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { updateVerificationStatus } from '@/app/actions/verificationActions'

// Must use raw body for Stripe webhook signature verification
export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const sig = req.headers.get('stripe-signature') ?? ''
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    console.error('stripe webhook: STRIPE_WEBHOOK_SECRET not set')
    return NextResponse.json({ error: 'Misconfigured' }, { status: 500 })
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-02-25.clover',
  })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)
  } catch (err: any) {
    console.warn('stripe webhook: signature verification failed', err.message)
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object as Stripe.PaymentIntent
    const userId = pi.metadata?.user_id
    const paymentMethodId = typeof pi.payment_method === 'string'
      ? pi.payment_method
      : pi.payment_method?.id ?? pi.id

    if (!userId) {
      console.error('stripe webhook: payment_intent has no user_id metadata')
      return NextResponse.json({ error: 'Missing user_id in metadata' }, { status: 400 })
    }

    try {
      await updateVerificationStatus({
        userId,
        type: 'payment',
        externalId: paymentMethodId,
        metadata: {
          payment_intent_id: pi.id,
          amount: pi.amount,
          currency: pi.currency,
          webhook_received_at: new Date().toISOString(),
        },
      })
      console.log(`stripe webhook: user ${userId} payment verified ✓`)
    } catch (err) {
      console.error('stripe webhook: updateVerificationStatus failed', err)
      return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
  } else if (event.type === 'payment_intent.payment_failed') {
    const pi = event.data.object as Stripe.PaymentIntent
    console.warn(`stripe webhook: payment failed for intent ${pi.id} user=${pi.metadata?.user_id}`)
  }

  return NextResponse.json({ received: true })
}
