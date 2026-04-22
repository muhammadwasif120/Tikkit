import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import PublicRegistrationForm from '@/components/register/PublicRegistrationForm'
import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'
import CyberLoader from '@/components/guest/CyberLoader'

export async function generateMetadata({ params }: { params: Promise<{ eventId: string }> }): Promise<Metadata> {
  const { eventId } = await params
  const supabase = await createClient()
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(eventId);

  const { data } = await supabase
    .from('events')
    .select('title, description, cover_image_url')
    .eq(isUUID ? 'id' : 'slug', eventId)
    .single()

  const event = data as any;

  if (!event) return { title: 'Registration Not Found' }

  return {
    title: `Register for ${event.title} — Tikkit`,
    description: event.description || `Secure your spot for ${event.title}. Register now on Tikkit — Pakistan's event ticketing platform.`,
    alternates: { canonical: `https://www.tikkitx.com/register/${eventId}` },
    openGraph: {
      title: `Register for ${event.title}`,
      description: event.description || `Secure your spot for ${event.title} on Tikkit.`,
      images: event.cover_image_url ? [{ url: event.cover_image_url, width: 1200, height: 630 }] : [{ url: '/og-image.jpg', width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      site: '@tikkitx',
      title: `Register for ${event.title}`,
      description: event.description || `Secure your spot for ${event.title} on Tikkit.`,
      images: event.cover_image_url ? [event.cover_image_url] : ['/og-image.jpg'],
    },
  }
}

async function RegistrationData({ eventId }: { eventId: string }) {
  const supabase = await createClient()

  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(eventId);

  const { data } = await supabase
    .from('events')
    .select('id, title, description, venue_name, date_start, date_end, capacity, registration_mode, require_id_verification, require_reference_code, secret_venue, status')
    .eq(isUUID ? 'id' : 'slug', eventId)
    .single()

  const event = data as any;

  if (!event || event.status === 'cancelled') notFound()
  if (event.registration_mode === 'invite_only') notFound()

  // If attendee is logged in, redirect them seamlessly to the native app interface
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role === 'guest') {
      redirect(`/guest/explore/${event.id}`)
    }
  }

  // Check capacity using the resolved event.id instead of the parameter
  const { count } = await supabase
    .from('guests')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', event.id)
    .neq('status', 'cancelled')

  const isFull = event.capacity > 0 && (count ?? 0) >= event.capacity

  // Fetch ticket types for this event
  const { data: ticketTypes } = await supabase
    .from('ticket_types')
    .select('id, name, price, original_price, discount_type, discount_value, quantity, quantity_sold, is_vip')
    .eq('event_id', event.id)
    .order('price', { ascending: true })

  return (
    <div className="min-h-screen bg-[#0F1117] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-10 h-10 bg-[#1E5EFF] rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.5px' }}>
            {event.title}
          </h1>
          {event.description && <p className="text-gray-400 text-sm">{event.description}</p>}
          <div className="flex items-center justify-center gap-4 text-xs text-gray-500 pt-1">
            {event.date_start && (
              <span>📅 {new Date(event.date_start).toLocaleDateString('en-PK', { dateStyle: 'medium' })}</span>
            )}
            {!event.secret_venue && event.venue_name && <span>📍 {event.venue_name}</span>}
          </div>
        </div>

        {isFull ? (
          <div className="bg-[#1a1d27] border border-white/10 rounded-2xl p-8 text-center">
            <p className="text-2xl mb-2">😔</p>
            <p className="text-white font-semibold" style={{ fontFamily: 'var(--font-display)' }}>Event is Full</p>
            <p className="text-gray-400 text-sm mt-1">No more spots available for this event.</p>
          </div>
        ) : (
          <PublicRegistrationForm event={event} ticketTypes={(ticketTypes ?? []).map((t: any) => ({ ...t, price: t.price ?? 0 }))} />
        )}

        {typeof window === 'undefined' ? (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'Event',
                name: event.title,
                description: event.description || `Register for ${event.title} on Tikkit.`,
                startDate: event.date_start,
                endDate: event.date_end,
                eventStatus: event.status === 'cancelled' ? 'https://schema.org/EventCancelled' : 'https://schema.org/EventScheduled',
                eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
                location: {
                  '@type': 'Place',
                  name: event.secret_venue ? 'Secret Venue' : event.venue_name || 'Venue TBA',
                },
                offers: {
                  '@type': 'Offer',
                  url: `https://tikkitx.com/register/${eventId}`,
                  availability: isFull ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
                },
              }),
            }}
          />
        ) : null}

        <p className="text-center text-xs text-gray-600">Powered by <span className="font-semibold text-gray-500">TIKKIT X</span></p>
      </div>
    </div>
  )
}

export default async function PublicRegistrationPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params
  return (
    <Suspense fallback={<CyberLoader />}>
      <RegistrationData eventId={eventId} />
    </Suspense>
  )
}
