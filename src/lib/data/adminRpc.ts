import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'

/** Calls an admin database function. Each one checks the caller is an admin inside the database as well. */
export async function adminRpc<T>(supabase: unknown, fn: string, args: Record<string, unknown> = {}): Promise<T | null> {
  const { data, error } = await (supabase as SupabaseClient).rpc(fn, args)
  if (error) { console.error(`admin rpc ${fn}`, error.message); return null }
  return data as T
}

export type Dash = {
  accounts: { organizers: number; attendees: number; managers: number; suspended_organizers: number; suspended_attendees: number; organizers_7d: number; organizers_30d: number; attendees_7d: number; attendees_30d: number }
  signups_30d: { day: string; organizers: number; attendees: number }[]
  events: { total: number; draft: number; published: number; completed: number; cancelled: number; upcoming: number; next_7d: number; next_30d: number; happening_now: number; created_30d: number; flagged_or_suspended: number }
  registrations: { total: number; last_30d: number; confirmed: number; checked_in: number; no_show: number; awaiting_review: number; for_upcoming_events: number; unique_attendees: number }
  activity: { organizers_with_upcoming: number; organizers_active_30d: number; organizers_never_published: number; attendees_never_registered: number; attendees_attended: number }
  modules: { classes: { series: number; organizers: number; bookings: number }; spaces: { spaces: number; organizers: number; bookings: number }; retreats: { retreats: number; organizers: number; participants: number } }
  plans: { plan: string; status: string; count: number }[]
  subscriptions: { trials_ending_7d: number; expired_or_grace: number; revenue_pkr: number; revenue_30d_pkr: number }
  ticket_value: { total_pkr: number; last_30d_pkr: number }
  cities: { city: string; events: number; registrations: number }[]
  categories: { category: string; events: number; registrations: number }[]
  top_organizers: { id: string; name: string; events: number; registrations: number; checked_in: number }[]
  reports: { open: number; reviewing: number; last_7d: number }
  pending: { id_reviews: number; subscription_payments: number }
}

export type UpcomingEvent = { id: string; title: string; slug: string | null; city: string | null; starts_at: string; status: string; admin_status: string; visibility: string; capacity: number | null; organizer_id: string; organizer: string; registrations: number; confirmed: number; awaiting: number; checked_in: number }
