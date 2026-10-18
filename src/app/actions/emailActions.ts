'use server'

import { createClient } from '@/lib/supabase/server'
import { processOutbox } from '@/lib/email/outbox'
import { checkRateLimit } from '@/lib/rateLimit'

/** Sends whatever is queued right now. Called after an announcement, invite or retreat update. */
export async function flushEmails() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { sent: 0, failed: 0 }
  // The queue is shared, so one person cannot be allowed to hammer the mail provider.
  if (!(await checkRateLimit(`flush:${user.id}`, 6, 60_000))) return { sent: 0, failed: 0 }
  return processOutbox(40)
}
