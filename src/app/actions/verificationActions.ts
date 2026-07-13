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

// ─── Public server actions ────────────────────────────────────────

/**
 * Initiates a Didit ID verification session (CNIC OCR + liveness).
 * Returns the session URL the client redirects the user to.
 */
export async function initiateVerification(): Promise<{
  diditSessionUrl?: string
  sessionId?: string
  error?: string
}> {
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: profile } = await (admin as any)
    .from('profiles')
    .select('is_id_verified')
    .eq('id', user.id)
    .single()

  if (profile?.is_id_verified) {
    return { error: 'Already verified' }
  }

  const diditResult = await createDiditSession(user.id)

  const { data: session, error: sessionErr } = await (admin as any)
    .from('verification_sessions')
    .upsert(
      {
        user_id: user.id,
        didit_session_id: diditResult?.sessionId ?? null,
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
  const sessionCol = 'didit_session_id'

  // Security Fix: Prevent race conditions by strictly correlating the external session ID
  const { data: activeSession } = await (admin as any)
    .from('verification_sessions')
    .select('id')
    .eq('user_id', userId)
    .eq(sessionCol, externalId)
    .single()

  if (!activeSession) {
    console.warn(`Security check failed: Webhook externalId ${externalId} does not match active session for user ${userId}. Ignored.`)
    return
  }

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
