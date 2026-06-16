'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// ── Types ────────────────────────────────────────────────────────────────────

export type VenueCategory =
  | 'studio' | 'court' | 'hall' | 'rooftop' | 'garden' | 'restaurant'
  | 'cafe' | 'coworking' | 'gym' | 'pool' | 'theatre' | 'gallery' | 'other'

// ── Helpers ──────────────────────────────────────────────────────────────────

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

async function getAuthUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  return { supabase, user }
}

async function getVenueForUser(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data: venue } = await (supabase as any)
    .from('venues')
    .select('id, name, slug')
    .eq('owner_id', userId)
    .single()
  return venue as { id: string; name: string; slug: string } | null
}

// ── Venue Onboarding ─────────────────────────────────────────────────────────

export async function createVenue(fd: FormData) {
  const { supabase, user } = await getAuthUser()

  const name = (fd.get('name') as string).trim()
  const city = (fd.get('city') as string).trim()
  const categories = fd.getAll('categories') as VenueCategory[]

  let slug = slugify(name)
  // Ensure unique slug
  const { data: existing } = await (supabase as any)
    .from('venues')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()
  if (existing) slug = `${slug}-${Date.now()}`

  const { data: venue, error } = await (supabase as any)
    .from('venues')
    .insert({
      owner_id:    user.id,
      name,
      slug,
      city,
      categories:  categories.length > 0 ? categories : ['other'],
      address:     (fd.get('address') as string)?.trim() || null,
      description: (fd.get('description') as string)?.trim() || null,
      phone:       (fd.get('phone') as string)?.trim() || null,
      capacity:    fd.get('capacity') ? parseInt(fd.get('capacity') as string) : null,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }
  redirect('/venue/os')
}

export async function updateVenue(fd: FormData) {
  const { supabase, user } = await getAuthUser()
  const venue = await getVenueForUser(supabase, user.id)
  if (!venue) return { error: 'Venue not found' }

  const { error } = await (supabase as any)
    .from('venues')
    .update({
      name:        (fd.get('name') as string)?.trim(),
      city:        (fd.get('city') as string)?.trim(),
      categories:  (fd.getAll('categories') as VenueCategory[]),
      address:     (fd.get('address') as string)?.trim() || null,
      description: (fd.get('description') as string)?.trim() || null,
      phone:       (fd.get('phone') as string)?.trim() || null,
      instagram:   (fd.get('instagram') as string)?.trim() || null,
      website:     (fd.get('website') as string)?.trim() || null,
      capacity:    fd.get('capacity') ? parseInt(fd.get('capacity') as string) : null,
    })
    .eq('id', venue.id)

  revalidatePath('/venue/os/settings')
  return { error: error?.message ?? null }
}

// ── Programmes ───────────────────────────────────────────────────────────────

export async function createProgramme(fd: FormData) {
  const { supabase, user } = await getAuthUser()
  const venue = await getVenueForUser(supabase, user.id)
  if (!venue) return { error: 'Venue not found' }

  const { data: programme, error } = await (supabase as any)
    .from('programmes')
    .insert({
      venue_id:             venue.id,
      title:                (fd.get('title') as string).trim(),
      description:          (fd.get('description') as string)?.trim() || null,
      category:             fd.get('category') as string || 'experience',
      rrule:                (fd.get('rrule') as string)?.trim() || null,
      start_time:           fd.get('start_time') as string,
      duration_mins:        parseInt(fd.get('duration_mins') as string) || 60,
      capacity:             parseInt(fd.get('capacity') as string) || 20,
      price:                parseFloat(fd.get('price') as string) || 0,
      tags:                 (fd.get('tags') as string)?.split(',').map(t => t.trim()).filter(Boolean) ?? [],
      spot_booking_enabled: fd.get('spot_booking_enabled') === 'true',
    })
    .select('id')
    .single()

  if (error) return { error: error.message }
  redirect(`/venue/os/programmes/${programme.id}`)
}

export async function updateProgramme(programmeId: string, fd: FormData) {
  const { supabase, user } = await getAuthUser()
  const venue = await getVenueForUser(supabase, user.id)
  if (!venue) return { error: 'Venue not found' }

  const { error } = await (supabase as any)
    .from('programmes')
    .update({
      title:                (fd.get('title') as string).trim(),
      description:          (fd.get('description') as string)?.trim() || null,
      category:             fd.get('category') as string,
      rrule:                (fd.get('rrule') as string)?.trim() || null,
      start_time:           fd.get('start_time') as string,
      duration_mins:        parseInt(fd.get('duration_mins') as string) || 60,
      capacity:             parseInt(fd.get('capacity') as string) || 20,
      price:                parseFloat(fd.get('price') as string) || 0,
      tags:                 (fd.get('tags') as string)?.split(',').map(t => t.trim()).filter(Boolean) ?? [],
    })
    .eq('id', programmeId)
    .eq('venue_id', venue.id)

  revalidatePath(`/venue/os/programmes/${programmeId}`)
  return { error: error?.message ?? null }
}

export async function toggleProgrammeActive(programmeId: string, active: boolean) {
  const { supabase, user } = await getAuthUser()
  const venue = await getVenueForUser(supabase, user.id)
  if (!venue) return { error: 'Venue not found' }

  const { error } = await (supabase as any)
    .from('programmes')
    .update({ active })
    .eq('id', programmeId)
    .eq('venue_id', venue.id)

  revalidatePath('/venue/os/programmes')
  return { error: error?.message ?? null }
}

export async function generateInstances(programmeId: string, dates: string[]) {
  const { supabase, user } = await getAuthUser()
  const venue = await getVenueForUser(supabase, user.id)
  if (!venue) return { error: 'Venue not found' }

  const rows = dates.map(date => ({
    programme_id: programmeId,
    date,
    status: 'scheduled',
  }))

  const { error } = await (supabase as any)
    .from('programme_instances')
    .upsert(rows, { onConflict: 'programme_id,date', ignoreDuplicates: true })

  revalidatePath(`/venue/os/programmes/${programmeId}`)
  return { error: error?.message ?? null }
}

export async function updateInstanceStatus(instanceId: string, status: string) {
  const { supabase, user } = await getAuthUser()
  const venue = await getVenueForUser(supabase, user.id)
  if (!venue) return { error: 'Venue not found' }

  const { error } = await (supabase as any)
    .from('programme_instances')
    .update({ status })
    .eq('id', instanceId)

  revalidatePath('/venue/os/programmes')
  return { error: error?.message ?? null }
}

// ── Resources (Slot Booking) ──────────────────────────────────────────────────

export async function createResource(fd: FormData) {
  const { supabase, user } = await getAuthUser()
  const venue = await getVenueForUser(supabase, user.id)
  if (!venue) return { error: 'Venue not found' }

  const activeDaysRaw = fd.getAll('active_days') as string[]
  const activeDays = activeDaysRaw.map(Number)

  const { data: resource, error } = await (supabase as any)
    .from('resources')
    .insert({
      venue_id:           venue.id,
      name:               (fd.get('name') as string).trim(),
      description:        (fd.get('description') as string)?.trim() || null,
      resource_type:      fd.get('resource_type') as string || 'space',
      duration_unit_mins: parseInt(fd.get('duration_unit_mins') as string) || 60,
      price_per_slot:     parseFloat(fd.get('price_per_slot') as string) || 0,
      buffer_mins:        parseInt(fd.get('buffer_mins') as string) || 0,
      max_advance_days:   parseInt(fd.get('max_advance_days') as string) || 30,
      min_notice_hours:   parseInt(fd.get('min_notice_hours') as string) || 2,
      open_time:          fd.get('open_time') as string || '08:00',
      close_time:         fd.get('close_time') as string || '22:00',
      active_days:        activeDays.length > 0 ? activeDays : [1,2,3,4,5,6,7],
      capacity:           parseInt(fd.get('capacity') as string) || 1,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }
  redirect('/venue/os/slots')
}

export async function updateResource(resourceId: string, fd: FormData) {
  const { supabase, user } = await getAuthUser()
  const venue = await getVenueForUser(supabase, user.id)
  if (!venue) return { error: 'Venue not found' }

  const activeDaysRaw = fd.getAll('active_days') as string[]
  const activeDays = activeDaysRaw.map(Number)

  const { error } = await (supabase as any)
    .from('resources')
    .update({
      name:               (fd.get('name') as string).trim(),
      description:        (fd.get('description') as string)?.trim() || null,
      resource_type:      fd.get('resource_type') as string,
      duration_unit_mins: parseInt(fd.get('duration_unit_mins') as string) || 60,
      price_per_slot:     parseFloat(fd.get('price_per_slot') as string) || 0,
      buffer_mins:        parseInt(fd.get('buffer_mins') as string) || 0,
      open_time:          fd.get('open_time') as string,
      close_time:         fd.get('close_time') as string,
      active_days:        activeDays.length > 0 ? activeDays : [1,2,3,4,5,6,7],
      capacity:           parseInt(fd.get('capacity') as string) || 1,
    })
    .eq('id', resourceId)
    .eq('venue_id', venue.id)

  revalidatePath('/venue/os/slots')
  return { error: error?.message ?? null }
}

export async function deleteResource(resourceId: string) {
  const { supabase, user } = await getAuthUser()
  const venue = await getVenueForUser(supabase, user.id)
  if (!venue) return { error: 'Venue not found' }

  const { error } = await (supabase as any)
    .from('resources')
    .update({ active: false })
    .eq('id', resourceId)
    .eq('venue_id', venue.id)

  revalidatePath('/venue/os/slots')
  return { error: error?.message ?? null }
}

export async function confirmSlotBooking(bookingId: string) {
  const { supabase, user } = await getAuthUser()
  const venue = await getVenueForUser(supabase, user.id)
  if (!venue) return { error: 'Venue not found' }

  const { error } = await (supabase as any)
    .from('slot_bookings')
    .update({ status: 'confirmed' })
    .eq('id', bookingId)

  revalidatePath('/venue/os/slots')
  return { error: error?.message ?? null }
}

// ── Spot Maps ─────────────────────────────────────────────────────────────────

export type SpotItem = {
  id: string
  label: string
  type: 'table' | 'booth' | 'row' | 'stage' | 'bar' | 'zone'
  x: number
  y: number
  w: number
  h: number
  capacity: number
  surcharge: number
}

export async function saveSpotMap(
  venueId: string,
  mapId: string | null,
  name: string,
  layout: SpotItem[],
  canvasWidth: number,
  canvasHeight: number
) {
  const { supabase, user } = await getAuthUser()
  const venue = await getVenueForUser(supabase, user.id)
  if (!venue || venue.id !== venueId) return { error: 'Venue not found' }

  if (mapId) {
    const { error } = await (supabase as any)
      .from('spot_maps')
      .update({ name, layout_json: layout, canvas_width: canvasWidth, canvas_height: canvasHeight })
      .eq('id', mapId)
      .eq('venue_id', venueId)
    revalidatePath('/venue/os/spot-map')
    return { error: error?.message ?? null }
  } else {
    const { data, error } = await (supabase as any)
      .from('spot_maps')
      .insert({ venue_id: venueId, name, layout_json: layout, canvas_width: canvasWidth, canvas_height: canvasHeight })
      .select('id')
      .single()
    revalidatePath('/venue/os/spot-map')
    return { error: error?.message ?? null, id: data?.id ?? null }
  }
}

export async function bookSpot(
  spotMapId: string,
  spotId: string,
  instanceId: string,
  partySize: number,
  surcharge: number
) {
  const { supabase, user } = await getAuthUser()

  // Check not already taken
  const { data: existing } = await (supabase as any)
    .from('spot_bookings')
    .select('id')
    .eq('spot_map_id', spotMapId)
    .eq('spot_id', spotId)
    .eq('instance_id', instanceId)
    .eq('status', 'confirmed')
    .maybeSingle()

  if (existing) return { error: 'This spot was just taken — please choose another.' }

  // Remove any previous spot booking by this user for this instance
  await (supabase as any)
    .from('spot_bookings')
    .delete()
    .eq('spot_map_id', spotMapId)
    .eq('instance_id', instanceId)
    .eq('user_id', user.id)

  const { error } = await (supabase as any)
    .from('spot_bookings')
    .insert({
      spot_map_id: spotMapId,
      spot_id:     spotId,
      instance_id: instanceId,
      user_id:     user.id,
      party_size:  partySize,
      surcharge,
      status:      'confirmed',
    })

  return { error: error?.message ?? null }
}

export async function cancelSpotBooking(spotMapId: string, instanceId: string) {
  const { supabase, user } = await getAuthUser()

  const { error } = await (supabase as any)
    .from('spot_bookings')
    .delete()
    .eq('spot_map_id', spotMapId)
    .eq('instance_id', instanceId)
    .eq('user_id', user.id)

  return { error: error?.message ?? null }
}

// ── Guest: Enquiries ─────────────────────────────────────────────────────────

export async function createVenueEnquiry(fd: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { error, data } = await (supabase as any)
    .from('venue_enquiries')
    .insert({
      venue_id:     fd.get('venue_id') as string,
      programme_id: (fd.get('programme_id') as string) || null,
      resource_id:  (fd.get('resource_id') as string) || null,
      guest_id:     user?.id ?? null,
      guest_name:   (fd.get('guest_name') as string).trim(),
      guest_phone:  (fd.get('guest_phone') as string)?.trim() || null,
      message:      (fd.get('message') as string).trim(),
    })
    .select('id')
    .single()

  return { error: error?.message ?? null, id: data?.id ?? null }
}

// ── Guest: Programme Registrations ───────────────────────────────────────────

export async function createProgrammeRegistrations(
  programmeId: string,
  venueId: string,
  instanceIds: string[],
  guestName: string,
  guestPhone: string,
  guestCount: number,
  pricePerSession: number,
  notes: string,
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Please sign in to register.' }

  const rows = instanceIds.map(instanceId => ({
    programme_id: programmeId,
    instance_id:  instanceId || null,
    venue_id:     venueId,
    user_id:      user.id,
    guest_name:   guestName.trim(),
    guest_phone:  guestPhone?.trim() || null,
    guest_count:  guestCount,
    total_price:  pricePerSession * guestCount,
    notes:        notes?.trim() || null,
  }))

  const { error, data } = await (supabase as any)
    .from('programme_registrations')
    .insert(rows)
    .select('id, qr_token')

  if (error) return { error: error.message }
  revalidatePath('/guest/my-tikkit')
  return { error: null, registrations: data as { id: string; qr_token: string }[] }
}

export async function createProgrammeRegistration(fd: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Please sign in to register.' }

  const programmeId = fd.get('programme_id') as string
  const guestCount  = parseInt(fd.get('guest_count') as string) || 1
  const price       = parseFloat(fd.get('total_price') as string) || 0

  const { error, data } = await (supabase as any)
    .from('programme_registrations')
    .insert({
      programme_id: programmeId,
      instance_id:  (fd.get('instance_id') as string) || null,
      venue_id:     fd.get('venue_id') as string,
      user_id:      user.id,
      guest_name:   (fd.get('guest_name') as string).trim(),
      guest_phone:  (fd.get('guest_phone') as string)?.trim() || null,
      guest_count:  guestCount,
      total_price:  price,
      notes:        (fd.get('notes') as string)?.trim() || null,
    })
    .select('id, qr_token')
    .single()

  if (error) return { error: error.message }
  revalidatePath('/guest/my-tikkit')
  return { error: null, id: data.id, qr_token: data.qr_token }
}

// ── Guest: Slot Bookings (resource) ──────────────────────────────────────────

export async function createSlotBookingGuest(fd: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Please sign in to book.' }

  const resourceId  = fd.get('resource_id') as string
  const date        = fd.get('date') as string
  const startTime   = fd.get('start_time') as string
  const endTime     = fd.get('end_time') as string
  const durationMins = parseInt(fd.get('duration_mins') as string)
  const totalPrice  = parseFloat(fd.get('total_price') as string) || 0

  // Check for conflicts
  const { data: conflict } = await (supabase as any)
    .from('slot_bookings')
    .select('id')
    .eq('resource_id', resourceId)
    .eq('date', date)
    .eq('start_time', startTime)
    .in('status', ['pending', 'confirmed'])
    .maybeSingle()

  if (conflict) return { error: 'This slot was just booked. Please choose another time.' }

  const { error, data } = await (supabase as any)
    .from('slot_bookings')
    .insert({
      resource_id:   resourceId,
      user_id:       user.id,
      date,
      start_time:    startTime,
      end_time:      endTime,
      duration_mins: durationMins,
      guest_count:   parseInt(fd.get('guest_count') as string) || 1,
      total_price:   totalPrice,
      notes:         (fd.get('notes') as string)?.trim() || null,
    })
    .select('id, qr_token')
    .single()

  if (error) return { error: error.message }
  revalidatePath('/guest/my-tikkit')
  return { error: null, id: data.id, qr_token: data.qr_token }
}

export async function cancelSlotBookingGuest(bookingId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await (supabase as any)
    .from('slot_bookings')
    .update({ status: 'cancelled' })
    .eq('id', bookingId)
    .eq('user_id', user.id)
    .eq('status', 'pending')

  revalidatePath('/guest/my-tikkit')
  return { error: error?.message ?? null }
}

export async function cancelProgrammeRegistration(registrationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await (supabase as any)
    .from('programme_registrations')
    .update({ status: 'cancelled' })
    .eq('id', registrationId)
    .eq('user_id', user.id)
    .eq('status', 'pending')

  revalidatePath('/guest/my-tikkit')
  return { error: error?.message ?? null }
}

// ── Venue OS: Enquiry Management ─────────────────────────────────────────────

export async function markEnquiryRead(enquiryId: string) {
  const { supabase, user } = await getAuthUser()
  const venue = await getVenueForUser(supabase, user.id)
  if (!venue) return { error: 'Venue not found' }

  await (supabase as any)
    .from('venue_enquiries')
    .update({ status: 'read' })
    .eq('id', enquiryId)
    .eq('venue_id', venue.id)
    .eq('status', 'new')

  revalidatePath('/venue/os/enquiries')
  return { error: null }
}

export async function replyToEnquiry(enquiryId: string, reply: string) {
  const { supabase, user } = await getAuthUser()
  const venue = await getVenueForUser(supabase, user.id)
  if (!venue) return { error: 'Venue not found' }

  const { error } = await (supabase as any)
    .from('venue_enquiries')
    .update({ reply: reply.trim(), status: 'replied', replied_at: new Date().toISOString() })
    .eq('id', enquiryId)
    .eq('venue_id', venue.id)

  revalidatePath('/venue/os/enquiries')
  return { error: error?.message ?? null }
}

export async function archiveEnquiry(enquiryId: string) {
  const { supabase, user } = await getAuthUser()
  const venue = await getVenueForUser(supabase, user.id)
  if (!venue) return { error: 'Venue not found' }

  await (supabase as any)
    .from('venue_enquiries')
    .update({ status: 'archived' })
    .eq('id', enquiryId)
    .eq('venue_id', venue.id)

  revalidatePath('/venue/os/enquiries')
  return { error: null }
}

export async function confirmSlotBookingVenue(bookingId: string) {
  const { supabase, user } = await getAuthUser()
  const venue = await getVenueForUser(supabase, user.id)
  if (!venue) return { error: 'Venue not found' }

  const { error } = await (supabase as any)
    .from('slot_bookings')
    .update({ status: 'confirmed' })
    .eq('id', bookingId)

  revalidatePath('/venue/os/enquiries')
  return { error: error?.message ?? null }
}

export async function confirmProgrammeRegistration(regId: string) {
  const { supabase, user } = await getAuthUser()
  const venue = await getVenueForUser(supabase, user.id)
  if (!venue) return { error: 'Venue not found' }

  const { error } = await (supabase as any)
    .from('programme_registrations')
    .update({ status: 'confirmed' })
    .eq('id', regId)

  revalidatePath('/venue/os/enquiries')
  return { error: error?.message ?? null }
}

// ── Public: Experiences for Guest Explore ────────────────────────────────────

export async function getExperiencesForExplore(limit = 12) {
  const supabase = await createClient()
  const today = new Date().toISOString().slice(0, 10)
  const in14days = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  // Get active programmes that have upcoming instances
  const { data: instances } = await (supabase as any)
    .from('programme_instances')
    .select('programme_id, date')
    .gte('date', today)
    .lte('date', in14days)
    .eq('status', 'scheduled')
    .order('date', { ascending: true })
    .limit(50)

  if (!instances || instances.length === 0) return []

  const progIds = [...new Set((instances as any[]).map((i: any) => i.programme_id))] as string[]

  const { data: programmes } = await (supabase as any)
    .from('programmes')
    .select('id, title, description, category, start_time, duration_mins, price, cover_image, tags, venue_id')
    .in('id', progIds)
    .eq('active', true)
    .limit(limit)

  if (!programmes || programmes.length === 0) return []

  const venueIds = [...new Set((programmes as any[]).map((p: any) => p.venue_id))] as string[]

  const { data: venues } = await (supabase as any)
    .from('venues')
    .select('id, name, slug, city, categories')
    .in('id', venueIds)
    .eq('active', true)

  const venueMap: Record<string, any> = {}
  for (const v of (venues ?? [])) venueMap[v.id] = v

  const instanceMap: Record<string, string[]> = {}
  for (const inst of instances) {
    ;(instanceMap[inst.programme_id] ??= []).push(inst.date)
  }

  return (programmes as any[]).map((p: any) => ({
    ...p,
    venue: venueMap[p.venue_id] ?? null,
    next_dates: (instanceMap[p.id] ?? []).slice(0, 3),
  }))
}

export async function getVenuesForExplore(limit = 10) {
  const supabase = await createClient()

  const { data: venues } = await (supabase as any)
    .from('venues')
    .select('id, name, slug, city, categories, photos, capacity')
    .eq('active', true)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (!venues || venues.length === 0) return []

  // Count programmes and resources per venue
  const venueIds = (venues as any[]).map((v: any) => v.id) as string[]

  const [{ data: progCounts }, { data: resCounts }] = await Promise.all([
    (supabase as any)
      .from('programmes')
      .select('venue_id')
      .in('venue_id', venueIds)
      .eq('active', true),
    (supabase as any)
      .from('resources')
      .select('venue_id')
      .in('venue_id', venueIds)
      .eq('active', true),
  ])

  const progMap: Record<string, number> = {}
  for (const p of (progCounts ?? [])) progMap[p.venue_id] = (progMap[p.venue_id] ?? 0) + 1

  const resMap: Record<string, number> = {}
  for (const r of (resCounts ?? [])) resMap[r.venue_id] = (resMap[r.venue_id] ?? 0) + 1

  return (venues as any[]).map((v: any) => ({
    ...v,
    programme_count: progMap[v.id] ?? 0,
    resource_count: resMap[v.id] ?? 0,
  }))
}
