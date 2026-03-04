'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, MapPin, Clock, Lock, Flame, Zap, Star } from 'lucide-react'

/* ─── Types ──────────────────────────────────────────────────────── */
type Organizer = { full_name: string | null; company_name: string | null }
type Event = {
  id: string; title: string; description: string | null
  venue_name: string | null; venue_address: string | null
  secret_venue: boolean; date_start: string; date_end: string | null
  capacity: number | null; cover_image_url: string | null
  tags: string[] | null; ticket_price: number | null
  registration_mode: string; is_private: boolean
  organizer: Organizer | null; registered_count?: number
}
type MyEvent = {
  id: string; status: string
  event: { id: string; title: string; date_start: string; cover_image_url: string | null; venue_name: string | null } | null
}

/* ─── Auto-gradients when no cover image ────────────────────────── */
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

/* ─── Helpers ────────────────────────────────────────────────────── */
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
function daysUntil(iso: string) { return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000) }

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

/* ─── Hero Banner ────────────────────────────────────────────────── */
function HeroBanner({ event }: { event: Event }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setTimeout(() => setMounted(true), 50) }, [])
  const days = daysUntil(event.date_start)
  const organiser = event.organizer?.company_name ?? event.organizer?.full_name ?? 'Tikkit'

  return (
    <Link href={`/events/${event.id}`} style={{ textDecoration: 'none', display: 'block', margin: '14px 16px 0' }}>
      <div style={{
        borderRadius: 20, overflow: 'hidden', position: 'relative', height: 215,
        background: event.cover_image_url ? `url(${event.cover_image_url}) center/cover` : getGradient(event.id),
        transform: mounted ? 'none' : 'translateY(14px) scale(0.97)',
        opacity: mounted ? 1 : 0,
        transition: 'all 0.5s cubic-bezier(0.34,1.56,0.64,1)',
        boxShadow: '0 16px 56px rgba(0,0,0,0.65)',
      }}>
        {/* Noise overlay */}
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
          <h2 style={{ color: 'white', fontSize: 24, fontWeight: 900, margin: '0 0 7px', fontFamily: "'Clash Display', sans-serif", letterSpacing: '-0.6px', lineHeight: 1.1 }}>
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

/* ─── My Events Strip ────────────────────────────────────────────── */
function MyEventsStrip({ myEvents }: { myEvents: MyEvent[] }) {
  if (!myEvents.length) return null
  const statusDot: Record<string, string> = {
    confirmed: '#10B981', registered: '#10B981',
    eoi_submitted: '#EAB308', eoi_approved: '#EF4444', payment_pending: '#818CF8',
  }
  return (
    <div style={{ margin: '20px 0 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 16px', marginBottom: 11 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{ width: 3, height: 13, borderRadius: 2, background: '#FF6B35' }} />
          <span style={{ color: 'white', fontSize: 12, fontWeight: 800, fontFamily: "'Clash Display', sans-serif", letterSpacing: '0.3px' }}>MY EVENTS</span>
        </div>
        <Link href="/guest/events" style={{ color: '#818CF8', fontSize: 10, fontWeight: 800, textDecoration: 'none', letterSpacing: '0.5px' }}>SEE ALL →</Link>
      </div>
      <div style={{ display: 'flex', gap: 9, overflowX: 'auto', padding: '0 16px 2px', scrollbarWidth: 'none' }}>
        {myEvents.map((reg, i) => {
          const ev = reg.event; if (!ev) return null
          const dot = statusDot[reg.status] ?? '#9CA3AF'
          return (
            <Link key={reg.id} href="/guest/events" style={{ textDecoration: 'none', flexShrink: 0, width: 120, opacity: 0, animation: 'revealUp 0.3s ease forwards', animationDelay: `${i * 50}ms` }}>
              <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ height: 64, background: ev.cover_image_url ? `url(${ev.cover_image_url}) center/cover` : getGradient(ev.id), position: 'relative' }}>
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.55), transparent)' }} />
                  <div style={{ position: 'absolute', bottom: 5, right: 6, width: 6, height: 6, borderRadius: '50%', background: dot, boxShadow: `0 0 5px ${dot}` }} />
                </div>
                <div style={{ padding: '6px 8px 8px', background: '#0C0E16' }}>
                  <p style={{ color: 'white', fontSize: 10, fontWeight: 700, margin: '0 0 1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'Clash Display', sans-serif" }}>{ev.title}</p>
                  <p style={{ color: '#374151', fontSize: 9, margin: 0, fontWeight: 600 }}>{fmtDay(ev.date_start)} · {fmtTime(ev.date_start)}</p>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

/* ─── Event Row ──────────────────────────────────────────────────── */
function EventRow({ event, index }: { event: Event; index: number }) {
  const organiser = event.organizer?.company_name ?? event.organizer?.full_name ?? 'Tikkit'
  const spotsLeft = (event.capacity && event.registered_count !== undefined) ? event.capacity - event.registered_count : null
  const modeCfg: Record<string, { label: string; color: string }> = {
    eoi:         { label: 'APPLY',       color: '#A855F7' },
    open:        { label: 'REGISTER',    color: '#1E5EFF' },
    invite_only: { label: 'INVITE ONLY', color: '#4B5563' },
  }
  const mode = modeCfg[event.registration_mode] ?? modeCfg.open
  const isFull = spotsLeft !== null && spotsLeft <= 0

  return (
    <Link href={`/events/${event.id}`} style={{ textDecoration: 'none', display: 'block', opacity: 0, animation: 'revealUp 0.35s ease forwards', animationDelay: `${index * 55}ms` }}>
      <div style={{ display: 'flex', gap: 11, padding: '11px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        {/* Date column */}
        <div style={{ flexShrink: 0, width: 42, textAlign: 'center', paddingTop: 1 }}>
          <p style={{ color: '#818CF8', fontSize: 8, fontWeight: 800, margin: '0 0 1px', letterSpacing: '0.8px' }}>{fmtDay(event.date_start)}</p>
          <p style={{ color: 'white', fontSize: 20, fontWeight: 900, margin: 0, fontFamily: "'Clash Display', sans-serif", lineHeight: 1 }}>{new Date(event.date_start).getDate()}</p>
          <p style={{ color: '#374151', fontSize: 8, margin: '1px 0 0', fontWeight: 700, letterSpacing: '0.3px' }}>
            {new Date(event.date_start).toLocaleDateString('en-PK', { month: 'short' }).toUpperCase()}
          </p>
        </div>

        {/* Thumbnail */}
        <div style={{ flexShrink: 0, width: 68, height: 68, borderRadius: 12, overflow: 'hidden', background: event.cover_image_url ? `url(${event.cover_image_url}) center/cover` : getGradient(event.id), border: '1px solid rgba(255,255,255,0.06)', position: 'relative' }}>
          {!event.cover_image_url && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, opacity: 0.25 }}>🎪</div>
          )}
          {isFull && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'white', fontSize: 7, fontWeight: 900, letterSpacing: '0.5px' }}>FULL</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ color: 'white', fontSize: 13, fontWeight: 800, margin: '0 0 1px', fontFamily: "'Clash Display', sans-serif", letterSpacing: '-0.2px', lineHeight: 1.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {event.title}
          </h3>
          <p style={{ color: '#2D3748', fontSize: 10, margin: '0 0 5px', fontStyle: 'italic' }}>{organiser}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: '#4B5563', fontSize: 10 }}>
              <Clock size={9} />{fmtTime(event.date_start)}
            </span>
            <span style={{ width: 2, height: 2, borderRadius: '50%', background: '#1F2937', flexShrink: 0 }} />
            <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: '#4B5563', fontSize: 10 }}>
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
      </div>
    </Link>
  )
}

