'use client'

import { useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import {
  CalendarDays, MapPin, Mail, Phone, Users, ChevronDown,
} from 'lucide-react'
import clsx from 'clsx'

/* ─── Types ──────────────────────────────────────────────────────── */
export type PublicProfile = {
  id: string
  full_name: string | null
  email: string
  phone_number: string | null
  company_name: string | null
  cover_image_url: string | null
  logo_url: string | null
  username: string | null
  created_at: string
}

export type PublicEvent = {
  id: string
  title: string
  date_start: string
  cover_image_url: string | null
  venue_name: string | null
  capacity: number
  status: string
  guest_count: number
}

/* ─── Helpers ─────────────────────────────────────────────────────── */
const COVER_GRADIENTS = [
  'linear-gradient(135deg, #0a0f2e 0%, #1a2a6c 50%, #1E5EFF 100%)',
  'linear-gradient(135deg, #0d001a 0%, #2d0050 50%, #7c3aed 100%)',
  'linear-gradient(135deg, #001233 0%, #023e8a 50%, #0077b6 100%)',
  'linear-gradient(135deg, #0f2027 0%, #2c5364 50%, #203a43 100%)',
  'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
]
function getGradient(id: string) { return COVER_GRADIENTS[id.charCodeAt(0) % COVER_GRADIENTS.length] }

function getCardGradient(id: string) {
  const CARD_GRADIENTS = [
    'linear-gradient(135deg, #0F2027 0%, #203A43 50%, #2C5364 100%)',
    'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    'linear-gradient(135deg, #200122 0%, #6f0000 100%)',
    'linear-gradient(135deg, #1f0033 0%, #2d0050 100%)',
    'linear-gradient(135deg, #001233 0%, #023e8a 100%)',
  ]
  return CARD_GRADIENTS[id.charCodeAt(0) % CARD_GRADIENTS.length]
}

/* ─── Event Card ─────────────────────────────────────────────────── */
function EventCard({ event }: { event: PublicEvent }) {
  const fillPct = event.capacity > 0 ? Math.min(100, (event.guest_count / event.capacity) * 100) : 0

  return (
    <Link
      href={`/guest/explore/${event.id}`}
      style={{
        display: 'flex', gap: 14, padding: '14px 16px',
        background: '#111420', border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 14, textDecoration: 'none',
        transition: 'border-color 0.15s, background 0.15s',
      }}
      className="group hover:border-[#1E5EFF]/30 hover:bg-[#161B2E]"
    >
      {/* Thumbnail */}
      <div
        style={{
          width: 56, height: 56, borderRadius: 10,
          overflow: 'hidden', flexShrink: 0,
          background: getCardGradient(event.id),
        }}
      >
        {event.cover_image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={event.cover_image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ color: 'white', fontSize: 14, fontWeight: 600, margin: '0 0 4px', lineHeight: 1.3 }}
          className="group-hover:text-[#1E5EFF] transition-colors truncate">
          {event.title}
        </p>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#6B7280', fontSize: 12 }}>
            <CalendarDays style={{ width: 11, height: 11 }} />
            {format(new Date(event.date_start), 'MMM d, yyyy')}
          </span>
          {event.venue_name && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#6B7280', fontSize: 12 }}>
              <MapPin style={{ width: 11, height: 11 }} />
              {event.venue_name}
            </span>
          )}
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#6B7280', fontSize: 12 }}>
            <Users style={{ width: 11, height: 11 }} />
            {event.guest_count} / {event.capacity}
          </span>
        </div>

        {/* Fill bar */}
        <div style={{ height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${fillPct}%`, background: '#1E5EFF', borderRadius: 99 }} />
        </div>
      </div>
    </Link>
  )
}

/* ─── Main ───────────────────────────────────────────────────────── */
export default function PublicOrganizerProfile({
  profile,
  events,
}: {
  profile: PublicProfile
  events: PublicEvent[]
}) {
  const [showPast, setShowPast] = useState(false)
  const now = new Date()

  const upcomingEvents = events.filter(e => e.status === 'published' && new Date(e.date_start) >= now)
  const pastEvents     = events.filter(e => e.status === 'completed' || (e.status === 'published' && new Date(e.date_start) < now))

  const initials = (profile.full_name || profile.company_name || 'O')
    .split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()

  const BANNER_H  = 160
  const AVATAR_H  = 72
  const avatarTop = BANNER_H - AVATAR_H / 2  // 124px

  return (
    <div style={{ background: '#080A10', minHeight: '100svh', paddingBottom: 64 }}>

      {/* Back to explore */}
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '16px 20px 0' }}>
        <Link
          href="/guest/explore"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#6B7280', fontSize: 13, textDecoration: 'none' }}
          className="hover:text-white transition-colors"
        >
          ← Explore Events
        </Link>
      </div>

      {/* Profile hero */}
      <div style={{ maxWidth: 680, margin: '12px auto 0', padding: '0 20px' }}>
        <div style={{
          background: '#0D0F18', borderRadius: 20,
          border: '1px solid rgba(255,255,255,0.06)',
          overflow: 'hidden', position: 'relative',
        }}>
          {/* Banner */}
          <div style={{ position: 'relative', height: BANNER_H, background: getGradient(profile.id), overflow: 'hidden' }}>
            {profile.cover_image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.cover_image_url} alt="Cover" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
            )}
            {!profile.cover_image_url && (
              <div style={{
                position: 'absolute', inset: 0, opacity: 0.1,
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                backgroundSize: '28px 28px',
              }} />
            )}
            <div style={{ position: 'absolute', inset: '0 0 0', bottom: 0, height: 60, background: 'linear-gradient(to top, #0D0F18, transparent)' }} />
          </div>

          {/* Logo badge */}
          <div style={{ position: 'absolute', top: avatarTop, left: 24 }}>
            <div style={{
              width: AVATAR_H, height: AVATAR_H, borderRadius: 18,
              overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: profile.logo_url ? 'transparent' : 'linear-gradient(135deg, rgba(30,94,255,0.3), rgba(30,94,255,0.1))',
              border: '3px solid #0D0F18',
              boxShadow: '0 0 0 1px rgba(30,94,255,0.25)',
            }}>
              {profile.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.logo_url} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: 26, fontWeight: 900, color: '#1E5EFF', fontFamily: 'var(--font-display)' }}>
                  {initials}
                </span>
              )}
            </div>
          </div>

          {/* Identity content */}
          <div style={{ padding: `${AVATAR_H / 2 + 20}px 24px 24px` }}>
            {profile.company_name && (
              <h1 style={{ color: 'white', fontSize: 22, fontWeight: 900, margin: '0 0 2px', fontFamily: 'var(--font-display)', letterSpacing: '-0.5px' }}>
                {profile.company_name}
              </h1>
            )}
            {profile.full_name && (
              <p style={{ color: '#9CA3AF', fontSize: 14, margin: '0 0 12px' }}>{profile.full_name}</p>
            )}

            {/* Contact row */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px' }}>
              <a href={`mailto:${profile.email}`} style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#6B7280', fontSize: 13, textDecoration: 'none' }}
                className="hover:text-white transition-colors">
                <Mail style={{ width: 13, height: 13 }} />
                {profile.email}
              </a>
              {profile.phone_number && (
                <a href={`tel:${profile.phone_number}`} style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#6B7280', fontSize: 13, textDecoration: 'none' }}
                  className="hover:text-white transition-colors">
                  <Phone style={{ width: 13, height: 13 }} />
                  {profile.phone_number}
                </a>
              )}
            </div>

            {/* Member since */}
            <p style={{ color: '#4B5563', fontSize: 11, marginTop: 10 }}>
              Organiser since {format(new Date(profile.created_at), 'MMMM yyyy')}
            </p>
          </div>
        </div>
      </div>

      {/* Upcoming Events */}
      <div style={{ maxWidth: 680, margin: '28px auto 0', padding: '0 20px' }}>
        <h2 style={{ color: 'white', fontSize: 16, fontWeight: 700, margin: '0 0 14px', fontFamily: 'var(--font-display)', letterSpacing: '-0.3px' }}>
          Upcoming Events
          {upcomingEvents.length > 0 && (
            <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 500, color: '#6B7280' }}>
              ({upcomingEvents.length})
            </span>
          )}
        </h2>

        {upcomingEvents.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '32px 0',
            background: '#0D0F18', borderRadius: 16,
            border: '1px solid rgba(255,255,255,0.05)',
          }}>
            <CalendarDays style={{ width: 32, height: 32, color: '#374151', margin: '0 auto 8px' }} />
            <p style={{ color: '#6B7280', fontSize: 14 }}>No upcoming events right now</p>
            <p style={{ color: '#4B5563', fontSize: 12, marginTop: 4 }}>Check back soon</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {upcomingEvents.map(ev => <EventCard key={ev.id} event={ev} />)}
          </div>
        )}
      </div>

      {/* Past Events (collapsible) */}
      {pastEvents.length > 0 && (
        <div style={{ maxWidth: 680, margin: '24px auto 0', padding: '0 20px' }}>
          <button
            onClick={() => setShowPast(v => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 12 }}
          >
            <span style={{ color: '#4B5563', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Past Events</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.05)' }} />
            <span style={{ color: '#4B5563', fontSize: 12 }}>{pastEvents.length}</span>
            <ChevronDown
              style={{ width: 14, height: 14, color: '#4B5563', transform: showPast ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
            />
          </button>

          {showPast && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, opacity: 0.65 }}>
              {pastEvents.map(ev => <EventCard key={ev.id} event={ev} />)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
