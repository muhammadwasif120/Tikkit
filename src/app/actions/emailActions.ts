'use server'

import { createClient } from '@/lib/supabase/server'
import { processOutbox } from '@/lib/email/outbox'

/** Sends whatever is queued right now. Called after an announcement, invite or retreat update. */
export async function flushEmails() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { sent: 0, failed: 0 }
  return processOutbox(40)
}
