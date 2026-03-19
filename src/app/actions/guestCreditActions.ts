'use server'

import { createClient } from '@/lib/supabase/server'

// ─── Point values ─────────────────────────────────────────────────────────────
const P = {
  EXIT_SCAN:   50,
  VIP_BONUS:   50,
  FIRST_EVENT: 100,
  STREAK_3:    25,
  STREAK_5:    50,
  STREAK_10:   100,
  NO_SHOW:    -20,
} as const

// ─── Ensure guest profile exists on first login ───────────────────────────────
export async function ensureGuestProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: existing } = await supabase
    .from('guest_profiles')
    .select('id')
    .eq('id', user.id)
    .single()

  if (existing) return existing

  await supabase.from('profiles').upsert({
    id:        user.id,
    email:     user.email!,
    full_name: user.user_metadata?.full_name ?? user.email!.split('@')[0],
    role:      'guest',
  }, { onConflict: 'id' })

  const { data: newProfile } = await supabase
    .from('guest_profiles')
    .insert({ id: user.id })
    .select()
    .single()

  return newProfile
}

// ─── Award credits on exit scan ───────────────────────────────────────────────
export async function awardExitScanCredits(guestRecordId: string, eventId: string) {
  const supabase = await createClient()

  const { data: guest } = await supabase
    .from('guests')
    .select('id, email, is_vip, guest_profile_id, ticket_price_paid')
    .eq('id', guestRecordId)
    .single()

  if (!guest) return { success: false, reason: 'guest not found' }

  let profileId = guest.guest_profile_id

  if (!profileId && guest.email) {
    const { data: prof } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', guest.email)
      .eq('role', 'guest')
      .single()

    if (prof) {
      profileId = prof.id
      await supabase.from('guests').update({ guest_profile_id: profileId }).eq('id', guestRecordId)
    }
  }

  if (!profileId) return { success: false, reason: 'no guest account linked' }

  const { data: profile } = await supabase
    .from('guest_profiles')
    .select('credit_score, total_attended, total_vip_events, attendance_streak, longest_streak')
    .eq('id', profileId)
    .single()

  if (!profile) return { success: false, reason: 'profile not found' }

  const isFirstEvent = profile.total_attended === 0
  const newAttended  = profile.total_attended + 1
  const newStreak    = profile.attendance_streak + 1
  const isVip        = !!guest.is_vip

  let totalPoints = P.EXIT_SCAN
  const txns: { type: string; points: number; note: string }[] = [
    { type: 'exit_scan', points: P.EXIT_SCAN, note: 'Attended and checked out' },
  ]

  if (isVip) {
    totalPoints += P.VIP_BONUS
    txns.push({ type: 'vip_bonus', points: P.VIP_BONUS, note: 'VIP ticket bonus' })
  }
  if (isFirstEvent) {
    totalPoints += P.FIRST_EVENT
    txns.push({ type: 'first_event', points: P.FIRST_EVENT, note: 'First event ever — welcome to Tikkit!' })
  }
  if (newStreak === 3) {
    txns.push({ type: 'streak_bonus', points: P.STREAK_3, note: '3-event streak 🔥' })
    totalPoints += P.STREAK_3
  } else if (newStreak === 5) {
    txns.push({ type: 'streak_bonus', points: P.STREAK_5, note: '5-event streak 🔥' })
    totalPoints += P.STREAK_5
  } else if (newStreak % 10 === 0 && newStreak > 0) {
    txns.push({ type: 'streak_bonus', points: P.STREAK_10, note: `${newStreak}-event streak milestone!` })
    totalPoints += P.STREAK_10
  }

  const newScore = profile.credit_score + totalPoints

  await supabase.from('guest_profiles').update({
    credit_score:      newScore,
    total_attended:    newAttended,
    total_vip_events:  isVip ? profile.total_vip_events + 1 : profile.total_vip_events,
    attendance_streak: newStreak,
    longest_streak:    Math.max(newStreak, profile.longest_streak),
    updated_at:        new Date().toISOString(),
  }).eq('id', profileId)

  let runningBalance = profile.credit_score
  for (const tx of txns) {
    runningBalance += tx.points
    await supabase.from('credit_transactions').insert({
      guest_id:        profileId,
      event_id:        eventId,
      guest_record_id: guestRecordId,
      type:            tx.type,
      points:          tx.points,
      balance_after:   runningBalance,
      note:            tx.note,
    })
  }

  await issueEventPass(profileId, guestRecordId, eventId, isVip, guest.ticket_price_paid)

  return { success: true, pointsAwarded: totalPoints, newScore, passes: txns }
}

