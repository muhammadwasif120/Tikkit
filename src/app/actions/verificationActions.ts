'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { VerifiedProfile, PayProOrderResponse } from '@/types/verification'

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
      vendor_data: userId,
      callback: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/didit`,
      features: 'OCR + FACE',
      document_country: 'PK',
    }),
  })

  if (!sessionRes.ok) {
    console.error('Didit session error:', await sessionRes.text())
    return null
  }

  const data = await sessionRes.json()
  return { sessionId: data.session_id, sessionUrl: data.session_url }
}

// ─── PayPro helpers ───────────────────────────────────────────────

/**
 * Creates a PayPro order and returns the Click2Pay payment URL.
 * Docs: https://docs.paypro.com.pk
 * BillReference encodes the userId so the IPN webhook can route it back.
 */
async function createPayProOrder(userId: string): Promise<{
  paymentUrl: string
  orderId: string
} | null> {
  const apiKey = process.env.PAYPRO_API_KEY
  const merchantId = process.env.PAYPRO_MERCHANT_ID
  const storeId = process.env.PAYPRO_STORE_ID

  if (!apiKey || !merchantId || !storeId) {
    console.error('PayPro env vars missing: PAYPRO_API_KEY, PAYPRO_MERCHANT_ID, PAYPRO_STORE_ID')
    return null
  }

  // BillReference: encode userId for routing in IPN — max 50 chars
  const orderId = `TKT-VRF-${userId.slice(0, 20)}-${Date.now()}`

  // Bill dates: today + 3 days expiry
  const today = new Date()
  const expiry = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000)
  const fmt = (d: Date) => d.toISOString().slice(0, 10)  // YYYY-MM-DD

  const payload = {
    MerchantId: merchantId,
    StoreId: storeId,
    MerchantName: 'Tikkit X',
    MerchantEmailAddress: process.env.PAYPRO_MERCHANT_EMAIL ?? 'payments@tikkit.pk',
    MerchantPhoneNumber: process.env.PAYPRO_MERCHANT_PHONE ?? '03000000000',
    MerchantProductInformation: 'Tikkit X — Organizer Verification Fee',
    RedirectURL: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/verify?payment=success`,
    CancelURL: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/verify?payment=cancelled`,
    NotificationURL: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/paypro`,
    BillReference: orderId,
    Amount: '500',
    BillDate: fmt(today),
    BillExpiryDate: fmt(expiry),
    EnabledPaymentMethods: '1',    // all methods (JazzCash, EasyPaisa, Card, Bank)
  }

  try {
    const res = await fetch('https://api.paypro.com.pk/v2/ppro/oms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: apiKey,
      },
      body: JSON.stringify([payload]),   // PayPro expects array
    })

    if (!res.ok) {
      console.error('PayPro order error:', res.status, await res.text())
      return null
    }

    const data: PayProOrderResponse[] = await res.json()
    const result = data[0]

    if (result?.ResponseCode !== '00' || !result['Click2Pay URL']) {
      console.error('PayPro order failed:', result?.Message)
      return null
    }

    return { paymentUrl: result['Click2Pay URL'], orderId }
  } catch (err) {
    console.error('PayPro order exception:', err)
    return null
  }
}

// ─── Public server actions ────────────────────────────────────────

/**
 * Initiates a dual verification flow:
 * 1. Creates a Didit session (CNIC OCR + liveness)
 * 2. Creates a PayPro order (PKR 500 signup fee)
 * Returns URLs needed by the client.
 */
export async function initiateVerification(): Promise<{
  diditSessionUrl?: string
  payproPaymentUrl?: string
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

  // Create Didit + PayPro in parallel
  const [diditResult, payproResult] = await Promise.all([
    !profile?.is_id_verified ? createDiditSession(user.id) : null,
    !profile?.is_payment_verified ? createPayProOrder(user.id) : null,
  ])

  // Persist / upsert session record
  const { data: session, error: sessionErr } = await (admin as any)
    .from('verification_sessions')
    .upsert(
      {
        user_id: user.id,
        didit_session_id: diditResult?.sessionId ?? null,
        paypro_order_id: payproResult?.orderId ?? null,
        status: 'pending',
      },
      { onConflict: 'user_id', ignoreDuplicates: false }
    )
    .select('id')
    .single()

  if (sessionErr) {
    console.error('initiateVerification session upsert:', sessionErr)
    return { error: 'Failed to create verification session' }
  }

  return {
    diditSessionUrl: diditResult?.sessionUrl,
    payproPaymentUrl: payproResult?.paymentUrl,
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
  const { userId, type, externalId } = params

  const field = type === 'id' ? 'is_id_verified' : 'is_payment_verified'
  const idField = type === 'id' ? 'didit_verification_id' : 'payment_method_token'

  await (admin as any)
    .from('profiles')
    .update({ [field]: true, [idField]: externalId })
    .eq('id', userId)

  const newStatus = type === 'id' ? 'id_complete' : 'payment_complete'
  await (admin as any)
    .from('verification_sessions')
    .update({ status: newStatus })
    .eq('user_id', userId)
    .in('status', ['pending', 'id_complete', 'payment_complete'])

  // Check if both verified → award +150 social_score (idempotent)
  const { data: updated } = await (admin as any)
    .from('profiles')
    .select('is_id_verified, is_payment_verified, social_score')
    .eq('id', userId)
    .single()

  if (updated?.is_id_verified && updated?.is_payment_verified) {
    if (updated.social_score < 150) {
      await (admin as any)
        .from('profiles')
        .update({ social_score: updated.social_score + 150 })
        .eq('id', userId)
    }
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
