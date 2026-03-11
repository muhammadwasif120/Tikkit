'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import {
  Calendar, MapPin, Clock, Upload, X, CheckCircle,
  AlertCircle, ChevronRight, Ticket, FileImage, Loader,
  CreditCard,
} from 'lucide-react'
import { submitPaymentScreenshot } from '@/app/actions/guestPaymentActions'

/* ─── Types ──────────────────────────────────────────────────────── */
type EventInfo = {
  id: string; title: string; date_start: string; date_end: string | null
  venue_name: string | null; secret_venue: boolean
  cover_image_url: string | null; ticket_price: number | null
}
type Registration = {
  id: string; status: string; payment_status?: string; created_at: string
  payment_screenshot_url: string | null
  event: EventInfo | null
}

/* ─── Resolve DB statuses → display key ─────────────────────────── */
function resolveStatus(status: string, paymentStatus?: string): string {
  if (status === 'pending') return 'eoi_submitted'
  if (status === 'approved') {
    if (paymentStatus === 'pending')   return 'eoi_approved'
    if (paymentStatus === 'submitted') return 'payment_pending'
    return 'confirmed' // not_required or confirmed
  }
  return status // rejected, etc.
}

/* ─── Helpers ────────────────────────────────────────────────────── */
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-PK', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', hour12: true })
}
function isPast(iso: string) { return new Date(iso) < new Date() }

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ReactNode; info: string }> = {
  eoi_submitted: {
    label: 'Interest Submitted', color: '#EAB308', bg: 'rgba(234,179,8,0.1)', border: 'rgba(234,179,8,0.2)',
    icon: <Clock size={13} />,
    info: 'Your application is being reviewed by the organizer.',
  },
  eoi_approved: {
    label: 'Approved — Pay Now', color: '#EF4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)',
    icon: <AlertCircle size={13} />,
    info: "You've been approved! Upload your payment screenshot to confirm your spot.",
  },
  payment_pending: {
    label: 'Payment Verifying', color: '#818CF8', bg: 'rgba(129,140,248,0.1)', border: 'rgba(129,140,248,0.2)',
    icon: <Loader size={13} />,
    info: 'Your payment is being verified by the organizer.',
  },
  confirmed: {
    label: 'Confirmed', color: '#10B981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)',
    icon: <CheckCircle size={13} />,
    info: "You're all set! Your QR ticket is in the Tickets tab.",
  },
  registered: {
    label: 'Registered', color: '#10B981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)',
    icon: <CheckCircle size={13} />,
    info: "You're registered. Your QR ticket is in the Tickets tab.",
  },
  waitlisted: {
    label: 'Waitlisted', color: '#9CA3AF', bg: 'rgba(156,163,175,0.1)', border: 'rgba(156,163,175,0.2)',
    icon: <Clock size={13} />,
    info: "You're on the waitlist. We'll notify you if a spot opens up.",
  },
  rejected: {
    label: 'Not Approved', color: '#EF4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.15)',
    icon: <X size={13} />,
    info: 'Your application was not approved for this event.',
  },
}

