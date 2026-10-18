'use server'

import { revalidatePath } from 'next/cache'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

/** Follow or unfollow a category. The For You feed uses these as stated interests. */
export async function toggleInterest(categoryId: string, on: boolean): Promise<{ ok: boolean }> {
  if (!/^[0-9a-f-]{36}$/i.test(categoryId)) return { ok: false }
  const supabase = (await createClient()) as unknown as SupabaseClient
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false }
  const { error } = on
    ? await supabase.from('attendee_interests').upsert({ user_id: user.id, category_id: categoryId })
    : await supabase.from('attendee_interests').delete().eq('user_id', user.id).eq('category_id', categoryId)
  if (error) return { ok: false }
  revalidatePath('/guest/explore')
  return { ok: true }
}

const UUID = /^[0-9a-f-]{36}$/i

/** Save or unsave an event. */
export async function toggleSaved(eventId: string, on: boolean): Promise<{ ok: boolean }> {
  if (!UUID.test(eventId)) return { ok: false }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false }
  const { error } = on
    ? await supabase.from('event_favourites').upsert({ user_id: user.id, event_id: eventId })
    : await supabase.from('event_favourites').delete().eq('user_id', user.id).eq('event_id', eventId)
  if (error) return { ok: false }
  revalidatePath('/guest', 'layout')
  return { ok: true }
}

/** Follow or unfollow an organizer. Followed organizers get a boost in For you. */
export async function toggleFollow(organizerId: string, on: boolean): Promise<{ ok: boolean }> {
  if (!UUID.test(organizerId)) return { ok: false }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false }
  const { error } = on
    ? await supabase.from('organizer_favourites').upsert({ user_id: user.id, organizer_id: organizerId })
    : await supabase.from('organizer_favourites').delete().eq('user_id', user.id).eq('organizer_id', organizerId)
  if (error) return { ok: false }
  revalidatePath('/guest', 'layout')
  return { ok: true }
}
