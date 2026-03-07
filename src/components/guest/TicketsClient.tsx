'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Ticket, Lock, MapPin, Calendar, Clock, CheckCircle, Unlock } from 'lucide-react'
import QRCode from 'qrcode'

/* ─── Types ──────────────────────────────────────────────────────── */
type TicketData = {
  registrationId: string
  eventId: string
  eventTitle: string
  eventDate: string
  eventVenue: string | null
  secretVenue: boolean
  venueRevealAt: string | null
  guestName: string
  ticketCode: string
  status: 'confirmed' | 'registered'
  checkedIn: boolean
  checkInTime: string | null
}

/* ─── Helpers ────────────────────────────────────────────────────── */
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-PK', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', hour12: true })
}
function msUntil(iso: string) { return new Date(iso).getTime() - Date.now() }
function fmtCountdown(ms: number) {
  if (ms <= 0) return null
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  if (h > 24) { const d = Math.floor(h / 24); return `${d}d ${h % 24}h` }
  if (h > 0) return `${h}h ${m}m`
  return `${m}m ${s}s`
}

/* ─── Confetti ───────────────────────────────────────────────────── */
function Confetti({ active }: { active: boolean }) {
  const colors = ['#1E5EFF','#EAB308','#EF4444','#10B981','#A855F7','#F97316']
  if (!active) return null
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999, overflow: 'hidden' }}>
      {Array.from({ length: 60 }).map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${Math.random() * 100}%`,
          top: `-10px`,
          width: `${6 + Math.random() * 8}px`,
          height: `${6 + Math.random() * 8}px`,
          borderRadius: Math.random() > 0.5 ? '50%' : '2px',
          background: colors[Math.floor(Math.random() * colors.length)],
          animation: `confettiFall ${1.5 + Math.random() * 2}s ease-in forwards`,
          animationDelay: `${Math.random() * 0.8}s`,
          transform: `rotate(${Math.random() * 360}deg)`,
        }} />
      ))}
    </div>
  )
}

/* ─── Ticket tear animation ──────────────────────────────────────── */
function TicketTear({ onComplete }: { onComplete: () => void }) {
  const [stage, setStage] = useState(0) // 0=idle 1=tearing 2=done

  useEffect(() => {
    setStage(1)
    const t1 = setTimeout(() => setStage(2), 600)
    const t2 = setTimeout(() => onComplete(), 900)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
    }}>
      <div style={{
        width: 280, height: 140, position: 'relative',
        transform: stage === 1 ? 'scale(1.05)' : 'scale(1)',
        transition: 'transform 0.3s ease',
      }}>
        {/* Top half */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '50%',
          background: 'linear-gradient(135deg,#1E3A5F,#1E5EFF)',
          borderRadius: '16px 16px 0 0',
          transform: stage === 1 ? 'translateY(-20px) rotate(-2deg)' : 'none',
          transition: 'transform 0.5s cubic-bezier(0.34,1.56,0.64,1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Ticket size={28} color="rgba(255,255,255,0.6)" />
        </div>
        {/* Tear line */}
        <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 2, background: 'rgba(255,255,255,0.15)', zIndex: 1 }} />
        {/* Bottom half */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%',
          background: 'linear-gradient(135deg,#1E5EFF,#818CF8)',
          borderRadius: '0 0 16px 16px',
          transform: stage === 1 ? 'translateY(20px) rotate(2deg)' : 'none',
          transition: 'transform 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.1s',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 700, letterSpacing: '2px' }}>UNLOCKED</span>
        </div>
      </div>
    </div>
  )
}

/* ─── QR Card ────────────────────────────────────────────────────── */
function QRTicketCard({ ticket }: { ticket: TicketData }) {
  const [qrSrc, setQrSrc] = useState('')
  const [brightness, setBrightness] = useState(false)
  const [showTear, setShowTear] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [timeLeft, setTimeLeft] = useState(msUntil(ticket.eventDate))
  const [venueTimeLeft, setVenueTimeLeft] = useState(
    ticket.venueRevealAt ? msUntil(ticket.venueRevealAt) : null
  )
  const [unlocked, setUnlocked] = useState(false)
  const [venueRevealed, setVenueRevealed] = useState(
    ticket.secretVenue ? (ticket.venueRevealAt ? msUntil(ticket.venueRevealAt) <= 0 : false) : true
  )
  const tearShownRef = useRef(false)

  const isUnlocked = timeLeft <= 3600000 // 1 hour before

  // Countdown tick
  useEffect(() => {
    const interval = setInterval(() => {
      const ms = msUntil(ticket.eventDate)
      setTimeLeft(ms)
      if (ticket.venueRevealAt) {
        const vms = msUntil(ticket.venueRevealAt)
        setVenueTimeLeft(vms)
        if (vms <= 0 && !venueRevealed) setVenueRevealed(true)
      }
      // Trigger tear animation once when QR unlocks
      if (ms <= 3600000 && !unlocked && !tearShownRef.current) {
        tearShownRef.current = true
        setShowTear(true)
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [unlocked, venueRevealed, ticket])

  // Generate QR only when unlocked
  useEffect(() => {
    if (isUnlocked || ticket.checkedIn) {
      QRCode.toDataURL(ticket.ticketCode, {
        width: 220, margin: 2,
        color: { dark: '#080A10', light: '#FFFFFF' },
        errorCorrectionLevel: 'H',
      }).then(setQrSrc).catch(console.error)
    }
  }, [isUnlocked, ticket.checkedIn, ticket.ticketCode])

  const isSoldOut = timeLeft < 0

  return (
    <>
      {showTear && <TicketTear onComplete={() => { setShowTear(false); setUnlocked(true); setShowConfetti(true); setTimeout(() => setShowConfetti(false), 3000) }} />}
      <Confetti active={showConfetti} />

      <div style={{
        background: '#13151E', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 22, overflow: 'hidden',
        boxShadow: isUnlocked ? '0 0 40px rgba(30,94,255,0.2)' : '0 8px 32px rgba(0,0,0,0.4)',
        transition: 'box-shadow 0.5s ease',
      }}>
        {/* Header */}
        <div style={{
          background: isSoldOut
            ? 'linear-gradient(135deg,#1A1A2E,#16213E)'
            : isUnlocked
            ? 'linear-gradient(135deg,#0F2A5E 0%,#1E5EFF 100%)'
            : 'linear-gradient(135deg,#1E3A5F 0%,#0D1B2E 100%)',
          padding: '20px 20px 16px', position: 'relative', overflow: 'hidden',
          transition: 'background 0.8s ease',
        }}>
          <div style={{ position: 'absolute', right: -30, top: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(30,94,255,0.1)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
            <Ticket size={13} color="#818CF8" />
            <span style={{ color: '#818CF8', fontSize: 10, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>
              {ticket.checkedIn ? 'Checked In ✓' : isUnlocked ? 'Active Ticket' : 'Upcoming'}
            </span>
            {ticket.checkedIn && <CheckCircle size={13} color="#10B981" style={{ marginLeft: 'auto' }} />}
          </div>
          <h2 style={{ color: 'white', fontSize: 19, fontWeight: 900, fontFamily: 'var(--font-display)', margin: '0 0 10px', letterSpacing: '-0.4px', lineHeight: 1.2 }}>
            {ticket.eventTitle}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
              <Calendar size={11} /> {fmtDate(ticket.eventDate)} · {fmtTime(ticket.eventDate)}
            </span>
            {/* Venue */}
            {!ticket.secretVenue && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
                <MapPin size={11} /> {ticket.eventVenue ?? 'TBA'}
              </span>
            )}
            {ticket.secretVenue && venueRevealed && ticket.eventVenue && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#10B981', fontSize: 12 }}>
                <MapPin size={11} /> {ticket.eventVenue}
              </span>
            )}
            {ticket.secretVenue && !venueRevealed && venueTimeLeft !== null && venueTimeLeft > 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#FFC745', fontSize: 12 }}>
                <Lock size={11} /> Venue reveals in {fmtCountdown(venueTimeLeft)}
              </span>
            )}
          </div>
        </div>

        {/* Tear divider */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '0 -1px' }}>
          <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#080A10', flexShrink: 0, marginLeft: -11 }} />
          <div style={{ flex: 1, borderTop: '2px dashed rgba(255,255,255,0.06)' }} />
          <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#080A10', flexShrink: 0, marginRight: -11 }} />
        </div>

        {/* QR / Lock section */}
        <div style={{ padding: '20px', textAlign: 'center' }}>
          {isUnlocked || ticket.checkedIn ? (
            <>
              <div
                onClick={() => setBrightness(!brightness)}
                style={{
                  display: 'inline-block', padding: 12, borderRadius: 16,
                  background: brightness ? 'white' : '#F9FAFB',
                  cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                  transition: 'background 0.2s',
                  animation: isUnlocked && !ticket.checkedIn ? 'pulse 2s ease infinite' : 'none',
                }}
              >
                {qrSrc
                  ? <img src={qrSrc} alt="QR" style={{ width: 196, height: 196, display: 'block', borderRadius: 8 }} />
                  : <div style={{ width: 196, height: 196, background: '#E5E7EB', borderRadius: 8 }} />
                }
              </div>
              <p style={{ color: '#4B5563', fontSize: 11, marginTop: 10 }}>
                {ticket.checkedIn ? "You're checked in ✓" : 'Tap to boost brightness · Show at entry'}
              </p>
            </>
          ) : (
            <div style={{ padding: '8px 0' }}>
              {/* Lock visual */}
              <div style={{
                width: 80, height: 80, borderRadius: 24,
                background: 'rgba(255,255,255,0.04)', border: '2px solid rgba(255,255,255,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px',
                animation: 'pulse 2.5s ease infinite',
              }}>
                <Lock size={32} color="#4B5563" />
              </div>
              <p style={{ color: 'white', fontSize: 15, fontWeight: 700, margin: '0 0 4px', fontFamily: 'var(--font-display)' }}>
                QR Locked
              </p>
              <p style={{ color: '#4B5563', fontSize: 13, margin: '0 0 16px' }}>
                Unlocks 1 hour before the event
              </p>
              {/* Countdown */}
              {timeLeft > 0 && (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '8px 16px', borderRadius: 14,
                  background: 'rgba(30,94,255,0.08)', border: '1px solid rgba(30,94,255,0.2)',
                }}>
                  <Clock size={13} color="#818CF8" />
                  <span style={{ color: '#818CF8', fontSize: 14, fontWeight: 800, fontFamily: 'var(--font-display)', letterSpacing: '-0.3px' }}>
                    {fmtCountdown(timeLeft)}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ color: '#4B5563', fontSize: 10, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ticket holder</p>
            <p style={{ color: 'white', fontSize: 13, fontWeight: 700, margin: 0 }}>{ticket.guestName}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ color: '#4B5563', fontSize: 10, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Code</p>
            <p style={{ color: '#818CF8', fontSize: 11, fontWeight: 700, margin: 0, fontFamily: 'monospace' }}>
              {ticket.ticketCode.replace('TIKKIT-','').slice(0,8)}
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

/* ─── Main ───────────────────────────────────────────────────────── */
export default function TicketsClient({ tickets }: { tickets: TicketData[] }) {
  const upcoming = tickets.filter(t => !t.checkedIn && new Date(t.eventDate) >= new Date())
  const checkedIn = tickets.filter(t => t.checkedIn)
  const past = tickets.filter(t => !t.checkedIn && new Date(t.eventDate) < new Date())

  if (tickets.length === 0) {
    return (
      <div style={{ padding: '80px 20px', textAlign: 'center' }}>
        <Ticket size={48} color="#1E5EFF" style={{ opacity: 0.25, marginBottom: 16 }} />
        <h3 style={{ color: 'white', fontSize: 18, fontWeight: 700, margin: '0 0 8px', fontFamily: 'var(--font-display)' }}>No tickets yet</h3>
        <p style={{ color: '#6B7280', fontSize: 14, margin: '0 0 24px' }}>Register and get confirmed for events to see your tickets here.</p>
        <a href="/guest/explore" style={{ display: 'inline-block', padding: '12px 24px', borderRadius: 14, background: '#1E5EFF', color: 'white', textDecoration: 'none', fontSize: 14, fontWeight: 700 }}>
          Explore Events
        </a>
      </div>
    )
  }

  return (
    <>
      <div style={{ padding: '16px' }}>
        {upcoming.length > 0 && (
          <>
            <p style={{ color: '#6B7280', fontSize: 11, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', margin: '0 0 12px' }}>Upcoming</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
              {upcoming.map(t => <QRTicketCard key={t.registrationId} ticket={t} />)}
            </div>
          </>
        )}
        {checkedIn.length > 0 && (
          <>
            <p style={{ color: '#6B7280', fontSize: 11, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', margin: '0 0 12px' }}>Checked In</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
              {checkedIn.map(t => <QRTicketCard key={t.registrationId} ticket={t} />)}
            </div>
          </>
        )}
        {past.length > 0 && (
          <>
            <p style={{ color: '#6B7280', fontSize: 11, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', margin: '0 0 12px' }}>Past</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, opacity: 0.45 }}>
              {past.map(t => <QRTicketCard key={t.registrationId} ticket={t} />)}
            </div>
          </>
        )}
      </div>
    </>
  )
}
