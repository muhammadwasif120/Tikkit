'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  Ticket, ArrowRight, ArrowLeft, Users, QrCode, BarChart3,
  CreditCard, MapPin, Calendar, CheckCircle, Sparkles,
  Zap, Shield, Bell, Search, Star, Clock, ChevronRight,
  ScanLine, TrendingUp, UserCheck, Package, X,
} from 'lucide-react'

// ─── Scroll hook ─────────────────────────────────────────────────────────────

function useInView(threshold = 0.15, once = true) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); if (once) obs.disconnect() } },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold, once])
  return { ref, inView }
}

function useScrollY() {
  const [y, setY] = useState(0)
  useEffect(() => {
    const fn = () => setY(window.scrollY)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])
  return y
}

// ─── Tiny UI blocks ───────────────────────────────────────────────────────────

function Pill({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 10px', borderRadius: 999,
      background: `${color}18`, border: `1px solid ${color}35`,
      fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
      textTransform: 'uppercase', color,
    }}>{children}</span>
  )
}

function GlassCard({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: 'rgba(13,15,24,0.85)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 16,
      ...style,
    }}>
      {children}
    </div>
  )
}

// ─── Orb background ──────────────────────────────────────────────────────────

function Orb({ x, y, color, size = 400, opacity = 0.18 }: {
  x: string; y: string; color: string; size?: number; opacity?: number
}) {
  return (
    <div aria-hidden="true" style={{
      position: 'absolute', left: x, top: y,
      width: size, height: size,
      background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
      opacity,
      borderRadius: '50%',
      pointerEvents: 'none',
      transform: 'translate(-50%,-50%)',
    }} />
  )
}

// ─── ORGANIZER MOCKUPS ────────────────────────────────────────────────────────

