import { createMobileClient, mobileUnauthorized } from '@/lib/supabase/mobile'
import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  const auth = await createMobileClient(req.headers.get('Authorization'))
  if (!auth) return mobileUnauthorized()
  const { supabase, userId } = auth

  // Parse multipart form data
  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return Response.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const registrationId = formData.get('registrationId') as string | null
  const screenshot = formData.get('screenshot') as File | null

  if (!registrationId) return Response.json({ error: 'registrationId required' }, { status: 400 })
  if (!screenshot || screenshot.size === 0) return Response.json({ error: 'screenshot required' }, { status: 400 })
  if (screenshot.size > 8 * 1024 * 1024) return Response.json({ error: 'File too large (max 8MB)' }, { status: 400 })

  // Get user email
  const { data: profile } = await (supabase as any)
    .from('profiles').select('email').eq('id', userId).single()
  if (!profile?.email) return Response.json({ error: 'Profile not found' }, { status: 404 })

  // Verify registration belongs to this user
  const { data: reg } = await (supabase as any)
    .from('public_registrations')
    .select('id, status, payment_status, event_id, email')
    .eq('id', registrationId)
    .eq('email', profile.email)
    .single()

  if (!reg) return Response.json({ error: 'Registration not found' }, { status: 404 })
  if (reg.status !== 'approved') return Response.json({ error: 'Registration is not approved yet' }, { status: 400 })
  if (reg.payment_status === 'submitted') return Response.json({ error: 'Screenshot already submitted' }, { status: 400 })
  if (reg.payment_status === 'confirmed') return Response.json({ error: 'Payment already confirmed' }, { status: 400 })

  // Upload to Supabase Storage using service role key for storage operations
  const { createClient } = await import('@supabase/supabase-js')
  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const ext = screenshot.name?.split('.').pop() ?? 'jpg'
  const path = `payment-screenshots/${registrationId}-${Date.now()}.${ext}`
  const bytes = await screenshot.arrayBuffer()

  const { error: uploadError } = await adminSupabase.storage
    .from('payment-screenshots')
    .upload(path, bytes, { contentType: screenshot.type || 'image/jpeg', upsert: true })

  if (uploadError) {
    console.error('Payment screenshot upload error:', uploadError)
    return Response.json({ error: 'Failed to upload screenshot. Try again.' }, { status: 500 })
  }

  const { data: { publicUrl } } = adminSupabase.storage
    .from('payment-screenshots')
    .getPublicUrl(path)

  // Update registration
  const { data: updated, error: updateError } = await (supabase as any)
    .from('public_registrations')
    .update({ payment_status: 'submitted', payment_screenshot_url: publicUrl })
    .eq('id', registrationId)
    .select()
    .single()

  if (updateError) return Response.json({ error: updateError.message }, { status: 500 })

  // Notify organizer (non-blocking)
  const { data: event } = await (supabase as any)
    .from('events').select('title, organizer_id').eq('id', reg.event_id).single()

  if (event) {
    await (supabase as any).from('notifications').insert({
      user_id: event.organizer_id,
      type: 'payment_submitted',
      title: 'Payment Screenshot Received 💳',
      body: `A payment screenshot was submitted for ${event.title}`,
      metadata: { event_id: reg.event_id, registration_id: registrationId },
    }).catch(() => {}) // notifications table may not exist
  }

  return Response.json({
    registration: {
      ...updated,
      notes: updated.registration_notes ?? null,
      display_status: 'payment_pending',
    }
  })
}
