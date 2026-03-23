'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  Ticket, Clock, CheckCircle, AlertCircle, Lock,
  MapPin, Calendar, Upload, X, FileImage, Loader,
  Award, Zap, Star, Flame, CreditCard, Heart,
} from 'lucide-react'
import QRCode from 'qrcode'
import { submitPaymentScreenshot } from '@/app/actions/guestPaymentActions'
import { toggleEventFavourite } from '@/app/actions/eventFavouriteActions'
import { getCreditTier } from '@/lib/creditUtils'

/* ─── Types ──────────────────────────────────────────────────────── */
type EventInfo = {
  id: string; slug?: string | null; title: string
  date_start: string; date_end: string | null
  venue_name: string | null; secret_venue: boolean
  venue_reveal_at: string | null; cover_image_url: string | null
  ticket_price: number | null; registration_mode: string
}
type Pass = {
  id: string; pass_type: string; issued_at: string
  event_title: string; was_vip: boolean
}
type Registration = {
  id: string; status: string; payment_status?: string; payment_accounts?: any[]
  payment_screenshot_url: string | null
  created_at: string
  ticket_days: string[] | null
  event: EventInfo | null
  pass: Pass | null
}
type FavEvent = {
  id: string; slug?: string | null; title: string
  date_start: string
  cover_image_url: string | null
  venue_name: string | null
  ticket_price: number | null
}

/* ─── Helpers ────────────────────────────────────────────────────── */
const GRADIENTS = [
  'linear-gradient(135deg,#0F2027,#2C5364)',
  'linear-gradient(135deg,#1a1a2e,#0f3460)',
  'linear-gradient(135deg,#200122,#6f0000)',
  'linear-gradient(135deg,#0d0d0d,#1a3a1a)',
  'linear-gradient(135deg,#1f0033,#2d0050)',
  'linear-gradient(135deg,#001233,#023e8a)',
]
function grad(id: string) { return GRADIENTS[id.charCodeAt(0) % GRADIENTS.length] }

function fmtDate(iso: string) {
  const d = new Date(iso)
  const today = new Date(); const tmrw = new Date(); tmrw.setDate(today.getDate() + 1)
  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === tmrw.toDateString()) return 'Tomorrow'
  return d.toLocaleDateString('en-PK', { weekday: 'short', day: 'numeric', month: 'short' })
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', hour12: true })
}

/* ─── Status config ──────────────────────────────────────────────── */
const STATUS: Record<string, { label: string; color: string; bg: string; border: string }> = {
  registered:      { label: 'Registered',      color: '#10B981', bg: 'rgba(16,185,129,0.1)',   border: 'rgba(16,185,129,0.2)'   },
  eoi_submitted:   { label: 'Pending Review',  color: '#EAB308', bg: 'rgba(234,179,8,0.1)',    border: 'rgba(234,179,8,0.2)'    },
  eoi_approved:    { label: 'Pay Now',         color: '#EF4444', bg: 'rgba(239,68,68,0.1)',    border: 'rgba(239,68,68,0.2)'    },
  payment_pending: { label: 'Verifying',       color: '#818CF8', bg: 'rgba(129,140,248,0.1)',  border: 'rgba(129,140,248,0.2)'  },
  confirmed:       { label: 'Confirmed',       color: '#10B981', bg: 'rgba(16,185,129,0.1)',   border: 'rgba(16,185,129,0.2)'   },
  rejected:        { label: 'Not Approved',    color: '#4B5563', bg: 'rgba(75,85,99,0.1)',     border: 'rgba(75,85,99,0.15)'    },
  attended:        { label: 'Attended',        color: '#818CF8', bg: 'rgba(129,140,248,0.1)',  border: 'rgba(129,140,248,0.2)'  },
  no_show:         { label: 'No Show',         color: '#EF4444', bg: 'rgba(239,68,68,0.1)',    border: 'rgba(239,68,68,0.2)'    },
  refunded:        { label: 'Refunded',        color: '#6B7280', bg: 'rgba(107,114,128,0.1)',  border: 'rgba(107,114,128,0.15)' },
}

