'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, MapPin, Calendar, Users, Ticket, Lock, ChevronRight, Clock, CheckCircle, AlertCircle } from 'lucide-react'

type Event = {
  id: string; title: string; description: string | null
  venue_name: string | null; secret_venue: boolean
  date_start: string; date_end: string | null
  capacity: number; cover_image_url: string | null
  tags: string[] | null; ticket_price: number
  registration_mode: string; registered_count: number
  organizer: { full_name: string; company_name: string | null } | null
}

type Registration = {
  id: string; event_id: string; status: string; payment_status: string
  created_at: string
  event: { id: string; title: string; date_start: string; cover_image_url: string | null; venue_name: string | null; secret_venue: boolean } | null
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-PK', { weekday: 'short', day: 'numeric', month: 'short' })
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', hour12: true })
}

function regStatusBadge(status: string, paymentStatus: string) {
  if (status === 'approved' && paymentStatus === 'not_required') return { label: 'Confirmed', color: '#22C55E', bg: 'rgba(34,197,94,0.15)', icon: CheckCircle }
  if (status === 'approved' && paymentStatus === 'pending') return { label: 'Pay Now', color: '#FFC745', bg: 'rgba(255,199,69,0.15)', icon: AlertCircle }
  if (status === 'approved' && paymentStatus === 'confirmed') return { label: 'Confirmed', color: '#22C55E', bg: 'rgba(34,197,94,0.15)', icon: CheckCircle }
  if (status === 'pending') return { label: 'Pending', color: '#6B7280', bg: 'rgba(107,114,128,0.15)', icon: Clock }
  if (status === 'rejected') return { label: 'Declined', color: '#EF4444', bg: 'rgba(239,68,68,0.15)', icon: AlertCircle }
  return { label: status, color: '#6B7280', bg: 'rgba(107,114,128,0.15)', icon: Clock }
}

