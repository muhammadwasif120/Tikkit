'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

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

  return (data ?? { id: user.id, cnic_status: 'none', social_score: 0 }) as CnicProfile
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

  const buffer = Buffer.from(base64, 'base64')
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

  // Get signed URL (valid 10 years — for admin review)
  const { data: signedData } = await (admin as any).storage
    .from('cnic-documents')
    .createSignedUrl(fileName, 60 * 60 * 24 * 365 * 10)

  const imageUrl = signedData?.signedUrl ?? fileName

  // Save to profile
  const { error: updateError } = await (admin as any)
    .from('profiles')
    .update({
      cnic_number: cnicNumber.trim(),
      cnic_expiry: cnicExpiry.trim(),
      cnic_image_url: imageUrl,
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
