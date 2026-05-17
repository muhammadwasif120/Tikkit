import { createMobileClient, mobileUnauthorized } from '@/lib/supabase/mobile'
import { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  const auth = await createMobileClient(req.headers.get('Authorization'))
  if (!auth) return mobileUnauthorized()
  const { supabase } = auth

  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  const page = parseInt(searchParams.get('page') ?? '0')
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 50)
  const search = searchParams.get('search')

  let query = (supabase as any)
    .from('events')
    .select(`
      id, title, description, date_start, date_end,
      venue_name, venue_city, capacity, ticket_price,
      registration_mode, status, cover_image_url, city,
      organizer_id,
      profiles!events_organizer_id_fkey(full_name, username, logo_url),
      event_categories!events_category_id_fkey(id, name, slug, icon, color)
    `)
    .eq('status', 'published')
    .gte('date_start', new Date().toISOString())
    .order('date_start', { ascending: true })
    .range(page * limit, (page + 1) * limit - 1)

  if (category) query = query.eq('event_categories.slug', category)
  if (search) query = query.ilike('title', `%${search}%`)

  const { data, error } = await query
  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ events: data ?? [], page, limit })
}
