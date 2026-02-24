'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Calendar, MapPin, Clock, CheckCircle, AlertCircle, XCircle, Ticket, ChevronRight, QrCode, Star } from 'lucide-react'

type Event = {
  id: string; title: string; date_start: string; date_end: string | null
  venue_name: string | null; secret_venue: boolean; cover_image_url: string | null
  ticket_price: number; registration_mode: string; status: string
  organizer: { full_name: string; company_name: string | null } | null
}

type Registration = {
  id: string; event_id: string; status: string; payment_status: string
  payment_token: string; created_at: string; event: Event | null
}

type QREntry = { qr_code: string; status: string; is_vip: boolean }

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-PK', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', hour12: true })
}
function isPast(iso: string) { return new Date(iso) < new Date() }

function StatusBadge({ status, paymentStatus }: { status: string; paymentStatus: string }) {
  let label = '', color = '', bg = '', Icon = Clock

  if (status === 'rejected') { label = 'Declined'; color = '#EF4444'; bg = 'rgba(239,68,68,0.12)'; Icon = XCircle }
  else if (status === 'pending') { label = 'Under Review'; color = '#6B7280'; bg = 'rgba(107,114,128,0.12)'; Icon = Clock }
  else if (status === 'approved' && paymentStatus === 'pending') { label = 'Payment Due'; color = '#FFC745'; bg = 'rgba(255,199,69,0.12)'; Icon = AlertCircle }
  else if (status === 'approved' && paymentStatus === 'submitted') { label = 'Payment Reviewing'; color = '#F97316'; bg = 'rgba(249,115,22,0.12)'; Icon = Clock }
  else if (status === 'approved') { label = 'Confirmed'; color = '#22C55E'; bg = 'rgba(34,197,94,0.12)'; Icon = CheckCircle }

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', background: bg, borderRadius: 20 }}>
      <Icon size={11} color={color} />
      <span style={{ color, fontSize: 11, fontWeight: 700 }}>{label}</span>
    </div>
  )
}

