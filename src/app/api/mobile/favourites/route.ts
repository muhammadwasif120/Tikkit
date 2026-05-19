import { createMobileClient, mobileUnauthorized, mobileBadRequest } from '@/lib/supabase/mobile'
import { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  const auth = await createMobileClient(req.headers.get('Authorization'))
  if (!auth) return mobileUnauthorized()
  const { supabase, userId } = auth

  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') ?? 'events' // 'events' | 'organizers'

  if (type === 'organizers') {
    const { data, error } = await (supabase as any)
      .from('organizer_favourites')
      .select('organizer_id, profiles!organizer_favourites_organizer_id_fkey(id, full_name, username, logo_url)')
      .eq('user_id', userId)

    if (error) { console.error(error); return Response.json({ error: "Internal server error" }, { status: 500 }) }
    return Response.json({ favourites: data ?? [] })
  }

  const { data, error } = await (supabase as any)
    .from('event_favourites')
    .select(`event_id, events(id, title, date_start, venue_name, cover_image_url,
             profiles!events_organizer_id_fkey(full_name, username))`)
    .eq('user_id', userId)

  if (error) { console.error(error); return Response.json({ error: "Internal server error" }, { status: 500 }) }
  return Response.json({ favourites: data ?? [] })
}

export async function POST(req: NextRequest) {
  const auth = await createMobileClient(req.headers.get('Authorization'))
  if (!auth) return mobileUnauthorized()
  const { supabase, userId } = auth

  const body = await req.json().catch(() => null)
  if (!body) return mobileBadRequest('Invalid JSON')

  const { type, id } = body
  if (!type || !id) return mobileBadRequest('Missing type or id')

  if (type === 'organizer') {
    await (supabase as any)
      .from('organizer_favourites')
      .upsert({ user_id: userId, organizer_id: id }, { onConflict: 'user_id,organizer_id' })
  } else {
    await (supabase as any)
      .from('event_favourites')
      .upsert({ user_id: userId, event_id: id }, { onConflict: 'user_id,event_id' })
  }

  return Response.json({ favourited: true })
}

export async function DELETE(req: NextRequest) {
  const auth = await createMobileClient(req.headers.get('Authorization'))
  if (!auth) return mobileUnauthorized()
  const { supabase, userId } = auth

  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')
  const id = searchParams.get('id')
  if (!type || !id) return mobileBadRequest('Missing type or id')

  if (type === 'organizer') {
    await (supabase as any)
      .from('organizer_favourites')
      .delete()
      .eq('user_id', userId)
      .eq('organizer_id', id)
  } else {
    await (supabase as any)
      .from('event_favourites')
      .delete()
      .eq('user_id', userId)
      .eq('event_id', id)
  }

  return Response.json({ favourited: false })
}
