import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { CalendarDays, MapPin, Users, ArrowLeft, Archive } from 'lucide-react'
import { getEffectiveStatus } from '@/lib/eventStatus'
import Link from 'next/link'
import clsx from 'clsx'
import EventActions from '@/components/events/EventActions'
import GuestTable from '@/components/guests/GuestTable'
import EventPaymentSetup from '@/components/events/EventPaymentSetup'
import EventTicketTypes from '@/components/events/EventTicketTypes'
import EventCoverAndDescription from '@/components/events/EventCoverAndDescription'
import DashboardLoader from '@/components/layout/DashboardLoader'

const STATUS_CONFIG: Record<string, { bg: string; color: string; border: string; label: string }> = {
  published: { bg: 'rgba(34,197,94,0.1)',  color: '#22C55E', border: 'rgba(34,197,94,0.25)',  label: 'LIVE'     },
  completed: { bg: 'rgba(75,85,99,0.1)',   color: '#6B7280', border: 'rgba(75,85,99,0.2)',    label: 'ENDED'    },
  archived:  { bg: 'rgba(75,85,99,0.06)',  color: '#4B5563', border: 'rgba(75,85,99,0.12)',   label: 'ARCHIVED' },
  draft:     { bg: 'rgba(250,204,21,0.1)', color: '#FACC15', border: 'rgba(250,204,21,0.2)',  label: 'DRAFT'    },
  cancelled: { bg: 'rgba(239,68,68,0.1)',  color: '#EF4444', border: 'rgba(239,68,68,0.2)',   label: 'CANCELLED'},
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

  const effStatus  = getEffectiveStatus(event)
  const isArchived = effStatus === 'completed' || effStatus === 'archived' || effStatus === 'cancelled'
  const st = STATUS_CONFIG[effStatus] ?? STATUS_CONFIG.draft
  const isLive = effStatus === 'published'

  // Fetch category details for display (read-only — locked after creation)
  const ev = event as any
  let category: { name: string; icon: string; color: string } | null = null
  if (ev.category_id) {
    const { data: cat } = await (supabase as any)
      .from('event_categories')
      .select('name, icon, color')
      .eq('id', ev.category_id)
      .single()
    category = cat ?? null
  }

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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Breadcrumb row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <Link href="/dashboard/events" className="hover:text-gray-400 transition-colors" style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#4B5563', textDecoration: 'none', fontSize: 'var(--fs-sm)', fontWeight: 600 }}
          >
            <ArrowLeft size={14} /> Events
          </Link>
          {!isArchived && <EventActions event={event} />}
        </div>

        {/* Title */}
        <h1 style={{
          color: 'white', fontSize: 'var(--fs-2xl)', fontWeight: 900,
          margin: 0, fontFamily: 'var(--font-display)', letterSpacing: '-0.5px', lineHeight: 1.2,
        }}>
          {event.title}
        </h1>

        {/* Badges row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{
            padding: '3px 10px', borderRadius: 100, fontSize: 'var(--fs-xs)', fontWeight: 800,
            letterSpacing: '0.07em', background: st.bg, color: st.color, border: `1px solid ${st.border}`,
            display: 'inline-flex', alignItems: 'center', gap: 5,
          }}>
            {isLive && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', animation: 'pulse 2s infinite', display: 'inline-block' }} />}
            {st.label}
          </span>
          {!event.is_public && (
            <span style={{ padding: '3px 10px', borderRadius: 100, fontSize: 'var(--fs-xs)', fontWeight: 700, background: 'rgba(255,199,69,0.1)', color: '#FFC745', border: '1px solid rgba(255,199,69,0.2)' }}>
              Private
            </span>
          )}
          {category && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '3px 10px', borderRadius: 100, fontSize: 'var(--fs-xs)', fontWeight: 700,
              background: `${category.color}18`, color: category.color, border: `1px solid ${category.color}30`,
            }}>
              {category.icon} {category.name}
            </span>
          )}
        </div>

        {/* Meta row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#6B7280', fontSize: 'var(--fs-sm)', fontWeight: 500 }}>
            <CalendarDays size={13} color="#4B5563" />
            {format(new Date(event.date_start), 'MMM d, yyyy')}
            <span style={{ color: '#374151' }}>·</span>
            {format(new Date(event.date_start), 'h:mm a')}
          </span>
          {event.venue_name && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#6B7280', fontSize: 'var(--fs-sm)', fontWeight: 500 }}>
              <MapPin size={13} color="#4B5563" />
              {event.venue_secret ? '🔒 Secret Venue' : event.venue_name}
            </span>
          )}
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#6B7280', fontSize: 'var(--fs-sm)', fontWeight: 500 }}>
            <Users size={13} color="#4B5563" />
            {total} / {event.capacity} guests
          </span>
        </div>
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