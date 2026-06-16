'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Search, MapPin, Clock, Lock, Flame, Zap, Star, CalendarDays,
  Building2, Heart, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { toggleFavouriteOrganizer } from '@/app/actions/organizerActions'
import { toggleEventFavourite } from '@/app/actions/eventFavouriteActions'
import type { TopOrganizer } from '@/app/actions/organizerActions'


/* ─── Types ──────────────────────────────────────────────────── */
type Organizer = {
  id?: string | null
  full_name: string | null
  company_name: string | null
  username?: string | null
}
type Event = {
  id: string; slug?: string | null; title: string; description: string | null
  venue_name: string | null; venue_address: string | null
  secret_venue: boolean; date_start: string; date_end: string | null
  capacity: number | null; cover_image_url: string | null
  tags: string[] | null; ticket_price: number | null
  registration_mode: string; is_private: boolean
  category_id: string | null
  organizer: Organizer | null; registered_count?: number
}
type MyEvent = {
  id: string; status: string
  event: { id: string; slug?: string | null; title: string; date_start: string; cover_image_url: string | null; venue_name: string | null } | null
}

/* ─── Auto-gradients when no cover image (CSS var — theme-adaptive) ── */
function getGradient(id: string) { return `var(--event-gradient-${id.charCodeAt(0) % 8})` }

