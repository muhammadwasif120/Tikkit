'use client'

import { useState, useEffect } from 'react'
import { Ticket, MapPin, Calendar, CheckCircle } from 'lucide-react'
import Link from 'next/link'

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


/* ─── QR Card ────────────────────────────────────────────────────── */
function QRTicketCard({ ticket }: { ticket: TicketData }) {
  const [qrSrc, setQrSrc] = useState('')
  const [brightness, setBrightness] = useState(false)
  const [timeLeft, setTimeLeft] = useState(msUntil(ticket.eventDate))

  // Countdown tick
  useEffect(() => {
    const interval = setInterval(() => setTimeLeft(msUntil(ticket.eventDate)), 1000)
    return () => clearInterval(interval)
  }, [ticket.eventDate])

  // Generate QR immediately — available as soon as ticket is confirmed
  useEffect(() => {
    import('qrcode').then(({ default: QRCode }) =>
      QRCode.toDataURL(ticket.ticketCode, {
        width: 220, margin: 2,
        color: { dark: '#080A10', light: '#FFFFFF' },
        errorCorrectionLevel: 'H',
      }).then(setQrSrc).catch(console.error)
    )
  }, [ticket.ticketCode])

  const isSoldOut = timeLeft < 0

  return (
    <>
      <div style={{
        background: 'var(--surface-card)', border: '1px solid var(--guest-border)',
        borderRadius: 22, overflow: 'hidden',
        boxShadow: '0 0 40px rgba(var(--brand-blue-rgb),0.2)',
      }}>
        {/* Header — intentional dark gradient for ticket aesthetic */}
        <div style={{
          background: isSoldOut
            ? 'linear-gradient(135deg,#1A1A2E,#16213E)'
            : 'linear-gradient(135deg,#0F2A5E 0%,var(--brand-blue) 100%)',
          padding: '20px 20px 16px', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', right: -30, top: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(var(--brand-blue-rgb),0.1)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
            <Ticket size={13} color="#818CF8" />
            <span style={{ color: '#818CF8', fontSize: 10, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>
              {ticket.checkedIn ? 'Checked In ✓' : 'Active Ticket'}
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
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: ticket.secretVenue ? '#10B981' : 'rgba(255,255,255,0.6)', fontSize: 12 }}>
              <MapPin size={11} /> {ticket.eventVenue ?? 'TBA'}
            </span>
          </div>
        </div>

        {/* Tear divider */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '0 -1px' }}>
          <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--guest-bg)', flexShrink: 0, marginLeft: -11 }} />
          <div style={{ flex: 1, borderTop: '2px dashed var(--guest-border)' }} />
          <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--guest-bg)', flexShrink: 0, marginRight: -11 }} />
        </div>

        {/* QR section — available immediately to confirmed ticket holders */}
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <div
            onClick={() => setBrightness(!brightness)}
            style={{
              display: 'inline-block', padding: 12, borderRadius: 16,
              background: brightness ? 'white' : '#F9FAFB',
              cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
              transition: 'background 0.2s',
            }}
          >
            {qrSrc
              ? <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrSrc} alt="QR" style={{ width: 196, height: 196, display: 'block', borderRadius: 8 }} />
                </>
              : <div style={{ width: 196, height: 196, background: '#E5E7EB', borderRadius: 8 }} />
            }
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 10 }}>
            {ticket.checkedIn ? "You're checked in ✓" : 'Tap to boost brightness · Show at entry'}
          </p>
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid var(--guest-border)', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: 10, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ticket holder</p>
            <p style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 700, margin: 0 }}>{ticket.guestName}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: 10, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Code</p>
            <p style={{ color: '#818CF8', fontSize: 11, fontWeight: 700, margin: 0, fontFamily: 'monospace' }}>
              {ticket.ticketCode.replace('TIKKIT-','').slice(0,8)}
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

const TC_STYLES = `
  .tc-grid { display: flex; flex-direction: column; gap: 16px; }
  @media (min-width: 768px) {
    .tc-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 20px; }
  }
`

/* ─── Main ───────────────────────────────────────────────────────── */
export default function TicketsClient({ tickets }: { tickets: TicketData[] }) {
  const upcoming = tickets.filter(t => !t.checkedIn && new Date(t.eventDate) >= new Date())
  const checkedIn = tickets.filter(t => t.checkedIn)
  const past = tickets.filter(t => !t.checkedIn && new Date(t.eventDate) < new Date())

  if (tickets.length === 0) {
    return (
      <div style={{ padding: '80px 20px', textAlign: 'center' }}>
        <Ticket size={48} color="var(--brand-blue)" style={{ opacity: 0.25, marginBottom: 16 }} />
        <h3 style={{ color: 'var(--text-primary)', fontSize: 18, fontWeight: 700, margin: '0 0 8px', fontFamily: 'var(--font-display)' }}>No tickets yet</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: '0 0 24px' }}>Register and get confirmed for events to see your tickets here.</p>
        <Link href="/guest/explore" style={{ display: 'inline-block', padding: '12px 24px', borderRadius: 14, background: 'var(--brand-blue)', color: '#FFFFFF', textDecoration: 'none', fontSize: 14, fontWeight: 700 }}>
          Explore Events
        </Link>
      </div>
    )
  }

  return (
    <>
      <style>{TC_STYLES}</style>
      <div style={{ padding: '16px' }}>
        {upcoming.length > 0 && (
          <>
            <p style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', margin: '0 0 12px' }}>Upcoming</p>
            <div className="tc-grid" style={{ marginBottom: 24 }}>
              {upcoming.map(t => <QRTicketCard key={t.registrationId} ticket={t} />)}
            </div>
          </>
        )}
        {checkedIn.length > 0 && (
          <>
            <p style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', margin: '0 0 12px' }}>Checked In</p>
            <div className="tc-grid" style={{ marginBottom: 24 }}>
              {checkedIn.map(t => <QRTicketCard key={t.registrationId} ticket={t} />)}
            </div>
          </>
        )}
        {past.length > 0 && (
          <>
            <p style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', margin: '0 0 12px' }}>Past</p>
            <div className="tc-grid" style={{ opacity: 0.45 }}>
              {past.map(t => <QRTicketCard key={t.registrationId} ticket={t} />)}
            </div>
          </>
        )}
      </div>
    </>
  )
}
