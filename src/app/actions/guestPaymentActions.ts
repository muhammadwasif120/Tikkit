'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function submitPaymentScreenshot(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const registrationId = formData.get('registrationId') as string
  const screenshot     = formData.get('screenshot') as File

  if (!registrationId)                      return { error: 'Missing registration ID' }
  if (!screenshot || screenshot.size === 0) return { error: 'No screenshot provided' }
  if (screenshot.size > 8 * 1024 * 1024)   return { error: 'File too large (max 8MB)' }

  // H2: Validate MIME type before uploading. Without this, a user can rename
  // any file (e.g. shell script) as .jpg and upload it to Supabase Storage.
  const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
  if (!ALLOWED_MIME.includes((screenshot.type ?? '').toLowerCase())) {
    return { error: 'Invalid file type. Please upload a JPEG, PNG, or WebP image.' }
  }

  // Verify registration belongs to this user by email
  const { data: reg } = await supabase
    .from('public_registrations')
    .select('id, status, payment_status, event_id, email')
    .eq('id', registrationId)
    .eq('email', user.email!)
    .single()

  if (!reg) return { error: 'Registration not found' }
  if (reg.status !== 'approved') return { error: 'Registration is not approved yet' }
  if (reg.payment_status === 'submitted') return { error: 'Screenshot already submitted' }
  if (reg.payment_status === 'confirmed') return { error: 'Payment already confirmed' }

  // Upload screenshot to storage
  const ext  = screenshot.name.split('.').pop() ?? 'jpg'
  const path = `payment-screenshots/${registrationId}-${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('payment-screenshots')
    .upload(path, screenshot, { contentType: screenshot.type, upsert: true })

  if (uploadError) {
    console.error('Upload error:', uploadError)
    return { error: 'Failed to upload screenshot. Try again.' }
  }

  const { data: { publicUrl } } = supabase.storage
    .from('payment-screenshots')
    .getPublicUrl(path)

  // Update registration payment status
  const { error: updateError } = await supabase
    .from('public_registrations')
    .update({
      payment_status:          'submitted',
      payment_screenshot_url:  publicUrl,
    })
    .eq('id', registrationId)

  if (updateError) return { error: updateError.message }

  // Notify organizer
  const { data: event } = await supabase
    .from('events')
    .select('title, organizer_id')
    .eq('id', reg.event_id)
    .single()

  if (event) {
    await supabase.from('notifications').insert({
      user_id: (event as any).organizer_id,
      type:    'payment_submitted',
      title:   'Payment Screenshot Received 💳',
      body:    `A payment screenshot was submitted for ${(event as any).title}`,
      data:    { event_id: reg.event_id, registration_id: registrationId },
    } as any)
  }

  revalidatePath('/guest/tikkit')
  return { success: true }
}
