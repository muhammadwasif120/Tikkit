'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import {
  CalendarDays, MapPin, Mail, Phone, Users, ChevronDown, ArrowLeft, Star,
} from 'lucide-react'

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
  slug: string | null
  title: string
  date_start: string
  cover_image_url: string | null
  venue_name: string | null
  capacity: number
  status: string
  guest_count: number
}

/* ─── Gradients ──────────────────────────────────────────────────── */
const COVER_GRADIENTS = [
  'linear-gradient(135deg,#0F2027,#203A43,#2C5364)',
  'linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)',
  'linear-gradient(135deg,#200122,#6f0000)',
  'linear-gradient(135deg,#001233,#023e8a)',
  'linear-gradient(135deg,#1f0033,#2d0050)',
]
function getGradient(id: string) { return COVER_GRADIENTS[id.charCodeAt(0) % COVER_GRADIENTS.length] }

const CARD_GRADIENTS = [
  'linear-gradient(135deg,#0F2027,#203A43)',
  'linear-gradient(135deg,#1a1a2e,#0f3460)',
  'linear-gradient(135deg,#200122,#6f0000)',
  'linear-gradient(135deg,#1f0033,#2d0050)',
  'linear-gradient(135deg,#001233,#023e8a)',
]
function getCardGradient(id: string) { return CARD_GRADIENTS[id.charCodeAt(0) % CARD_GRADIENTS.length] }

