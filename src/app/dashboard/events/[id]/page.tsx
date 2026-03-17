import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { CalendarDays, MapPin, Users, ArrowLeft, Archive } from 'lucide-react'
import Link from 'next/link'
import clsx from 'clsx'
import EventActions from '@/components/events/EventActions'
import GuestTable from '@/components/guests/GuestTable'
import EventPaymentSetup from '@/components/events/EventPaymentSetup'
import EventTicketTypes from '@/components/events/EventTicketTypes'
import EventCoverAndDescription from '@/components/events/EventCoverAndDescription'
import EventCategoryPicker from '@/components/events/EventCategoryPicker'
import DashboardLoader from '@/components/layout/DashboardLoader'

const statusBadge: Record<string, string> = {
  draft: 'badge-gray',
  published: 'badge-green',
  cancelled: 'badge-red',
  completed: 'badge-blue',
}

async function EventDetailData({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', (await params).id)
    .eq('organizer_id', user!.id)
    .single()

  if (!event) notFound()

  const isArchived = event.status === 'completed' || event.status === 'cancelled'

  const { data: guests } = await supabase
    .from('guests')
    .select('*')
    .eq('event_id', event.id)
    .order('created_at', { ascending: false })

  const { data: ticketTypes } = await supabase
    .from('ticket_types')
    .select('*')
    .eq('event_id', event.id)

  // Payment accounts — all saved by organizer
  const { data: allPaymentAccounts } = await supabase
    .from('payment_accounts')
    .select('*')
    .eq('organizer_id', user!.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  // Which accounts are already linked to this event
  const { data: linkedEPA } = await supabase
    .from('event_payment_accounts')
    .select('payment_account_id')
    .eq('event_id', event.id)

  const linkedAccountIds = (linkedEPA ?? []).map((r: any) => r.payment_account_id)

  const checkedIn = guests?.filter(g => g.status === 'checked_in').length ?? 0
  const total = guests?.length ?? 0

  return (
    <div className="max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <Link href="/dashboard/events" className="text-gray-400 hover:text-white transition-colors mt-1">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
                {event.title}
              </h2>
              <span className={clsx(statusBadge[event.status])}>{event.status}</span>
              {!event.is_public && <span className="badge-yellow">Private</span>}
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <CalendarDays className="w-3 h-3" />
                {format(new Date(event.date_start), 'MMM d, yyyy · h:mm a')}
              </span>
              {event.venue_name && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {event.venue_secret ? '🔒 Secret Venue' : event.venue_name}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {total} / {event.capacity} guests
              </span>
            </div>
          </div>
        </div>
        {/* Actions menu — hidden for archived events */}
        {!isArchived && <EventActions event={event} />}
      </div>

      {/* Archived banner */}
      {isArchived && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/3 border border-white/8 text-sm text-gray-400">
          <Archive className="w-4 h-4 shrink-0 text-gray-500" />
          <span>
            This event has ended and is now <span className="text-white font-medium">archived</span>. Analytics and guest records are available below.
          </span>
        </div>
      )}

      {/* Cover image + description — editing only for non-archived events */}
      <EventCoverAndDescription
        eventId={event.id}
        initialCoverUrl={event.cover_image_url ?? null}
        initialDescription={event.description ?? null}
        eventTitle={event.title}
        readOnly={isArchived}
      />

      {/* Category picker */}
      <EventCategoryPicker
        eventId={event.id}
        currentCategoryId={(event as any).category_id ?? null}
        isArchived={isArchived}
      />

      {/* Capacity bar */}
      <div className="card">
        <div className="flex items-center justify-between text-sm mb-3">
          <span className="text-gray-400">Capacity</span>
          <span className="text-white font-medium">{total} / {event.capacity}</span>
        </div>
        <div className="w-full bg-brand-charcoal-light rounded-full h-2">
          <div
            className="h-2 rounded-full bg-brand-blue transition-all"
            style={{ width: `${Math.min(100, (total / event.capacity) * 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-2">
          <span>{checkedIn} checked in</span>
          <span>{event.capacity - total} spots remaining</span>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Guests',  value: total },
          { label: 'Checked In',    value: checkedIn },
          { label: 'Ticket Types',  value: ticketTypes?.length ?? 0 },
          { label: 'Waitlisted',    value: guests?.filter(g => g.waitlist).length ?? 0 },
        ].map((s) => (
          <div key={s.label} className="card text-center py-4">
            <p className="text-2xl font-bold text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
              {s.value}
            </p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Ticket Tiers + Payment Setup — hidden for archived events */}
      {!isArchived && (
        <>
          <EventTicketTypes
            eventId={event.id}
            initialTicketTypes={ticketTypes ?? []}
          />
          <EventPaymentSetup
            eventId={event.id}
            allAccounts={allPaymentAccounts ?? []}
            linkedAccountIds={linkedAccountIds}
          />
        </>
      )}

      {/* Guest table — always visible, Add Guest hidden for archived events */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white text-sm" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Guest List
          </h3>
          {!isArchived && (
            <div className="flex gap-2">
              <Link
                href={`/dashboard/events/${event.id}/guests/add`}
                className="btn-primary text-xs px-3 py-2"
              >
                Add Guest
              </Link>
            </div>
          )}
        </div>
        <GuestTable guests={guests ?? []} eventId={event.id} />
      </div>
    </div>
  )
}

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<DashboardLoader variant="detail" />}>
      <EventDetailData params={params} />
    </Suspense>
  )
}