/* ─── Payment Sheet ──────────────────────────────────────────────── */
function PaymentSheet({ registration, onClose, onSuccess }: {
  registration: Registration
  onClose: () => void
  onSuccess: () => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const event = registration.event!

  const handleFile = (f: File) => {
    if (!f.type.startsWith('image/')) { setErr('Please upload an image file'); return }
    if (f.size > 8 * 1024 * 1024) { setErr('File must be under 8MB'); return }
    setErr(null)
    setFile(f)
    const reader = new FileReader()
    reader.onload = e => setPreview(e.target?.result as string)
    reader.readAsDataURL(f)
  }

  const handleSubmit = async () => {
    if (!file) return
    setBusy(true)
    setErr(null)
    try {
      const fd = new FormData()
      fd.append('registrationId', registration.id)
      fd.append('screenshot', file)
      const res = await submitPaymentScreenshot(fd)
      if (res?.error) { setErr(res.error); return }
      onSuccess()
    } catch {
      setErr('Upload failed. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} />
      {/* Sheet */}
      <div style={{
        position: 'relative', background: 'var(--guest-surface-2)',
        borderRadius: '24px 24px 0 0', padding: '24px 20px 40px',
        border: '1px solid rgba(255,255,255,0.08)',
        animation: 'sheetSlideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        {/* Handle */}
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)', margin: '0 auto 20px' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <h3 style={{ color: 'white', fontSize: 18, fontWeight: 800, margin: '0 0 4px', fontFamily: 'var(--font-display)' }}>Submit Payment</h3>
            <p style={{ color: '#6B7280', fontSize: 13, margin: 0 }}>{event.title}</p>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 10, padding: 8, cursor: 'pointer', color: '#9CA3AF', display: 'flex' }}>
            <X size={16} />
          </button>
        </div>

        {event.ticket_price && event.ticket_price > 0 && (
          <div style={{ padding: '12px 14px', background: 'rgba(30,94,255,0.08)', border: '1px solid rgba(30,94,255,0.15)', borderRadius: 14, marginBottom: 20 }}>
            <p style={{ color: '#818CF8', fontSize: 13, margin: '0 0 2px', fontWeight: 600 }}>Amount to pay</p>
            <p style={{ color: 'white', fontSize: 22, fontWeight: 900, margin: 0, fontFamily: 'var(--font-display)' }}>
              PKR {event.ticket_price.toLocaleString('en-PK')}
            </p>
          </div>
        )}

        {/* Upload area */}
        <div
          onClick={() => inputRef.current?.click()}
          style={{
            border: `2px dashed ${preview ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: 18, padding: preview ? 0 : '32px 20px',
            textAlign: 'center', cursor: 'pointer', marginBottom: 16,
            overflow: 'hidden', transition: 'border-color 0.2s',
            background: preview ? 'transparent' : 'rgba(255,255,255,0.02)',
          }}
        >
          {preview ? (
            <div style={{ position: 'relative' }}>
              <img src={preview} alt="Payment screenshot" style={{ width: '100%', maxHeight: 280, objectFit: 'cover', display: 'block', borderRadius: 16 }} />
              <div style={{ position: 'absolute', top: 8, right: 8 }}>
                <button onClick={e => { e.stopPropagation(); setFile(null); setPreview(null) }} style={{ background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: 8, padding: 6, cursor: 'pointer', color: 'white', display: 'flex' }}>
                  <X size={14} />
                </button>
              </div>
            </div>
          ) : (
            <>
              <FileImage size={32} color="#6B7280" style={{ marginBottom: 10 }} />
              <p style={{ color: 'white', fontSize: 14, fontWeight: 600, margin: '0 0 4px' }}>Upload payment screenshot</p>
              <p style={{ color: '#6B7280', fontSize: 12, margin: 0 }}>Tap to choose · JPG, PNG, HEIC · Max 8MB</p>
            </>
          )}
        </div>
        <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />

        {err && (
          <div style={{ display: 'flex', gap: 8, padding: '10px 13px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 12, marginBottom: 14 }}>
            <AlertCircle size={14} color="#F87171" style={{ flexShrink: 0, marginTop: 1 }} />
            <span style={{ color: '#FCA5A5', fontSize: 13 }}>{err}</span>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={!file || busy}
          style={{
            width: '100%', padding: '14px', border: 'none', borderRadius: 14,
            background: !file || busy ? 'rgba(255,255,255,0.06)' : '#1E5EFF',
            color: !file || busy ? '#6B7280' : 'white',
            fontSize: 15, fontWeight: 700, cursor: !file || busy ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            fontFamily: 'var(--font-body)', transition: 'all 0.2s',
          }}
        >
          {busy
            ? <><Loader size={16} className="animate-spin" /> Uploading…</>
            : <><Upload size={16} /> Submit Screenshot</>
          }
        </button>
      </div>
    </div>
  )
}

/* ─── Registration Card ──────────────────────────────────────────── */
function RegCard({ reg, onPay }: { reg: Registration; onPay: (r: Registration) => void }) {
  const event = reg.event
  if (!event) return null
  const displayStatus = resolveStatus(reg.status, reg.payment_status)
  const cfg = STATUS_CONFIG[displayStatus] ?? STATUS_CONFIG.confirmed
  const past = isPast(event.date_start)
  const isConfirmed = displayStatus === 'confirmed' || displayStatus === 'registered'

  return (
    <div style={{
      background: 'var(--guest-surface)', border: `1px solid ${past ? 'rgba(255,255,255,0.04)' : cfg.border}`,
      borderRadius: 20, overflow: 'hidden', opacity: past ? 0.6 : 1,
      animation: 'revealUp 0.3s ease forwards',
    }}>
      {/* Cover strip */}
      <div style={{ height: 90, position: 'relative', background: event.cover_image_url ? `url(${event.cover_image_url}) center/cover` : 'linear-gradient(135deg,#1E3A5F,#0A0C12)' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(12,14,22,1) 0%, rgba(12,14,22,0.2) 100%)' }} />
        <div style={{ position: 'absolute', bottom: 10, left: 14, right: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <h3 style={{ color: 'white', fontSize: 16, fontWeight: 800, margin: 0, fontFamily: 'var(--font-display)', letterSpacing: '-0.3px' }}>
            {event.title}
          </h3>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 20, background: 'rgba(0,0,0,0.62)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)', color: cfg.color, fontSize: 10, fontWeight: 700, flexShrink: 0, marginLeft: 8 }}>
            {cfg.icon} {cfg.label}
          </span>
        </div>
      </div>

      <div style={{ padding: '12px 14px' }}>
        {/* Event info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#6B7280', fontSize: 12 }}>
            <Calendar size={11} color="#1E5EFF" />
            {fmtDate(event.date_start)} · {fmtTime(event.date_start)}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#6B7280', fontSize: 12 }}>
            <MapPin size={11} color="#1E5EFF" />
            {event.secret_venue && !isConfirmed
              ? <span style={{ color: '#FFC745' }}>Secret venue</span>
              : (event.venue_name ?? 'TBA')}
          </span>
        </div>

        {/* Status info blurb */}
        <div style={{ padding: '8px 10px', background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 10, marginBottom: 12 }}>
          <p style={{ color: cfg.color, fontSize: 12, margin: 0, lineHeight: 1.4 }}>{cfg.info}</p>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8 }}>
          {displayStatus === 'eoi_approved' && (
            <Link href="/guest/tikkit" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px', border: 'none', borderRadius: 12, background: '#EF4444', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer', textDecoration: 'none', fontFamily: 'var(--font-body)' }}>
              <CreditCard size={13} /> Pay Now
            </Link>
          )}
          {isConfirmed && !past && (
            <Link href="/guest/tikkit" style={{ flex: 1, padding: '10px', borderRadius: 12, background: 'rgba(30,94,255,0.15)', border: '1px solid rgba(30,94,255,0.25)', color: '#818CF8', fontSize: 13, fontWeight: 700, cursor: 'pointer', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
              <Ticket size={13} /> View Ticket
            </Link>
          )}
          {displayStatus === 'payment_pending' && reg.payment_screenshot_url && (
            <div style={{ flex: 1, padding: '10px', borderRadius: 12, background: 'rgba(129,140,248,0.08)', border: '1px solid rgba(129,140,248,0.15)', color: '#818CF8', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
              <CheckCircle size={13} /> Screenshot sent
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── Main ───────────────────────────────────────────────────────── */
export default function MyEventsClient({ registrations }: { registrations: Registration[] }) {
  const [filter, setFilter] = useState<'all' | 'active' | 'pending' | 'past'>('all')
  const [payTarget, setPayTarget] = useState<Registration | null>(null)
  const [successMsg, setSuccessMsg] = useState(false)

  const filtered = registrations.filter(r => {
    if (!r.event) return false
    const past = isPast(r.event.date_start)
    const ds = resolveStatus(r.status, r.payment_status)
    if (filter === 'active')  return (ds === 'confirmed' || ds === 'registered') && !past
    if (filter === 'pending') return ['eoi_submitted', 'eoi_approved', 'payment_pending'].includes(ds)
    if (filter === 'past')    return past
    return true
  })

  const tabs: { key: typeof filter; label: string }[] = [
    { key: 'all',     label: 'All'     },
    { key: 'active',  label: 'Active'  },
    { key: 'pending', label: 'Pending' },
    { key: 'past',    label: 'Past'    },
  ]

  return (
    <>
      {successMsg && (
        <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 999, padding: '12px 20px', background: '#10B981', borderRadius: 14, color: 'white', fontSize: 14, fontWeight: 700, boxShadow: '0 8px 24px rgba(16,185,129,0.4)', animation: 'revealUp 0.3s ease', whiteSpace: 'nowrap' }}>
          ✓ Payment screenshot submitted!
        </div>
      )}

      <div style={{ padding: '12px 16px 0' }}>
        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              style={{
                flexShrink: 0, padding: '7px 14px', borderRadius: 20,
                border: `1px solid ${filter === t.key ? '#1E5EFF' : 'rgba(255,255,255,0.08)'}`,
                background: filter === t.key ? 'rgba(30,94,255,0.15)' : 'var(--guest-surface)',
                color: filter === t.key ? '#818CF8' : '#6B7280',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                fontFamily: 'var(--font-body)', transition: 'all 0.15s',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Cards */}
        {filtered.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map(r => <RegCard key={r.id} reg={r} onPay={setPayTarget} />)}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '64px 0', color: '#6B7280' }}>
            <Calendar size={40} color="#4B5563" style={{ opacity: 0.3, marginBottom: 14 }} />
            <p style={{ fontSize: 15, fontWeight: 600, color: '#9CA3AF', margin: '0 0 8px', fontFamily: 'var(--font-display)' }}>No events here</p>
            <p style={{ fontSize: 13, margin: '0 0 24px', color: '#6B7280' }}>Events you register for will appear here.</p>
            <Link href="/guest/explore" style={{ display: 'inline-block', padding: '10px 20px', borderRadius: 12, background: '#1E5EFF', color: 'white', textDecoration: 'none', fontSize: 14, fontWeight: 700 }}>
              Explore Events
            </Link>
          </div>
        )}
      </div>

      {payTarget && (
        <PaymentSheet
          registration={payTarget}
          onClose={() => setPayTarget(null)}
          onSuccess={() => {
            setPayTarget(null)
            setSuccessMsg(true)
            setTimeout(() => setSuccessMsg(false), 3000)
          }}
        />
      )}
    </>
  )
}
