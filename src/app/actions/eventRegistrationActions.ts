'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function registerForEvent(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const eventId  = formData.get('eventId')  as string
  const name     = formData.get('name')     as string
  const email    = formData.get('email')    as string
  const phone    = formData.get('phone')    as string

  if (!eventId || !name || !email) return { error: 'Missing required fields' }

  // Check event exists + is open
  const { data: event } = await supabase
    .from('events')
    .select('id, title, capacity, registration_mode, organizer_id')
    .eq('id', eventId)
    .eq('status', 'published')
    .single()

  if (!event) return { error: 'Event not found' }
  if (event.registration_mode !== 'open') return { error: 'This event requires an application' }

  // Check capacity
  if (event.capacity) {
    const { count } = await supabase
      .from('public_registrations')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .not('status', 'in', '("rejected","cancelled")')
    if ((count ?? 0) >= event.capacity) return { error: 'This event is full' }
  }

  // Check duplicate
  const { data: existing } = await supabase
    .from('public_registrations')
    .select('id')
    .eq('event_id', eventId)
    .eq('email', email)
    .not('status', 'in', '("rejected","cancelled")')
    .maybeSingle()
  if (existing) return { error: 'You\'re already registered for this event' }

  // Insert registration
  const { error } = await supabase
    .from('public_registrations')
    .insert({
      event_id:   eventId,
      full_name:  name,
      email:      email.toLowerCase().trim(),
      phone:      phone || null,
      status:     'registered',
      source:     'web',
      guest_id:   user?.id ?? null,
    })

  if (error) {
    console.error('Registration error:', error)
    return { error: 'Could not complete registration. Please try again.' }
  }

  // Also create guest record
  await supabase.from('guests').insert({
    event_id: eventId,
    name:     name,
    email:    email.toLowerCase().trim(),
    phone:    phone || null,
    status:   'registered',
    source:   'public_registration',
  })

  // Notify organizer
  await supabase.from('notifications').insert({
    user_id: event.organizer_id,
    type:    'new_registration',
    title:   'New Registration',
    body:    `${name} registered for ${event.title}`,
    data:    { event_id: eventId },
  })

  revalidatePath(`/events/${eventId}`)
  revalidatePath('/guest/events')
  return { success: true }
}

export async function submitEOI(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const eventId = formData.get('eventId') as string
  const name    = formData.get('name')    as string
  const email   = formData.get('email')   as string
  const phone   = formData.get('phone')   as string
  const note    = formData.get('note')    as string

  if (!eventId || !name || !email) return { error: 'Missing required fields' }

  const { data: event } = await supabase
    .from('events')
    .select('id, title, organizer_id, registration_mode')
    .eq('id', eventId)
    .eq('status', 'published')
    .single()

  if (!event) return { error: 'Event not found' }

  // Check duplicate
  const { data: existing } = await supabase
    .from('public_registrations')
    .select('id')
    .eq('event_id', eventId)
    .eq('email', email)
    .not('status', 'in', '("rejected","cancelled")')
    .maybeSingle()
  if (existing) return { error: 'You\'ve already applied for this event' }

  const { error } = await supabase
    .from('public_registrations')
    .insert({
      event_id:  eventId,
      full_name: name,
      email:     email.toLowerCase().trim(),
      phone:     phone || null,
      notes:     note || null,
      status:    'eoi_submitted',
      source:    'web',
      guest_id:  user?.id ?? null,
    })

  if (error) {
    console.error('EOI error:', error)
    return { error: 'Could not submit application. Please try again.' }
  }

  // Notify organizer
  await supabase.from('notifications').insert({
    user_id: event.organizer_id,
    type:    'eoi_submitted',
    title:   'New Application',
    body:    `${name} expressed interest in ${event.title}`,
    data:    { event_id: eventId },
  })

  revalidatePath(`/events/${eventId}`)
  revalidatePath('/guest/events')
  return { success: true }
}