/* ─── Event Row ──────────────────────────────────────────────────── */
function EventRow({ event, dim }: { event: PublicEvent; dim?: boolean }) {
  const fillPct = event.capacity > 0 ? Math.min(100, (event.guest_count / event.capacity) * 100) : 0
  const isAlmostFull = fillPct >= 80

  return (
    <Link
      href={`/guest/explore/${event.slug || event.id}`}
      style={{
        display: 'flex', gap: 14, padding: '14px 16px',
        background: '#0E1018', border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 16, textDecoration: 'none',
        opacity: dim ? 0.55 : 1,
        transition: 'border-color 0.15s, background 0.15s',
      }}
      className="hover:border-[#1E5EFF]/30 hover:bg-[#111828]"
    >
      {/* Thumbnail */}
      <div style={{
        width: 60, height: 60, borderRadius: 12, overflow: 'hidden',
        flexShrink: 0, background: getCardGradient(event.id), position: 'relative',
      }}>
        {event.cover_image_url && (
          <Image src={event.cover_image_url} alt={`${event.title} cover`} fill style={{ objectFit: 'cover' }} sizes="60px" />
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ color: 'white', fontSize: 14, fontWeight: 700, margin: '0 0 5px', lineHeight: 1.3, fontFamily: 'var(--font-display)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {event.title}
        </p>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 8, alignItems: 'center' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#818CF8', fontSize: 11, fontWeight: 600 }}>
            <CalendarDays size={10} />
            {format(new Date(event.date_start), 'MMM d, yyyy')}
          </span>
          {event.venue_name && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#6B7280', fontSize: 11 }}>
              <MapPin size={10} />
              {event.venue_name}
            </span>
          )}
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#6B7280', fontSize: 11 }}>
            <Users size={10} />
            {event.guest_count} / {event.capacity}
          </span>
          {isAlmostFull && (
            <span style={{ padding: '2px 7px', borderRadius: 5, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#F87171', fontSize: 9, fontWeight: 800, letterSpacing: '0.5px' }}>
              ALMOST FULL
            </span>
          )}
        </div>

        {/* Capacity fill bar */}
        <div style={{ height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${fillPct}%`, borderRadius: 99, background: isAlmostFull ? '#EF4444' : '#1E5EFF', transition: 'width 0.4s' }} />
        </div>
      </div>
    </Link>
  )
}

/* ─── Main ───────────────────────────────────────────────────────── */
export default function PublicOrganizerProfile({
  profile, events,
}: {
  profile: PublicProfile
  events: PublicEvent[]
}) {
  const router = useRouter()
  const [showPast, setShowPast] = useState(false)
  const now = new Date()

  const upcomingEvents = events.filter(e => e.status === 'published' && new Date(e.date_start) >= now)
  const pastEvents     = events.filter(e => e.status === 'completed' || (e.status === 'published' && new Date(e.date_start) < now))

  const displayName = profile.company_name || profile.full_name || 'Organizer'
  const subName     = profile.company_name ? profile.full_name : null
  const initials    = displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const memberSince = format(new Date(profile.created_at), 'MMMM yyyy')
  const totalGuests = events.reduce((s, e) => s + (e.guest_count ?? 0), 0)

  return (
    <>
      <style>{`
        @keyframes revealUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @media (min-width: 768px) {
          .op-root {
            display: flex !important;
            flex-direction: row !important;
            width: 100% !important;
            height: 100svh !important;
            overflow: hidden !important;
            padding-bottom: 0 !important;
          }
          .op-hero {
            width: 400px !important;
            flex-shrink: 0 !important;
            height: 100svh !important;
          }
          .op-content {
            flex: 1 !important;
            height: 100svh !important;
            overflow-y: auto !important;
            border-left: 1px solid rgba(255,255,255,0.05) !important;
            padding: 32px 36px 48px !important;
          }
          .op-mobile-banner { display: none !important; }
          .op-mobile-logo   { display: none !important; }
        }
        @media (min-width: 1280px) {
          .op-hero    { width: 460px !important; }
          .op-content { padding: 40px 48px 56px !important; }
        }
      `}</style>

      <div className="op-root" style={{ background: '#080A10', minHeight: '100svh', fontFamily: 'var(--font-body)', paddingBottom: 64 }}>

        {/* ── Hero panel ─────────────────────────────────────────── */}
        <div className="op-hero" style={{ position: 'relative', background: getGradient(profile.id), overflow: 'hidden' }}>

          {/* Cover image */}
          {profile.cover_image_url && (
            <Image src={profile.cover_image_url} alt="" fill style={{ objectFit: 'cover' }} sizes="100vw" priority />
          )}

          {/* Grid texture */}
          {!profile.cover_image_url && (
            <div style={{ position: 'absolute', inset: 0, opacity: 0.06, backgroundImage: 'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
          )}

          {/* Gradient overlay — dark at bottom so name is readable */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, transparent 35%, rgba(8,10,16,0.7) 70%, rgba(8,10,16,0.97) 100%)' }} />

          {/* Back button */}
          <button
            onClick={() => router.back()}
            style={{ position: 'absolute', top: 'calc(env(safe-area-inset-top) + 14px)', left: 16, zIndex: 10, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '7px 12px 7px 9px', color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'background 0.15s' }}
          >
            <ArrowLeft size={14} />
            Back
          </button>

          {/* Bottom: logo + name */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 28px 32px' }}>
            {/* Logo */}
            <div style={{
              width: 76, height: 76, borderRadius: 20, overflow: 'hidden',
              background: profile.logo_url ? 'transparent' : 'linear-gradient(135deg, rgba(30,94,255,0.25), rgba(129,140,248,0.15))',
              border: '2.5px solid rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 14,
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            }}>
              {profile.logo_url ? (
                <Image src={profile.logo_url} alt={`${displayName} logo`} width={76} height={76} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
              ) : (
                <span style={{ fontSize: 28, fontWeight: 900, color: 'white', fontFamily: 'var(--font-display)' }}>{initials}</span>
              )}
            </div>

            <h1 style={{ color: 'white', fontSize: 26, fontWeight: 900, margin: '0 0 4px', fontFamily: 'var(--font-display)', letterSpacing: '-0.6px', lineHeight: 1.1, textShadow: '0 2px 12px rgba(0,0,0,0.5)' }}>
              {displayName}
            </h1>
            {subName && (
              <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, margin: '0 0 12px' }}>{subName}</p>
            )}

            {/* Member since badge */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <Star size={10} color="#FFC745" fill="#FFC745" />
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 600 }}>Since {memberSince}</span>
            </div>
          </div>
        </div>

        {/* Mobile: banner + logo (hidden on desktop via .op-mobile-banner/.op-mobile-logo) */}
        <div className="op-mobile-banner" style={{ position: 'relative', height: 200, background: getGradient(profile.id), overflow: 'hidden' }}>
          {profile.cover_image_url && (
            <Image src={profile.cover_image_url} alt="" fill style={{ objectFit: 'cover' }} sizes="100vw" />
          )}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(8,10,16,0.8))' }} />
          <button
            onClick={() => router.back()}
            style={{ position: 'absolute', top: 'calc(env(safe-area-inset-top) + 14px)', left: 16, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '7px 12px 7px 9px', color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
          >
            <ArrowLeft size={14} /> Back
          </button>
        </div>

        {/* ── Content panel ──────────────────────────────────────── */}
        <div className="op-content" style={{ padding: '0 0 40px', animation: 'revealUp 0.4s ease' }}>

          {/* Mobile: logo + identity */}
          <div className="op-mobile-logo" style={{ padding: '0 16px' }}>
            <div style={{ marginTop: -38, marginBottom: 12, width: 76, height: 76, borderRadius: 20, overflow: 'hidden', background: 'linear-gradient(135deg, rgba(30,94,255,0.25), rgba(129,140,248,0.15))', border: '3px solid #080A10', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {profile.logo_url
                ? <Image src={profile.logo_url} alt={`${displayName} logo`} width={76} height={76} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                : <span style={{ fontSize: 26, fontWeight: 900, color: 'white', fontFamily: 'var(--font-display)' }}>{initials}</span>
              }
            </div>
            <h1 style={{ color: 'white', fontSize: 22, fontWeight: 900, margin: '0 0 3px', fontFamily: 'var(--font-display)', letterSpacing: '-0.5px' }}>{displayName}</h1>
            {subName && <p style={{ color: '#6B7280', fontSize: 13, margin: '0 0 12px' }}>{subName}</p>}
          </div>

          {/* ── Desktop identity header (visible only in content col on desktop) ── */}
          <div className="op-desktop-identity" style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20 }}>
              <div style={{ width: 3, height: 14, borderRadius: 2, background: '#1E5EFF' }} />
              <span style={{ color: '#6B7280', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px' }}>Organizer Profile</span>
            </div>

            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 24 }}>
              {[
                { label: 'Total Events', value: events.length },
                { label: 'Upcoming', value: upcomingEvents.length },
                { label: 'Total Guests', value: totalGuests },
              ].map(stat => (
                <div key={stat.label} style={{ background: '#0E1018', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '14px 16px', textAlign: 'center' }}>
                  <p style={{ color: 'white', fontSize: 22, fontWeight: 900, margin: '0 0 3px', fontFamily: 'var(--font-display)', letterSpacing: '-0.5px' }}>
                    {stat.value}
                  </p>
                  <p style={{ color: '#6B7280', fontSize: 11, margin: 0, fontWeight: 600 }}>{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Contact */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <a href={`mailto:${profile.email}`} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', background: '#0E1018', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, color: '#9CA3AF', fontSize: 13, textDecoration: 'none', transition: 'border-color 0.15s' }}
                className="hover:border-[#1E5EFF]/30">
                <Mail size={14} color="#818CF8" />
                <span>{profile.email}</span>
              </a>
              {profile.phone_number && (
                <a href={`tel:${profile.phone_number}`} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', background: '#0E1018', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, color: '#9CA3AF', fontSize: 13, textDecoration: 'none', transition: 'border-color 0.15s' }}
                  className="hover:border-[#1E5EFF]/30">
                  <Phone size={14} color="#818CF8" />
                  <span>{profile.phone_number}</span>
                </a>
              )}
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', marginBottom: 24 }} />

          {/* ── Upcoming Events ── */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
              <div style={{ width: 3, height: 14, borderRadius: 2, background: '#1E5EFF' }} />
              <span style={{ color: 'white', fontSize: 12, fontWeight: 800, fontFamily: 'var(--font-display)', letterSpacing: '0.3px' }}>UPCOMING EVENTS</span>
              {upcomingEvents.length > 0 && (
                <span style={{ fontSize: 11, color: '#6B7280' }}>({upcomingEvents.length})</span>
              )}
            </div>

            {upcomingEvents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 0', background: '#0E1018', borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)' }}>
                <CalendarDays size={28} color="#374151" style={{ margin: '0 auto 10px' }} />
                <p style={{ color: '#6B7280', fontSize: 13, margin: '0 0 4px' }}>No upcoming events right now</p>
                <p style={{ color: '#4B5563', fontSize: 11, margin: 0 }}>Check back soon</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {upcomingEvents.map(ev => <EventRow key={ev.id} event={ev} />)}
              </div>
            )}
          </div>

          {/* ── Past Events ── */}
          {pastEvents.length > 0 && (
            <div>
              <button
                onClick={() => setShowPast(v => !v)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 12px', marginBottom: 0 }}
              >
                <span style={{ color: '#4B5563', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Past Events</span>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.05)' }} />
                <span style={{ color: '#4B5563', fontSize: 11, marginRight: 4 }}>{pastEvents.length}</span>
                <ChevronDown size={13} color="#4B5563" style={{ transform: showPast ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
              </button>

              {showPast && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {pastEvents.map(ev => <EventRow key={ev.id} event={ev} dim />)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
