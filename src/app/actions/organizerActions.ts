'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { logBehaviour } from './behaviourActions'

export type TopOrganizer = {
  id: string
  full_name: string | null
  company_name: string | null
  username: string | null
  logo_url: string | null
  cover_image_url: string | null
  upcoming_event_count: number
  is_favourite: boolean
}

export async function getTopOrganizers(limit = 10): Promise<TopOrganizer[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await (supabase as any).rpc('get_top_organizers', {
    p_limit:   limit,
    p_user_id: user?.id ?? null,
  })

  if (error) {
    console.error('getTopOrganizers error:', error)
    return []
  }

  return (data ?? []) as TopOrganizer[]
}

export async function toggleFavouriteOrganizer(
  organizerId: string,
): Promise<{ is_favourite: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: existing } = await (supabase as any)
    .from('organizer_favourites')
    .select('id')
    .eq('user_id', user.id)
    .eq('organizer_id', organizerId)
    .maybeSingle()

  if (existing) {
    await (supabase as any)
      .from('organizer_favourites')
      .delete()
      .eq('user_id', user.id)
      .eq('organizer_id', organizerId)
    return { is_favourite: false }
  }

  await (supabase as any)
    .from('organizer_favourites')
    .insert({ user_id: user.id, organizer_id: organizerId })
  // Log behaviour signal (fire-and-forget)
  logBehaviour({ action: 'favourite_organizer', organizerId }).catch(() => {})
  revalidatePath('/guest/explore')
  return { is_favourite: true }
}

export async function getFavouriteOrganizerIds(): Promise<string[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await (supabase as any)
    .from('organizer_favourites')
    .select('organizer_id')
    .eq('user_id', user.id)

  return (data ?? []).map((r: any) => r.organizer_id)
}