function OrgStep1({ inView }: { inView: boolean }) {
  // Dashboard / Create Event mockup
  return (
    <div style={{
      background: '#0D0F18', borderRadius: 16, overflow: 'hidden',
      border: '1px solid rgba(255,255,255,0.07)',
      opacity: inView ? 1 : 0,
      transform: inView ? 'translateY(0) scale(1)' : 'translateY(32px) scale(0.97)',
      transition: 'opacity 0.7s ease, transform 0.7s ease',
    }}>
      {/* Window chrome */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#080A10' }}>
        {['#FF5F57','#FEBC2E','#28C840'].map((c,i) => <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />)}
        <span style={{ fontSize: 11, color: '#4B5563', marginLeft: 8, fontFamily: 'var(--font-body)' }}>tikkit.app/dashboard/events</span>
      </div>
      <div style={{ display: 'flex', height: 340 }}>
        {/* Sidebar */}
        <div style={{ width: 52, borderRight: '1px solid rgba(255,255,255,0.06)', padding: '16px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, background: '#080A10' }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,#2B6FFF,#1448CC)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Ticket size={13} color="white" />
          </div>
          {[Calendar, Users, QrCode, BarChart3].map((Icon, i) => (
            <div key={i} style={{
              width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: i === 0 ? 'rgba(30,94,255,0.15)' : 'transparent',
              boxShadow: i === 0 ? 'inset 3px 0 0 #1E5EFF' : 'none',
            }}>
              <Icon size={15} color={i === 0 ? '#1E5EFF' : '#374151'} />
            </div>
          ))}
        </div>
        {/* Main area */}
        <div style={{ flex: 1, padding: 20, overflow: 'hidden' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: '#F0F2FF', marginBottom: 16, letterSpacing: '-0.3px' }}>Create New Event</div>
          {/* Form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Event Name', val: 'Rooftop Night — DHA Karachi', color: '#1E5EFF' },
              { label: 'Date & Time', val: 'Saturday, 22 March · 9:00 PM' },
              { label: 'Venue', val: 'The Rooftop, Phase 5, DHA' },
              { label: 'Capacity', val: '150 guests' },
            ].map((f, i) => (
              <div key={i} style={{ opacity: inView ? 1 : 0, transform: inView ? 'translateX(0)' : 'translateX(-16px)', transition: `opacity 0.5s ease ${0.2 + i * 0.1}s, transform 0.5s ease ${0.2 + i * 0.1}s` }}>
                <div style={{ fontSize: 10, color: '#4B5563', fontFamily: 'var(--font-body)', marginBottom: 3, fontWeight: 600 }}>{f.label}</div>
                <div style={{
                  background: '#0F1119', border: `1px solid ${f.color ? 'rgba(30,94,255,0.4)' : 'rgba(255,255,255,0.07)'}`,
                  borderRadius: 8, padding: '7px 10px',
                  fontSize: 12, color: f.color ? '#F0F2FF' : '#6B7280',
                  fontFamily: 'var(--font-body)',
                  boxShadow: f.color ? '0 0 0 3px rgba(30,94,255,0.12)' : 'none',
                }}>{f.val}</div>
              </div>
            ))}
            <div style={{
              marginTop: 4,
              background: 'linear-gradient(135deg,#1E5EFF,#1448CC)',
              borderRadius: 8, padding: '9px 14px',
              fontSize: 12, fontWeight: 700, color: 'white',
              fontFamily: 'var(--font-display)', textAlign: 'center',
              boxShadow: '0 0 24px rgba(30,94,255,0.45)',
              opacity: inView ? 1 : 0,
              transform: inView ? 'scale(1)' : 'scale(0.95)',
              transition: 'opacity 0.5s ease 0.65s, transform 0.5s ease 0.65s',
            }}>Publish Event →</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function OrgStep2({ inView }: { inView: boolean }) {
  // Guest list & approval mockup
  const guests = [
    { name: 'Aisha Malik', status: 'Approved', color: '#22C55E', avatar: '#8B5CF6' },
    { name: 'Omar Farooq', status: 'Pending',  color: '#F59E0B', avatar: '#1E5EFF' },
    { name: 'Sara Khan',   status: 'Approved', color: '#22C55E', avatar: '#EC4899' },
    { name: 'Ali Raza',    status: 'Pending',  color: '#F59E0B', avatar: '#06B6D4' },
  ]
  return (
    <div style={{
      background: '#0D0F18', borderRadius: 16, overflow: 'hidden',
      border: '1px solid rgba(255,255,255,0.07)',
      opacity: inView ? 1 : 0,
      transform: inView ? 'translateY(0) scale(1)' : 'translateY(32px) scale(0.97)',
      transition: 'opacity 0.7s ease, transform 0.7s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#080A10' }}>
        {['#FF5F57','#FEBC2E','#28C840'].map((c,i) => <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />)}
        <span style={{ fontSize: 11, color: '#4B5563', marginLeft: 8, fontFamily: 'var(--font-body)' }}>tikkit.app/dashboard/guests</span>
      </div>
      <div style={{ padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: '#F0F2FF', letterSpacing: '-0.3px' }}>Guest List · 84 RSVPs</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[{ label: '62 Approved', c: '#22C55E' }, { label: '22 Pending', c: '#F59E0B' }].map((b,i) => (
              <span key={i} style={{ fontSize: 10, fontWeight: 700, color: b.c, background: `${b.c}18`, borderRadius: 999, padding: '3px 8px', border: `1px solid ${b.c}30` }}>{b.label}</span>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {guests.map((g, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: '#0F1119', borderRadius: 10, padding: '10px 12px',
              border: '1px solid rgba(255,255,255,0.05)',
              opacity: inView ? 1 : 0,
              transform: inView ? 'translateX(0)' : 'translateX(-20px)',
              transition: `opacity 0.5s ease ${i * 0.1}s, transform 0.5s ease ${i * 0.1}s`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: g.avatar, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'white' }}>
                  {g.name[0]}
                </div>
                <span style={{ fontSize: 13, color: '#D1D5DB', fontFamily: 'var(--font-body)' }}>{g.name}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: g.color, background: `${g.color}18`, borderRadius: 999, padding: '2px 8px' }}>{g.status}</span>
                {g.status === 'Pending' && (
                  <div style={{ display: 'flex', gap: 4 }}>
                    <div style={{ width: 22, height: 22, borderRadius: 6, background: 'rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <CheckCircle size={11} color="#22C55E" />
                    </div>
                    <div style={{ width: 22, height: 22, borderRadius: 6, background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <X size={11} color="#EF4444" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function OrgStep3({ inView }: { inView: boolean }) {
  // QR Scanner mockup
  const [scanLine, setScanLine] = useState(0)
  useEffect(() => {
    if (!inView) return
    const id = setInterval(() => setScanLine(p => (p + 2) % 100), 20)
    return () => clearInterval(id)
  }, [inView])

  return (
    <div style={{
      background: '#0D0F18', borderRadius: 16, overflow: 'hidden',
      border: '1px solid rgba(255,255,255,0.07)',
      opacity: inView ? 1 : 0,
      transform: inView ? 'translateY(0) scale(1)' : 'translateY(32px) scale(0.97)',
      transition: 'opacity 0.7s ease, transform 0.7s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#080A10' }}>
        {['#FF5F57','#FEBC2E','#28C840'].map((c,i) => <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />)}
        <span style={{ fontSize: 11, color: '#4B5563', marginLeft: 8, fontFamily: 'var(--font-body)' }}>tikkit.app/dashboard/scan</span>
      </div>
      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: '#F0F2FF', letterSpacing: '-0.3px' }}>QR Check-In</div>
        {/* Scanner frame */}
        <div style={{ position: 'relative', width: 160, height: 160, background: '#080A10', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
          {/* Corner marks */}
          {[{t:8,l:8},{t:8,r:8},{b:8,l:8},{b:8,r:8}].map((pos,i) => (
            <div key={i} style={{ position: 'absolute', width: 18, height: 18, ...pos,
              borderTop: i < 2 ? '2.5px solid #1E5EFF' : 'none',
              borderBottom: i >= 2 ? '2.5px solid #1E5EFF' : 'none',
              borderLeft: [0,2].includes(i) ? '2.5px solid #1E5EFF' : 'none',
              borderRight: [1,3].includes(i) ? '2.5px solid #1E5EFF' : 'none',
            }} />
          ))}
          {/* Simulated QR blocks */}
          <div style={{ position: 'absolute', inset: 28, display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 3 }}>
            {Array.from({length: 36}).map((_,i) => (
              <div key={i} style={{ borderRadius: 2, background: [0,1,5,6,7,11,18,19,23,24,25,29,30,35,12,14,16,21].includes(i) ? 'rgba(255,255,255,0.12)' : 'rgba(30,94,255,0.35)' }} />
            ))}
          </div>
          {/* Scan line */}
          <div style={{
            position: 'absolute', left: 0, right: 0, height: 2,
            background: 'linear-gradient(90deg,transparent,#1E5EFF,transparent)',
            top: `${scanLine}%`,
            boxShadow: '0 0 8px rgba(30,94,255,0.8)',
            opacity: inView ? 1 : 0,
          }} />
        </div>
        {/* Success card */}
        <div style={{
          width: '100%', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 10, padding: '12px 16px',
          display: 'flex', alignItems: 'center', gap: 10,
          opacity: inView ? 1 : 0,
          transform: inView ? 'scale(1)' : 'scale(0.9)',
          transition: 'opacity 0.5s ease 0.5s, transform 0.5s ease 0.5s',
        }}>
          <CheckCircle size={20} color="#22C55E" />
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: '#22C55E' }}>Aisha Malik — Checked In</div>
            <div style={{ fontSize: 11, color: '#4B5563', fontFamily: 'var(--font-body)', marginTop: 2 }}>Table 4 · VIP · 9:14 PM</div>
          </div>
        </div>
        {/* Stats row */}
        <div style={{ display: 'flex', gap: 10, width: '100%' }}>
          {[{ n: '84', l: 'Guests', c: '#1E5EFF' }, { n: '62', l: 'Checked In', c: '#22C55E' }, { n: '22', l: 'Remaining', c: '#F59E0B' }].map((s,i) => (
            <div key={i} style={{
              flex: 1, background: '#0F1119', borderRadius: 8, padding: '8px 10px', textAlign: 'center',
              border: '1px solid rgba(255,255,255,0.05)',
              opacity: inView ? 1 : 0,
              transition: `opacity 0.5s ease ${0.7 + i * 0.1}s`,
            }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: s.c }}>{s.n}</div>
              <div style={{ fontSize: 10, color: '#4B5563', fontFamily: 'var(--font-body)' }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function OrgStep4({ inView }: { inView: boolean }) {
  // Analytics mockup
  const bars = [45, 72, 60, 88, 95, 78, 100]
  const days = ['M','T','W','T','F','S','S']
  return (
    <div style={{
      background: '#0D0F18', borderRadius: 16, overflow: 'hidden',
      border: '1px solid rgba(255,255,255,0.07)',
      opacity: inView ? 1 : 0,
      transform: inView ? 'translateY(0) scale(1)' : 'translateY(32px) scale(0.97)',
      transition: 'opacity 0.7s ease, transform 0.7s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#080A10' }}>
        {['#FF5F57','#FEBC2E','#28C840'].map((c,i) => <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />)}
        <span style={{ fontSize: 11, color: '#4B5563', marginLeft: 8, fontFamily: 'var(--font-body)' }}>tikkit.app/dashboard/analytics</span>
      </div>
      <div style={{ padding: 20 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: '#F0F2FF', letterSpacing: '-0.3px', marginBottom: 14 }}>Event Analytics</div>
        {/* Stat row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 16 }}>
          {[{ n: 'PKR 480K', l: 'Revenue', c: '#22C55E' }, { n: '84%', l: 'Attendance', c: '#1E5EFF' }, { n: '4.8★', l: 'Rating', c: '#FFC745' }].map((s,i) => (
            <div key={i} style={{
              background: '#0F1119', borderRadius: 8, padding: '10px 12px',
              border: `1px solid ${s.c}22`,
              opacity: inView ? 1 : 0,
              transform: inView ? 'translateY(0)' : 'translateY(12px)',
              transition: `opacity 0.5s ease ${i * 0.1}s, transform 0.5s ease ${i * 0.1}s`,
            }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 800, color: s.c }}>{s.n}</div>
              <div style={{ fontSize: 10, color: '#4B5563', fontFamily: 'var(--font-body)', marginTop: 2 }}>{s.l}</div>
            </div>
          ))}
        </div>
        {/* Bar chart */}
        <div style={{ background: '#0F1119', borderRadius: 10, padding: '14px 16px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ fontSize: 11, color: '#4B5563', fontFamily: 'var(--font-body)', marginBottom: 10, fontWeight: 600 }}>Check-ins by day</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80 }}>
            {bars.map((h,i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{
                  width: '100%', borderRadius: '4px 4px 0 0',
                  background: i === 6 ? '#1E5EFF' : 'rgba(30,94,255,0.3)',
                  boxShadow: i === 6 ? '0 0 12px rgba(30,94,255,0.6)' : 'none',
                  height: inView ? `${h}%` : '0%',
                  transition: `height 0.7s ease ${0.3 + i * 0.07}s`,
                }} />
                <span style={{ fontSize: 9, color: '#374151', fontFamily: 'var(--font-body)' }}>{days[i]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── ATTENDEE MOCKUPS ─────────────────────────────────────────────────────────

function PhoneFrame({ children, inView }: { children: React.ReactNode; inView: boolean }) {
  return (
    <div style={{
      width: 220, margin: '0 auto',
      background: '#0D0F18',
      borderRadius: 32,
      border: '2px solid rgba(255,255,255,0.1)',
      boxShadow: '0 0 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04) inset',
      overflow: 'hidden',
      opacity: inView ? 1 : 0,
      transform: inView ? 'translateY(0) scale(1)' : 'translateY(40px) scale(0.95)',
      transition: 'opacity 0.7s ease, transform 0.7s ease',
    }}>
      {/* Notch */}
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10, paddingBottom: 4 }}>
        <div style={{ width: 60, height: 18, background: '#080A10', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#1A1C28' }} />
        </div>
      </div>
      {children}
      {/* Home indicator */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 10px' }}>
        <div style={{ width: 60, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)' }} />
      </div>
    </div>
  )
}

function AttStep1({ inView }: { inView: boolean }) {
  // Explore events screen
  const events = [
    { name: 'Rooftop Night Karachi', date: 'Sat 22 Mar', price: 'PKR 2,500', color: '#1E5EFF', cat: 'Party' },
    { name: 'Brand Launch — Lahore', date: 'Fri 28 Mar', price: 'PKR 0', color: '#22C55E', cat: 'Free' },
    { name: 'Jazz Night Islamabad',  date: 'Sun 30 Mar', price: 'PKR 3,000', color: '#A855F7', cat: 'Live Music' },
  ]
  return (
    <PhoneFrame inView={inView}>
      <div style={{ padding: '0 12px 8px' }}>
        {/* Search */}
        <div style={{ background: '#0F1119', borderRadius: 10, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8, border: '1px solid rgba(255,255,255,0.07)', marginBottom: 12 }}>
          <Search size={12} color="#4B5563" />
          <span style={{ fontSize: 11, color: '#374151', fontFamily: 'var(--font-body)' }}>Find events near you…</span>
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', fontFamily: 'var(--font-body)', marginBottom: 8, letterSpacing: '0.05em' }}>THIS WEEKEND</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {events.map((e, i) => (
            <div key={i} style={{
              background: '#0F1119', borderRadius: 10, padding: '10px 12px',
              border: '1px solid rgba(255,255,255,0.05)',
              borderLeft: `3px solid ${e.color}`,
              opacity: inView ? 1 : 0,
              transform: inView ? 'translateX(0)' : 'translateX(20px)',
              transition: `opacity 0.5s ease ${0.2 + i * 0.12}s, transform 0.5s ease ${0.2 + i * 0.12}s`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, color: '#F0F2FF', letterSpacing: '-0.2px', lineHeight: 1.3 }}>{e.name}</div>
                <span style={{ fontSize: 9, color: e.color, background: `${e.color}18`, borderRadius: 4, padding: '2px 5px', fontWeight: 700, whiteSpace: 'nowrap', marginLeft: 6 }}>{e.cat}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <span style={{ fontSize: 10, color: '#4B5563', fontFamily: 'var(--font-body)' }}>{e.date}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', fontFamily: 'var(--font-body)' }}>{e.price}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PhoneFrame>
  )
}

function AttStep2({ inView }: { inView: boolean }) {
  // Event detail + register
  return (
    <PhoneFrame inView={inView}>
      <div style={{ padding: '0 12px 8px' }}>
        {/* Event hero */}
        <div style={{ borderRadius: 12, background: 'linear-gradient(135deg,#1E3A6E,#0A1A3A)', padding: '14px', marginBottom: 12, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 70% 30%, rgba(30,94,255,0.3), transparent 60%)' }} />
          <div style={{ position: 'relative' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 800, color: '#F0F2FF', letterSpacing: '-0.3px', lineHeight: 1.25 }}>Rooftop Night<br />Karachi</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#9CA3AF' }}><Calendar size={9} />Sat 22 Mar</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#9CA3AF' }}><MapPin size={9} />DHA Phase 5</div>
            </div>
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ display: 'flex' }}>
                {['#8B5CF6','#1E5EFF','#EC4899'].map((c,i) => (
                  <div key={i} style={{ width: 18, height: 18, borderRadius: '50%', background: c, border: '2px solid #0A1A3A', marginLeft: i > 0 ? -6 : 0 }} />
                ))}
              </div>
              <span style={{ fontSize: 10, color: '#6B7280' }}>84 going</span>
            </div>
          </div>
        </div>
        {/* Price & register */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 10, color: '#4B5563', fontFamily: 'var(--font-body)' }}>Ticket Price</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: '#FFC745' }}>PKR 2,500</div>
          </div>
          <div style={{
            background: '#FFC745', borderRadius: 10, padding: '8px 14px',
            fontSize: 11, fontWeight: 700, color: '#080A10', fontFamily: 'var(--font-display)',
            opacity: inView ? 1 : 0,
            transform: inView ? 'scale(1)' : 'scale(0.85)',
            transition: 'opacity 0.5s ease 0.5s, transform 0.5s ease 0.5s',
          }}>Register Now →</div>
        </div>
        {/* Pay via */}
        <div style={{ fontSize: 10, color: '#374151', fontFamily: 'var(--font-body)', marginBottom: 6, fontWeight: 600 }}>Pay via</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {['JazzCash','EasyPaisa','Bank'].map((p,i) => (
            <div key={i} style={{
              flex: 1, background: i === 0 ? 'rgba(255,199,69,0.12)' : '#0F1119',
              border: `1px solid ${i === 0 ? '#FFC74540' : 'rgba(255,255,255,0.06)'}`,
              borderRadius: 8, padding: '6px 4px', textAlign: 'center',
              fontSize: 9, fontWeight: 700, color: i === 0 ? '#FFC745' : '#4B5563',
              fontFamily: 'var(--font-body)',
            }}>{p}</div>
          ))}
        </div>
      </div>
    </PhoneFrame>
  )
}

function AttStep3({ inView }: { inView: boolean }) {
  // QR ticket screen
  const [scanPulse, setScanPulse] = useState(false)
  useEffect(() => {
    if (!inView) return
    const id = setInterval(() => setScanPulse(p => !p), 800)
    return () => clearInterval(id)
  }, [inView])

  return (
    <PhoneFrame inView={inView}>
      <div style={{ padding: '0 12px 8px' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: '#F0F2FF', marginBottom: 10, textAlign: 'center' }}>Your Ticket</div>
        {/* Ticket card */}
        <div style={{
          background: 'linear-gradient(135deg,#0F1420,#0A1030)',
          border: '1px solid rgba(30,94,255,0.2)',
          borderRadius: 14, padding: '14px',
          boxShadow: '0 0 30px rgba(30,94,255,0.12)',
        }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 800, color: '#F0F2FF', marginBottom: 4 }}>Rooftop Night Karachi</div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            <div style={{ fontSize: 10, color: '#6B7280' }}><Calendar size={9} style={{display:'inline',marginRight:3}} />Sat 22 Mar</div>
            <div style={{ fontSize: 10, color: '#6B7280' }}><MapPin size={9} style={{display:'inline',marginRight:3}} />DHA Phase 5</div>
          </div>
          {/* QR code */}
          <div style={{
            background: '#F0F2FF', borderRadius: 10, padding: 12, display: 'grid',
            gridTemplateColumns: 'repeat(9,1fr)', gap: 3, marginBottom: 12,
            boxShadow: scanPulse ? '0 0 20px rgba(30,94,255,0.5)' : '0 0 0px transparent',
            transition: 'box-shadow 0.4s ease',
          }}>
            {Array.from({length: 81}).map((_,i) => (
              <div key={i} style={{
                borderRadius: 1,
                background: [0,1,2,3,4,5,6,7,14,18,19,20,21,22,23,24,27,28,35,42,49,56,63,70,77,60,61,62,63,64,65,66,72,74,75,80].includes(i) ? '#080A10' : 'transparent',
                aspectRatio: '1',
              }} />
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 10, color: '#4B5563', fontFamily: 'var(--font-body)' }}>Name</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, color: '#F0F2FF' }}>Aisha Malik</div>
            </div>
            <div style={{
              background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)',
              borderRadius: 8, padding: '4px 8px', fontSize: 10, fontWeight: 700, color: '#22C55E',
            }}>✓ APPROVED</div>
          </div>
        </div>
      </div>
    </PhoneFrame>
  )
}

function AttStep4({ inView }: { inView: boolean }) {
  // Guest profile / credit score
  return (
    <PhoneFrame inView={inView}>
      <div style={{ padding: '0 12px 8px' }}>
        {/* Profile header */}
        <div style={{ textAlign: 'center', marginBottom: 14 }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%',
            background: 'linear-gradient(135deg,#8B5CF6,#1E5EFF)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 8px',
            boxShadow: '0 0 20px rgba(139,92,246,0.4)',
            opacity: inView ? 1 : 0,
            transform: inView ? 'scale(1)' : 'scale(0.7)',
            transition: 'opacity 0.5s ease 0.2s, transform 0.5s ease 0.2s',
          }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: 'white' }}>A</span>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: '#F0F2FF' }}>Aisha Malik</div>
          <div style={{ fontSize: 10, color: '#4B5563', fontFamily: 'var(--font-body)' }}>@aisha.malik</div>
        </div>
        {/* Credit score */}
        <div style={{
          background: 'linear-gradient(135deg,rgba(255,199,69,0.08),rgba(249,115,22,0.08))',
          border: '1px solid rgba(255,199,69,0.2)', borderRadius: 12, padding: '12px 14px', marginBottom: 10,
          opacity: inView ? 1 : 0,
          transform: inView ? 'translateY(0)' : 'translateY(16px)',
          transition: 'opacity 0.5s ease 0.3s, transform 0.5s ease 0.3s',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 10, color: '#9CA3AF', fontFamily: 'var(--font-body)' }}>Guest Score</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, color: '#FFC745' }}>94</div>
            </div>
            <Star size={28} color="#FFC745" fill="#FFC745" style={{ opacity: 0.8 }} />
          </div>
          <div style={{ marginTop: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 999, height: 4, overflow: 'hidden' }}>
            <div style={{ width: '94%', height: '100%', background: 'linear-gradient(90deg,#FFC745,#F97316)', borderRadius: 999, transition: 'width 1s ease 0.8s' }} />
          </div>
          <div style={{ fontSize: 10, color: '#6B7280', fontFamily: 'var(--font-body)', marginTop: 4 }}>Excellent · Top 8% of guests</div>
        </div>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
          {[{ n: '12', l: 'Events', c: '#1E5EFF' }, { n: '11', l: 'Attended', c: '#22C55E' }, { n: '0', l: 'No-shows', c: '#374151' }].map((s,i) => (
            <div key={i} style={{
              background: '#0F1119', borderRadius: 8, padding: '8px', textAlign: 'center',
              border: '1px solid rgba(255,255,255,0.05)',
              opacity: inView ? 1 : 0,
              transform: inView ? 'translateY(0)' : 'translateY(10px)',
              transition: `opacity 0.5s ease ${0.5 + i * 0.1}s, transform 0.5s ease ${0.5 + i * 0.1}s`,
            }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 800, color: s.c }}>{s.n}</div>
              <div style={{ fontSize: 9, color: '#374151', fontFamily: 'var(--font-body)' }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>
    </PhoneFrame>
  )
}

// ─── Section step card ────────────────────────────────────────────────────────

function FeatureStep({
  num, icon: Icon, title, desc, color, index, inView,
}: { num: string; icon: React.ElementType; title: string; desc: string; color: string; index: number; inView: boolean }) {
  return (
    <div style={{
      display: 'flex', gap: 16, alignItems: 'flex-start',
      opacity: inView ? 1 : 0,
      transform: inView ? 'translateX(0)' : 'translateX(-24px)',
      transition: `opacity 0.55s ease ${index * 0.12}s, transform 0.55s ease ${index * 0.12}s`,
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 12, flexShrink: 0, marginTop: 2,
        background: `${color}18`, border: `1px solid ${color}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={18} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, color: color, letterSpacing: '0.08em', marginBottom: 4, fontFamily: 'var(--font-body)' }}>STEP {num}</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, color: '#F0F2FF', letterSpacing: '-0.3px', marginBottom: 6 }}>{title}</div>
        <div style={{ fontSize: 14, color: '#6B7280', fontFamily: 'var(--font-body)', lineHeight: 1.6 }}>{desc}</div>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function HowItWorksPage() {
  const scrollY = useScrollY()
  const [activeTab, setActiveTab] = useState<'organizer' | 'attendee'>('organizer')
  const heroRef = useRef<HTMLDivElement>(null)

  // Organizer step refs
  const org1 = useInView(0.2)
  const org2 = useInView(0.2)
  const org3 = useInView(0.2)
  const org4 = useInView(0.2)

  // Attendee step refs
  const att1 = useInView(0.2)
  const att2 = useInView(0.2)
  const att3 = useInView(0.2)
  const att4 = useInView(0.2)

  const heroInView = useInView(0.1)
  const tabsInView = useInView(0.1)
  const orgSectionInView = useInView(0.05)
  const attSectionInView = useInView(0.05)
  const ctaInView = useInView(0.2)

  const orgSteps = [
    { ref: org1, mockup: OrgStep1, icon: Calendar, title: 'Create your event in minutes', desc: 'Set the date, venue, capacity, ticket price, and guest mode. Go live in under two minutes.', color: '#1E5EFF', num: '01' },
    { ref: org2, mockup: OrgStep2, icon: UserCheck, title: 'Manage your guest list', desc: 'Approve applications, monitor RSVPs, and see payment status in real time — all in one place.', color: '#22C55E', num: '02' },
    { ref: org3, mockup: OrgStep3, icon: ScanLine, title: 'Scan at the door, stress-free', desc: 'Your team scans QR codes on their phones. No paper lists. No confusion. No queue.', color: '#8B5CF6', num: '03' },
    { ref: org4, mockup: OrgStep4, icon: TrendingUp, title: 'Review and run it better next time', desc: 'Revenue, attendance rate, check-in timeline, guest segments. Every number you need.', color: '#F97316', num: '04' },
  ]

  const attSteps = [
    { ref: att1, mockup: AttStep1, icon: Search, title: 'Discover events near you', desc: 'Browse curated events in your city. Filter by date, type, or price. Find what fits your night.', color: '#1E5EFF', num: '01' },
    { ref: att2, mockup: AttStep2, icon: CreditCard, title: 'Register and pay with one tap', desc: 'JazzCash, EasyPaisa, or bank transfer — whatever works for you. Payment verified instantly.', color: '#FFC745', num: '02' },
    { ref: att3, mockup: AttStep3, icon: QrCode, title: 'Your QR ticket, always ready', desc: 'No printing needed. Your unique QR code lives in your pocket. Show up and get scanned in.', color: '#22C55E', num: '03' },
    { ref: att4, mockup: AttStep4, icon: Star, title: 'Build your guest reputation', desc: 'Every event you attend adds to your guest score. Top-rated guests get priority for future events.', color: '#A855F7', num: '04' },
  ]

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body {
          background: #080A10;
          color: #F0F2FF;
          font-family: var(--font-body);
          -webkit-font-smoothing: antialiased;
          overflow-x: hidden;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes floatSlow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33%       { transform: translateY(-14px) rotate(1deg); }
          66%       { transform: translateY(-6px) rotate(-1deg); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes orb-drift {
          0%, 100% { transform: translate(-50%,-50%) scale(1); }
          50%       { transform: translate(-50%,-50%) scale(1.15); }
        }
        @keyframes glow-pulse {
          0%, 100% { opacity: 0.5; }
          50%       { opacity: 1; }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes ticket-enter {
          0%   { opacity: 0; transform: translateY(20px) scale(0.96); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }

        .gradient-text {
          background: linear-gradient(135deg, #F0F2FF 0%, #1E5EFF 50%, #FFC745 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 4s linear infinite;
        }
        .gradient-text-blue {
          background: linear-gradient(135deg, #4D82FF 0%, #1E5EFF 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .gradient-text-gold {
          background: linear-gradient(135deg, #FFC745 0%, #F97316 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .tab-btn {
          position: relative;
          padding: 12px 28px;
          border-radius: 12px;
          font-family: var(--font-display);
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          border: none;
          transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
          letter-spacing: -0.2px;
        }
        .tab-btn-org {
          background: ${activeTab === 'organizer' ? 'rgba(30,94,255,0.15)' : 'transparent'};
          color: ${activeTab === 'organizer' ? '#1E5EFF' : '#4B5563'};
          box-shadow: ${activeTab === 'organizer' ? 'inset 0 0 0 1px rgba(30,94,255,0.4)' : 'none'};
        }
        .tab-btn-org:hover { color: #1E5EFF; }
        .tab-btn-att {
          background: ${activeTab === 'attendee' ? 'rgba(255,199,69,0.12)' : 'transparent'};
          color: ${activeTab === 'attendee' ? '#FFC745' : '#4B5563'};
          box-shadow: ${activeTab === 'attendee' ? 'inset 0 0 0 1px rgba(255,199,69,0.35)' : 'none'};
        }
        .tab-btn-att:hover { color: #FFC745; }

        .step-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 64px;
          align-items: center;
          padding: 80px 0;
          border-top: 1px solid rgba(255,255,255,0.05);
        }
        .step-section:first-child { border-top: none; }
        .step-section.reverse { direction: rtl; }
        .step-section.reverse > * { direction: ltr; }

        @media (max-width: 900px) {
          .step-section { grid-template-columns: 1fr; gap: 36px; }
          .step-section.reverse { direction: ltr; }
        }
        @media (max-width: 640px) {
          .tab-btn { padding: 10px 18px; font-size: 13px; }
        }
      `}</style>

      {/* ── Nav ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '0 24px',
        background: scrollY > 40 ? 'rgba(8,10,16,0.9)' : 'transparent',
        backdropFilter: scrollY > 40 ? 'blur(20px)' : 'none',
        WebkitBackdropFilter: scrollY > 40 ? 'blur(20px)' : 'none',
        borderBottom: scrollY > 40 ? '1px solid rgba(255,255,255,0.06)' : 'none',
        height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        transition: 'background 0.3s ease, border-color 0.3s ease',
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg,#2B6FFF,#1448CC)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 14px rgba(30,94,255,0.35)' }}>
            <Ticket size={14} color="white" />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 800, color: '#F0F2FF' }}>Tikkit</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#6B7280', textDecoration: 'none', fontFamily: 'var(--font-body)' }}>
            <ArrowLeft size={14} /> Back
          </Link>
          <Link href="/auth/login" style={{
            background: 'linear-gradient(135deg,#1E5EFF,#1448CC)',
            color: 'white', textDecoration: 'none', borderRadius: 10, padding: '8px 18px',
            fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-display)',
            display: 'flex', alignItems: 'center', gap: 6,
            boxShadow: '0 0 20px rgba(30,94,255,0.35)',
          }}>
            Get started <ArrowRight size={13} />
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ position: 'relative', minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '120px 24px 80px', overflow: 'hidden' }}>
        {/* Orbs */}
        <Orb x="20%" y="30%" color="#1E5EFF" size={600} opacity={0.15} />
        <Orb x="80%" y="60%" color="#A855F7" size={500} opacity={0.12} />
        <Orb x="50%" y="80%" color="#FFC745" size={400} opacity={0.08} />

        {/* Grid */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(30,94,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(30,94,255,0.03) 1px,transparent 1px)',
          backgroundSize: '60px 60px',
          maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%,black 40%,transparent 100%)',
        }} />

        <div ref={heroInView.ref} style={{ position: 'relative', maxWidth: 700 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 24,
            background: 'rgba(30,94,255,0.1)', border: '1px solid rgba(30,94,255,0.25)',
            borderRadius: 999, padding: '6px 16px',
            opacity: heroInView.inView ? 1 : 0,
            animation: heroInView.inView ? 'fadeIn 0.6s ease both' : 'none',
          }}>
            <Sparkles size={13} color="#1E5EFF" />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#1E5EFF', letterSpacing: '0.06em', fontFamily: 'var(--font-body)' }}>PRODUCT TOUR</span>
          </div>

          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(42px, 7vw, 80px)',
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: '-2px',
            marginBottom: 24,
            opacity: heroInView.inView ? 1 : 0,
            animation: heroInView.inView ? 'fadeUp 0.7s ease 0.1s both' : 'none',
          }}>
            See Tikkit<br />
            <span className="gradient-text">in action.</span>
          </h1>

          <p style={{
            fontSize: 'clamp(16px, 2vw, 20px)',
            color: '#6B7280',
            fontFamily: 'var(--font-body)',
            lineHeight: 1.7,
            maxWidth: 520,
            margin: '0 auto 40px',
            opacity: heroInView.inView ? 1 : 0,
            animation: heroInView.inView ? 'fadeUp 0.7s ease 0.2s both' : 'none',
          }}>
            Two experiences. One platform. Explore how organizers run their events — and how guests discover and attend them.
          </p>

          {/* Tab switcher */}
          <div ref={tabsInView.ref} style={{
            display: 'inline-flex', gap: 4, background: '#0F1119',
            borderRadius: 14, padding: 4, border: '1px solid rgba(255,255,255,0.07)',
            opacity: tabsInView.inView ? 1 : 0,
            animation: tabsInView.inView ? 'fadeUp 0.7s ease 0.3s both' : 'none',
          }}>
            <button className="tab-btn tab-btn-org" onClick={() => setActiveTab('organizer')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <BarChart3 size={15} />
                For Organizers
              </div>
            </button>
            <button className="tab-btn tab-btn-att" onClick={() => setActiveTab('attendee')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Ticket size={15} />
                For Attendees
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* ── Organizer Section ── */}
      <section
        ref={orgSectionInView.ref}
        style={{
          maxWidth: 1100, margin: '0 auto', padding: '0 24px 120px',
          display: activeTab === 'organizer' ? 'block' : 'none',
        }}
      >
        {/* Section header */}
        <div style={{
          textAlign: 'center', marginBottom: 80,
          opacity: orgSectionInView.inView ? 1 : 0,
          transform: orgSectionInView.inView ? 'translateY(0)' : 'translateY(24px)',
          transition: 'opacity 0.6s ease, transform 0.6s ease',
        }}>
          <Pill color="#1E5EFF">For Organizers</Pill>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: 'clamp(32px, 5vw, 52px)',
            fontWeight: 800, letterSpacing: '-1.5px', marginTop: 16, marginBottom: 16,
            color: '#F0F2FF', lineHeight: 1.1,
          }}>
            Your whole event,<br />
            <span className="gradient-text-blue">in one dashboard.</span>
          </h2>
          <p style={{ fontSize: 17, color: '#6B7280', fontFamily: 'var(--font-body)', lineHeight: 1.7, maxWidth: 500, margin: '0 auto' }}>
            From creating an event to reviewing post-night analytics — Tikkit keeps it all in one place so you can stay focused on what matters.
          </p>
        </div>

        {orgSteps.map((step, i) => {
          const MockupComponent = step.mockup
          return (
            <div
              key={i}
              ref={step.ref.ref}
              className={`step-section${i % 2 === 1 ? ' reverse' : ''}`}
            >
              {/* Text side */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                <FeatureStep
                  num={step.num}
                  icon={step.icon}
                  title={step.title}
                  desc={step.desc}
                  color={step.color}
                  index={0}
                  inView={step.ref.inView}
                />
                {/* Decorative accent line */}
                <div style={{
                  height: 2, borderRadius: 1,
                  background: `linear-gradient(90deg, ${step.color}, transparent)`,
                  width: step.ref.inView ? '60%' : '0%',
                  transition: 'width 0.8s ease 0.4s',
                }} />
              </div>
              {/* Mockup side */}
              <div style={{ position: 'relative' }}>
                <div aria-hidden="true" style={{
                  position: 'absolute', top: '50%', left: '50%',
                  transform: 'translate(-50%,-50%)',
                  width: 300, height: 300,
                  background: `radial-gradient(circle, ${step.color}20 0%, transparent 70%)`,
                  pointerEvents: 'none',
                  animation: step.ref.inView ? 'glow-pulse 3s ease infinite' : 'none',
                }} />
                <MockupComponent inView={step.ref.inView} />
              </div>
            </div>
          )
        })}
      </section>

      {/* ── Attendee Section ── */}
      <section
        ref={attSectionInView.ref}
        style={{
          maxWidth: 1100, margin: '0 auto', padding: '0 24px 120px',
          display: activeTab === 'attendee' ? 'block' : 'none',
        }}
      >
        {/* Section header */}
        <div style={{
          textAlign: 'center', marginBottom: 80,
          opacity: attSectionInView.inView ? 1 : 0,
          transform: attSectionInView.inView ? 'translateY(0)' : 'translateY(24px)',
          transition: 'opacity 0.6s ease, transform 0.6s ease',
        }}>
          <Pill color="#FFC745">For Attendees</Pill>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: 'clamp(32px, 5vw, 52px)',
            fontWeight: 800, letterSpacing: '-1.5px', marginTop: 16, marginBottom: 16,
            color: '#F0F2FF', lineHeight: 1.1,
          }}>
            Discover. Register.<br />
            <span className="gradient-text-gold">Show up.</span>
          </h2>
          <p style={{ fontSize: 17, color: '#6B7280', fontFamily: 'var(--font-body)', lineHeight: 1.7, maxWidth: 500, margin: '0 auto' }}>
            Find the city&apos;s best events, register in seconds, and walk in with a single QR scan. Build your guest reputation with every event.
          </p>
        </div>

        {attSteps.map((step, i) => {
          const MockupComponent = step.mockup
          return (
            <div
              key={i}
              ref={step.ref.ref}
              className={`step-section${i % 2 === 1 ? ' reverse' : ''}`}
            >
              {/* Text side */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                <FeatureStep
                  num={step.num}
                  icon={step.icon}
                  title={step.title}
                  desc={step.desc}
                  color={step.color}
                  index={0}
                  inView={step.ref.inView}
                />
                <div style={{
                  height: 2, borderRadius: 1,
                  background: `linear-gradient(90deg, ${step.color}, transparent)`,
                  width: step.ref.inView ? '60%' : '0%',
                  transition: 'width 0.8s ease 0.4s',
                }} />
              </div>
              {/* Mockup */}
              <div style={{ position: 'relative' }}>
                <div aria-hidden="true" style={{
                  position: 'absolute', top: '50%', left: '50%',
                  transform: 'translate(-50%,-50%)',
                  width: 300, height: 300,
                  background: `radial-gradient(circle, ${step.color}20 0%, transparent 70%)`,
                  pointerEvents: 'none',
                  animation: step.ref.inView ? 'glow-pulse 3s ease infinite' : 'none',
                }} />
                <MockupComponent inView={step.ref.inView} />
              </div>
            </div>
          )
        })}
      </section>

      {/* ── Switch CTA strip ── */}
      <div style={{ maxWidth: 1100, margin: '0 auto 80px', padding: '0 24px' }}>
        <GlassCard style={{ padding: '28px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: '#F0F2FF', marginBottom: 4 }}>
              {activeTab === 'organizer' ? 'Curious how attendees experience it?' : 'Want to run your own events?'}
            </div>
            <div style={{ fontSize: 14, color: '#6B7280', fontFamily: 'var(--font-body)' }}>
              {activeTab === 'organizer' ? 'See the attendee journey from discovery to check-in.' : 'See how organizers create and manage events from the dashboard.'}
            </div>
          </div>
          <button
            onClick={() => setActiveTab(activeTab === 'organizer' ? 'attendee' : 'organizer')}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: activeTab === 'organizer' ? 'rgba(255,199,69,0.12)' : 'rgba(30,94,255,0.12)',
              border: `1px solid ${activeTab === 'organizer' ? 'rgba(255,199,69,0.3)' : 'rgba(30,94,255,0.3)'}`,
              color: activeTab === 'organizer' ? '#FFC745' : '#1E5EFF',
              borderRadius: 10, padding: '10px 20px',
              fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-display)',
              cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
            {activeTab === 'organizer' ? <Ticket size={14} /> : <BarChart3 size={14} />}
            {activeTab === 'organizer' ? 'View Attendee Tour' : 'View Organizer Tour'}
            <ChevronRight size={14} />
          </button>
        </GlassCard>
      </div>

      {/* ── CTA ── */}
      <section
        ref={ctaInView.ref}
        style={{ padding: '0 24px 120px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}
      >
        <Orb x="50%" y="50%" color="#1E5EFF" size={600} opacity={0.12} />

        <div style={{
          maxWidth: 640, margin: '0 auto', position: 'relative',
          opacity: ctaInView.inView ? 1 : 0,
          transform: ctaInView.inView ? 'translateY(0)' : 'translateY(32px)',
          transition: 'opacity 0.7s ease, transform 0.7s ease',
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: 18, margin: '0 auto 24px',
            background: 'linear-gradient(135deg,#2B6FFF,#1448CC)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 40px rgba(30,94,255,0.4)',
            animation: ctaInView.inView ? 'floatSlow 4s ease infinite' : 'none',
          }}>
            <Zap size={28} color="white" />
          </div>

          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(32px, 5vw, 52px)',
            fontWeight: 800, letterSpacing: '-1.5px',
            color: '#F0F2FF', lineHeight: 1.1, marginBottom: 20,
          }}>
            Ready to run events<br />
            <span className="gradient-text">the right way?</span>
          </h2>

          <p style={{ fontSize: 18, color: '#6B7280', fontFamily: 'var(--font-body)', lineHeight: 1.7, marginBottom: 36 }}>
            Join organizers across Pakistan who use Tikkit to manage events that people actually remember.
          </p>

          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/auth/login" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'linear-gradient(135deg,#1E5EFF,#1448CC)',
              color: 'white', textDecoration: 'none',
              borderRadius: 14, padding: '16px 32px',
              fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-display)',
              boxShadow: '0 0 40px rgba(30,94,255,0.4)',
              letterSpacing: '-0.2px',
            }}>
              Start for free <ArrowRight size={16} />
            </Link>
            <Link href="/" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#9CA3AF', textDecoration: 'none',
              borderRadius: 14, padding: '16px 28px',
              fontSize: 16, fontWeight: 600, fontFamily: 'var(--font-display)',
            }}>
              ← Back to home
            </Link>
          </div>

          {/* Trust badges */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 40, flexWrap: 'wrap' }}>
            {[
              { icon: Shield, text: 'No credit card required' },
              { icon: Zap, text: 'Live in 2 minutes' },
              { icon: Users, text: 'Trusted by 500+ organizers' },
            ].map(({ icon: Icon, text }, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, opacity: ctaInView.inView ? 1 : 0, transition: `opacity 0.5s ease ${0.4 + i * 0.1}s` }}>
                <Icon size={13} color="#4B5563" />
                <span style={{ fontSize: 13, color: '#4B5563', fontFamily: 'var(--font-body)' }}>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
