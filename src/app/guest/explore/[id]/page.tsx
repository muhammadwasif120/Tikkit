import { Suspense } from 'react'
import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import EventDetailClient from '@/components/guest/EventDetailClient'
import SkeletonEventDetail from '@/components/guest/SkeletonEventDetail'
import { getUserFavouriteEventIds } from '@/app/actions/eventFavouriteActions'
import { isUUID } from '@/lib/slugify'
import { stripHtml } from '@/lib/sanitize'

// ─── Resolve slug OR uuid to an event row ─────────────────────────────────────
async function resolveEvent(idOrSlug: string) {
  const supabase = await createClient()

  if (isUUID(idOrSlug)) {
    // Legacy UUID URL — look up by id, then redirect to slug URL
    const { data } = await supabase
      .from('events')
      .select('id, slug, status')
      .eq('id', idOrSlug)
      .single()
    const ev = data as any
    if (ev?.slug) redirect(`/guest/explore/${ev.slug}`)
    return ev // slug missing — fall through to UUID-based render
  }

  // Slug URL — look up by slug
  const { data } = await supabase
    .from('events')
    .select('id, slug, status')
    .eq('slug', idOrSlug)
    .single()
  return data as any
}

// ─── Metadata ─────────────────────────────────────────────────────────────────
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id: idOrSlug } = await params
  const supabase = await createClient()

  const eventId = idOrSlug
  if (!isUUID(idOrSlug)) {
    // Resolve slug → id
    const { data } = await supabase
      .from('events')
      .select('id, title, description, cover_image_url, slug')
      .eq('slug', idOrSlug)
      .single()
    if (!data) return { title: 'Event Not Found - Tikkit' }
    const ev = data as any
    return buildMetadata(ev, ev.slug || ev.id)
  }

  const { data } = await supabase
    .from('events')
    .select('id, title, description, cover_image_url, slug')
    .eq('id', eventId)
    .single()
  if (!data) return { title: 'Event Not Found - Tikkit' }
  const ev = data as any
  return buildMetadata(ev, ev.slug || ev.id)
}

function buildMetadata(ev: any, slugOrId: string): Metadata {
  const plainDescription = stripHtml(ev.description) || `Register for ${ev.title} on Tikkit.`
  return {
    title: `${ev.title} - Tikkit`,
    description: plainDescription,
    alternates: { canonical: `https://tikkitx.com/guest/explore/${slugOrId}` },
    openGraph: {
      title: ev.title,
      description: plainDescription,
      url: `https://tikkitx.com/guest/explore/${slugOrId}`,
      images: ev.cover_image_url ? [{ url: ev.cover_image_url }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: ev.title,
      description: plainDescription,
      images: ev.cover_image_url ? [ev.cover_image_url] : [],
    },
  }
}

// ─── Event Data ───────────────────────────────────────────────────────────────
async function EventData({ idOrSlug }: { idOrSlug: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Resolve the actual event id
  const resolved = await resolveEvent(idOrSlug)
  if (!resolved) notFound()
  const eventId = resolved.id

  const { data: event } = await supabase
    .from('events')
    .select(`
      id, title, description, venue_name, venue_address, secret_venue, venue_reveal_at,
      date_start, date_end, capacity, cover_image_url, tags, ticket_price, slug,
      registration_mode, is_private, status, category_id, organizer_id,
      organizer:profiles!events_organizer_id_fkey(id, full_name, company_name, avatar_url, logo_url, username)
    `)
    .eq('id', eventId)
    .single()

  const ev = event as any
  if (!ev || ev.status !== 'published') notFound()

  // Organizer join may return null if RLS blocks anonymous reads.
  if (!ev.organizer && ev.organizer_id) {
    const { data: orgRows } = await (supabase as any)
      .rpc('get_public_organizer_profile', { p_lookup: ev.organizer_id })
    ev.organizer = orgRows?.[0] ?? null
  }

  // Fetch payment accounts linked via junction table
  const { data: linkedAccounts } = await supabase
    .from('event_payment_accounts')
    .select('payment_account:payment_accounts(id, label, account_type, bank_name, account_title, account_number, instructions)')
    .eq('event_id', eventId)

  const paymentAccounts = (linkedAccounts ?? [])
    .map((r: any) => r.payment_account)
    .filter(Boolean)

  // Count registrations
  const { count: registeredCount } = await supabase
    .from('public_registrations')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId)
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
        .eq('event_id', eventId)
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
    isFavourited = favIds.includes(eventId)
  }

  const slugOrId = ev.slug || eventId

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
              description: stripHtml(enrichedEvent.description) || `Register for ${enrichedEvent.title} on Tikkit.`,
              image: enrichedEvent.cover_image_url ? [enrichedEvent.cover_image_url] : [],
              startDate: enrichedEvent.date_start,
              endDate: enrichedEvent.date_end,
              url: `https://tikkitx.com/guest/explore/${slugOrId}`,
              eventStatus: 'https://schema.org/EventScheduled',
              eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
              location: {
                '@type': 'Place',
                name: enrichedEvent.secret_venue ? 'Secret Venue' : enrichedEvent.venue_name || 'Venue TBA',
                address: enrichedEvent.secret_venue ? undefined : enrichedEvent.venue_address,
              },
              offers: {
                '@type': 'Offer',
                url: `https://tikkitx.com/guest/explore/${slugOrId}`,
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
        existingReg={existingReg as any}
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
      <EventData idOrSlug={id} />
    </Suspense>
  )
}
