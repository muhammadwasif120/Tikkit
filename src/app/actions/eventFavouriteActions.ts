'use server'

import { createClient } from '@/lib/supabase/server'

export async function toggleEventFavourite(eventId: string): Promise<{ favourited: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { favourited: false }

  const { data: existing } = await (supabase as any)
    .from('event_favourites')
    .select('id')
    .eq('user_id', user.id)
    .eq('event_id', eventId)
    .maybeSingle()

  if (existing) {
    await (supabase as any)
      .from('event_favourites')
      .delete()
      .eq('user_id', user.id)
      .eq('event_id', eventId)
    return { favourited: false }
  } else {
    await (supabase as any)
      .from('event_favourites')
      .insert({ user_id: user.id, event_id: eventId })
    return { favourited: true }
  }
}

export async function getUserFavouriteEventIds(): Promise<string[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await (supabase as any)
    .from('event_favourites')
    .select('event_id')
    .eq('user_id', user.id)

  return (data ?? []).map((r: any) => r.event_id)
}