/* ─── Confetti ───────────────────────────────────────────────────── */
function Confetti({ active }: { active: boolean }) {
  if (!active) return null
  const colors = ['#1E5EFF','#FFC745','#EF4444','#10B981','#A855F7','#fff']
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999, overflow: 'hidden' }}>
      {Array.from({ length: 60 }).map((_, i) => (
        <div key={i} style={{
          position: 'absolute', left: `${Math.random()*100}%`, top: '-8px',
          width: `${5+Math.random()*7}px`, height: `${5+Math.random()*7}px`,
          borderRadius: Math.random()>.5?'50%':'2px',
          background: colors[Math.floor(Math.random()*colors.length)],
          animation: `confettiFall ${1.5+Math.random()*2}s ease-in forwards`,
          animationDelay: `${Math.random()*0.6}s`,
        }} />
      ))}
    </div>
  )
}

/* ─── QR Modal popup ─────────────────────────────────────────────── */
function QRModal({ reg, guestName, onClose }: { reg: Registration; guestName: string; onClose: () => void }) {
  const ev = reg.event!
  const [qrSrc, setQrSrc] = useState('')
  const [bright, setBright] = useState(false)
  const ticketCode = `TIKKIT-${reg.id.replace(/-/g,'').slice(0,16).toUpperCase()}`

  useEffect(() => {
    QRCode.toDataURL(ticketCode, {
      width: 260, margin: 2,
      color: { dark: '#080A10', light: '#FFFFFF' },
      errorCorrectionLevel: 'H',
    }).then(setQrSrc)
  }, [ticketCode])

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(10px)' }}
      />

      {/* Card */}
      <div style={{
        position: 'relative', background: '#0E1018', borderRadius: 28,
        padding: '24px 20px 28px', border: '1px solid rgba(255,255,255,0.1)',
        width: '100%', maxWidth: 340,
        animation: 'revealUp 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        boxShadow: '0 24px 80px rgba(0,0,0,0.8)',
      }}>
        {/* Close */}
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 10, padding: 8, cursor: 'pointer', color: '#6B7280', display: 'flex' }}
        >
          <X size={15} />
        </button>

        {/* Header */}
        <div style={{ marginBottom: 20, paddingRight: 36 }}>
          <p style={{ color: '#10B981', fontSize: 10, fontWeight: 800, margin: '0 0 5px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            ✓ Your Ticket
          </p>
          <h3 style={{ color: 'white', fontSize: 19, fontWeight: 900, margin: '0 0 4px', fontFamily: 'var(--font-display)', letterSpacing: '-0.4px', lineHeight: 1.2 }}>
            {ev.title}
          </h3>
          <p style={{ color: '#6B7280', fontSize: 12, margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Calendar size={10} /> {fmtDate(ev.date_start)} · {fmtTime(ev.date_start)}
          </p>
        </div>

        {/* QR Code */}
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div
            onClick={() => setBright(b => !b)}
            style={{
              display: 'inline-block', padding: 14, borderRadius: 20,
              background: bright ? 'white' : '#F9FAFB',
              cursor: 'pointer',
              boxShadow: bright
                ? '0 0 40px rgba(255,255,255,0.25), 0 8px 32px rgba(0,0,0,0.5)'
                : '0 8px 32px rgba(0,0,0,0.5)',
              transition: 'all 0.25s ease',
            }}
          >
            {qrSrc
              ? <img src={qrSrc} alt="QR Code" style={{ width: 220, height: 220, display: 'block', borderRadius: 8 }} />
              : <div style={{ width: 220, height: 220, background: '#E5E7EB', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Loader size={24} color="#9CA3AF" style={{ animation: 'spin 1s linear infinite' }} />
                </div>
            }
          </div>
          <p style={{ color: '#6B7280', fontSize: 11, margin: '10px 0 3px' }}>
            Tap QR to boost brightness · Show at entry
          </p>
          <p style={{ color: '#4B5563', fontSize: 10, fontFamily: 'monospace', letterSpacing: '0.5px' }}>
            {ticketCode}
          </p>
        </div>

        {/* Guest chip */}
        <div style={{ padding: '10px 14px', background: 'rgba(30,94,255,0.07)', border: '1px solid rgba(30,94,255,0.15)', borderRadius: 14, textAlign: 'center' }}>
          <p style={{ color: '#6B7280', fontSize: 10, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Guest</p>
          <p style={{ color: 'white', fontSize: 15, fontWeight: 800, margin: 0, fontFamily: 'var(--font-display)' }}>{guestName}</p>
        </div>

        {/* Selected days for multi-day tickets */}
        {reg.ticket_days && reg.ticket_days.length > 0 && (
          <div style={{ marginTop: 10, padding: '10px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14 }}>
            <p style={{ color: '#4B5563', fontSize: 10, fontWeight: 700, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Valid for</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {reg.ticket_days.map(day => (
                <span key={day} style={{ padding: '3px 9px', borderRadius: 20, background: 'rgba(30,94,255,0.1)', border: '1px solid rgba(30,94,255,0.2)', color: '#818CF8', fontSize: 11, fontWeight: 600 }}>
                  {new Date(day + 'T12:00:00').toLocaleDateString('en-PK', { weekday: 'short', day: 'numeric', month: 'short' })}
                </span>
              ))}
            </div>
          </div>
        )}

        {ev.venue_name && !ev.secret_venue && (
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, color: '#6B7280', fontSize: 12 }}>
            <MapPin size={11} />
            <span>{ev.venue_name}</span>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Payment Sheet ──────────────────────────────────────────────── */
function PaymentSheet({ reg, onClose, onSuccess }: { reg: Registration; onClose: () => void; onSuccess: () => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const ref = useRef<HTMLInputElement>(null)
  const account = reg.payment_accounts?.[0]
  const ticketPrice = reg.event?.ticket_price

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.size > 8 * 1024 * 1024) { setErr('File too large (max 8MB)'); return }
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setErr(null)
  }

  const handleSubmit = async () => {
    if (!file) { setErr('Please attach your payment screenshot'); return }
    setBusy(true); setErr(null)
    try {
      const fd = new FormData()
      fd.append('registrationId', reg.id)
      fd.append('screenshot', file)
      const res = await submitPaymentScreenshot(fd)
      if (res?.error) { setErr(res.error); return }
      onSuccess()
    } catch { setErr('Upload failed. Try again.') }
    finally { setBusy(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(5px)' }} />
      <div style={{ position: 'relative', background: '#0E1018', borderRadius: '24px 24px 0 0', padding: '0 0 40px', border: '1px solid rgba(255,255,255,0.08)', animation: 'sheetSlideUp 0.35s cubic-bezier(0.34,1.56,0.64,1)', maxHeight: '92vh', overflowY: 'auto', width: '100%', maxWidth: 480 }}>

        {/* Handle */}
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.12)', margin: '14px auto 0' }} />

        {/* Header */}
        <div style={{ padding: '16px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
          <div>
            <h3 style={{ color: 'white', fontSize: 18, fontWeight: 900, margin: '0 0 3px', fontFamily: 'var(--font-display)' }}>Complete Payment</h3>
            <p style={{ color: '#6B7280', fontSize: 13, margin: 0 }}>{reg.event?.title}</p>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 8, cursor: 'pointer', color: '#6B7280', display: 'flex' }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: '16px 20px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Bank details */}
          {account && (
            <div style={{ padding: '14px 16px', borderRadius: 16, background: 'rgba(30,94,255,0.07)', border: '1px solid rgba(30,94,255,0.18)' }}>
              <p style={{ color: '#818CF8', fontSize: 11, fontWeight: 800, margin: '0 0 10px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Transfer Details</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ color: '#6B7280', fontSize: 12 }}>Amount</span>
                <span style={{ color: 'white', fontSize: 18, fontWeight: 900, fontFamily: 'var(--font-display)' }}>PKR {(ticketPrice ?? 0).toLocaleString('en-PK')}</span>
              </div>
              <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', marginBottom: 8 }} />
              {[
                { label: 'Bank',          value: account.bank_name || account.label },
                { label: 'Account #',     value: account.account_number },
                { label: 'Account Title', value: account.account_title },
              ].filter(r => r.value).map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ color: '#6B7280', fontSize: 12 }}>{row.label}</span>
                  <span style={{ color: 'white', fontSize: 12, fontWeight: 600 }}>{row.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Screenshot upload */}
          <div>
            <p style={{ color: '#6B7280', fontSize: 11, fontWeight: 700, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Upload Payment Screenshot</p>
            <input ref={ref} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />

            {preview ? (
              <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(16,185,129,0.25)' }}>
                <img src={preview} alt="Screenshot preview" style={{ width: '100%', maxHeight: 200, objectFit: 'cover', display: 'block' }} />
                <button
                  onClick={() => { setFile(null); setPreview(null) }}
                  style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: 5, cursor: 'pointer', color: 'white', display: 'flex' }}
                >
                  <X size={14} />
                </button>
                <div style={{ position: 'absolute', bottom: 8, left: 8 }}>
                  <span style={{ background: 'rgba(16,185,129,0.9)', color: 'white', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6 }}>✓ Ready to submit</span>
                </div>
              </div>
            ) : (
              <button
                onClick={() => ref.current?.click()}
                style={{ width: '100%', padding: '20px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '2px dashed rgba(255,255,255,0.1)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, transition: 'all 0.2s' }}
              >
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(30,94,255,0.1)', border: '1px solid rgba(30,94,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileImage size={20} color="#818CF8" />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ color: 'white', fontSize: 13, fontWeight: 700, margin: '0 0 2px', fontFamily: 'var(--font-display)' }}>Attach Screenshot</p>
                  <p style={{ color: '#6B7280', fontSize: 11, margin: 0 }}>Tap to select from your gallery</p>
                </div>
              </button>
            )}
          </div>

          {/* Error */}
          {err && (
            <div style={{ display: 'flex', gap: 8, padding: '10px 12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 12 }}>
              <AlertCircle size={14} color="#F87171" style={{ flexShrink: 0, marginTop: 1 }} />
              <span style={{ color: '#FCA5A5', fontSize: 13 }}>{err}</span>
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={busy || !file}
            style={{ width: '100%', padding: '14px', borderRadius: 14, background: busy || !file ? 'rgba(255,255,255,0.06)' : '#EF4444', border: 'none', color: busy || !file ? '#6B7280' : 'white', fontSize: 15, fontWeight: 800, cursor: busy || !file ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s' }}
          >
            {busy
              ? <><Loader size={16} className="animate-spin" /> Submitting…</>
              : <><Upload size={16} /> Submit Payment Screenshot</>
            }
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Pass chip icon map ─────────────────────────────────────────── */
const PASS_ICONS: Record<string, React.ReactNode> = {
  attendance:  <Ticket size={14} />,
  early_bird:  <Zap    size={14} />,
  vip:         <Award  size={14} />,
  first_timer: <Star   size={14} />,
  streak_3:    <Flame  size={14} />,
  streak_5:    <Zap    size={14} />,
}
const PASS_CFG: Record<string, { color: string; bg: string; label: string }> = {
  attendance:  { color: '#9CA3AF', bg: 'rgba(156,163,175,0.1)', label: 'Attendance'  },
  early_bird:  { color: '#34D399', bg: 'rgba(52,211,153,0.1)',  label: 'Early Bird'  },
  vip:         { color: '#FFC745', bg: 'rgba(255,199,69,0.1)',  label: 'VIP'         },
  first_timer: { color: '#60A5FA', bg: 'rgba(96,165,250,0.1)',  label: 'First Timer' },
  streak_3:    { color: '#F97316', bg: 'rgba(249,115,22,0.1)',  label: '3× Streak'   },
  streak_5:    { color: '#A855F7', bg: 'rgba(168,85,247,0.1)',  label: '5× Streak'   },
}

/* ─── Registration Card ──────────────────────────────────────────── */
function RegCard({ reg, guestName, creditScore, onPay, onViewTicket }: {
  reg: Registration
  guestName: string
  creditScore: number
  onPay: (r: Registration) => void
  onViewTicket: (r: Registration) => void
}) {
  const ev = reg.event
  if (!ev) return null

  const isPast = new Date(ev.date_start) < new Date()
  const isPaidEvent = (ev.ticket_price ?? 0) > 0
  const paymentStatus = (reg as any).payment_status ?? 'not_required'

  // Payment flow states
  const isPayNow     = reg.status === 'approved' && isPaidEvent && (paymentStatus === 'not_required' || paymentStatus === 'pending')
  const isPayPending = reg.status === 'approved' && isPaidEvent && paymentStatus === 'submitted'
  const isConfirmed  = ['confirmed', 'registered'].includes(reg.status)
    || (reg.status === 'approved' && (!isPaidEvent || paymentStatus === 'confirmed'))

  // Map actual DB status values → display key
  // For past events: show the real outcome (attended / no_show / refunded).
  // If the system hasn't updated the status yet, a past confirmed → "Attended".
  const statusKey = isPast
    ? reg.status === 'no_show'   ? 'no_show'
    : reg.status === 'refunded'  ? 'refunded'
    : reg.status === 'attended'  ? 'attended'
    : isConfirmed                ? 'attended'   // confirmed but event is past → attended
    : reg.status
    : isPayNow                   ? 'eoi_approved'
    : isPayPending               ? 'payment_pending'
    : reg.status === 'pending'   ? 'eoi_submitted'
    : isConfirmed                ? 'confirmed'
    : reg.status
  const st = STATUS[statusKey] ?? STATUS.registered
  const pass = reg.pass
  const passCfg = pass ? (PASS_CFG[pass.pass_type] ?? PASS_CFG.attendance) : null
  const passIcon = pass ? (PASS_ICONS[pass.pass_type] ?? PASS_ICONS.attendance) : null

  return (
    <div style={{ background: '#0E1018', border: `1px solid ${isPast ? 'rgba(255,255,255,0.04)' : st.border}`, borderRadius: 20, overflow: 'hidden', opacity: isPast && !pass ? 0.5 : 1, transition: 'opacity 0.2s' }}>

      {/* Cover — tap to view event details (upcoming only) */}
      {(() => {
        const coverInner = (
          <div style={{ height: 100, background: ev.cover_image_url ? `url(${ev.cover_image_url}) center/cover` : grad(ev.id), position: 'relative' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(14,16,24,1) 0%, rgba(14,16,24,0.1) 100%)' }} />

            {/* Pass badge */}
            {pass && passCfg && (
              <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, background: 'rgba(8,10,18,0.92)', border: `1px solid ${passCfg.color}40` }}>
                <span style={{ color: passCfg.color, display: 'flex' }}>{passIcon}</span>
                <span style={{ color: passCfg.color, fontSize: 10, fontWeight: 700 }}>Pass Earned</span>
              </div>
            )}

            {/* Status pill */}
            <div style={{ position: 'absolute', top: 10, right: 10 }}>
              <span style={{ padding: '4px 10px', borderRadius: 20, background: 'rgba(8,10,18,0.92)', border: `1px solid ${st.color}40`, color: st.color, fontSize: 10, fontWeight: 800 }}>
                {st.label}
              </span>
            </div>

            {/* Title */}
            <div style={{ position: 'absolute', bottom: 10, left: 14, right: 14 }}>
              <h3 style={{ color: 'white', fontSize: 16, fontWeight: 900, margin: 0, fontFamily: 'var(--font-display)', letterSpacing: '-0.3px', lineHeight: 1.2 }}>
                {ev.title}
              </h3>
            </div>
          </div>
        )
        return isPast
          ? <div style={{ display: 'block' }}>{coverInner}</div>
          : <Link href={`/guest/explore/${ev.slug || ev.id}`} style={{ textDecoration: 'none', display: 'block' }}>{coverInner}</Link>
      })()}

      {/* Info row */}
      <div style={{ padding: '10px 14px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#6B7280', fontSize: 11 }}>
            <Calendar size={10} />{fmtDate(ev.date_start)} · {fmtTime(ev.date_start)}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#6B7280', fontSize: 11 }}>
            <MapPin size={10} />
            {ev.secret_venue
              ? isConfirmed
                ? <span style={{ color: '#10B981' }}>{ev.venue_name ?? 'TBA'}</span>
                : <span style={{ color: '#FFC745' }}><Lock size={9} style={{ display: 'inline', marginRight: 3 }} />Secret Venue</span>
              : ev.venue_name ?? 'TBA'
            }
          </span>
        </div>

        {/* Verifying badge */}
        {isPayPending && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 10, background: 'rgba(129,140,248,0.1)', border: '1px solid rgba(129,140,248,0.2)', color: '#818CF8', fontSize: 11, fontWeight: 700 }}>
            <Clock size={11} /> Verifying
          </div>
        )}
      </div>

      {/* ── Primary action button ── */}
      {!isPast && (isConfirmed || isPayNow) && (
        <div style={{ padding: '12px 14px 14px' }}>
          {isConfirmed && (
            <button
              onClick={() => onViewTicket(reg)}
              style={{
                width: '100%', padding: '11px', borderRadius: 14,
                background: 'linear-gradient(135deg, rgba(16,185,129,0.18) 0%, rgba(16,185,129,0.10) 100%)',
                border: '1px solid rgba(16,185,129,0.3)',
                color: '#10B981', fontSize: 13, fontWeight: 800,
                cursor: 'pointer', fontFamily: 'var(--font-body)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                transition: 'all 0.15s',
              }}
            >
              <Ticket size={14} /> View Ticket
            </button>
          )}

          {isPayNow && (
            <button
              onClick={() => onPay(reg)}
              style={{
                width: '100%', padding: '11px', borderRadius: 14,
                background: 'linear-gradient(135deg, rgba(239,68,68,0.20) 0%, rgba(239,68,68,0.12) 100%)',
                border: '1px solid rgba(239,68,68,0.35)',
                color: '#EF4444', fontSize: 13, fontWeight: 800,
                cursor: 'pointer', fontFamily: 'var(--font-body)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                transition: 'all 0.15s',
              }}
            >
              <CreditCard size={14} />
              Pay Now
              {ev.ticket_price && ev.ticket_price > 0 && (
                <span style={{ marginLeft: 2, opacity: 0.8, fontWeight: 700 }}>
                  · PKR {ev.ticket_price.toLocaleString('en-PK')}
                </span>
              )}
            </button>
          )}

        </div>
      )}

      {/* Spacer when no action button */}
      {(isPast || (!isConfirmed && !isPayNow)) && (
        <div style={{ height: isPayPending ? 10 : 14 }} />
      )}

      {/* Pass details for past events */}
      {isPast && pass && passCfg && (
        <div style={{ padding: '0 14px 14px', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 12, background: passCfg.bg, border: `1px solid ${passCfg.color}25` }}>
            <span style={{ color: passCfg.color, display: 'flex' }}>{passIcon}</span>
            <div>
              <p style={{ color: passCfg.color, fontSize: 12, fontWeight: 700, margin: '0 0 1px' }}>Collectible Pass</p>
              <p style={{ color: '#9CA3AF', fontSize: 11, margin: 0 }}>{passCfg.label}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Fav Card ───────────────────────────────────────────────────── */
function FavCard({ event, onRemove }: { event: FavEvent; onRemove: (id: string) => void }) {
  return (
    <div style={{ position: 'relative', background: '#0E1018', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, overflow: 'hidden' }}>
      <Link href={`/guest/explore/${event.slug || event.id}`} style={{ textDecoration: 'none', display: 'block' }}>
        {/* Cover */}
        <div style={{ height: 80, background: event.cover_image_url ? `url(${event.cover_image_url}) center/cover` : grad(event.id), position: 'relative' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(14,16,24,1) 0%, transparent 60%)' }} />
          <div style={{ position: 'absolute', bottom: 10, left: 14, right: 44 }}>
            <h3 style={{ color: 'white', fontSize: 14, fontWeight: 900, margin: 0, fontFamily: 'var(--font-display)', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {event.title}
            </h3>
          </div>
        </div>
        {/* Meta row */}
        <div style={{ padding: '8px 14px 12px', display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#6B7280', fontSize: 11 }}>
            <Calendar size={10} />{fmtDate(event.date_start)} · {fmtTime(event.date_start)}
          </span>
          {event.venue_name && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#6B7280', fontSize: 11 }}>
              <MapPin size={10} />{event.venue_name}
            </span>
          )}
          {(event.ticket_price ?? 0) === 0
            ? <span style={{ padding: '2px 7px', borderRadius: 5, background: 'rgba(16,185,129,0.1)', color: '#10B981', fontSize: 9, fontWeight: 800 }}>FREE</span>
            : <span style={{ color: '#6B7280', fontSize: 11, fontWeight: 700 }}>PKR {event.ticket_price!.toLocaleString('en-PK')}</span>
          }
        </div>
      </Link>

      {/* Remove heart */}
      <button
        onClick={() => onRemove(event.id)}
        style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: 6, cursor: 'pointer', display: 'flex', color: '#EF4444' }}
      >
        <Heart size={13} fill="#EF4444" />
      </button>
    </div>
  )
}

/* ─── Main ───────────────────────────────────────────────────────── */
export default function MyTikkitClient({ registrations, guestName, creditScore, favourites: initialFavourites = [] }: {
  registrations: Registration[]; guestName: string; creditScore: number
  favourites?: FavEvent[]
}) {
  const [payTarget, setPayTarget] = useState<Registration | null>(null)
  const [ticketTarget, setTicketTarget] = useState<Registration | null>(null)
  const [successMsg, setSuccessMsg] = useState(false)
  const [tab, setTab] = useState<'upcoming' | 'past' | 'saved'>('upcoming')
  const [favEvents, setFavEvents] = useState<FavEvent[]>(initialFavourites)

  const upcoming = registrations.filter(r => r.event && new Date(r.event.date_start) >= new Date() && r.status !== 'rejected')
  const past = registrations.filter(r => r.event && new Date(r.event.date_start) < new Date())

  const handleRemoveFav = async (eventId: string) => {
    setFavEvents(prev => prev.filter(e => e.id !== eventId))
    await toggleEventFavourite(eventId)
  }

  const tier = getCreditTier(creditScore)
  const current = tab === 'upcoming' ? upcoming : past

  return (
    <>
      <Confetti active={successMsg} />

      {successMsg && (
        <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 999, padding: '11px 20px', background: '#10B981', borderRadius: 14, color: 'white', fontSize: 14, fontWeight: 700, boxShadow: '0 8px 24px rgba(16,185,129,0.4)', animation: 'revealUp 0.3s ease', whiteSpace: 'nowrap' }}>
          ✓ Screenshot submitted!
        </div>
      )}

      {/* Credit chip */}
      <div style={{ padding: '14px 16px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ color: 'white', fontSize: 20, fontWeight: 900, margin: 0, fontFamily: 'var(--font-display)', letterSpacing: '-0.5px' }}>My Tikkit</h2>
        <Link href="/guest/profile" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20, background: tier.bg, border: `1px solid ${tier.border}`, textDecoration: 'none' }}>
          <Zap size={11} color={tier.color} />
          <span style={{ color: tier.color, fontSize: 11, fontWeight: 800 }}>{creditScore} · {tier.label}</span>
        </Link>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, padding: '14px 16px 0' }}>
        {([
          { key: 'upcoming', label: `Upcoming${upcoming.length > 0 ? ` (${upcoming.length})` : ''}` },
          { key: 'past',     label: `Past${past.length > 0 ? ` (${past.length})` : ''}` },
          { key: 'saved',    label: favEvents.length > 0 ? `❤️ Saved (${favEvents.length})` : '❤️ Saved' },
        ] as const).map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)} style={{ flex: 1, padding: '9px 0', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', borderBottom: `2px solid ${tab === key ? '#1E5EFF' : 'rgba(255,255,255,0.06)'}`, color: tab === key ? 'white' : '#6B7280', fontSize: 12, fontWeight: tab === key ? 700 : 500, transition: 'all 0.15s' }}>
            {label}
          </button>
        ))}
      </div>

      {/* Cards */}
      <div style={{ padding: '14px 16px 0', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 12 }}>
        {tab === 'saved' ? (
          favEvents.length > 0
            ? favEvents.map(ev => <FavCard key={ev.id} event={ev} onRemove={handleRemoveFav} />)
            : (
              <div style={{ padding: '64px 0', textAlign: 'center', animation: 'revealUp 0.3s ease', gridColumn: '1 / -1' }}>
                <Heart size={36} color="#4B5563" style={{ marginBottom: 14, opacity: 0.4 }} />
                <p style={{ color: '#9CA3AF', fontSize: 14, fontWeight: 700, margin: '0 0 6px', fontFamily: 'var(--font-display)' }}>No saved events</p>
                <p style={{ color: '#6B7280', fontSize: 13, margin: '0 0 20px' }}>Tap the ❤️ on any event to save it here.</p>
                <Link href="/guest/explore" style={{ display: 'inline-block', padding: '10px 20px', borderRadius: 12, background: '#1E5EFF', color: 'white', textDecoration: 'none', fontSize: 13, fontWeight: 700 }}>
                  Explore Events
                </Link>
              </div>
            )
        ) : current.length > 0
          ? current.map(r => (
              <RegCard
                key={r.id}
                reg={r}
                guestName={guestName}
                creditScore={creditScore}
                onPay={setPayTarget}
                onViewTicket={setTicketTarget}
              />
            ))
          : (
            <div style={{ padding: '64px 0', textAlign: 'center', animation: 'revealUp 0.3s ease', gridColumn: '1 / -1' }}>
              {tab === 'upcoming'
                ? <>
                    <Ticket size={36} color="#4B5563" style={{ marginBottom: 14, opacity: 0.4 }} />
                    <p style={{ color: '#9CA3AF', fontSize: 14, fontWeight: 700, margin: '0 0 6px', fontFamily: 'var(--font-display)' }}>No upcoming events</p>
                    <p style={{ color: '#6B7280', fontSize: 13, margin: '0 0 20px' }}>Register for events to see them here.</p>
                    <Link href="/guest/explore" style={{ display: 'inline-block', padding: '10px 20px', borderRadius: 12, background: '#1E5EFF', color: 'white', textDecoration: 'none', fontSize: 13, fontWeight: 700 }}>
                      Explore Events
                    </Link>
                  </>
                : <>
                    <Award size={36} color="#4B5563" style={{ marginBottom: 14, opacity: 0.4 }} />
                    <p style={{ color: '#9CA3AF', fontSize: 14, fontWeight: 700, margin: '0 0 6px', fontFamily: 'var(--font-display)' }}>No past events yet</p>
                    <p style={{ color: '#6B7280', fontSize: 13, margin: 0 }}>Events you've attended will appear here with your collectible passes.</p>
                  </>
              }
            </div>
          )
        }
      </div>
      <div style={{ height: 20 }} />

      {/* QR Ticket popup */}
      {ticketTarget && (
        <QRModal
          reg={ticketTarget}
          guestName={guestName}
          onClose={() => setTicketTarget(null)}
        />
      )}

      {/* Payment popup */}
      {payTarget && (
        <PaymentSheet
          reg={payTarget}
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
