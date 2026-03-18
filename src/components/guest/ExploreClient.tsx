'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Search, MapPin, Clock, Lock, Flame, Zap, Star, CalendarDays,
  Building2, Users, Heart,
} from 'lucide-react'
import { toggleFavouriteOrganizer } from '@/app/actions/organizerActions'
import { toggleEventFavourite } from '@/app/actions/eventFavouriteActions'
import type { TopOrganizer } from '@/app/actions/organizerActions'
import type { EventCategory } from '@/app/actions/behaviourActions'

/* ─── Types ──────────────────────────────────────────────────── */
type Organizer = {
  id?: string | null
  full_name: string | null
  company_name: string | null
  username?: string | null
}
type Event = {
  id: string; title: string; description: string | null
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
  event: { id: string; title: string; date_start: string; cover_image_url: string | null; venue_name: string | null } | null
}

/* ─── Auto-gradients when no cover image ────────────────────── */
const GRADIENTS = [
  'linear-gradient(135deg, #0F2027 0%, #203A43 50%, #2C5364 100%)',
  'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
  'linear-gradient(135deg, #200122 0%, #6f0000 100%)',
  'linear-gradient(135deg, #0d0d0d 0%, #1a3a1a 50%, #0a2a0a 100%)',
  'linear-gradient(135deg, #1f0033 0%, #0d001a 50%, #2d0050 100%)',
  'linear-gradient(135deg, #0a0a0a 0%, #1a1500 50%, #2a2000 100%)',
  'linear-gradient(135deg, #001233 0%, #001845 50%, #023e8a 100%)',
  'linear-gradient(135deg, #1a0000 0%, #3d0000 50%, #1a0000 100%)',
]
function getGradient(id: string) { return GRADIENTS[id.charCodeAt(0) % GRADIENTS.length] }

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
    <Link href={`/guest/explore/${event.id}`} style={{ textDecoration: 'none', display: 'block', margin: '14px 16px 0' }}>
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
    return map[status] ?? '#9CA3AF'
  }
  return (
    <div style={{ margin: '20px 0 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 16px', marginBottom: 11 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{ width: 3, height: 13, borderRadius: 2, background: '#FF6B35' }} />
          <span style={{ color: 'white', fontSize: 12, fontWeight: 800, fontFamily: 'var(--font-display)', letterSpacing: '0.3px' }}>MY EVENTS</span>
        </div>
        <Link href="/guest/tikkit" style={{ color: '#818CF8', fontSize: 10, fontWeight: 800, textDecoration: 'none', letterSpacing: '0.5px' }}>SEE ALL →</Link>
      </div>
      <div style={{ display: 'flex', gap: 9, overflowX: 'auto', padding: '0 16px 2px', scrollbarWidth: 'none' }}>
        {myEvents.map((reg, i) => {
          const ev = reg.event; if (!ev) return null
          const dot = resolveStatusDot(reg.status)
          return (
            <Link key={reg.id} href="/guest/tikkit" style={{ textDecoration: 'none', flexShrink: 0, width: 120, opacity: 0, animation: 'revealUp 0.3s ease forwards', animationDelay: `${i * 50}ms` }}>
              <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ height: 64, background: ev.cover_image_url ? `url(${ev.cover_image_url}) center/cover` : getGradient(ev.id), position: 'relative' }}>
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.55), transparent)' }} />
                  <div style={{ position: 'absolute', bottom: 5, right: 6, width: 6, height: 6, borderRadius: '50%', background: dot, boxShadow: `0 0 5px ${dot}` }} />
                </div>
                <div style={{ padding: '6px 8px 8px', background: 'var(--guest-surface)' }}>
                  <p style={{ color: 'white', fontSize: 10, fontWeight: 700, margin: '0 0 1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--font-display)' }}>{ev.title}</p>
                  <p style={{ color: '#6B7280', fontSize: 9, margin: 0, fontWeight: 600 }}>{fmtDay(ev.date_start)} · {fmtTime(ev.date_start)}</p>
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
  const [pending, startTransition] = useTransition()

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 16px', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{ width: 3, height: 13, borderRadius: 2, background: '#FFC745' }} />
          <Building2 size={12} color="#FFC745" />
          <span style={{ color: 'white', fontSize: 12, fontWeight: 800, fontFamily: 'var(--font-display)', letterSpacing: '0.3px' }}>
            TOP ORGANIZERS
          </span>
        </div>
      </div>

      {/* Horizontal scroll */}
      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', padding: '0 16px 4px', scrollbarWidth: 'none' }}>
        {organizers.map((org, i) => {
          const name = org.company_name ?? org.full_name ?? 'Organizer'
          const href = org.username ? `/organizer/${org.username}` : null
          const card = (
            <div
              key={org.id}
              style={{
                flexShrink: 0, width: 104,
                opacity: 0, animation: 'revealUp 0.3s ease forwards',
                animationDelay: `${i * 60}ms`,
              }}
            >
              <div style={{
                borderRadius: 16, overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.07)',
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
                  border: '2px solid rgba(255,255,255,0.12)',
                  background: org.logo_url ? `url(${org.logo_url}) center/cover` : '#1A1F2E',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
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
                  <p style={{
                    color: 'white', fontSize: 10, fontWeight: 800,
                    margin: '0 0 3px', fontFamily: 'var(--font-display)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {name}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                    <CalendarDays size={8} color="#6B7280" />
                    <span style={{ color: '#6B7280', fontSize: 9, fontWeight: 700 }}>
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
  const modeCfg: Record<string, { label: string; color: string }> = {
    expression_of_interest: { label: 'APPLY',       color: '#A855F7' },
    open:                   { label: 'REGISTER',    color: '#1E5EFF' },
    invite_only:            { label: 'INVITE ONLY', color: '#4B5563' },
  }
  const mode = modeCfg[event.registration_mode] ?? modeCfg.open
  const isFull = spotsLeft !== null && spotsLeft <= 0

  return (
    <Link href={`/guest/explore/${event.id}`} style={{ textDecoration: 'none', display: 'block', opacity: 0, animation: 'revealUp 0.35s ease forwards', animationDelay: `${index * 55}ms` }}>
      <div style={{ display: 'flex', gap: 11, padding: '11px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        {/* Date column */}
        <div style={{ flexShrink: 0, width: 42, textAlign: 'center', paddingTop: 1 }}>
          <p style={{ color: '#818CF8', fontSize: 8, fontWeight: 800, margin: '0 0 1px', letterSpacing: '0.8px' }}>{fmtDay(event.date_start)}</p>
          <p style={{ color: 'white', fontSize: 20, fontWeight: 900, margin: 0, fontFamily: 'var(--font-display)', lineHeight: 1 }}>{new Date(event.date_start).getDate()}</p>
          <p style={{ color: '#6B7280', fontSize: 8, margin: '1px 0 0', fontWeight: 700, letterSpacing: '0.3px' }}>
            {new Date(event.date_start).toLocaleDateString('en-PK', { month: 'short' }).toUpperCase()}
          </p>
        </div>

        {/* Thumbnail */}
        <div style={{ flexShrink: 0, width: 68, height: 68, borderRadius: 12, overflow: 'hidden', background: event.cover_image_url ? `url(${event.cover_image_url}) center/cover` : getGradient(event.id), border: '1px solid rgba(255,255,255,0.06)', position: 'relative' }}>
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
          <h3 style={{ color: 'white', fontSize: 13, fontWeight: 800, margin: '0 0 1px', fontFamily: 'var(--font-display)', letterSpacing: '-0.2px', lineHeight: 1.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {event.title}
          </h3>
          {/* Organizer link — must be a span (not <a>) since EventRow is already inside <Link> */}
          {orgUsername ? (
            <span
              role="link"
              tabIndex={0}
              onClick={e => { e.preventDefault(); e.stopPropagation(); router.push(`/organizer/${orgUsername}`) }}
              onKeyDown={e => e.key === 'Enter' && router.push(`/organizer/${orgUsername}`)}
              style={{ color: '#818CF8', fontSize: 10, margin: '0 0 5px', fontStyle: 'italic', cursor: 'pointer', display: 'inline-block' }}
            >
              {orgName} →
            </span>
          ) : (
            <p style={{ color: '#6B7280', fontSize: 10, margin: '0 0 5px', fontStyle: 'italic' }}>{orgName}</p>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: '#9CA3AF', fontSize: 10 }}>
              <Clock size={9} />{fmtTime(event.date_start)}
            </span>
            <span style={{ width: 2, height: 2, borderRadius: '50%', background: '#4B5563', flexShrink: 0 }} />
            <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: '#9CA3AF', fontSize: 10 }}>
              <MapPin size={9} />
              {event.secret_venue
                ? <span style={{ color: '#FFC745', display: 'flex', alignItems: 'center', gap: 2 }}><Lock size={8} />Secret</span>
                : (event.venue_name ?? 'TBA')}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ padding: '2px 6px', borderRadius: 5, background: `${mode.color}18`, color: mode.color, fontSize: 8, fontWeight: 800, letterSpacing: '0.4px' }}>
              {mode.label}
            </span>
            {(event.ticket_price ?? 0) === 0
              ? <span style={{ padding: '2px 6px', borderRadius: 5, background: 'rgba(16,185,129,0.1)', color: '#10B981', fontSize: 8, fontWeight: 800 }}>FREE</span>
              : <span style={{ color: '#6B7280', fontSize: 10, fontWeight: 700 }}>PKR {event.ticket_price!.toLocaleString('en-PK')}</span>
            }
            {spotsLeft !== null && spotsLeft > 0 && spotsLeft <= 15 && (
              <span style={{ padding: '2px 6px', borderRadius: 5, background: 'rgba(239,68,68,0.1)', color: '#EF4444', fontSize: 8, fontWeight: 800 }}>
                {spotsLeft} LEFT
              </span>
            )}
          </div>
        </div>

        {/* Heart / Save button */}
        <button
          onClick={e => { e.preventDefault(); e.stopPropagation(); onToggleFav(event.id) }}
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
    </Link>
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
          background: !selectedCategoryId ? 'rgba(129,140,248,0.15)' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${!selectedCategoryId ? 'rgba(129,140,248,0.4)' : 'rgba(255,255,255,0.08)'}`,
          color: !selectedCategoryId ? '#818CF8' : '#6B7280',
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
              background: active ? `${cat.color}18` : 'rgba(255,255,255,0.04)',
              border: `1px solid ${active ? `${cat.color}50` : 'rgba(255,255,255,0.08)'}`,
              color: active ? cat.color : '#6B7280',
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
      next.has(eventId) ? next.delete(eventId) : next.add(eventId)
      return next
    })
    startFavTransition(async () => {
      const res = await toggleEventFavourite(eventId)
      // Sync if server disagrees
      setFavIds(prev => {
        const next = new Set(prev)
        res.favourited ? next.add(eventId) : next.delete(eventId)
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
      {/* Search */}
      <div style={{ padding: '12px 16px 0' }}>
        <div className="guest-search">
          <Search
            size={14}
            style={{ flexShrink: 0, color: focused ? '#818CF8' : '#4B5563', transition: 'color 0.2s' }}
          />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Search events, venues, organizers..."
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              color: 'white', fontSize: 13, fontFamily: 'var(--font-body)',
            }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="cursor-pointer"
              style={{ background: 'none', border: 'none', color: '#6B7280', padding: 0, fontSize: 18, lineHeight: 1 }}
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Category filter pills */}
      <CategoryPills
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        onSelect={setSelectedCategoryId}
      />

      {/* Tag chips (event tags) */}
      {allTags.length > 0 && (
        <div style={{ display: 'flex', gap: 5, overflowX: 'auto', padding: '8px 16px 0', scrollbarWidth: 'none' }}>
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

      {/* Hero + My Events + Top Organizers (non-search state) */}
      {!isFiltering && heroEvent && <HeroBanner event={heroEvent} />}
      {!isFiltering && <MyEventsStrip myEvents={myEvents} />}
      {!isFiltering && topOrganizers.length > 0 && (
        <TopOrganizersStrip organizers={topOrganizers} userId={userId} />
      )}

      {/* Divider */}
      {!isFiltering && (
        <div style={{ padding: '18px 16px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ height: 1, flex: 1, background: 'rgba(255,255,255,0.04)' }} />
          <span style={{ color: '#6B7280', fontSize: 9, fontWeight: 900, letterSpacing: '2px', fontFamily: 'var(--font-display)' }}>ALL EVENTS</span>
          <div style={{ height: 1, flex: 1, background: 'rgba(255,255,255,0.04)' }} />
        </div>
      )}

      {/* Results or grouped list */}
      {isFiltering ? (
        <div style={{ padding: '14px 16px 0' }}>
          <p style={{ color: '#6B7280', fontSize: 10, fontWeight: 800, letterSpacing: '0.8px', margin: '0 0 2px', fontFamily: 'var(--font-display)' }}>
            {filtered.length} RESULT{filtered.length !== 1 ? 'S' : ''}
          </p>
          {filtered.length > 0
            ? filtered.map((e, i) => <EventRow key={e.id} event={e} index={i} isFavourited={favIds.has(e.id)} onToggleFav={handleToggleFav} />)
            : (
              <div style={{ padding: '60px 0', textAlign: 'center' }}>
                <Search size={32} style={{ opacity: 0.15, marginBottom: 12, color: 'white', display: 'block', margin: '0 auto 12px' }} />
                <p style={{ color: '#6B7280', fontSize: 13, margin: 0 }}>
                  No events match &ldquo;{query || selectedTag || categories.find(c => c.id === selectedCategoryId)?.name}&rdquo;
                </p>
              </div>
            )
          }
        </div>
      ) : (
        <div>
          {groups.map(group => (
            <div key={group.key}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '14px 16px 0' }}>
                {group.icon}
                <span style={{ color: '#9CA3AF', fontSize: 10, fontWeight: 900, fontFamily: 'var(--font-display)', letterSpacing: '1px' }}>
                  {group.label.toUpperCase()}
                </span>
                <span style={{ color: '#4B5563', fontSize: 10, fontWeight: 700 }}>· {group.events.length}</span>
              </div>
              <div style={{ padding: '0 16px' }}>
                {group.events.map((e, i) => <EventRow key={e.id} event={e} index={i} isFavourited={favIds.has(e.id)} onToggleFav={handleToggleFav} />)}
              </div>
            </div>
          ))}
          {groups.length === 0 && (
            <div style={{ padding: '80px 20px', textAlign: 'center' }}>
              <CalendarDays size={36} style={{ opacity: 0.12, marginBottom: 14, color: 'white', display: 'block', margin: '0 auto 14px' }} />
              <p style={{ color: '#6B7280', fontSize: 13, fontWeight: 700, margin: 0 }}>No upcoming events</p>
            </div>
          )}
        </div>
      )}
      <div style={{ height: 20 }} />
    </>
  )
}
