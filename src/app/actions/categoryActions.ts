'use server'

import { createClient } from '@/lib/supabase/server'

export type EventCategory = {
  id: string
  name: string
  slug: string
  icon: string
  color: string
}

// Fetch all event categories (public)
export async function getEventCategories(): Promise<EventCategory[]> {
  const supabase = await createClient()
  const { data } = await (supabase as any)
    .from('event_categories')
    .select('id, name, slug, icon, color')
    .order('sort_order', { ascending: true })

  return (data ?? []) as EventCategory[]
}
