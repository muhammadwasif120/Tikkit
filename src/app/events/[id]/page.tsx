import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import EventDetailClient from '@/components/guest/EventDetailClient'

export default async function EventDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: event } = await supabase
    .from('events')
    .select(`
      id, title, description, venue_name, venue_address, secret_venue, venue_reveal_at,
      date_start, date_end, capacity, cover_image_url, tags, ticket_price,
      registration_mode, is_private, status,
      organizer:profiles!events_organizer_id_fkey(full_name, company_name, avatar_url),
      payment_accounts(id, bank_name, account_title, account_number, account_name, is_default)
    `)
    .eq('id', params.id)
    .single()

  if (!event || event.status !== 'published') notFound()

  // Count registrations
  const { count: registeredCount } = await supabase
    .from('public_registrations')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', params.id)
    .not('status', 'in', '("rejected","cancelled")')

  // Check if current user already registered
  let existingReg = null
  if (user) {
    const { data: reg } = await supabase
      .from('public_registrations')
      .select('id, status, payment_status')
      .eq('event_id', params.id)
      .eq('email', user.email!)
      .not('status', 'in', '("rejected","cancelled")')
      .maybeSingle()
    existingReg = reg ?? null
  }

  // Sort payment accounts — default first
  const accounts = (event.payment_accounts ?? []).sort((a: any, b: any) =>
    b.is_default ? 1 : -1
  )

  const enrichedEvent = {
    ...event,
    registered_count: registeredCount ?? 0,
    payment_accounts: accounts,
  }

  return (
    <EventDetailClient
      event={enrichedEvent as any}
      existingReg={existingReg}
      isLoggedIn={!!user}
    />
  )
}
