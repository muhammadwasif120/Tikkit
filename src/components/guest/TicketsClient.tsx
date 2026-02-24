'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Calendar, MapPin, Ticket, Star, CheckCircle, Clock, Award } from 'lucide-react'

type Guest = { event_id: string; qr_code: string; status: string; is_vip: boolean; checked_in_at: string | null; checked_out_at: string | null }
type EventData = { id: string; title: string; date_start: string; date_end: string | null; venue_name: string | null; secret_venue: boolean; cover_image_url: string | null; ticket_price: number; event_status: string }
type Registration = { id: string; event_id: string; status: string; payment_status: string; payment_token: string; event: EventData | null }

function isPast(iso: string) { return new Date(iso) < new Date() }
function fmtDate(iso: string) { return new Date(iso).toLocaleDateString('en-PK', { weekday: 'short', day: 'numeric', month: 'short' }) }
function fmtTime(iso: string) { return new Date(iso).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', hour12: true }) }

function TicketCard({ reg, guest }: { reg: Registration; guest?: Guest }) {
  const [expanded, setExpanded] = useState(false)
  const event = reg.event
  if (!event || !guest) return null

  const past = event.date_end ? isPast(event.date_end) : isPast(event.date_start)
  const checkedIn = guest.status === 'checked_in' || guest.status === 'checked_out'
  const checkedOut = guest.status === 'checked_out'

  if (past) {
    return (
      <div style={{ background: '#13151E', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, overflow: 'hidden', opacity: 0.7 }}>
        <div style={{ position: 'relative', height: 80, background: '#0F1117' }}>
          {event.cover_image_url && <img src={event.cover_image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(60%)' }} />}
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#6B7280', fontSize: 12, fontWeight: 700 }}>Event Ended</span>
          </div>
        </div>
        <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ color: '#6B7280', fontSize: 13, fontWeight: 600, margin: '0 0 2px' }}>{event.title}</p>
            <p style={{ color: '#374151', fontSize: 12, margin: 0 }}>{fmtDate(event.date_start)}</p>
          </div>
          <Link href="/guest/passes" style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)', borderRadius: 20, textDecoration: 'none' }}>
            <Award size={12} color="#A855F7" />
            <span style={{ color: '#A855F7', fontSize: 12, fontWeight: 700 }}>View Pass</span>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      background: '#13151E',
      border: guest.is_vip ? '1px solid rgba(255,199,69,0.25)' : '1px solid rgba(255,255,255,0.07)',
      borderRadius: 20, overflow: 'hidden',
    }}>
      {/* VIP top line */}
      {guest.is_vip && <div style={{ height: 2, background: 'linear-gradient(90deg, transparent, #FFC745, transparent)' }} />}

      {/* Cover */}
      <div style={{ position: 'relative', height: 140 }}>
        {event.cover_image_url ? (
          <img src={event.cover_image_url} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #0D1A3A, #0A0C12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Ticket size={32} color="rgba(30,94,255,0.2)" />
          </div>
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(19,21,30,1) 0%, transparent 60%)' }} />

        {/* Check-in status */}
        <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', background: checkedIn ? 'rgba(34,197,94,0.9)' : 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', borderRadius: 20 }}>
          {checkedIn ? <CheckCircle size={11} color="#000" /> : <Clock size={11} color="#6B7280" />}
          <span style={{ fontSize: 11, fontWeight: 700, color: checkedIn ? '#000' : '#6B7280' }}>
            {checkedOut ? 'Attended' : checkedIn ? 'Checked In' : 'Not yet scanned'}
          </span>
        </div>

        {guest.is_vip && (
          <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: 'rgba(255,199,69,0.9)', borderRadius: 20 }}>
            <Star size={11} color="#000" fill="#000" />
            <span style={{ fontSize: 11, fontWeight: 800, color: '#000' }}>VIP</span>
          </div>
        )}
      </div>

      {/* Event info */}
      <div style={{ padding: '14px 16px' }}>
        <h3 style={{ color: 'white', fontSize: 17, fontWeight: 800, fontFamily: 'Poppins, sans-serif', letterSpacing: '-0.3px', margin: '0 0 8px' }}>{event.title}</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Calendar size={13} color="#4B5563" />
            <span style={{ color: '#6B7280', fontSize: 13 }}>{fmtDate(event.date_start)} · {fmtTime(event.date_start)}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <MapPin size={13} color="#4B5563" />
            <span style={{ color: '#6B7280', fontSize: 13 }}>{event.secret_venue ? (event.venue_name ?? 'Venue TBC') : (event.venue_name ?? 'TBC')}</span>
          </div>
        </div>

        {/* Ticket stub divider */}
        <div style={{ display: 'flex', alignItems: 'center', margin: '0 -16px 16px' }}>
          <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#080A0F', flexShrink: 0 }} />
          <div style={{ flex: 1, borderTop: '1.5px dashed rgba(255,255,255,0.07)' }} />
          <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#080A0F', flexShrink: 0 }} />
        </div>

        {/* QR Code */}
        <div style={{ textAlign: 'center' }}>
          <button onClick={() => setExpanded(!expanded)} style={{
            background: 'none', border: 'none', cursor: 'pointer', width: '100%', padding: 0,
          }}>
            {expanded ? (
              <div style={{ background: 'white', borderRadius: 12, padding: 14, display: 'inline-block' }}>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${guest.qr_code}`}
                  alt="QR Code"
                  style={{ width: 220, height: 220, display: 'block' }}
                />
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px', background: 'rgba(30,94,255,0.08)', border: '1px solid rgba(30,94,255,0.2)', borderRadius: 12 }}>
                <Ticket size={16} color="#4F8AFF" />
                <span style={{ color: '#4F8AFF', fontSize: 14, fontWeight: 700 }}>Tap to show QR code</span>
              </div>
            )}
          </button>
          {expanded && (
            <p style={{ color: '#374151', fontSize: 12, margin: '10px 0 0', lineHeight: 1.5 }}>
              Show this to the door staff for entry.<br />Tap the QR to hide it.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default function TicketsClient({ registrations, guestMap }: { registrations: Registration[]; guestMap: Record<string, Guest> }) {
  const upcoming = registrations.filter(r => r.event && !(r.event.date_end ? isPast(r.event.date_end) : isPast(r.event.date_start)))
  const past = registrations.filter(r => r.event && (r.event.date_end ? isPast(r.event.date_end) : isPast(r.event.date_start)))

  return (
    <div style={{ padding: '20px 18px 8px' }}>
      <h1 style={{ color: 'white', fontSize: 24, fontWeight: 800, fontFamily: 'Poppins, sans-serif', letterSpacing: '-0.5px', margin: '0 0 20px' }}>
        My Tickets
      </h1>

      {registrations.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <Ticket size={36} color="#1F2937" style={{ marginBottom: 12 }} />
          <p style={{ color: '#374151', fontSize: 15, fontWeight: 600, margin: '0 0 6px' }}>No tickets yet</p>
          <p style={{ color: '#1F2937', fontSize: 13, margin: '0 0 20px' }}>Your approved event tickets will appear here</p>
          <Link href="/explore" style={{ display: 'inline-block', padding: '10px 20px', background: '#1E5EFF', color: 'white', borderRadius: 12, textDecoration: 'none', fontSize: 14, fontWeight: 700 }}>
            Explore Events
          </Link>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <>
              <p style={{ color: '#6B7280', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 12px' }}>Upcoming · {upcoming.length}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 28 }}>
                {upcoming.map(reg => <TicketCard key={reg.id} reg={reg} guest={guestMap[reg.event_id]} />)}
              </div>
            </>
          )}
          {past.length > 0 && (
            <>
              <p style={{ color: '#374151', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 10px' }}>Past · {past.length}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {past.map(reg => <TicketCard key={reg.id} reg={reg} guest={guestMap[reg.event_id]} />)}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}