/* ─── Organizer avatar initials ─────────────────────────────── */
function orgInitials(o: TopOrganizer) {
  const name = o.company_name ?? o.full_name ?? '?'
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

/* ─── Helpers ────────────────────────────────────────────────── */
function fmtDay(iso: string) {
  const d = new Date(iso)
  const today = new Date(); const tomorrow = new Date(); tomorrow.setDate(today.getDate() + 1)
  if (d.toDateString() === today.toDateString()) return 'TODAY'
  if (d.toDateString() === tomorrow.toDateString()) return 'TMRW'
  return d.toLocaleDateString('en-PK', { weekday: 'short' }).toUpperCase()
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', hour12: true })
}
function daysUntil(iso: string) {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const evDay = new Date(iso); evDay.setHours(0, 0, 0, 0)
  return Math.round((evDay.getTime() - today.getTime()) / 86400000)
}

function groupEvents(events: Event[]) {
  const todayEnd = new Date(); todayEnd.setHours(23,59,59)
  const weekEnd = new Date(); weekEnd.setDate(new Date().getDate() + 7)
  const groups = [
    { key: 'today', label: 'Today',     icon: <Flame size={13} color="#FF6B35" />, events: [] as Event[] },
    { key: 'week',  label: 'This Week', icon: <Zap   size={13} color="#FFC745" />, events: [] as Event[] },
    { key: 'later', label: 'Coming Up', icon: <Star  size={13} color="#818CF8" />, events: [] as Event[] },
  ]
  for (const e of events) {
    const d = new Date(e.date_start)
    if (d <= todayEnd) groups[0].events.push(e)
    else if (d <= weekEnd) groups[1].events.push(e)
    else groups[2].events.push(e)
  }
  return groups.filter(g => g.events.length > 0)
}

/* ─── Hero Banner ────────────────────────────────────────────── */
function HeroBanner({ event }: { event: Event }) {
  const days = daysUntil(event.date_start)
  const organiser = event.organizer?.company_name ?? event.organizer?.full_name ?? 'Unknown Organizer'

  return (
    <Link href={`/guest/explore/${event.slug || event.id}`} style={{ textDecoration: 'none', display: 'block', margin: '14px 16px 0' }}>
      <div style={{
        borderRadius: 20, overflow: 'hidden', position: 'relative', height: 215,
        background: event.cover_image_url ? `url(${event.cover_image_url}) center/cover` : getGradient(event.id),
        boxShadow: '0 16px 56px rgba(0,0,0,0.65)',
      }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.035, backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.25) 55%, transparent 100%)' }} />

        {/* Top row */}
        <div style={{ position: 'absolute', top: 13, left: 13, right: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ padding: '4px 9px', borderRadius: 7, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', color: 'rgba(255,255,255,0.8)', fontSize: 9, fontWeight: 800, letterSpacing: '1.2px' }}>
            FEATURED
          </span>
          <span style={{ padding: '4px 9px', borderRadius: 7, background: days <= 1 ? 'rgba(239,68,68,0.9)' : 'rgba(0,0,0,0.55)', backdropFilter: 'blur(10px)', color: 'white', fontSize: 9, fontWeight: 800, letterSpacing: '0.8px' }}>
            {days <= 0 ? 'TODAY' : days === 1 ? 'TOMORROW' : `IN ${days} DAYS`}
          </span>
        </div>

        {/* Bottom content */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 16px 16px' }}>
          {(event.tags ?? []).length > 0 && (
            <div style={{ display: 'flex', gap: 5, marginBottom: 7 }}>
              {(event.tags ?? []).slice(0, 2).map(tag => (
                <span key={tag} style={{ padding: '2px 7px', borderRadius: 6, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(6px)', color: 'rgba(255,255,255,0.75)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {tag}
                </span>
              ))}
            </div>
          )}
          <h2 style={{ color: 'white', fontSize: 24, fontWeight: 900, margin: '0 0 7px', fontFamily: 'var(--font-display)', letterSpacing: '-0.6px', lineHeight: 1.1 }}>
            {event.title}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11 }}>
              {fmtDay(event.date_start)} · {fmtTime(event.date_start)}
            </span>
            <span style={{ width: 2, height: 2, borderRadius: '50%', background: 'rgba(255,255,255,0.25)', flexShrink: 0 }} />
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>by {organiser}</span>
            <span style={{ marginLeft: 'auto', padding: '4px 9px', borderRadius: 7, background: (event.ticket_price ?? 0) === 0 ? 'rgba(16,185,129,0.85)' : 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: 10, fontWeight: 800 }}>
              {(event.ticket_price ?? 0) === 0 ? 'FREE' : `PKR ${event.ticket_price!.toLocaleString('en-PK')}`}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

/* ─── My Events Strip ────────────────────────────────────────── */
function MyEventsStrip({ myEvents }: { myEvents: MyEvent[] }) {
  if (!myEvents.length) return null
  function resolveStatusDot(status: string): string {
    if (status === 'pending')  return '#EAB308'
    if (status === 'rejected') return '#EF4444'
    if (status === 'approved') return '#10B981'
    const map: Record<string, string> = {
      confirmed: '#10B981', registered: '#10B981',
      eoi_submitted: '#EAB308', eoi_approved: '#EF4444', payment_pending: '#818CF8',
    }
    return map[status] ?? 'var(--text-secondary)'
  }
  return (
    <div style={{ margin: '20px 0 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 16px', marginBottom: 11 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{ width: 3, height: 13, borderRadius: 2, background: '#FF6B35' }} />
          <span style={{ color: 'var(--text-primary)', fontSize: 12, fontWeight: 800, fontFamily: 'var(--font-display)', letterSpacing: '0.3px' }}>MY EVENTS</span>
        </div>
        <Link href="/guest/tikkit" style={{ color: '#818CF8', fontSize: 10, fontWeight: 800, textDecoration: 'none', letterSpacing: '0.5px' }}>SEE ALL →</Link>
      </div>
      <div style={{ display: 'flex', gap: 9, overflowX: 'auto', padding: '0 16px 2px', scrollbarWidth: 'none' }}>
        {myEvents.map((reg, i) => {
          const ev = reg.event; if (!ev) return null
          const dot = resolveStatusDot(reg.status)
          return (
            <Link key={reg.id} href={ev.slug ? `/guest/explore/${ev.slug}` : ev.id ? `/guest/explore/${ev.id}` : '/guest/tikkit'} style={{ textDecoration: 'none', flexShrink: 0, width: 120, opacity: 0, animation: 'revealUp 0.3s ease forwards', animationDelay: `${i * 50}ms` }}>
              <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--guest-border)' }}>
                <div style={{ height: 64, background: ev.cover_image_url ? `url(${ev.cover_image_url}) center/cover` : getGradient(ev.id), position: 'relative' }}>
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.55), transparent)' }} />
                  <div style={{ position: 'absolute', bottom: 5, right: 6, width: 6, height: 6, borderRadius: '50%', background: dot, boxShadow: `0 0 5px ${dot}` }} />
                </div>
                <div style={{ padding: '6px 8px 8px', background: 'var(--guest-surface)' }}>
                  <p style={{ color: 'var(--text-primary)', fontSize: 10, fontWeight: 700, margin: '0 0 1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--font-display)' }}>{ev.title}</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: 9, margin: 0, fontWeight: 600 }}>{fmtDay(ev.date_start)} · {fmtTime(ev.date_start)}</p>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

/* ─── Top Organizers Strip ───────────────────────────────────── */
function TopOrganizersStrip({
  organizers: initial,
  userId,
}: {
  organizers: TopOrganizer[]
  userId: string | null
}) {
  const [organizers, setOrganizers] = useState(initial)
  const [, startTransition] = useTransition()

  if (!organizers.length) return null

  function handleStar(e: React.MouseEvent, org: TopOrganizer) {
    e.preventDefault()
    e.stopPropagation()
    if (!userId) return

    // Optimistic update
    setOrganizers(prev =>
      prev.map(o => o.id === org.id ? { ...o, is_favourite: !o.is_favourite } : o)
    )

    startTransition(async () => {
      try {
        await toggleFavouriteOrganizer(org.id)
      } catch {
        // Revert on error
        setOrganizers(prev =>
          prev.map(o => o.id === org.id ? { ...o, is_favourite: org.is_favourite } : o)
        )
      }
    })
  }

  return (
    <div style={{ margin: '20px 0 0' }}>
      {/* Header */}
      <div className="exp-strip-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 16px', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{ width: 3, height: 13, borderRadius: 2, background: '#FFC745' }} />
          <Building2 size={12} color="#FFC745" />
          <span className="exp-section-lbl" style={{ color: 'var(--text-primary)', fontSize: 12, fontWeight: 800, fontFamily: 'var(--font-display)', letterSpacing: '0.3px' }}>
            TOP ORGANIZERS
          </span>
        </div>
      </div>

      {/* Scroll / grid */}
      <div className="exp-org-scroll" style={{ display: 'flex', gap: 10, overflowX: 'auto', padding: '0 16px 4px', scrollbarWidth: 'none' }}>
        {organizers.map((org, i) => {
          const name = org.company_name ?? org.full_name ?? 'Organizer'
          const href = org.username ? `/organizer/${org.username}` : null
          const card = (
            <div
              key={org.id}
              className="exp-org-card"
              style={{
                flexShrink: 0, width: 104,
                opacity: 0, animation: 'revealUp 0.3s ease forwards',
                animationDelay: `${i * 60}ms`,
              }}
            >
              <div style={{
                borderRadius: 16, overflow: 'hidden',
                border: '1px solid var(--guest-border)',
                background: 'var(--guest-surface)',
                position: 'relative',
              }}>
                {/* Cover strip */}
                <div style={{
                  height: 44,
                  background: org.cover_image_url
                    ? `url(${org.cover_image_url}) center/cover`
                    : getGradient(org.id),
                  position: 'relative',
                }}>
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.4))' }} />
                </div>

                {/* Logo / initials */}
                <div style={{
                  position: 'absolute', top: 24, left: '50%', transform: 'translateX(-50%)',
                  width: 40, height: 40, borderRadius: 12,
                  border: '2px solid var(--guest-border)',
                  background: org.logo_url ? `url(${org.logo_url}) center/cover` : 'var(--guest-surface-2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                }}>
                  {!org.logo_url && (
                    <span style={{ color: '#818CF8', fontSize: 12, fontWeight: 900, fontFamily: 'var(--font-display)' }}>
                      {orgInitials(org)}
                    </span>
                  )}
                </div>

                {/* Star button */}
                {userId && (
                  <button
                    onClick={(e) => handleStar(e, org)}
                    style={{
                      position: 'absolute', top: 6, right: 6,
                      width: 22, height: 22, borderRadius: 7,
                      background: org.is_favourite ? 'rgba(252,191,73,0.2)' : 'rgba(0,0,0,0.45)',
                      border: `1px solid ${org.is_favourite ? 'rgba(252,191,73,0.4)' : 'rgba(255,255,255,0.1)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      backdropFilter: 'blur(6px)',
                    }}
                  >
                    <Heart
                      size={10}
                      color={org.is_favourite ? '#FCBF49' : 'rgba(255,255,255,0.5)'}
                      fill={org.is_favourite ? '#FCBF49' : 'none'}
                    />
                  </button>
                )}

                {/* Info */}
                <div style={{ padding: '26px 8px 10px', textAlign: 'center' }}>
                  <p className="exp-org-name" style={{
                    color: 'var(--text-primary)', fontSize: 10, fontWeight: 800,
                    margin: '0 0 3px', fontFamily: 'var(--font-display)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {name}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                    <CalendarDays size={8} color="var(--text-muted)" />
                    <span style={{ color: 'var(--text-muted)', fontSize: 9, fontWeight: 700 }}>
                      {org.upcoming_event_count} event{org.upcoming_event_count !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )

          return href ? (
            <Link key={org.id} href={href} style={{ textDecoration: 'none' }}>
              {card}
            </Link>
          ) : (
            <div key={org.id}>{card}</div>
          )
        })}
      </div>
    </div>
  )
}

/* ─── Desktop Hero Carousel ─────────────────────────────────── */
function DesktopHeroCarousel({ slides }: { slides: Event[] }) {
  const [idx, setIdx] = useState(0)
  const [paused, setPaused] = useState(false)
  const [arrowsVisible, setArrowsVisible] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const count = slides.length

  useEffect(() => {
    if (paused || count <= 1) return
    timerRef.current = setInterval(() => setIdx(i => (i + 1) % count), 5500)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [paused, count])

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft')  setIdx(i => (i - 1 + count) % count)
    if (e.key === 'ArrowRight') setIdx(i => (i + 1) % count)
  }
  const prev = (e: React.MouseEvent) => { e.preventDefault(); setIdx(i => (i - 1 + count) % count) }
  const next = (e: React.MouseEvent) => { e.preventDefault(); setIdx(i => (i + 1) % count) }

  if (!slides.length) return null

  return (
    <div
      className="exp-desktop-hero"
      tabIndex={0}
      onKeyDown={handleKey}
      onMouseEnter={() => { setPaused(true); setArrowsVisible(true) }}
      onMouseLeave={() => { setPaused(false); setArrowsVisible(false) }}
      style={{ position: 'relative', borderRadius: 20, overflow: 'hidden', height: 520, marginBottom: 32, boxShadow: '0 32px 80px rgba(0,0,0,0.7)', outline: 'none' }}
    >
      {/* Slides */}
      {slides.map((ev, i) => {
        const days = daysUntil(ev.date_start)
        const organiser = ev.organizer?.company_name ?? ev.organizer?.full_name ?? 'Unknown Organizer'
        return (
          <div
            key={ev.id}
            style={{
              position: 'absolute', inset: 0,
              background: ev.cover_image_url ? `url(${ev.cover_image_url}) center/cover` : getGradient(ev.id),
              opacity: i === idx ? 1 : 0,
              transition: 'opacity 0.7s ease',
              pointerEvents: i === idx ? 'auto' : 'none',
            }}
          >
            {/* Bottom gradient — stronger for text legibility */}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.55) 40%, rgba(0,0,0,0.1) 75%, transparent 100%)' }} />
            {/* Left gradient */}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.6) 0%, transparent 60%)' }} />

            {/* Content */}
            <Link
              href={`/guest/explore/${ev.slug || ev.id}`}
              style={{ position: 'absolute', inset: 0, textDecoration: 'none', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '48px 52px' }}
            >
              {/* Top badges */}
              <div style={{ position: 'absolute', top: 28, left: 52, display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ padding: '5px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', color: 'rgba(255,255,255,0.9)', fontSize: 10, fontWeight: 800, letterSpacing: '1.5px' }}>
                  FEATURED
                </span>
                <span style={{ padding: '5px 12px', borderRadius: 8, background: days <= 1 ? 'rgba(239,68,68,0.9)' : 'rgba(0,0,0,0.55)', backdropFilter: 'blur(12px)', color: 'white', fontSize: 10, fontWeight: 800, letterSpacing: '0.8px' }}>
                  {days <= 0 ? 'TODAY' : days === 1 ? 'TOMORROW' : `IN ${days} DAYS`}
                </span>
              </div>

              {/* Tags */}
              {(ev.tags ?? []).length > 0 && (
                <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                  {(ev.tags ?? []).slice(0, 3).map(tag => (
                    <span key={tag} style={{ padding: '4px 11px', borderRadius: 7, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Title */}
              <h2 style={{ color: 'white', fontSize: 44, fontWeight: 900, margin: '0 0 16px', fontFamily: 'var(--font-display)', letterSpacing: '-1px', lineHeight: 1.05, maxWidth: 600 }}>
                {ev.title}
              </h2>

              {/* Meta */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CalendarDays size={14} style={{ opacity: 0.8 }} />
                  {fmtDay(ev.date_start)} · {fmtTime(ev.date_start)}
                </span>
                {ev.venue_name && !ev.secret_venue && (
                  <>
                    <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
                    <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <MapPin size={13} style={{ opacity: 0.7 }} />{ev.venue_name}
                    </span>
                  </>
                )}
                <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'rgba(255,255,255,0.25)', flexShrink: 0 }} />
                <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14 }}>by {organiser}</span>
              </div>

              {/* CTA row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '12px 28px', borderRadius: 14, background: 'var(--brand-blue)', color: '#FFFFFF', fontSize: 15, fontWeight: 800, boxShadow: '0 4px 24px rgba(var(--brand-blue-rgb),0.55)', letterSpacing: '-0.2px' }}>
                  View Event →
                </span>
                <span style={{ padding: '11px 18px', borderRadius: 14, background: (ev.ticket_price ?? 0) === 0 ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)', border: `1px solid ${(ev.ticket_price ?? 0) === 0 ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.14)'}`, color: (ev.ticket_price ?? 0) === 0 ? '#10B981' : 'white', fontSize: 15, fontWeight: 800 }}>
                  {(ev.ticket_price ?? 0) === 0 ? 'FREE' : `PKR ${ev.ticket_price!.toLocaleString('en-PK')}`}
                </span>
              </div>
            </Link>
          </div>
        )
      })}

      {/* Prev / Next arrows — visible on hover only */}
      {count > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Previous slide"
            style={{ position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)', zIndex: 10, width: 44, height: 44, borderRadius: 12, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'opacity 0.2s, background 0.15s', opacity: arrowsVisible ? 1 : 0 }}
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={next}
            aria-label="Next slide"
            style={{ position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)', zIndex: 10, width: 44, height: 44, borderRadius: 12, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'opacity 0.2s, background 0.15s', opacity: arrowsVisible ? 1 : 0 }}
          >
            <ChevronRight size={20} />
          </button>
        </>
      )}

      {/* Dot indicators */}
      {count > 1 && (
        <div style={{ position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6, zIndex: 10 }}>
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              aria-label={`Slide ${i + 1}`}
              style={{ height: 4, width: i === idx ? 32 : 8, borderRadius: 2, background: i === idx ? 'white' : 'rgba(255,255,255,0.35)', border: 'none', cursor: 'pointer', padding: 0, transition: 'all 0.35s ease' }}
            />
          ))}
        </div>
      )}

      {/* Progress bar */}
      {count > 1 && !paused && (
        <div key={idx} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 4, zIndex: 10 }}>
          <div style={{ height: '100%', background: 'rgba(var(--brand-blue-rgb),0.9)', animation: 'heroProgress 5.5s linear forwards' }} />
        </div>
      )}
    </div>
  )
}

/* ─── Desktop Event Card ─────────────────────────────────────── */
function EventCard({ event, index, isFavourited, onToggleFav }: {
  event: Event; index: number
  isFavourited: boolean
  onToggleFav: (id: string) => void
}) {
  const router = useRouter()
  const [hovered, setHovered] = useState(false)
  const orgName = event.organizer?.company_name ?? event.organizer?.full_name ?? 'Unknown Organizer'
  const orgUsername = event.organizer?.username
  const spotsLeft = (event.capacity && event.registered_count !== undefined) ? event.capacity - event.registered_count : null
  const isFull = spotsLeft !== null && spotsLeft <= 0
  const modeCfg: Record<string, { label: string; color: string; bg: string }> = {
    expression_of_interest: { label: 'APPLY',       color: '#A855F7',           bg: 'rgba(168,85,247,0.10)' },
    open:                   { label: 'REGISTER',    color: 'var(--brand-blue)', bg: 'rgba(var(--brand-blue-rgb),0.10)' },
    invite_only:            { label: 'INVITE ONLY', color: 'var(--text-muted)', bg: 'rgba(107,114,128,0.09)' },
  }
  const mode = modeCfg[event.registration_mode] ?? modeCfg.open

  return (
    <div
      onClick={() => router.push(`/guest/explore/${event.slug || event.id}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        cursor: 'pointer',
        borderRadius: 16,
        overflow: 'hidden',
        background: 'var(--surface-card)',
        border: '1px solid var(--guest-border)',
        transition: 'all 0.2s ease',
        opacity: 0,
        animation: 'revealUp 0.35s ease forwards',
        animationDelay: `${index * 45}ms`,
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
        boxShadow: hovered ? '0 12px 40px rgba(0,0,0,0.35)' : '0 2px 8px rgba(0,0,0,0.15)',
      }}
    >
      {/* Image */}
      <div style={{ position: 'relative', height: 180, background: event.cover_image_url ? `url(${event.cover_image_url}) center/cover` : getGradient(event.id) }}>
        {!event.cover_image_url && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.15 }}>
            <CalendarDays size={40} color="white" />
          </div>
        )}
        {/* Overlay gradient */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)' }} />

        {/* Price badge — top left */}
        <div style={{ position: 'absolute', top: 10, left: 10 }}>
          {(event.ticket_price ?? 0) === 0
            ? <span style={{ padding: '4px 10px', borderRadius: 8, background: 'rgba(16,185,129,0.9)', color: 'white', fontSize: 11, fontWeight: 800 }}>FREE</span>
            : <span style={{ padding: '4px 10px', borderRadius: 8, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.12)', color: 'white', fontSize: 11, fontWeight: 800 }}>PKR {event.ticket_price!.toLocaleString('en-PK')}</span>
          }
        </div>

        {/* FULL badge */}
        {isFull && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'white', fontSize: 13, fontWeight: 900, letterSpacing: '1px', padding: '6px 14px', borderRadius: 8, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.15)' }}>FULL</span>
          </div>
        )}

        {/* Heart button — top right */}
        <button
          onClick={e => { e.stopPropagation(); onToggleFav(event.id) }}
          style={{ position: 'absolute', top: 10, right: 10, width: 32, height: 32, borderRadius: 8, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          <Heart size={14} style={{ color: isFavourited ? '#EF4444' : 'white', fill: isFavourited ? '#EF4444' : 'none', transition: 'all 0.15s' }} />
        </button>

        {/* Mode badge — bottom left */}
        <div style={{ position: 'absolute', bottom: 10, left: 10 }}>
          <span style={{ padding: '3px 8px', borderRadius: 6, background: mode.bg, backdropFilter: 'blur(6px)', color: mode.color, fontSize: 10, fontWeight: 800, letterSpacing: '0.4px' }}>
            {mode.label}
          </span>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '14px 16px 16px' }}>
        {/* Category tag */}
        {(event.tags ?? []).length > 0 && (
          <span style={{ display: 'inline-block', padding: '2px 7px', borderRadius: 5, background: 'rgba(129,140,248,0.1)', color: '#818CF8', fontSize: 10, fontWeight: 800, letterSpacing: '0.4px', marginBottom: 8 }}>
            {(event.tags ?? [])[0].toUpperCase()}
          </span>
        )}

        {/* Title */}
        <h3 style={{ color: 'var(--text-primary)', fontSize: 15, fontWeight: 800, margin: '0 0 8px', fontFamily: 'var(--font-display)', letterSpacing: '-0.3px', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {event.title}
        </h3>

        {/* Meta */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-secondary)', fontSize: 12 }}>
            <CalendarDays size={11} style={{ flexShrink: 0, opacity: 0.7 }} />
            {fmtDay(event.date_start)} · {fmtTime(event.date_start)}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-secondary)', fontSize: 12 }}>
            <MapPin size={11} style={{ flexShrink: 0, opacity: 0.7 }} />
            {event.secret_venue
              ? <span style={{ color: '#FFC745', display: 'flex', alignItems: 'center', gap: 3 }}><Lock size={10} />Secret venue</span>
              : (event.venue_name ?? 'TBA')
            }
          </span>
        </div>

        {/* Organizer + spots */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--guest-border)' }}>
          {orgUsername ? (
            <span
              role="link"
              tabIndex={0}
              onClick={e => { e.stopPropagation(); router.push(`/organizer/${orgUsername}`) }}
              onKeyDown={e => e.key === 'Enter' && router.push(`/organizer/${orgUsername}`)}
              style={{ color: '#818CF8', fontSize: 11, fontStyle: 'italic', cursor: 'pointer' }}
            >
              {orgName} →
            </span>
          ) : (
            <span style={{ color: 'var(--text-muted)', fontSize: 11, fontStyle: 'italic' }}>{orgName}</span>
          )}
          {spotsLeft !== null && spotsLeft > 0 && spotsLeft <= 15 && (
            <span style={{ padding: '2px 7px', borderRadius: 5, background: 'rgba(239,68,68,0.1)', color: '#EF4444', fontSize: 10, fontWeight: 800 }}>
              {spotsLeft} LEFT
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── Event Row ──────────────────────────────────────────────── */
function EventRow({ event, index, isFavourited, onToggleFav }: {
  event: Event; index: number
  isFavourited: boolean
  onToggleFav: (id: string) => void
}) {
  const router = useRouter()
  const orgName = event.organizer?.company_name ?? event.organizer?.full_name ?? 'Unknown Organizer'
  const orgUsername = event.organizer?.username
  const spotsLeft = (event.capacity && event.registered_count !== undefined) ? event.capacity - event.registered_count : null
  const modeCfg: Record<string, { label: string; color: string; bg: string }> = {
    expression_of_interest: { label: 'APPLY',       color: '#A855F7',           bg: 'rgba(168,85,247,0.10)'            },
    open:                   { label: 'REGISTER',    color: 'var(--brand-blue)', bg: 'rgba(var(--brand-blue-rgb),0.10)' },
    invite_only:            { label: 'INVITE ONLY', color: 'var(--text-muted)', bg: 'rgba(107,114,128,0.09)'           },
  }
  const mode = modeCfg[event.registration_mode] ?? modeCfg.open
  const isFull = spotsLeft !== null && spotsLeft <= 0

  return (
    <div
      onClick={() => router.push(`/guest/explore/${event.slug || event.id}`)}
      style={{ textDecoration: 'none', display: 'block', opacity: 0, animation: 'revealUp 0.35s ease forwards', animationDelay: `${index * 55}ms`, cursor: 'pointer' }}
    >
      <div className="exp-row-pad" style={{ display: 'flex', gap: 11, padding: '11px 0', borderBottom: '1px solid var(--guest-border)' }}>
        {/* Date column */}
        <div className="exp-date-col" style={{ flexShrink: 0, width: 42, textAlign: 'center', paddingTop: 1 }}>
          <p style={{ color: '#818CF8', fontSize: 8, fontWeight: 800, margin: '0 0 1px', letterSpacing: '0.8px' }}>{fmtDay(event.date_start)}</p>
          <p className="exp-date-day" style={{ color: 'var(--text-primary)', fontSize: 20, fontWeight: 900, margin: 0, fontFamily: 'var(--font-display)', lineHeight: 1 }}>{new Date(event.date_start).getDate()}</p>
          <p style={{ color: 'var(--text-muted)', fontSize: 8, margin: '1px 0 0', fontWeight: 700, letterSpacing: '0.3px' }}>
            {new Date(event.date_start).toLocaleDateString('en-PK', { month: 'short' }).toUpperCase()}
          </p>
        </div>

        {/* Thumbnail */}
        <div className="exp-row-thumb" style={{ flexShrink: 0, width: 68, height: 68, borderRadius: 12, overflow: 'hidden', background: event.cover_image_url ? `url(${event.cover_image_url}) center/cover` : getGradient(event.id), border: '1px solid var(--guest-border)', position: 'relative' }}>
          {!event.cover_image_url && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.2 }}>
              <CalendarDays size={22} color="white" />
            </div>
          )}
          {isFull && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'white', fontSize: 7, fontWeight: 900, letterSpacing: '0.5px' }}>FULL</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 className="exp-row-title" style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 800, margin: '0 0 1px', fontFamily: 'var(--font-display)', letterSpacing: '-0.2px', lineHeight: 1.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {event.title}
          </h3>
          {/* Organizer link */}
          {orgUsername ? (
            <span
              role="link"
              tabIndex={0}
              onClick={e => { e.stopPropagation(); router.push(`/organizer/${orgUsername}`) }}
              onKeyDown={e => e.key === 'Enter' && router.push(`/organizer/${orgUsername}`)}
              style={{ color: '#818CF8', fontSize: 10, margin: '0 0 5px', fontStyle: 'italic', cursor: 'pointer', display: 'inline-block' }}
            >
              {orgName} →
            </span>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: 10, margin: '0 0 5px', fontStyle: 'italic' }}>{orgName}</p>
          )}
          <div className="exp-row-meta" style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'var(--text-secondary)', fontSize: 10 }}>
              <Clock size={9} />{fmtTime(event.date_start)}
            </span>
            <span style={{ width: 2, height: 2, borderRadius: '50%', background: 'var(--text-muted)', flexShrink: 0 }} />
            <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'var(--text-secondary)', fontSize: 10 }}>
              <MapPin size={9} />
              {event.secret_venue
                ? <span style={{ color: '#FFC745', display: 'flex', alignItems: 'center', gap: 2 }}><Lock size={8} />Secret</span>
                : (event.venue_name ?? 'TBA')}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexWrap: 'wrap' }}>
            <span className="exp-row-badge" style={{ padding: '2px 6px', borderRadius: 5, background: mode.bg, color: mode.color, fontSize: 8, fontWeight: 800, letterSpacing: '0.4px' }}>
              {mode.label}
            </span>
            {(event.ticket_price ?? 0) === 0
              ? <span className="exp-row-badge" style={{ padding: '2px 6px', borderRadius: 5, background: 'rgba(16,185,129,0.1)', color: '#10B981', fontSize: 8, fontWeight: 800 }}>FREE</span>
              : <span style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 700 }}>PKR {event.ticket_price!.toLocaleString('en-PK')}</span>
            }
            {spotsLeft !== null && spotsLeft > 0 && spotsLeft <= 15 && (
              <span className="exp-row-badge" style={{ padding: '2px 6px', borderRadius: 5, background: 'rgba(239,68,68,0.1)', color: '#EF4444', fontSize: 8, fontWeight: 800 }}>
                {spotsLeft} LEFT
              </span>
            )}
          </div>
        </div>

        {/* Heart / Save button */}
        <button
          onClick={e => { e.stopPropagation(); onToggleFav(event.id) }}
          style={{ alignSelf: 'center', flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', padding: '6px 2px 6px 6px', display: 'flex' }}
        >
          <Heart
            size={17}
            style={{
              color: isFavourited ? '#EF4444' : '#374151',
              fill: isFavourited ? '#EF4444' : 'none',
              transition: 'all 0.15s',
            }}
          />
        </button>
      </div>
    </div>
  )
}

/* ─── Category Filter Pills ──────────────────────────────────── */
function CategoryPills({
  categories,
  selectedCategoryId,
  onSelect,
}: {
  categories: { id: string; name: string; icon: string; color: string }[]
  selectedCategoryId: string | null
  onSelect: (id: string | null) => void
}) {
  if (!categories.length) return null
  return (
    <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '10px 16px 0', scrollbarWidth: 'none' }}>
      <button
        onClick={() => onSelect(null)}
        style={{
          flexShrink: 0,
          padding: '5px 10px', borderRadius: 20,
          background: !selectedCategoryId ? 'rgba(129,140,248,0.15)' : 'var(--guest-surface-2)',
          border: `1px solid ${!selectedCategoryId ? 'rgba(129,140,248,0.4)' : 'var(--guest-border)'}`,
          color: !selectedCategoryId ? '#818CF8' : 'var(--text-muted)',
          fontSize: 10, fontWeight: 800, letterSpacing: '0.3px',
          cursor: 'pointer', fontFamily: 'var(--font-body)',
          transition: 'all 0.15s',
        }}
      >
        All
      </button>
      {categories.map(cat => {
        const active = selectedCategoryId === cat.id
        return (
          <button
            key={cat.id}
            onClick={() => onSelect(active ? null : cat.id)}
            style={{
              flexShrink: 0,
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '5px 10px', borderRadius: 20,
              background: active ? `${cat.color}18` : 'var(--guest-surface-2)',
              border: `1px solid ${active ? `${cat.color}50` : 'var(--guest-border)'}`,
              color: active ? cat.color : 'var(--text-muted)',
              fontSize: 10, fontWeight: 800, letterSpacing: '0.3px',
              cursor: 'pointer', fontFamily: 'var(--font-body)',
              transition: 'all 0.15s',
            }}
          >
            <span style={{ fontSize: 11 }}>{cat.icon}</span>
            {cat.name}
          </button>
        )
      })}
    </div>
  )
}

/* ─── Main ───────────────────────────────────────────────────── */
export default function ExploreClient({
  events,
  myEvents,
  topOrganizers = [],
  categories = [],
  userId = null,
  favouritedEventIds = [],
}: {
  events: Event[]
  myEvents: MyEvent[]
  topOrganizers?: TopOrganizer[]
  categories?: { id: string; name: string; slug: string; icon: string; color: string }[]
  userId?: string | null
  favouritedEventIds?: string[]
}) {
  const [query, setQuery] = useState('')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [focused, setFocused] = useState(false)
  const [favIds, setFavIds] = useState(() => new Set(favouritedEventIds))
  const [, startFavTransition] = useTransition()

  const handleToggleFav = (eventId: string) => {
    if (!userId) return
    setFavIds(prev => {
      const next = new Set(prev)
      if (next.has(eventId)) next.delete(eventId)
      else next.add(eventId)
      return next
    })
    startFavTransition(async () => {
      const res = await toggleEventFavourite(eventId)
      // Sync if server disagrees
      setFavIds(prev => {
        const next = new Set(prev)
        if (res.favourited) next.add(eventId)
        else next.delete(eventId)
        return next
      })
    })
  }

  const allTags = Array.from(new Set(events.flatMap(e => e.tags ?? []))).slice(0, 8)
  const isFiltering = !!(query || selectedTag || selectedCategoryId)

  const filtered = events.filter(e => {
    const q = query.toLowerCase()
    const matchQ = !query || e.title.toLowerCase().includes(q)
      || (e.venue_name ?? '').toLowerCase().includes(q)
      || (e.tags ?? []).some(t => t.toLowerCase().includes(q))
      || (e.organizer?.company_name ?? '').toLowerCase().includes(q)
      || (e.organizer?.full_name ?? '').toLowerCase().includes(q)
    const matchTag = !selectedTag || (e.tags ?? []).includes(selectedTag)
    const matchCat = !selectedCategoryId || e.category_id === selectedCategoryId
    return matchQ && matchTag && matchCat
  })

  const heroEvent = events[0] ?? null
  const groups = groupEvents(isFiltering ? filtered : events.slice(1))

  return (
    <>
      {/* ── Responsive overrides ─────────────────────────────────── */}
      <style>{`
        /* ── Mobile defaults ── */
        .exp-search-wrap  { padding: 12px 16px 0; }
        .exp-pills-wrap   { display: flex; gap: 6px; overflow-x: auto; padding: 10px 16px 0; scrollbar-width: none; }
        .exp-tags-wrap    { display: flex; gap: 5px; overflow-x: auto; padding: 8px 16px 0; scrollbar-width: none; }

        .exp-grid         { display: flex; flex-direction: column; }
        .exp-sidebar      { order: 1; }
        .exp-main         { order: 2; }

        .exp-row-thumb    { width: 68px !important; height: 68px !important; }
        .exp-row-title    { font-size: 13px !important; }
        .exp-row-meta     { font-size: 10px !important; }
        .exp-row-badge    { font-size: 8px !important; }
        .exp-date-day     { font-size: 20px !important; }
        .exp-date-col     { width: 42px !important; }
        .exp-section-lbl  { font-size: 12px !important; }
        .exp-group-lbl    { font-size: 10px !important; }

        .exp-org-scroll   { display: flex; gap: 10px; overflow-x: auto; padding: 0 16px 4px; scrollbar-width: none; }
        .exp-org-card     { flex-shrink: 0; width: 104px; }
        .exp-myev-scroll  { display: flex; gap: 9px; overflow-x: auto; padding: 0 16px 2px; scrollbar-width: none; }
        .exp-myev-card    { flex-shrink: 0; width: 120px; }

        .exp-hero-wrap    { margin: 14px 16px 0; }
        .exp-hero-inner   { border-radius: 20px; overflow: hidden; position: relative; height: 215px; }

        /* Desktop carousel hidden on mobile */
        .exp-desktop-hero { display: none; }

        /* Event card grid — hidden on mobile */
        .exp-card-grid    { display: none; }
        /* Event row list — shown on mobile */
        .exp-row-list     { display: block; }

        @keyframes heroProgress {
          from { width: 0%; }
          to   { width: 100%; }
        }

        /* ── Desktop overrides (≥768px) ── */
        @media (min-width: 768px) {
          /* Hero carousel replaces mobile hero */
          .exp-desktop-hero { display: block; }
          .exp-hero-wrap    { display: none !important; }

          /* Single-column linear flow — no sidebar layout */
          .exp-grid         { display: block; }
          .exp-sidebar      { margin-bottom: 0; }

          /* Search + pills: no side padding (content container already has it) */
          .exp-search-wrap  { padding: 0 0 12px; }
          .exp-pills-wrap   { padding: 0 0 0; flex-wrap: wrap; overflow: visible; gap: 8px; }
          .exp-tags-wrap    { padding: 6px 0 0; flex-wrap: wrap; overflow: visible; gap: 6px; }

          /* Pill sizing on desktop */
          .exp-pills-wrap button,
          .exp-tags-wrap  button { padding: 7px 16px !important; font-size: 11px !important; }

          /* Organizer grid: auto-fill columns */
          .exp-org-scroll   { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); overflow: visible; padding: 0; gap: 12px; }
          .exp-org-card     { width: auto !important; }

          /* My events strip stays horizontal but wider cards */
          .exp-myev-scroll  { padding: 0; gap: 12px; }
          .exp-myev-card    { width: 140px !important; }

          /* Strip headers lose side padding */
          .exp-strip-header { padding-left: 0 !important; padding-right: 0 !important; }

          /* Section headers */
          .exp-section-lbl  { font-size: 14px !important; }
          .exp-group-lbl    { font-size: 12px !important; letter-spacing: 1.2px !important; }
          .exp-all-divider  { padding: 16px 0 0 !important; }
          .exp-group-header { padding: 20px 0 8px !important; }
          .exp-group-rows   { padding: 0 !important; }
          .exp-filter-pad   { padding: 14px 0 0 !important; }
          .exp-filter-lbl   { font-size: 13px !important; }

          /* Event card grid shown on desktop; row list hidden */
          .exp-card-grid    { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
          .exp-row-list     { display: none; }
        }

        @media (min-width: 1024px) {
          .exp-card-grid    { grid-template-columns: repeat(3, 1fr); }
        }
      `}</style>

      {/* Search */}
      <div className="exp-search-wrap">
        <div className="guest-search">
          <Search
            size={14}
            style={{ flexShrink: 0, color: focused ? '#818CF8' : 'var(--text-muted)', transition: 'color 0.2s' }}
          />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Search events, venues, organizers..."
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              color: 'var(--text-primary)', fontSize: 13, fontFamily: 'var(--font-body)',
            }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="cursor-pointer"
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', padding: 0, fontSize: 18, lineHeight: 1 }}
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Category filter pills */}
      <div className="exp-pills-wrap">
        <button
          onClick={() => setSelectedCategoryId(null)}
          style={{
            flexShrink: 0, padding: '5px 10px', borderRadius: 20,
            background: !selectedCategoryId ? 'rgba(var(--brand-blue-rgb),0.15)' : 'var(--guest-surface-2)',
            border: `1px solid ${!selectedCategoryId ? 'rgba(var(--brand-blue-rgb),0.4)' : 'var(--guest-border)'}`,
            color: !selectedCategoryId ? 'var(--brand-blue)' : 'var(--text-muted)',
            fontSize: 10, fontWeight: 800, letterSpacing: '0.3px',
            cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'all 0.15s',
          }}
        >All</button>
        {categories.map(cat => {
          const active = selectedCategoryId === cat.id
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryId(active ? null : cat.id)}
              style={{
                flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4,
                padding: '5px 10px', borderRadius: 20,
                background: active ? `${cat.color}18` : 'var(--guest-surface-2)',
                border: `1px solid ${active ? `${cat.color}50` : 'var(--guest-border)'}`,
                color: active ? cat.color : 'var(--text-muted)',
                fontSize: 10, fontWeight: 800, letterSpacing: '0.3px',
                cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: 11 }}>{cat.icon}</span>{cat.name}
            </button>
          )
        })}
      </div>

      {/* Tag chips */}
      {allTags.length > 0 && (
        <div className="exp-tags-wrap">
          {['All', ...allTags].map(tag => {
            const active = tag === 'All' ? !selectedTag : selectedTag === tag
            return (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag === 'All' ? null : tag)}
                className={`guest-pill ${active ? 'guest-pill-active' : ''}`}
              >
                {tag.toUpperCase()}
              </button>
            )
          })}
        </div>
      )}

      {/* ── Desktop full-width hero carousel (hidden on mobile) ── */}
      {!isFiltering && events.length > 0 && (
        <DesktopHeroCarousel slides={events.slice(0, 5)} />
      )}

      {/* ── Mobile hero banner (hidden on desktop via CSS) ── */}
      {!isFiltering && heroEvent && (
        <div className="exp-hero-wrap">
          <Link href={`/guest/explore/${heroEvent.slug || heroEvent.id}`} style={{ textDecoration: 'none', display: 'block' }}>
            <div className="exp-hero-inner" style={{
              background: heroEvent.cover_image_url
                ? `url(${heroEvent.cover_image_url}) center/cover`
                : getGradient(heroEvent.id),
              boxShadow: '0 16px 56px rgba(0,0,0,0.65)',
            }}>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.25) 55%, transparent 100%)' }} />
              <div style={{ position: 'absolute', top: 13, left: 13, right: 13, display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ padding: '4px 9px', borderRadius: 7, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', color: 'rgba(255,255,255,0.8)', fontSize: 9, fontWeight: 800, letterSpacing: '1.2px' }}>FEATURED</span>
              </div>
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 16px 16px' }}>
                <h2 style={{ color: 'white', fontSize: 22, fontWeight: 900, margin: '0 0 6px', fontFamily: 'var(--font-display)', lineHeight: 1.1 }}>{heroEvent.title}</h2>
                <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11 }}>{fmtDay(heroEvent.date_start)} · {fmtTime(heroEvent.date_start)}</span>
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* ── Content grid (single col on desktop, stacked on mobile) ── */}
      <div className="exp-grid">
        <div className="exp-sidebar">

          {/* My Events strip */}
          {!isFiltering && myEvents.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <div className="exp-strip-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 16px', marginBottom: 11 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div style={{ width: 3, height: 13, borderRadius: 2, background: '#FF6B35' }} />
                  <span className="exp-section-lbl" style={{ color: 'var(--text-primary)', fontWeight: 800, fontFamily: 'var(--font-display)', letterSpacing: '0.3px' }}>MY EVENTS</span>
                </div>
                <Link href="/guest/tikkit" style={{ color: '#818CF8', fontSize: 10, fontWeight: 800, textDecoration: 'none', letterSpacing: '0.5px' }}>SEE ALL →</Link>
              </div>
              <div className="exp-myev-scroll" style={{ padding: '0 16px 2px' }}>
                {myEvents.map((reg, i) => {
                  const ev = reg.event; if (!ev) return null
                  const dot = reg.status === 'confirmed' || reg.status === 'registered' ? '#10B981'
                    : reg.status === 'eoi_submitted' ? '#EAB308'
                    : reg.status === 'rejected' ? '#EF4444'
                    : reg.status === 'payment_pending' ? '#818CF8' : '#9CA3AF'
                  return (
                    <Link key={reg.id} href={ev.slug ? `/guest/explore/${ev.slug}` : ev.id ? `/guest/explore/${ev.id}` : '/guest/tikkit'} className="exp-myev-card" style={{ textDecoration: 'none', opacity: 0, animation: 'revealUp 0.3s ease forwards', animationDelay: `${i * 50}ms` }}>
                      <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--guest-border)' }}>
                        <div style={{ height: 64, background: ev.cover_image_url ? `url(${ev.cover_image_url}) center/cover` : getGradient(ev.id), position: 'relative' }}>
                          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.55), transparent)' }} />
                          <div style={{ position: 'absolute', bottom: 5, right: 6, width: 6, height: 6, borderRadius: '50%', background: dot, boxShadow: `0 0 5px ${dot}` }} />
                        </div>
                        <div style={{ padding: '6px 8px 8px', background: 'var(--guest-surface)' }}>
                          <p style={{ color: 'var(--text-primary)', fontSize: 10, fontWeight: 700, margin: '0 0 1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--font-display)' }}>{ev.title}</p>
                          <p style={{ color: 'var(--text-muted)', fontSize: 9, margin: 0, fontWeight: 600 }}>{fmtDay(ev.date_start)} · {fmtTime(ev.date_start)}</p>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

          {/* Top Organizers strip */}
          {!isFiltering && topOrganizers.length > 0 && (
            <TopOrganizersStrip organizers={topOrganizers} userId={userId} />
          )}
        </div>

        {/* Events section */}
        <div className="exp-main">
          {!isFiltering && (
            <div className="exp-all-divider" style={{ padding: '18px 16px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ height: 1, flex: 1, background: 'var(--guest-border)' }} />
              <span style={{ color: 'var(--text-muted)', fontSize: 9, fontWeight: 900, letterSpacing: '2px', fontFamily: 'var(--font-display)' }}>ALL EVENTS</span>
              <div style={{ height: 1, flex: 1, background: 'var(--guest-border)' }} />
            </div>
          )}

          {isFiltering ? (
            <div className="exp-filter-pad" style={{ padding: '14px 16px 0' }}>
              <p className="exp-filter-lbl" style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 800, letterSpacing: '0.8px', margin: '0 0 12px', fontFamily: 'var(--font-display)' }}>
                {filtered.length} RESULT{filtered.length !== 1 ? 'S' : ''}
              </p>
              {filtered.length > 0 ? (
                <>
                  {/* Desktop: card grid */}
                  <div className="exp-card-grid">
                    {filtered.map((e, i) => <EventCard key={e.id} event={e} index={i} isFavourited={favIds.has(e.id)} onToggleFav={handleToggleFav} />)}
                  </div>
                  {/* Mobile: row list */}
                  <div className="exp-row-list">
                    {filtered.map((e, i) => <EventRow key={e.id} event={e} index={i} isFavourited={favIds.has(e.id)} onToggleFav={handleToggleFav} />)}
                  </div>
                </>
              ) : (
                <div style={{ padding: '60px 0', textAlign: 'center' }}>
                  <Search size={32} style={{ opacity: 0.15, color: 'var(--text-muted)', display: 'block', margin: '0 auto 12px' }} />
                  <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>
                    No events match &ldquo;{query || selectedTag || categories.find(c => c.id === selectedCategoryId)?.name}&rdquo;
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div>
              {groups.map(group => (
                <div key={group.key}>
                  <div className="exp-group-header" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '14px 16px 0' }}>
                    {group.icon}
                    <span className="exp-group-lbl" style={{ color: 'var(--text-secondary)', fontSize: 10, fontWeight: 900, fontFamily: 'var(--font-display)', letterSpacing: '1px' }}>
                      {group.label.toUpperCase()}
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 700 }}>· {group.events.length}</span>
                  </div>
                  {/* Desktop: card grid */}
                  <div className="exp-card-grid" style={{ paddingTop: 8 }}>
                    {group.events.map((e, i) => <EventCard key={e.id} event={e} index={i} isFavourited={favIds.has(e.id)} onToggleFav={handleToggleFav} />)}
                  </div>
                  {/* Mobile: row list */}
                  <div className="exp-group-rows exp-row-list" style={{ padding: '0 16px' }}>
                    {group.events.map((e, i) => <EventRow key={e.id} event={e} index={i} isFavourited={favIds.has(e.id)} onToggleFav={handleToggleFav} />)}
                  </div>
                </div>
              ))}
              {groups.length === 0 && (
                <div style={{ padding: '80px 20px', textAlign: 'center' }}>
                  <CalendarDays size={36} style={{ opacity: 0.12, color: 'var(--text-muted)', display: 'block', margin: '0 auto 14px' }} />
                  <p style={{ color: 'var(--text-muted)', fontSize: 13, fontWeight: 700, margin: 0 }}>No upcoming events</p>
                </div>
              )}
            </div>
          )}
          <div style={{ height: 24 }} />
        </div>
      </div>
    </>
  )
}
