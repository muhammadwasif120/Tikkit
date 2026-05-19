'use server'

// ─────────────────────────────────────────────────────────────────
// FILE: src/app/actions/guestPaymentActions.ts
// ─────────────────────────────────────────────────────────────────

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function submitPaymentScreenshot(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const registrationId = formData.get('registrationId') as string
  const screenshot = formData.get('screenshot') as File

  if (!registrationId) return { error: 'Missing registration ID' }
  if (!screenshot || screenshot.size === 0) return { error: 'No screenshot provided' }
  if (screenshot.size > 5 * 1024 * 1024) return { error: 'File too large (max 5MB)' }

  const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
  if (!ALLOWED_MIME.includes((screenshot.type ?? '').toLowerCase())) {
    return { error: 'Invalid file type. Please upload a JPEG, PNG, or WebP image.' }
  }

  // Verify this registration belongs to the current user and is approved
  const { data: reg, error: regError } = await (supabase as any)
    .from('public_registrations')
    .select('id, status, email, event_id')
    .eq('id', registrationId)
    .eq('email', user.email)
    .single()

  if (regError || !reg) return { error: 'Registration not found' }
  // H7: 'eoi_approved' is not a valid registration status in the DB schema.
  // Valid statuses are: pending / approved / rejected / checked_in / attended.
  // The duplicate function in guestPaymentActions.ts correctly checks 'approved'.
  if (reg.status !== 'approved') return { error: 'Registration is not approved yet' }

  // Upload to Supabase Storage
  const ext = screenshot.name.split('.').pop() ?? 'jpg'
  const path = `payment-screenshots/${user.id}/${registrationId}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('payment-screenshots')
    .upload(path, screenshot, { upsert: true, contentType: screenshot.type })

  if (uploadError) {
    console.error('Upload error:', uploadError)
    return { error: 'Upload failed. Please try again.' }
  }

  // payment-screenshots bucket is private; store the path and serve via signed URL as needed
  const { data: { publicUrl } } = supabase.storage
    .from('payment-screenshots')
    .getPublicUrl(path)

  // H7: Update payment_status (not registration status) to 'submitted'.
  // The previous code incorrectly set status = 'payment_pending' which is not
  // a valid enum value — the correct field is payment_status = 'submitted'.
  const { error: updateError } = await supabase
    .from('public_registrations')
    .update({
      payment_status: 'submitted',
      payment_screenshot_url: publicUrl,
      payment_submitted_at: new Date().toISOString(),
    })
    .eq('id', registrationId)
    .eq('email', user.email!)

  if (updateError) return { error: 'Could not update registration status' }

  // Notify organizer
  const { data: event } = await supabase
    .from('events')
    .select('organizer_id, title')
    .eq('id', reg.event_id)
    .single()

  if (event) {
    await supabase.from('notifications').insert({
      user_id: event.organizer_id,
      type: 'guest_signup',
      title: 'Payment Screenshot Received',
      body: `A guest has submitted a payment screenshot for ${event.title}`,
      metadata: { registration_id: registrationId, event_id: reg.event_id } as any,
    })
  }

  revalidatePath('/guest/tikkit')
  return { success: true }
}


export async function updateGuestProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const full_name = (formData.get('full_name') as string)?.trim()
  const username = (formData.get('username') as string)?.trim().replace(/^@/, '')
  const phone = (formData.get('phone') as string)?.trim()
  const instagram_handle = (formData.get('instagram_handle') as string)?.trim().replace(/^@/, '')
  const bio = (formData.get('bio') as string)?.trim()
  const is_discoverable = formData.get('is_discoverable') === 'true'

  // Check username uniqueness (if changed)
  if (username) {
    const { data: existing } = await supabase
      .from('guest_profiles')
      .select('id')
      .eq('username', username)
      .neq('id', user.id)
      .single()
    if (existing) return { error: 'Username already taken' }
  }

  const { error } = await supabase
    .from('guest_profiles')
    .upsert({
  id: user.id,
  username: username || null,
  instagram_handle: instagram_handle || null,
  bio: bio || null,
  is_discoverable,
  updated_at: new Date().toISOString(),
  })

  if (error) {
    console.error('Profile update error:', error)
    return { error: 'Could not update profile' }
  }

  // Sync editable identity fields to base profiles table
  const profileUpdate: Record<string, string> = {}
  if (full_name) profileUpdate.full_name = full_name
  if (phone)     profileUpdate.phone_number = phone
  if (Object.keys(profileUpdate).length > 0) {
    await supabase.from('profiles').update(profileUpdate).eq('id', user.id)
  }

  revalidatePath('/guest/profile')
  return { success: true }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/auth/login')
}
// Add this to /src/app/actions/guestProfileActions.ts

export async function sendPasswordReset() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return { error: 'No email found' }

  // Rate limit: 3 reset emails per hour per user
  const { checkRateLimit } = await import('@/lib/rateLimit')
  if (!checkRateLimit(`pwreset:${user.id}`, 3, 3_600_000)) {
    return { error: 'Too many reset attempts. Please wait before trying again.' }
  }

  const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
  })
  if (error) return { error: error.message }
  return { success: true }
}

export async function uploadProfilePhoto(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const file = formData.get('photo') as File
  if (!file || file.size === 0) return { error: 'No file provided' }
  if (file.size > 5 * 1024 * 1024) return { error: 'Max file size is 5MB' }
  if (!file.type.startsWith('image/')) return { error: 'Must be an image file' }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const path = `avatars/${user.id}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('tikkit-uploads')
    .upload(path, file, { upsert: true, contentType: file.type })

  if (uploadError) return { error: 'Upload failed. Please try again.' }

  const { data: { publicUrl } } = supabase.storage
    .from('tikkit-uploads')
    .getPublicUrl(path)

  await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id)

  revalidatePath('/guest/profile')
  return { success: true, url: publicUrl }
}

export async function deleteAccount() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Soft-delete: wipe personal data, keep anonymised records intact
  await supabase.from('profiles').update({
    full_name: 'Deleted User',
    phone_number: null,
    avatar_url: null,
  }).eq('id', user.id)

  await (supabase as any).from('guest_profiles').upsert({
    id: user.id,
    username: null,
    bio: null,
    instagram_handle: null,
    is_discoverable: false,
    updated_at: new Date().toISOString(),
  })

  await supabase.auth.signOut()
  redirect('/auth/login')
}

export async function updateNotificationPrefs(prefs: Record<string, boolean>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  await (supabase as any).from('guest_profiles').upsert({
    id: user.id,
    notification_prefs: prefs,
    updated_at: new Date().toISOString(),
  })

  return { success: true }
}
