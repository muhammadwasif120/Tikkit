'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * syncEventStatuses — auto-advances event status in the DB based on time.
 *
 *  published → completed : date_end + 12 h has passed
 *  completed → archived  : date_end + 72 h has passed
 *
 * Fire-and-forget safe — call at the top of any page that lists events.
 */
export async function syncEventStatuses(): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return



  // 1. published → completed (12 h after date_end)
  await (supabase as any)
    .from('events')
    .update({ status: 'completed' })
    .eq('organizer_id', user.id)
    .eq('status', 'published')
    .lt('date_end', new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString())

  // 2. completed → archived (72 h after date_end)
  await (supabase as any)
    .from('events')
    .update({ status: 'archived' })
    .eq('organizer_id', user.id)
    .eq('status', 'completed')
    .lt('date_end', new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString())
}
