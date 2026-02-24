'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, SlidersHorizontal, MapPin, Calendar, Users, Ticket, Lock, ChevronRight, Sparkles } from 'lucide-react'

type Event = {
  id: string
  title: string
  description: string | null
  venue_name: string | null
  secret_venue: boolean
  date_start: string
  date_end: string | null
  capacity: number
  cover_image_url: string | null
  tags: string[] | null
  ticket_price: number
  registration_mode: string
  is_private: boolean
  registered_count: number
  organizer: { full_name: string; company_name: string | null } | null
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-PK', { weekday: 'short', day: 'numeric', month: 'short' })
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', hour12: true })
}

function spotsLeft(capacity: number, registered: number) {
  const left = capacity - registered
  if (left <= 0) return { text: 'Full', color: '#EF4444' }
  if (left <= 10) return { text: `${left} spots left`, color: '#FFC745' }
  return { text: `${left} spots`, color: '#22C55E' }
}

const MODE_LABELS: Record<string, string> = {
  open:                  'Open Registration',
  expression_of_interest: 'Apply',
  invite_only:           'Invite Only',
}

function EventCard({ event }: { event: Event }) {
  const spots = spotsLeft(event.capacity, event.registered_count)
  const isFull = event.registered_count >= event.capacity && event.capacity > 0
  const organiserName = event.organizer?.company_name ?? event.organizer?.full_name ?? 'Unknown'

  return (
    <Link href={`/register/${event.id}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div style={{
        background: '#13151E',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 16,
        overflow: 'hidden',
        transition: 'transform 0.18s, border-color 0.18s',
      }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
          (e.currentTarget as HTMLElement).style.borderColor = 'rgba(30,94,255,0.3)'
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
          (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)'
        }}
      >
        {/* Cover */}
        <div style={{ position: 'relative', height: 160, background: '#0F1117', overflow: 'hidden' }}>
          {event.cover_image_url ? (
            <img src={event.cover_image_url} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #0D1326 0%, #111827 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Ticket size={32} color="rgba(30,94,255,0.3)" />
            </div>
          )}
          {/* Price badge */}
          <div style={{
            position: 'absolute', top: 10, right: 10,
            padding: '4px 10px', borderRadius: 20,
            background: event.ticket_price > 0 ? 'rgba(255,199,69,0.9)' : 'rgba(34,197,94,0.9)',
            backdropFilter: 'blur(8px)',
            fontSize: 12, fontWeight: 700,
            color: event.ticket_price > 0 ? '#000' : '#000',
          }}>
            {event.ticket_price > 0 ? `PKR ${event.ticket_price.toLocaleString()}` : 'Free'}
          </div>
          {/* Mode badge */}
          {event.registration_mode !== 'open' && (
            <div style={{
              position: 'absolute', top: 10, left: 10,
              padding: '4px 10px', borderRadius: 20,
              background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
              fontSize: 11, fontWeight: 600, color: '#9CA3AF',
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <Lock size={10} />
              {MODE_LABELS[event.registration_mode] ?? event.registration_mode}
            </div>
          )}
        </div>

        {/* Body */}
        <div style={{ padding: '14px 16px 16px' }}>
          <h3 style={{
            color: 'white', fontSize: 16, fontWeight: 700,
            fontFamily: 'Poppins, sans-serif', letterSpacing: '-0.3px',
            margin: '0 0 4px', lineHeight: 1.3,
          }}>
            {event.title}
          </h3>
          <p style={{ color: '#6B7280', fontSize: 12, margin: '0 0 12px' }}>by {organiserName}</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {/* Date */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Calendar size={12} color="#4B5563" />
              <span style={{ color: '#9CA3AF', fontSize: 12 }}>{formatDate(event.date_start)} · {formatTime(event.date_start)}</span>
            </div>
            {/* Venue */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <MapPin size={12} color="#4B5563" />
              <span style={{ color: '#9CA3AF', fontSize: 12 }}>
                {event.secret_venue ? '📍 Venue revealed on approval' : (event.venue_name ?? 'Venue TBC')}
              </span>
            </div>
            {/* Spots */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Users size={12} color="#4B5563" />
              <span style={{ color: spots.color, fontSize: 12, fontWeight: 600 }}>{spots.text}</span>
            </div>
          </div>

          {/* CTA row */}
          <div style={{
            marginTop: 14, paddingTop: 14,
            borderTop: '1px solid rgba(255,255,255,0.05)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {(event.tags ?? []).slice(0, 2).map(tag => (
                <span key={tag} style={{
                  padding: '2px 8px', background: 'rgba(255,255,255,0.05)',
                  borderRadius: 20, fontSize: 11, color: '#6B7280',
                }}>#{tag}</span>
              ))}
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 4,
              color: isFull ? '#4B5563' : '#4F8AFF', fontSize: 13, fontWeight: 600,
            }}>
              {isFull ? 'Full' : (event.registration_mode === 'open' ? 'Register' : 'Apply')}
              <ChevronRight size={14} />
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default function ExploreClient({ events }: { events: Event[] }) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'free' | 'paid' | 'open'>('all')

  const filtered = useMemo(() => {
    return events.filter(e => {
      const matchSearch = !search || e.title.toLowerCase().includes(search.toLowerCase()) || e.venue_name?.toLowerCase().includes(search.toLowerCase())
      const matchFilter = filter === 'all' ? true
        : filter === 'free' ? e.ticket_price === 0
        : filter === 'paid' ? e.ticket_price > 0
        : filter === 'open' ? e.registration_mode === 'open'
        : true
      return matchSearch && matchFilter
    })
  }, [events, search, filter])

  return (
    <div style={{ padding: '0 0 8px' }}>
      {/* Header */}
      <div style={{
        padding: '20px 18px 0',
        background: 'linear-gradient(180deg, rgba(30,94,255,0.06) 0%, transparent 100%)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <Sparkles size={13} color="#4F8AFF" />
          <span style={{ color: '#4F8AFF', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em' }}>DISCOVER</span>
        </div>
        <h1 style={{
          color: 'white', fontSize: 26, fontWeight: 800,
          fontFamily: 'Poppins, sans-serif', letterSpacing: '-0.6px',
          margin: '0 0 16px',
        }}>
          What's happening
        </h1>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 12 }}>
          <Search size={15} color="#4B5563" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Search events, venues..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '11px 14px 11px 38px',
              background: '#0F1117', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12, color: 'white', fontSize: 14,
              outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Filter pills */}
        <div style={{ display: 'flex', gap: 6, paddingBottom: 16, overflowX: 'auto' }}>
          {(['all', 'free', 'paid', 'open'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '6px 14px', borderRadius: 20, border: 'none',
                background: filter === f ? '#1E5EFF' : 'rgba(255,255,255,0.06)',
                color: filter === f ? 'white' : '#6B7280',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                whiteSpace: 'nowrap', flexShrink: 0,
                transition: 'all 0.15s',
              }}
            >
              {f === 'all' ? 'All Events' : f === 'free' ? 'Free' : f === 'paid' ? 'Paid' : 'Open Now'}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div style={{ padding: '8px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Ticket size={36} color="#1F2937" style={{ marginBottom: 12 }} />
            <p style={{ color: '#4B5563', fontSize: 15, margin: 0 }}>No events found</p>
            <p style={{ color: '#374151', fontSize: 13, margin: '4px 0 0' }}>Try a different search or filter</p>
          </div>
        ) : (
          <>
            <p style={{ color: '#4B5563', fontSize: 12, margin: '0 0 4px' }}>
              {filtered.length} event{filtered.length !== 1 ? 's' : ''} {search ? `for "${search}"` : 'upcoming'}
            </p>
            {filtered.map(event => <EventCard key={event.id} event={event} />)}
          </>
        )}
      </div>
    </div>
  )
}