function RegistrationCard({ reg, qr, userEmail }: { reg: Registration; qr?: QREntry; userEmail: string }) {
  const [showQR, setShowQR] = useState(false)
  const event = reg.event
  if (!event) return null

  const eventPast = event.date_end ? isPast(event.date_end) : isPast(event.date_start)
  const isApproved = reg.status === 'approved'
  const needsPayment = isApproved && reg.payment_status === 'pending'
  const paymentUrl = `/register/${event.id}?step=2&token=${reg.payment_token}`
  const organiser = event.organizer?.company_name ?? event.organizer?.full_name

  return (
    <div style={{ background: '#13151E', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, overflow: 'hidden', marginBottom: 12 }}>
      {/* Cover */}
      <div style={{ position: 'relative', height: 120 }}>
        {event.cover_image_url ? (
          <img src={event.cover_image_url} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #0D1A3A, #0A0C12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Ticket size={28} color="rgba(30,94,255,0.2)" />
          </div>
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(19,21,30,1) 0%, transparent 60%)' }} />
        {qr?.is_vip && (
          <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', background: 'rgba(255,199,69,0.9)', borderRadius: 20 }}>
            <Star size={10} color="#000" fill="#000" />
            <span style={{ fontSize: 10, fontWeight: 800, color: '#000' }}>VIP</span>
          </div>
        )}
        {eventPast && (
          <div style={{ position: 'absolute', top: 10, left: 10, padding: '3px 8px', background: 'rgba(0,0,0,0.6)', borderRadius: 20, backdropFilter: 'blur(8px)' }}>
            <span style={{ color: '#6B7280', fontSize: 10, fontWeight: 600 }}>Event Ended</span>
          </div>
        )}
      </div>

      <div style={{ padding: '14px 16px' }}>
        {/* Title + status */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
          <h3 style={{ color: 'white', fontSize: 15, fontWeight: 700, fontFamily: 'Poppins, sans-serif', margin: 0, lineHeight: 1.3, flex: 1 }}>
            {event.title}
          </h3>
          <StatusBadge status={reg.status} paymentStatus={reg.payment_status} />
        </div>

        {/* Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Calendar size={12} color="#4B5563" />
            <span style={{ color: '#6B7280', fontSize: 12 }}>{fmtDate(event.date_start)} · {fmtTime(event.date_start)}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <MapPin size={12} color="#4B5563" />
            <span style={{ color: '#6B7280', fontSize: 12 }}>{event.secret_venue ? (isApproved ? (event.venue_name ?? 'TBC') : '📍 Revealed on approval') : (event.venue_name ?? 'TBC')}</span>
          </div>
        </div>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: 8 }}>
          {/* Payment due */}
          {needsPayment && (
            <Link href={paymentUrl} style={{ flex: 1, textDecoration: 'none' }}>
              <div style={{ padding: '10px 14px', background: '#FFC745', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <AlertCircle size={14} color="#000" />
                <span style={{ color: '#000', fontSize: 13, fontWeight: 700 }}>Complete Payment</span>
              </div>
            </Link>
          )}

          {/* QR code button */}
          {isApproved && qr && !eventPast && reg.payment_status !== 'pending' && (
            <button
              onClick={() => setShowQR(true)}
              style={{ flex: 1, padding: '10px 14px', background: 'rgba(30,94,255,0.12)', border: '1px solid rgba(30,94,255,0.25)', borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              <QrCode size={14} color="#4F8AFF" />
              <span style={{ color: '#4F8AFF', fontSize: 13, fontWeight: 700 }}>Show QR</span>
            </button>
          )}

          {/* Passes collectible hint */}
          {eventPast && isApproved && (
            <Link href="/guest/passes" style={{ flex: 1, textDecoration: 'none' }}>
              <div style={{ padding: '10px 14px', background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Star size={14} color="#A855F7" />
                <span style={{ color: '#A855F7', fontSize: 13, fontWeight: 700 }}>View Pass</span>
              </div>
            </Link>
          )}
        </div>
      </div>

      {/* QR Modal */}
      {showQR && qr && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={() => setShowQR(false)}
        >
          <div style={{ background: '#13151E', borderRadius: 20, padding: '28px 24px', width: '100%', maxWidth: 340, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <p style={{ color: '#6B7280', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 4px' }}>Your Entry Pass</p>
            <h3 style={{ color: 'white', fontSize: 16, fontWeight: 800, fontFamily: 'Poppins, sans-serif', margin: '0 0 20px' }}>{event.title}</h3>

            {/* QR Code — using a public QR API */}
            <div style={{ background: 'white', borderRadius: 14, padding: 16, display: 'inline-block', marginBottom: 16 }}>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qr.qr_code}`}
                alt="QR Code"
                style={{ width: 200, height: 200, display: 'block' }}
              />
            </div>

            {qr.is_vip && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 12, padding: '6px 14px', background: 'rgba(255,199,69,0.12)', border: '1px solid rgba(255,199,69,0.25)', borderRadius: 20, width: 'fit-content', margin: '0 auto 16px' }}>
                <Star size={12} color="#FFC745" fill="#FFC745" />
                <span style={{ color: '#FFC745', fontSize: 12, fontWeight: 700 }}>VIP Access</span>
              </div>
            )}

            <p style={{ color: '#374151', fontSize: 12, margin: '0 0 16px', lineHeight: 1.5 }}>
              Show this at the door for entry.<br />
              Tap anywhere to close.
            </p>

            <div style={{ padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: 10 }}>
              <p style={{ color: '#374151', fontSize: 11, margin: 0, fontFamily: 'monospace', letterSpacing: '0.05em' }}>{qr.qr_code.slice(0, 20)}...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const TABS = ['All', 'Upcoming', 'Pending', 'Past'] as const
type Tab = typeof TABS[number]

export default function MyEventsClient({
  registrations, qrMap, userEmail,
}: {
  registrations: Registration[]
  qrMap: Record<string, QREntry>
  userEmail: string
}) {
  const [tab, setTab] = useState<Tab>('All')

  const filtered = registrations.filter(reg => {
    if (!reg.event) return false
    const past = reg.event.date_end ? isPast(reg.event.date_end) : isPast(reg.event.date_start)
    if (tab === 'Upcoming') return !past && reg.status !== 'rejected'
    if (tab === 'Pending')  return reg.status === 'pending' || (reg.status === 'approved' && reg.payment_status === 'pending')
    if (tab === 'Past')     return past
    return true
  })

  return (
    <div style={{ padding: '20px 18px 8px' }}>
      {/* Header */}
      <h1 style={{ color: 'white', fontSize: 24, fontWeight: 800, fontFamily: 'Poppins, sans-serif', letterSpacing: '-0.5px', margin: '0 0 16px' }}>
        My Events
      </h1>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, overflowX: 'auto', scrollbarWidth: 'none' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '7px 16px', borderRadius: 20, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
            background: tab === t ? '#1E5EFF' : 'rgba(255,255,255,0.06)',
            color: tab === t ? 'white' : '#6B7280', fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
          }}>{t}</button>
        ))}
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Ticket size={32} color="#1F2937" style={{ marginBottom: 12 }} />
          <p style={{ color: '#374151', fontSize: 15, fontWeight: 600, margin: '0 0 6px' }}>
            {tab === 'All' ? 'No events yet' : `No ${tab.toLowerCase()} events`}
          </p>
          <p style={{ color: '#1F2937', fontSize: 13, margin: '0 0 20px' }}>
            {tab === 'All' ? 'Register for an event to see it here' : ''}
          </p>
          {tab === 'All' && (
            <Link href="/explore" style={{ display: 'inline-block', padding: '10px 20px', background: '#1E5EFF', color: 'white', borderRadius: 12, textDecoration: 'none', fontSize: 14, fontWeight: 700 }}>
              Explore Events
            </Link>
          )}
        </div>
      ) : (
        filtered.map(reg => (
          <RegistrationCard key={reg.id} reg={reg} qr={qrMap[reg.event_id]} userEmail={userEmail} />
        ))
      )}
    </div>
  )
}