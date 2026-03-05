'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function registerForEvent(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const eventId = formData.get('eventId') as string
  const name    = formData.get('name')    as string
  const email   = formData.get('email')   as string
  const phone   = formData.get('phone')   as string

  if (!eventId || !name || !email) return { error: 'Missing required fields' }

  const { data: eventData } = await supabase
    .from('events')
    .select('id, title, capacity, registration_mode, organizer_id')
    .eq('id', eventId)
    .eq('status', 'published')
    .maybeSingle()

  const event = eventData as { id: string; title: string; capacity: number | null; registration_mode: string; organizer_id: string } | null
  if (!event) return { error: 'Event not found' }
  if (event.registration_mode !== 'open') return { error: 'This event requires an application' }

  if (event.capacity) {
    const { count } = await supabase
      .from('public_registrations')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .not('status', 'eq', 'rejected')
    if ((count ?? 0) >= event.capacity) return { error: 'This event is full' }
  }

  const { data: existing } = await supabase
    .from('public_registrations')
    .select('id')
    .eq('event_id', eventId)
    .eq('email', email)
    .not('status', 'eq', 'rejected')
    .maybeSingle()
  if (existing) return { error: 'You\'re already registered for this event' }

  const { error } = await supabase
    .from('public_registrations')
    .insert({
      event_id:  eventId,
      full_name: name,
      email:     email.toLowerCase().trim(),
      phone:     phone || null,
      status:    'approved',
      
      
    } as any)

  if (error) return { error: 'Could not complete registration. Please try again.' }

  await supabase.from('guests').insert({
    event_id: eventId,
    name,
    email:    email.toLowerCase().trim(),
    phone:    phone || null,
    status:   'registered',
    source:   'public_registration',
  } as any)

  await supabase.from('notifications').insert({
    user_id: event.organizer_id,
    type:    'new_registration',
    title:   'New Registration',
    body:    `${name} registered for ${event.title}`,
    data:    { event_id: eventId },
  } as any)

  revalidatePath(`/guest/explore/${eventId}`)
  revalidatePath('/guest/tikkit')
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
      event_id:  eventId,
      full_name: name,
      email:     email.toLowerCase().trim(),
      phone:     phone || null,
      notes:     note || null,
      status:    'pending',
    } as any)

  if (error) { console.error("EOI insert error:", JSON.stringify(error)); return { error: error.message ?? "Could not submit application. Please try again." } }

  await supabase.from('notifications').insert({
    user_id: event.organizer_id,
    type:    'eoi_submitted',
    title:   'New Application',
    body:    `${name} expressed interest in ${event.title}`,
    data:    { event_id: eventId },
  } as any)

  revalidatePath(`/guest/explore/${eventId}`)
  revalidatePath('/guest/tikkit')
  return { success: true }
}
