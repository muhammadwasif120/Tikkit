import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import EventDetailClient from '@/components/guest/EventDetailClient'
import SkeletonEventDetail from '@/components/guest/SkeletonEventDetail'

async function EventData({ id }: { id: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: event } = await supabase
    .from('events')
    .select(`
      id, title, description, venue_name, venue_address, secret_venue, venue_reveal_at,
      date_start, date_end, capacity, cover_image_url, tags, ticket_price,
      registration_mode, is_private, status,
      organizer:profiles!events_organizer_id_fkey(full_name, company_name, avatar_url)
    `)
    .eq('id', id)
    .single()

  if (!event || event.status !== 'published') notFound()

  // Fetch payment accounts linked via junction table
  const { data: linkedAccounts } = await supabase
    .from('event_payment_accounts')
    .select('payment_account:payment_accounts(id, label, account_type, bank_name, account_title, account_number, instructions)')
    .eq('event_id', id)

  const paymentAccounts = (linkedAccounts ?? [])
    .map((r: any) => r.payment_account)
    .filter(Boolean)

  // Count registrations
  const { count: registeredCount } = await supabase
    .from('public_registrations')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', id)
    .not('status', 'eq', 'rejected')

  // Fetch user profile for one-tap registration
  let userProfile = null
  let existingReg = null

  if (user) {
    const [profileRes, regRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single(),
      supabase
        .from('public_registrations')
        .select('id, status, payment_status')
        .eq('event_id', id)
        .eq('email', user.email!)
        .not('status', 'eq', 'rejected')
        .maybeSingle(),
    ])

    userProfile = {
      full_name: profileRes.data?.full_name ?? '',
      email: user.email ?? '',
    }
    existingReg = regRes.data ?? null
  }

  const enrichedEvent = {
    ...event,
    registered_count: registeredCount ?? 0,
    payment_accounts: paymentAccounts,
  }

  return (
    <EventDetailClient
      event={enrichedEvent as any}
      existingReg={existingReg}
      isLoggedIn={!!user}
      userProfile={userProfile}
    />
  )
}

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <Suspense fallback={<SkeletonEventDetail />}>
      <EventData id={id} />
    </Suspense>
  )
}
