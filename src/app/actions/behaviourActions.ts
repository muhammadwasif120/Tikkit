'use server'

import { createClient } from '@/lib/supabase/server'

export type BehaviourAction =
  | 'view_event'
  | 'register'
  | 'organizer_visit'
  | 'favourite_organizer'
  | 'unfavourite_organizer'

// Points awarded per action — register is 5× more signal than a view
const ACTION_WEIGHTS: Record<BehaviourAction, number> = {
  view_event:             1,
  register:               5,
  organizer_visit:        1,
  favourite_organizer:    3,
  unfavourite_organizer: -3,
}

export type EventCategory = {
  id: string
  name: string
  slug: string
  icon: string
  color: string
}

// ── Log a user behaviour signal ────────────────────────────────
// Fire-and-forget: swallows errors so callers don't need to handle them.
export async function logBehaviour(params: {
  action: BehaviourAction
  eventId?: string | null
  organizerId?: string | null
  categoryId?: string | null
}): Promise<void> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { action, eventId = null, organizerId = null, categoryId = null } = params

    await (supabase as any).from('user_behaviour_log').insert({
      user_id:      user.id,
      event_id:     eventId,
      organizer_id: organizerId,
      category_id:  categoryId,
      action,
    })

    // Incrementally update the category interest score
    if (categoryId) {
      const delta = ACTION_WEIGHTS[action] ?? 0
      if (delta !== 0) {
        await (supabase as any).rpc('upsert_category_score', {
          p_user_id:     user.id,
          p_category_id: categoryId,
          p_delta:       delta,
        })
      }
    }
  } catch {
    // Never throw — logging is best-effort
  }
}

// ── Fetch all event categories (public) ────────────────────────
export async function getEventCategories(): Promise<EventCategory[]> {
  const supabase = await createClient()
  const { data } = await (supabase as any)
    .from('event_categories')
    .select('id, name, slug, icon, color')
    .order('sort_order', { ascending: true })

  return (data ?? []) as EventCategory[]
}

// ── Get user's category interest scores ────────────────────────
// Returns category IDs ordered by descending interest score.
export async function getUserCategoryOrder(): Promise<
  Array<{ category_id: string; score: number }>
> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await (supabase as any)
    .from('user_category_scores')
    .select('category_id, score')
    .eq('user_id', user.id)
    .order('score', { ascending: false })
    .limit(14)

  return (data ?? []) as Array<{ category_id: string; score: number }>
}