/* ─── Main ───────────────────────────────────────────────────────── */
export default function ExploreClient({ events, myEvents }: { events: Event[]; myEvents: MyEvent[] }) {
  const [query, setQuery] = useState('')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [focused, setFocused] = useState(false)

  const allTags = Array.from(new Set(events.flatMap(e => e.tags ?? []))).slice(0, 8)
  const isFiltering = !!(query || selectedTag)

  const filtered = events.filter(e => {
    const q = query.toLowerCase()
    const matchQ = !query || e.title.toLowerCase().includes(q) || (e.venue_name ?? '').toLowerCase().includes(q)
      || (e.tags ?? []).some(t => t.toLowerCase().includes(q)) || (e.organizer?.company_name ?? '').toLowerCase().includes(q)
    const matchTag = !selectedTag || (e.tags ?? []).includes(selectedTag)
    return matchQ && matchTag
  })

  const heroEvent = events[0] ?? null
  const groups = groupEvents(isFiltering ? filtered : events.slice(1))

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');
        @keyframes revealUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* Search */}
      <div style={{ padding: '12px 16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, background: focused ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.025)', border: `1px solid ${focused ? 'rgba(129,140,248,0.35)' : 'rgba(255,255,255,0.06)'}`, borderRadius: 12, padding: '10px 13px', transition: 'all 0.2s' }}>
          <Search size={14} color={focused ? '#818CF8' : '#2D3748'} style={{ flexShrink: 0, transition: 'color 0.2s' }} />
          <input value={query} onChange={e => setQuery(e.target.value)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} placeholder="Search events, venues, organizers..." style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'white', fontSize: 13, fontFamily: "'Cabinet Grotesk', sans-serif" }} />
          {query && <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#374151', padding: 0, fontSize: 16, lineHeight: 1 }}>×</button>}
        </div>
      </div>

      {/* Tag chips */}
      {allTags.length > 0 && (
        <div style={{ display: 'flex', gap: 5, overflowX: 'auto', padding: '10px 16px 0', scrollbarWidth: 'none' }}>
          {['All', ...allTags].map(tag => {
            const active = tag === 'All' ? !selectedTag : selectedTag === tag
            return (
              <button key={tag} onClick={() => setSelectedTag(tag === 'All' ? null : tag)} style={{ flexShrink: 0, padding: '4px 10px', borderRadius: 7, border: `1px solid ${active ? 'rgba(129,140,248,0.45)' : 'rgba(255,255,255,0.06)'}`, background: active ? 'rgba(129,140,248,0.1)' : 'transparent', color: active ? '#818CF8' : '#374151', fontSize: 10, fontWeight: 800, cursor: 'pointer', fontFamily: "'Cabinet Grotesk', sans-serif", letterSpacing: '0.5px', transition: 'all 0.15s' }}>
                {tag.toUpperCase()}
              </button>
            )
          })}
        </div>
      )}

      {/* Hero + My Events (non-search state) */}
      {!isFiltering && heroEvent && <HeroBanner event={heroEvent} />}
      {!isFiltering && <MyEventsStrip myEvents={myEvents} />}

      {/* Section divider */}
      {!isFiltering && (
        <div style={{ padding: '18px 16px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ height: 1, flex: 1, background: 'rgba(255,255,255,0.04)' }} />
          <span style={{ color: '#1F2937', fontSize: 9, fontWeight: 900, letterSpacing: '2px' }}>ALL EVENTS</span>
          <div style={{ height: 1, flex: 1, background: 'rgba(255,255,255,0.04)' }} />
        </div>
      )}

      {/* Results or grouped list */}
      {isFiltering ? (
        <div style={{ padding: '14px 16px 0' }}>
          <p style={{ color: '#1F2937', fontSize: 10, fontWeight: 800, letterSpacing: '0.8px', margin: '0 0 2px' }}>
            {filtered.length} RESULT{filtered.length !== 1 ? 'S' : ''}
          </p>
          {filtered.length > 0
            ? filtered.map((e, i) => <EventRow key={e.id} event={e} index={i} />)
            : <div style={{ padding: '60px 0', textAlign: 'center' }}><Search size={32} style={{ opacity: 0.1, marginBottom: 12, color: 'white' }} /><p style={{ color: '#1F2937', fontSize: 13, margin: 0 }}>No events match "{query || selectedTag}"</p></div>
          }
        </div>
      ) : (
        <div>
          {groups.map(group => (
            <div key={group.key}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '14px 16px 0' }}>
                {group.icon}
                <span style={{ color: '#9CA3AF', fontSize: 10, fontWeight: 900, fontFamily: "'Clash Display', sans-serif", letterSpacing: '1px' }}>{group.label.toUpperCase()}</span>
                <span style={{ color: '#1F2937', fontSize: 10, fontWeight: 700 }}>· {group.events.length}</span>
              </div>
              <div style={{ padding: '0 16px' }}>
                {group.events.map((e, i) => <EventRow key={e.id} event={e} index={i} />)}
              </div>
            </div>
          ))}
          {groups.length === 0 && (
            <div style={{ padding: '80px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 14, opacity: 0.2 }}>🎪</div>
              <p style={{ color: '#1F2937', fontSize: 13, fontWeight: 700, margin: 0 }}>No upcoming events</p>
            </div>
          )}
        </div>
      )}
      <div style={{ height: 20 }} />
    </>
  )
}
