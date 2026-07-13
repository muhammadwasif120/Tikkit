'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { createNotification, Notifications } from '@/lib/supabase/notifications'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'

export async function registerForEvent(formData: FormData) {
  const ip = await getClientIp()
  if (!(await checkRateLimit(`register:${ip}`, 5, 600_000))) {
    return { error: 'Too many registration attempts. Please try again later.' }
  }

  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { data: { user } } = await supabase.auth.getUser()

  const eventId        = formData.get('eventId')     as string
  const name           = formData.get('name')        as string
  const email          = formData.get('email')       as string
  const phone          = formData.get('phone')       as string
  const ticketDaysRaw  = formData.get('ticket_days') as string | null
  let ticketDays: string[] | null = null
  if (ticketDaysRaw) {
    try { ticketDays = JSON.parse(ticketDaysRaw) } catch { return { error: 'Invalid ticket selection' } }
  }

  if (!eventId || !name || !email) return { error: 'Missing required fields' }
  if (ticketDays !== null && ticketDays.length === 0) return { error: 'Please select at least one day' }

  const { data: eventData } = await supabase
    .from('events')
    .select('id, title, capacity, registration_mode, organizer_id')
    .eq('id', eventId)
    .eq('status', 'published')
    .maybeSingle()

  const event = eventData as { id: string; title: string; capacity: number | null; registration_mode: string; organizer_id: string } | null
  if (!event) return { error: 'Event not found' }
  if (event.registration_mode !== 'open') return { error: 'This event requires an application' }

  const [{ count: regCount }, { data: existing }] = await Promise.all([
    supabase
      .from('public_registrations')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .not('status', 'eq', 'rejected'),
    supabase
      .from('public_registrations')
      .select('id')
      .eq('event_id', eventId)
      .eq('email', email)
      .not('status', 'eq', 'rejected')
      .maybeSingle(),
  ])

  if (event.capacity && (regCount ?? 0) >= event.capacity) return { error: 'This event is full' }
  if (existing) return { error: 'You\'re already registered for this event' }

  const { error } = await supabase
    .from('public_registrations')
    .insert({
      event_id:    eventId,
      full_name:   name,
      email:       email.toLowerCase().trim(),
      phone:       phone || null,
      status:      'approved',
      ticket_days: ticketDays,
    } as any)

  if (error) return { error: 'Could not complete registration. Please try again.' }

  await supabase.from('guests').insert({
    event_id:    eventId,
    name,
    email:       email.toLowerCase().trim(),
    phone:       phone || null,
    status:      'registered',
    source:      'public_registration',
    ticket_days: ticketDays,
  } as any)

  await createNotification(Notifications.newRegistration(event.organizer_id, eventId, name, event.title))

  revalidatePath('/guest/explore/[id]', 'page')  // revalidates all event detail pages
  revalidatePath('/guest/tikkit')
  return { success: true }
}

export async function submitEOI(formData: FormData) {
  const ip = await getClientIp()
  if (!(await checkRateLimit(`eoi:${ip}`, 5, 600_000))) {
    return { error: 'Too many submission attempts. Please try again later.' }
  }

  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { data: { user } } = await supabase.auth.getUser()

  const eventId        = formData.get('eventId')     as string
  const name           = formData.get('name')        as string
  const email          = formData.get('email')       as string
  const phone          = formData.get('phone')       as string
  const note           = formData.get('note')        as string
  const ticketDaysRaw  = formData.get('ticket_days') as string | null
  let ticketDays: string[] | null = null
  if (ticketDaysRaw) {
    try { ticketDays = JSON.parse(ticketDaysRaw) } catch { return { error: 'Invalid ticket selection' } }
  }

  if (!eventId || !name || !email) return { error: 'Missing required fields' }
  if (ticketDays !== null && ticketDays.length === 0) return { error: 'Please select at least one day' }

  const { data: eventData } = await supabase
    .from('events')
    .select('id, title, organizer_id, registration_mode')
    .eq('id', eventId)
    .eq('status', 'published')
    .maybeSingle()

  const event = eventData as { id: string; title: string; organizer_id: string; registration_mode: string } | null
  if (!event) return { error: 'Event not found' }

  const { data: existing } = await supabase
    .from('public_registrations')
    .select('id')
    .eq('event_id', eventId)
    .eq('email', email)
    .not('status', 'eq', 'rejected')
    .maybeSingle()
  if (existing) return { error: 'You\'ve already applied for this event' }

  const { error } = await supabase
    .from('public_registrations')
    .insert({
      event_id:    eventId,
      full_name:   name,
      email:       email.toLowerCase().trim(),
      phone:       phone || null,
      notes:       note || null,
      status:      'pending',
      ticket_days: ticketDays,
    } as any)

  if (error) { console.error("EOI insert error:", JSON.stringify(error)); return { error: error.message ?? "Could not submit application. Please try again." } }

  await createNotification(Notifications.eoiSubmitted(event.organizer_id, eventId, name, event.title))

  revalidatePath('/guest/explore/[id]', 'page')  // revalidates all event detail pages
  revalidatePath('/guest/tikkit')
  return { success: true }
}
