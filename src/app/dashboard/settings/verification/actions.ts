'use server'

import { createClient } from '@/lib/supabase/server'
import { encrypt } from '@/lib/encrypt'

/** Encrypts the ID number on the server, then records the submission for manual review. */
export async function submitIdVerification(input: { idType: 'cnic' | 'passport'; number: string; expiry: string | null; imagePath: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Please log in again.' }
  // The file must be one this user just uploaded: <their id>/<uuid>.<image extension>. No other segments, no traversal.
  if (!new RegExp(`^${user.id}/[0-9a-f-]{36}\\.(jpe?g|png|webp)$`, 'i').test(input.imagePath)) return { error: 'The image upload did not complete. Try again.' }
  if (input.expiry && !/^\d{4}-\d{2}-\d{2}$/.test(input.expiry)) return { error: 'Check the expiry date.' }

  const digits = input.number.replace(/[\s-]/g, '')
  if (input.idType === 'cnic' && !/^\d{13}$/.test(digits)) return { error: 'A CNIC has 13 digits.' }
  if (input.idType === 'passport' && !/^[A-Za-z0-9]{6,12}$/.test(digits)) return { error: 'Check the passport number.' }

  const { error } = await supabase.rpc('submit_id_verification', {
    p_id_type: input.idType, p_image_path: input.imagePath, p_number_enc: encrypt(digits), p_expiry: input.expiry || undefined,
  })
  if (error) return { error: error.message.replace(/^[A-Z_]+: /, '') }
  return { ok: true as const }
}
