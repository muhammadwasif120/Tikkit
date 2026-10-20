import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'

/** Photo links for the guests of the events this organizer (or manager) runs. Empty if there are none or the function is missing. */
export async function loadGuestAvatars(supabase: unknown): Promise<Map<string, string>> {
  const { data } = await (supabase as SupabaseClient).rpc('my_guest_avatars')
  return new Map(((data ?? []) as { attendee_id: string; avatar_url: string }[]).map(a => [a.attendee_id, a.avatar_url]))
}