// ─── Issue collectible event pass ─────────────────────────────────────────────
async function issueEventPass(
  profileId: string,
  guestRecordId: string,
  eventId: string,
  isVip: boolean,
  ticketPricePaid: number,
) {
  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('event_passes')
    .select('id')
    .eq('guest_id', profileId)
    .eq('event_id', eventId)
    .single()

  if (existing) return

  const { data: event } = await supabase
    .from('events')
    .select('title, date_start, venue_name, cover_image_url')
    .eq('id', eventId)
    .single()

  if (!event) return

  const { count } = await supabase
    .from('event_passes')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId)

  await supabase.from('event_passes').insert({
    guest_id:          profileId,
    event_id:          eventId,
    guest_record_id:   guestRecordId,
    event_title:       event.title,
    event_date:        event.date_start,
    venue_name:        event.venue_name ?? null,
    cover_image_url:   event.cover_image_url ?? null,
    was_vip:           isVip,
    ticket_price_paid: ticketPricePaid ?? 0,
    pass_number:       (count ?? 0) + 1,
  })
}

// ─── No-show deductions ───────────────────────────────────────────────────────
export async function processNoShows(eventId: string) {
  const supabase = await createClient()

  const { data: noShows } = await supabase
    .from('guests')
    .select('id, email, guest_profile_id')
    .eq('event_id', eventId)
    .in('status', ['registered', 'invited'])
    .not('guest_profile_id', 'is', null)

  if (!noShows?.length) return { processed: 0 }

  let count = 0
  for (const guest of noShows) {
    const pid = guest.guest_profile_id!
    const { data: profile } = await supabase
      .from('guest_profiles')
      .select('credit_score, total_no_shows, attendance_streak')
      .eq('id', pid)
      .single()

    if (!profile) continue

    const newScore = Math.max(0, profile.credit_score + P.NO_SHOW)

    await supabase.from('guest_profiles').update({
      credit_score:      newScore,
      total_no_shows:    profile.total_no_shows + 1,
      attendance_streak: 0,
      updated_at:        new Date().toISOString(),
    }).eq('id', pid)

    await supabase.from('credit_transactions').insert({
      guest_id:        pid,
      event_id:        eventId,
      guest_record_id: guest.id,
      type:            'no_show_deduction',
      points:          P.NO_SHOW,
      balance_after:   newScore,
      note:            'No-show: registered but did not attend',
    })
    count++
  }

  return { processed: count }
}

// ─── Data fetchers ────────────────────────────────────────────────────────────
export async function getCreditScore(userId?: string) {
  const supabase = await createClient()
  const uid = userId ?? (await supabase.auth.getUser()).data.user?.id
  if (!uid) return 0

  const { data } = await supabase
    .from('credit_transactions')
    .select('points')
    .eq('guest_id', uid)

  return (data ?? []).reduce((sum, tx) => sum + (tx.points ?? 0), 0)
}

export async function getGuestProfile(userId?: string) {
  const supabase = await createClient()
  const uid = userId ?? (await supabase.auth.getUser()).data.user?.id
  if (!uid) return null

  const { data } = await supabase
    .from('guest_profiles')
    .select('*, profile:profiles!guest_profiles_id_fkey(full_name, email)')
    .eq('id', uid)
    .single()

  return data
}

export async function getGuestPasses(userId?: string) {
  const supabase = await createClient()
  const uid = userId ?? (await supabase.auth.getUser()).data.user?.id
  if (!uid) return []

  const { data } = await supabase
    .from('event_passes')
    .select('*')
    .eq('guest_id', uid)
    .order('issued_at', { ascending: false })

  return data ?? []
}

export async function getCreditHistory(userId?: string, limit = 30) {
  const supabase = await createClient()
  const uid = userId ?? (await supabase.auth.getUser()).data.user?.id
  if (!uid) return []

  const { data } = await supabase
    .from('credit_transactions')
    .select('*, event:events(title, date_start)')
    .eq('guest_id', uid)
    .order('created_at', { ascending: false })
    .limit(limit)

  return data ?? []
}

export async function getPublicEvents(limit = 20) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('events')
    .select('id, slug, title, description, venue_name, venue_address, secret_venue, date_start, date_end, capacity, cover_image_url, tags, ticket_price, registration_mode, is_private, category_id, organizer:profiles!events_organizer_id_fkey(id, full_name, company_name, username)')
    .eq('status', 'published')
    .eq('is_private', false)
    .gte('date_start', new Date().toISOString())
    .order('date_start', { ascending: true })
    .limit(limit)

  if (error) {
    // Fallback for pre-migration DBs where category_id doesn't exist yet
    const { data: fallback } = await supabase
      .from('events')
      .select('id, title, description, venue_name, venue_address, secret_venue, date_start, date_end, capacity, cover_image_url, tags, ticket_price, registration_mode, is_private, organizer:profiles!events_organizer_id_fkey(id, full_name, company_name, username)')
      .eq('status', 'published')
      .eq('is_private', false)
      .gte('date_start', new Date().toISOString())
      .order('date_start', { ascending: true })
      .limit(limit)
    return fallback ?? []
  }

  return data ?? []
}
