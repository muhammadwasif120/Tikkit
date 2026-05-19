import { createMobileClient, mobileUnauthorized } from '@/lib/supabase/mobile'
import { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  const auth = await createMobileClient(req.headers.get('Authorization'))
  if (!auth) return mobileUnauthorized()
  const { supabase, userId } = auth

  // Get user email to match public_registrations (which uses email, not user_id)
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('email')
    .eq('id', userId)
    .single()

  if (!profile?.email) return Response.json({ registrations: [] })

  const { data: registrations, error } = await (supabase as any)
    .from('public_registrations')
    .select(`
      id,
      status,
      payment_status,
      payment_screenshot_url,
      registration_notes,
      reference_code_entered,
      created_at,
      reviewed_at,
      event:events(
        id, title, date_start, date_end,
        venue_name, city, cover_image_url,
        ticket_price, registration_mode, status,
        organizer_id,
        profiles:organizer_id(full_name, username, logo_url)
      )
    `)
    .eq('email', profile.email)
    .order('created_at', { ascending: false })

  if (error) { console.error(error); return Response.json({ error: "Internal server error" }, { status: 500 }) }

  // Enrich with computed display status
  const mapped = (registrations ?? []).map((r: any) => {
    let displayStatus = r.status
    if (r.status === 'pending') displayStatus = 'eoi_submitted'
    else if (r.status === 'approved') {
      if (r.payment_status === 'pending') displayStatus = 'eoi_approved'
      else if (r.payment_status === 'submitted') displayStatus = 'payment_pending'
      else displayStatus = 'confirmed'
    }
    return {
      ...r,
      notes: r.registration_notes ?? null,
      display_status: displayStatus,
    }
  })

  return Response.json({ registrations: mapped })
}
