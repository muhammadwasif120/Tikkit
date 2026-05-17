import { createMobileClient, mobileUnauthorized } from '@/lib/supabase/mobile'
import { NextRequest } from 'next/server'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await createMobileClient(req.headers.get('Authorization'))
  if (!auth) return mobileUnauthorized()
  const { supabase, userId } = auth

  const { id } = await params

  const { data: event, error } = await (supabase as any)
    .from('events')
    .select(`
      id, title, description, date_start, date_end,
      venue_name, venue_address, venue_city, venue_maps_url,
      capacity, ticket_price, registration_mode, status,
      cover_image_url, city, city_label,
      organizer_id,
      profiles!events_organizer_id_fkey(id, full_name, username, logo_url, bio),
      event_categories!events_category_id_fkey(id, name, slug, icon, color),
      ticket_types(id, day, date, ticket_price)
    `)
    .eq('id', id)
    .eq('status', 'published')
    .maybeSingle()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  if (!event) return Response.json({ error: 'Event not found' }, { status: 404 })

  // Check if user is already registered
  const { data: reg } = await (supabase as any)
    .from('public_registrations')
    .select('id, status, payment_status')
    .eq('event_id', id)
    .eq('email', (await supabase.auth.getUser()).data.user?.email)
    .maybeSingle()

  // Count registered attendees
  const { count } = await supabase
    .from('public_registrations')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', id)
    .not('status', 'eq', 'rejected')

  return Response.json({
    event: {
      ...event,
      registered_count: count ?? 0,
      user_registration: reg ?? null,
    }
  })
}
