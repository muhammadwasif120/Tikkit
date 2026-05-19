'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { encrypt, safeDecrypt } from '@/lib/encrypt'

export interface CnicProfile {
  id: string
  full_name: string | null
  cnic_number: string | null
  cnic_expiry: string | null
  cnic_image_url: string | null
  cnic_status: 'none' | 'pending' | 'verified' | 'rejected'
  cnic_submitted_at: string | null
  cnic_reject_reason: string | null
  social_score: number
}

/**
 * Fetch current CNIC verification status for the logged-in user.
 */
export async function getCnicStatus(): Promise<CnicProfile | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await (supabase as any)
    .from('profiles')
    .select('id, full_name, cnic_number, cnic_expiry, cnic_image_url, cnic_status, cnic_submitted_at, cnic_reject_reason, social_score')
    .eq('id', user.id)
    .single()

  const profile = (data ?? { id: user.id, cnic_status: 'none', social_score: 0 }) as CnicProfile
  if (profile.cnic_number) profile.cnic_number = safeDecrypt(profile.cnic_number)
  return profile
}

/**
 * Submit CNIC verification:
 * - Receives the watermarked image as a base64 data URL from the client
 * - Uploads to Supabase storage (private bucket)
 * - Saves extracted CNIC number + expiry to profile
 * - Sets status to 'pending' for admin review
 */
export async function submitCnicVerification(params: {
  imageDataUrl: string   // watermarked image as base64 data URL
  cnicNumber: string
  cnicExpiry: string
}): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { imageDataUrl, cnicNumber, cnicExpiry } = params

  // Validate CNIC format: XXXXX-XXXXXXX-X
  const cnicRegex = /^\d{5}-\d{7}-\d$/
  if (!cnicRegex.test(cnicNumber.trim())) {
    return { error: 'Invalid CNIC format. Expected: XXXXX-XXXXXXX-X' }
  }

  // Convert base64 data URL to buffer
  const base64 = imageDataUrl.split(',')[1]
  if (!base64) return { error: 'Invalid image data' }

  // Guard against payload bombs: base64 overhead is ~1.37x, so 10MB base64 ≈ 7.3MB decoded.
  // Reject before allocating any buffer memory.
  if (base64.length > 10_000_000) return { error: 'Image too large. Maximum size is 7MB.' }

  const buffer = Buffer.from(base64, 'base64')

  // Secondary check on decoded size
  if (buffer.byteLength > 7 * 1024 * 1024) return { error: 'Image too large. Maximum size is 7MB.' }
  const fileName = `${user.id}/cnic_${Date.now()}.jpg`

  // Upload watermarked image to private bucket
  const { error: uploadError } = await (admin as any).storage
    .from('cnic-documents')
    .upload(fileName, buffer, {
      contentType: 'image/jpeg',
      upsert: true,
    })

  if (uploadError) {
    console.error('CNIC upload error:', uploadError)
    return { error: 'Something went wrong. Please try again.' }
  }

  // Save to profile — encrypt CNIC number at rest
  const { error: updateError } = await (admin as any)
    .from('profiles')
    .update({
      cnic_number: encrypt(cnicNumber.trim()),
      cnic_expiry: cnicExpiry.trim(),
      cnic_image_url: fileName,  // store path only; signed URLs generated on demand
      cnic_status: 'pending',
      cnic_submitted_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (updateError) {
    console.error('CNIC profile update error:', updateError)
    return { error: 'Something went wrong. Please try again.' }
  }

  return { success: true }
}
