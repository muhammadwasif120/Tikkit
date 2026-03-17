import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import EventDetailClient from '@/components/guest/EventDetailClient'
import SkeletonEventDetail from '@/components/guest/SkeletonEventDetail'
import { getUserFavouriteEventIds } from '@/app/actions/eventFavouriteActions'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('events')
    .select('title, description, cover_image_url')
    .eq('id', id)
    .single()

  const event = data as any;

  if (!event) return { title: 'Event Not Found - Tikkit' }

  return {
    title: `${event.title} - Tikkit`,
    description: event.description || `Register for ${event.title} on Tikkit.`,
    openGraph: {
      title: event.title,
      description: event.description || `Register for ${event.title} on Tikkit.`,
      images: event.cover_image_url ? [{ url: event.cover_image_url }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: event.title,
      description: event.description || `Register for ${event.title} on Tikkit.`,
      images: event.cover_image_url ? [event.cover_image_url] : [],
    },
  }
}

async function EventData({ id }: { id: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: event } = await supabase
    .from('events')
    .select(`
      id, title, description, venue_name, venue_address, secret_venue, venue_reveal_at,
      date_start, date_end, capacity, cover_image_url, tags, ticket_price,
      registration_mode, is_private, status, category_id, organizer_id,
      organizer:profiles!events_organizer_id_fkey(id, full_name, company_name, avatar_url, logo_url, username)
    `)
    .eq('id', id)
    .single()

  const ev = event as any
  if (!ev || ev.status !== 'published') notFound()

  // Organizer join may return null if RLS blocks anonymous reads.
  // Fall back to the SECURITY DEFINER RPC which bypasses RLS.
  if (!ev.organizer && ev.organizer_id) {
    const { data: orgRows } = await (supabase as any)
      .rpc('get_public_organizer_profile', { p_lookup: ev.organizer_id })
    ev.organizer = orgRows?.[0] ?? null
  }

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
  let isFavourited = false

  if (user) {
    const [profileRes, regRes, favIds] = await Promise.all([
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
      getUserFavouriteEventIds(),
    ])

    userProfile = {
      full_name: (profileRes.data as any)?.full_name ?? '',
      email: user.email ?? '',
    }
    existingReg = regRes.data ?? null
    isFavourited = favIds.includes(id)
  }

  const enrichedEvent = {
    ...(event as any),
    registered_count: registeredCount ?? 0,
    payment_accounts: paymentAccounts,
  }

  return (
    <>
      {typeof window === 'undefined' ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Event',
              name: enrichedEvent.title,
              description: enrichedEvent.description || `Register for ${enrichedEvent.title} on Tikkit.`,
              image: enrichedEvent.cover_image_url ? [enrichedEvent.cover_image_url] : [],
              startDate: enrichedEvent.date_start,
              endDate: enrichedEvent.date_end,
              eventStatus: 'https://schema.org/EventScheduled',
              eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
              location: {
                '@type': 'Place',
                name: enrichedEvent.secret_venue ? 'Secret Venue' : enrichedEvent.venue_name || 'Venue TBA',
                address: enrichedEvent.secret_venue ? undefined : enrichedEvent.venue_address,
              },
              offers: {
                '@type': 'Offer',
                url: `https://tikkitx.com/register/${id}`,
                price: enrichedEvent.ticket_price || 0,
                priceCurrency: 'PKR',
                availability: 'https://schema.org/InStock',
              },
              organizer: {
                '@type': 'Organization',
                name: enrichedEvent.organizer?.company_name || enrichedEvent.organizer?.full_name || 'Tikkit Organizer',
              },
            }),
          }}
        />
      ) : null}
      <EventDetailClient
        event={enrichedEvent as any}
        existingReg={existingReg}
        isLoggedIn={!!user}
        userProfile={userProfile}
        isFavourited={isFavourited}
      />
    </>
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
