'use server'

import { createClient } from '@/lib/supabase/server'

const INDEX_NOW_KEY = '2aac1ba3120f5fcd7e8ec88cc63f7355'
const BASE_URL = 'https://www.tikkitx.com'

/**
 * Ping IndexNow with a single event URL when it's published.
 * Verifies the caller owns the event before submitting.
 * Fire-and-forget safe — never throws.
 */
export async function pingIndexNowForEvent(eventId: string, slugOrId: string): Promise<void> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Verify caller owns this event
    const { data: event } = await supabase
      .from('events')
      .select('id, organizer_id')
      .eq('id', eventId)
      .eq('organizer_id', user.id)
      .single()
    if (!event) return

    const url = `${BASE_URL}/guest/explore/${slugOrId}`

    await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host: 'www.tikkitx.com',
        key: INDEX_NOW_KEY,
        keyLocation: `${BASE_URL}/${INDEX_NOW_KEY}.txt`,
        urlList: [url],
      }),
    })
  } catch {
    // Non-critical — never let IndexNow failures surface to the organizer
  }
}
