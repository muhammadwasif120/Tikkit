'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { VerifiedProfile } from '@/types/verification'

// ─── Didit helpers ────────────────────────────────────────────────

async function createDiditSession(userId: string): Promise<{
  sessionId: string
  sessionUrl: string
} | null> {
  const clientId = process.env.DIDIT_CLIENT_ID
  const clientSecret = process.env.DIDIT_CLIENT_SECRET

  if (!clientId || !clientSecret) return null

  // 1. Get access token
  const tokenRes = await fetch('https://apx.didit.me/auth/v2/token/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    }),
  })

  if (!tokenRes.ok) {
    console.error('Didit token error:', await tokenRes.text())
    return null
  }

  const { access_token } = await tokenRes.json()

  // 2. Create verification session
  const sessionRes = await fetch('https://apx.didit.me/v2/session/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${access_token}`,
    },
    body: JSON.stringify({
      vendor_data: userId,          // echoed back in webhook payload
      callback: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/didit`,
      features: 'OCR + FACE',       // CNIC OCR + passive liveness
      document_country: 'PK',       // Pakistan CNIC
    }),
  })

  if (!sessionRes.ok) {
    console.error('Didit session error:', await sessionRes.text())
    return null
  }

  const data = await sessionRes.json()
  return { sessionId: data.session_id, sessionUrl: data.session_url }
}

// ─── Stripe helpers ───────────────────────────────────────────────

async function createStripePaymentIntent(userId: string): Promise<{
  clientSecret: string
  paymentIntentId: string
} | null> {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) return null

  const res = await fetch('https://api.stripe.com/v1/payment_intents', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      amount: '500',             // PKR 500 sign-up fee (in paisas for PKR = 500 × 100)
      currency: 'pkr',
      'automatic_payment_methods[enabled]': 'true',
      'metadata[user_id]': userId,
      'metadata[purpose]': 'tikkit_signup_verification',
    }),
  })

  if (!res.ok) {
    console.error('Stripe PaymentIntent error:', await res.text())
    return null
  }

  const pi = await res.json()
  return { clientSecret: pi.client_secret, paymentIntentId: pi.id }
}

// ─── Public server actions ────────────────────────────────────────

/**
 * Initiates a dual verification flow:
 * 1. Creates a Didit session (ID + liveness)
 * 2. Creates a Stripe PaymentIntent (signup fee)
 * Returns URLs/secrets needed by the client.
 */
export async function initiateVerification(): Promise<{
  diditSessionUrl?: string
  stripeClientSecret?: string
  sessionId?: string
  error?: string
}> {
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Check if already verified
  const { data: profile } = await (admin as any)
    .from('profiles')
    .select('is_id_verified, is_payment_verified')
    .eq('id', user.id)
    .single()

  if (profile?.is_id_verified && profile?.is_payment_verified) {
    return { error: 'Already fully verified' }
  }

  // Check for an existing pending session
  const { data: existing } = await (admin as any)
    .from('verification_sessions')
    .select('*')
    .eq('user_id', user.id)
    .in('status', ['pending', 'id_complete', 'payment_complete'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (existing) {
    // Resume existing session if it's still valid
    const [diditResult, stripeResult] = await Promise.all([
      !profile?.is_id_verified ? createDiditSession(user.id) : null,
      !profile?.is_payment_verified ? createStripePaymentIntent(user.id) : null,
    ])
    return {
      diditSessionUrl: diditResult?.sessionUrl,
      stripeClientSecret: stripeResult?.clientSecret,
      sessionId: existing.id,
    }
  }

  // Create Didit + Stripe in parallel
  const [diditResult, stripeResult] = await Promise.all([
    createDiditSession(user.id),
    createStripePaymentIntent(user.id),
  ])

  // Persist session record
  const { data: session, error: sessionErr } = await (admin as any)
    .from('verification_sessions')
    .insert({
      user_id: user.id,
      didit_session_id: diditResult?.sessionId ?? null,
      stripe_payment_intent_id: stripeResult?.paymentIntentId ?? null,
      status: 'pending',
    })
    .select('id')
    .single()

  if (sessionErr) {
    console.error('initiateVerification session insert:', sessionErr)
    return { error: 'Failed to create verification session' }
  }

  return {
    diditSessionUrl: diditResult?.sessionUrl,
    stripeClientSecret: stripeResult?.clientSecret,
    sessionId: session?.id,
  }
}

/**
 * Called by webhook handlers to update verification status.
 * When both ID + payment are verified, awards +150 social_score (once only).
 */
export async function updateVerificationStatus(params: {
  userId: string
  type: 'id' | 'payment'
  externalId: string
  metadata?: Record<string, unknown>
}): Promise<void> {
  const admin = createAdminClient()
  const { userId, type, externalId, metadata = {} } = params

  const field = type === 'id' ? 'is_id_verified' : 'is_payment_verified'
  const idField = type === 'id' ? 'didit_verification_id' : 'payment_method_token'

  // Update profile field
  await (admin as any)
    .from('profiles')
    .update({ [field]: true, [idField]: externalId })
    .eq('id', userId)

  // Update verification_session status
  const newStatus = type === 'id' ? 'id_complete' : 'payment_complete'
  await (admin as any)
    .from('verification_sessions')
    .update({ status: newStatus })
    .eq('user_id', userId)
    .in('status', ['pending', 'id_complete', 'payment_complete'])

  // Check if both are now verified → award social_score (idempotent)
  const { data: profile } = await (admin as any)
    .from('profiles')
    .select('is_id_verified, is_payment_verified, social_score')
    .eq('id', userId)
    .single()

  if (profile?.is_id_verified && profile?.is_payment_verified) {
    // Only award once (guard: score was 0 before; this is the triple-verified boost)
    const alreadyAwarded = profile.social_score >= 150
    if (!alreadyAwarded) {
      await (admin as any)
        .from('profiles')
        .update({ social_score: profile.social_score + 150 })
        .eq('id', userId)
    }

    // Mark session as fully_verified
    await (admin as any)
      .from('verification_sessions')
      .update({ status: 'fully_verified' })
      .eq('user_id', userId)
      .in('status', ['id_complete', 'payment_complete'])
  }
}

/**
 * Fetch current verification status for the authenticated user.
 */
export async function getVerificationStatus(): Promise<VerifiedProfile | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await (supabase as any)
    .from('profiles')
    .select('id, full_name, email, is_id_verified, is_payment_verified, didit_verification_id, payment_method_token, social_score')
    .eq('id', user.id)
    .single()

  return data as VerifiedProfile | null
}
