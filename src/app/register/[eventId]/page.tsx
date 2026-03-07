import { createClient } from '@/lib/supabase/server'
import PublicRegistrationForm from '@/components/register/PublicRegistrationForm'
import { notFound } from 'next/navigation'

export default async function PublicRegistrationPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params
  const supabase = await createClient()

  const { data: event } = await supabase
    .from('events')
    .select('id, title, description, venue_name, date_start, date_end, capacity, registration_mode, require_id_verification, require_reference_code, secret_venue, status')
    .eq('id', eventId)
    .single()

  if (!event || event.status === 'cancelled') notFound()
  if (event.registration_mode === 'invite_only') notFound()

  // Check capacity
  const { count } = await supabase
    .from('guests')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId)
    .neq('status', 'cancelled')

  const isFull = event.capacity > 0 && (count ?? 0) >= event.capacity

  // Fetch ticket types for this event
  const { data: ticketTypes } = await supabase
    .from('ticket_types')
    .select('id, name, price, original_price, discount_type, discount_value, quantity, quantity_sold, is_vip')
    .eq('event_id', eventId)
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
          <PublicRegistrationForm event={event} ticketTypes={ticketTypes ?? []} />
        )}

        <p className="text-center text-xs text-gray-600">Powered by Tikkit</p>
      </div>
    </div>
  )
}
