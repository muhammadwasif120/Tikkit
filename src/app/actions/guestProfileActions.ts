'use server'

// ─────────────────────────────────────────────────────────────────
// FILE: src/app/actions/guestPaymentActions.ts
// ─────────────────────────────────────────────────────────────────

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function submitPaymentScreenshot(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const registrationId = formData.get('registrationId') as string
  const screenshot = formData.get('screenshot') as File

  if (!registrationId) return { error: 'Missing registration ID' }
  if (!screenshot || screenshot.size === 0) return { error: 'No screenshot provided' }
  if (screenshot.size > 5 * 1024 * 1024) return { error: 'File too large (max 5MB)' }

  // Verify this registration belongs to the current user and is in eoi_approved state
  const { data: reg, error: regError } = await supabase
    .from('public_registrations')
    .select('id, status, guest_id, event_id')
    .eq('id', registrationId)
    .eq('guest_id', user.id)
    .single()

  if (regError || !reg) return { error: 'Registration not found' }
  if (reg.status !== 'eoi_approved') return { error: 'Payment not required for this registration' }

  // Upload to Supabase Storage
  const ext = screenshot.name.split('.').pop() ?? 'jpg'
  const path = `payment-screenshots/${user.id}/${registrationId}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('tikkit-uploads')
    .upload(path, screenshot, { upsert: true, contentType: screenshot.type })

  if (uploadError) {
    console.error('Upload error:', uploadError)
    return { error: 'Upload failed. Please try again.' }
  }

  const { data: { publicUrl } } = supabase.storage
    .from('tikkit-uploads')
    .getPublicUrl(path)

  // Update registration status
  const { error: updateError } = await supabase
    .from('public_registrations')
    .update({
      status: 'payment_pending',
      payment_screenshot_url: publicUrl,
      payment_submitted_at: new Date().toISOString(),
    })
    .eq('id', registrationId)
    .eq('guest_id', user.id)

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
      type: 'payment_submitted',
      title: 'Payment Screenshot Received',
      body: `A guest has submitted a payment screenshot for ${event.title}`,
      data: { registration_id: registrationId, event_id: reg.event_id },
    })
  }

  revalidatePath('/guest/events')
  return { success: true }
}


// ─────────────────────────────────────────────────────────────────
// FILE: src/app/actions/guestProfileActions.ts
// ─────────────────────────────────────────────────────────────────

import { createClient as _createClient } from '@/lib/supabase/server'
import { revalidatePath as _revalidatePath } from 'next/cache'
import { redirect as _redirect } from 'next/navigation'

export async function updateGuestProfile(formData: FormData) {
  const supabase = await _createClient()
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
      full_name: full_name || null,
      username: username || null,
      phone: phone || null,
      instagram_handle: instagram_handle || null,
      bio: bio || null,
      is_discoverable,
      updated_at: new Date().toISOString(),
    })

  if (error) {
    console.error('Profile update error:', error)
    return { error: 'Could not update profile' }
  }

  // Also sync full_name to base profiles table
  if (full_name) {
    await supabase.from('profiles').update({ full_name }).eq('id', user.id)
  }

  _revalidatePath('/guest/profile')
  return { success: true }
}

export async function signOut() {
  const supabase = await _createClient()
  await supabase.auth.signOut()
  _redirect('/auth/login')
}