// ── Hero Banner ──────────────────────────────────────────────────────────────
function HeroBanner({ event }: { event: Event }) {
  const spots = event.capacity - event.registered_count
  return (
    <Link href={`/register/${event.id}`} style={{ textDecoration: 'none', display: 'block', margin: '0 0 0' }}>
      <div style={{ position: 'relative', height: 260, overflow: 'hidden' }}>
        {event.cover_image_url ? (
          <img src={event.cover_image_url} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #0D1A3A 0%, #0A0C12 100%)' }} />
        )}
        {/* Gradient overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(8,10,15,1) 0%, rgba(8,10,15,0.4) 50%, transparent 100%)' }} />

        {/* Featured badge */}
        <div style={{ position: 'absolute', top: 16, left: 16, padding: '4px 10px', background: '#1E5EFF', borderRadius: 20 }}>
          <span style={{ color: 'white', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em' }}>FEATURED</span>
        </div>

        {/* Price */}
        <div style={{ position: 'absolute', top: 16, right: 16, padding: '4px 12px', background: event.ticket_price > 0 ? 'rgba(255,199,69,0.9)' : 'rgba(34,197,94,0.9)', borderRadius: 20, backdropFilter: 'blur(8px)' }}>
          <span style={{ color: '#000', fontSize: 12, fontWeight: 800 }}>{event.ticket_price > 0 ? `PKR ${event.ticket_price.toLocaleString()}` : 'Free'}</span>
        </div>

        {/* Content */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '16px 18px' }}>
          <h2 style={{ color: 'white', fontSize: 22, fontWeight: 800, fontFamily: 'Poppins, sans-serif', letterSpacing: '-0.5px', margin: '0 0 6px', lineHeight: 1.2 }}>
            {event.title}
          </h2>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Calendar size={12} color="#9CA3AF" />
              <span style={{ color: '#9CA3AF', fontSize: 12 }}>{fmtDate(event.date_start)}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <MapPin size={12} color="#9CA3AF" />
              <span style={{ color: '#9CA3AF', fontSize: 12 }}>{event.secret_venue ? 'Secret Venue' : (event.venue_name ?? 'TBC')}</span>
            </div>
            {spots > 0 && spots <= 20 && (
              <span style={{ color: '#FFC745', fontSize: 12, fontWeight: 600 }}>{spots} left</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

// ── My Events horizontal strip ────────────────────────────────────────────────
function MyEventsStrip({ registrations }: { registrations: Registration[] }) {
  if (!registrations.length) return null
  return (
    <div style={{ padding: '20px 0 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 18px', marginBottom: 12 }}>
        <h3 style={{ color: 'white', fontSize: 15, fontWeight: 700, fontFamily: 'Poppins, sans-serif', margin: 0 }}>My Events</h3>
        <Link href="/guest/events" style={{ color: '#4F8AFF', fontSize: 13, textDecoration: 'none', fontWeight: 600 }}>See all →</Link>
      </div>
      <div style={{ display: 'flex', gap: 10, paddingLeft: 18, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
        {registrations.map(reg => {
          if (!reg.event) return null
          const badge = regStatusBadge(reg.status, reg.payment_status)
          const StatusIcon = badge.icon
          return (
            <Link key={reg.id} href="/guest/events" style={{ textDecoration: 'none', flexShrink: 0 }}>
              <div style={{ width: 140, background: '#13151E', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, overflow: 'hidden' }}>
                <div style={{ height: 80, position: 'relative', background: '#0F1117' }}>
                  {reg.event.cover_image_url ? (
                    <img src={reg.event.cover_image_url} alt={reg.event.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #0D1A3A, #0A0C12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Ticket size={20} color="rgba(30,94,255,0.3)" />
                    </div>
                  )}
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(19,21,30,0.8), transparent)' }} />
                </div>
                <div style={{ padding: '8px 10px 10px' }}>
                  <p style={{ color: 'white', fontSize: 12, fontWeight: 700, margin: '0 0 4px', lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>
                    {reg.event.title}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 6px', background: badge.bg, borderRadius: 20, width: 'fit-content' }}>
                    <StatusIcon size={9} color={badge.color} />
                    <span style={{ color: badge.color, fontSize: 10, fontWeight: 700 }}>{badge.label}</span>
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
        <Link href="/explore" style={{ textDecoration: 'none', flexShrink: 0 }}>
          <div style={{ width: 100, height: 140, background: 'rgba(30,94,255,0.06)', border: '1px dashed rgba(30,94,255,0.2)', borderRadius: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <div style={{ width: 28, height: 28, background: 'rgba(30,94,255,0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ChevronRight size={14} color="#4F8AFF" />
            </div>
            <span style={{ color: '#4F8AFF', fontSize: 11, fontWeight: 600, textAlign: 'center' }}>Find Events</span>
          </div>
        </Link>
      </div>
    </div>
  )
}

// ── Event Card ────────────────────────────────────────────────────────────────
function EventCard({ event }: { event: Event }) {
  const spotsLeft = event.capacity > 0 ? event.capacity - event.registered_count : null
  const isFull = spotsLeft !== null && spotsLeft <= 0
  const organiser = event.organizer?.company_name ?? event.organizer?.full_name

  return (
    <Link href={`/register/${event.id}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div style={{ display: 'flex', gap: 12, padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s' }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
      >
        {/* Thumbnail */}
        <div style={{ width: 72, height: 72, borderRadius: 12, overflow: 'hidden', flexShrink: 0, background: '#13151E' }}>
          {event.cover_image_url ? (
            <img src={event.cover_image_url} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #0D1A3A, #0A0C12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Ticket size={20} color="rgba(30,94,255,0.3)" />
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
            <h4 style={{ color: 'white', fontSize: 14, fontWeight: 700, fontFamily: 'Poppins, sans-serif', margin: 0, lineHeight: 1.3, flex: 1 }}>
              {event.title}
            </h4>
            <span style={{
              fontSize: 12, fontWeight: 700, flexShrink: 0, padding: '2px 8px', borderRadius: 12,
              background: event.ticket_price > 0 ? 'rgba(255,199,69,0.12)' : 'rgba(34,197,94,0.12)',
              color: event.ticket_price > 0 ? '#FFC745' : '#22C55E',
            }}>
              {event.ticket_price > 0 ? `PKR ${event.ticket_price.toLocaleString()}` : 'Free'}
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Calendar size={11} color="#4B5563" />
              <span style={{ color: '#6B7280', fontSize: 12 }}>{fmtDate(event.date_start)} · {fmtTime(event.date_start)}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <MapPin size={11} color="#4B5563" />
              <span style={{ color: '#6B7280', fontSize: 12 }}>{event.secret_venue ? '📍 Secret' : (event.venue_name ?? 'TBC')}</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
            <span style={{ color: '#374151', fontSize: 11 }}>by {organiser}</span>
            {isFull ? (
              <span style={{ color: '#EF4444', fontSize: 11, fontWeight: 600 }}>Full</span>
            ) : spotsLeft !== null && spotsLeft <= 15 ? (
              <span style={{ color: '#FFC745', fontSize: 11, fontWeight: 600 }}>{spotsLeft} spots left</span>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                {event.registration_mode !== 'open' && <Lock size={10} color="#4B5563" />}
                <span style={{ color: '#4B5563', fontSize: 11 }}>
                  {event.registration_mode === 'open' ? 'Open' : event.registration_mode === 'expression_of_interest' ? 'Apply' : 'Invite only'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ExploreClient({ events, myRegistrations }: { events: Event[]; myRegistrations: Registration[] }) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'free' | 'paid' | 'open'>('all')

  const hero = events[0] ?? null
  const rest = events.slice(1)

  const filtered = useMemo(() => {
    return rest.filter(e => {
      const s = search.toLowerCase()
      const matchSearch = !s || e.title.toLowerCase().includes(s) || (e.venue_name ?? '').toLowerCase().includes(s)
      const matchFilter = filter === 'all' ? true : filter === 'free' ? e.ticket_price === 0 : filter === 'paid' ? e.ticket_price > 0 : e.registration_mode === 'open'
      return matchSearch && matchFilter
    })
  }, [rest, search, filter])

  return (
    <div>
      {/* Hero */}
      {hero && <HeroBanner event={hero} />}

      {/* My Events strip */}
      <MyEventsStrip registrations={myRegistrations} />

      {/* Search + filters */}
      <div style={{ padding: '20px 18px 0' }}>
        <div style={{ position: 'relative', marginBottom: 12 }}>
          <Search size={15} color="#4B5563" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input
            type="text" placeholder="Search events, venues..." value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '11px 14px 11px 38px', background: '#13151E', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, color: 'white', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 4, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
          {(['all', 'free', 'paid', 'open'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
              background: filter === f ? '#1E5EFF' : 'rgba(255,255,255,0.06)',
              color: filter === f ? 'white' : '#6B7280', fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
            }}>
              {f === 'all' ? 'All' : f === 'free' ? 'Free' : f === 'paid' ? 'Paid' : 'Open'}
            </button>
          ))}
        </div>
      </div>

      {/* Upcoming heading */}
      <div style={{ padding: '16px 18px 0' }}>
        <h3 style={{ color: 'white', fontSize: 15, fontWeight: 700, fontFamily: 'Poppins, sans-serif', margin: '0 0 4px' }}>
          Upcoming Events {filtered.length > 0 && <span style={{ color: '#374151', fontWeight: 500, fontSize: 13 }}>· {filtered.length}</span>}
        </h3>
      </div>

      {/* Event list */}
      <div style={{ marginTop: 8 }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 18px' }}>
            <Ticket size={32} color="#1F2937" style={{ marginBottom: 12 }} />
            <p style={{ color: '#374151', fontSize: 15, margin: '0 0 4px', fontWeight: 600 }}>No events found</p>
            <p style={{ color: '#1F2937', fontSize: 13, margin: 0 }}>Try a different search or filter</p>
          </div>
        ) : (
          filtered.map(event => <EventCard key={event.id} event={event} />)
        )}
      </div>
    </div>
  )
}