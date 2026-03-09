'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  Ticket, Clock, CheckCircle, AlertCircle, Lock,
  MapPin, Calendar, Upload, X, FileImage, Loader,
  ChevronDown, ChevronUp, Award, Zap, Star, Flame,
  CreditCard,
} from 'lucide-react'
import QRCode from 'qrcode'
import { submitPaymentScreenshot } from '@/app/actions/guestPaymentActions'
import { getCreditTier } from '@/lib/creditUtils'

/* ─── Types ──────────────────────────────────────────────────────── */
type EventInfo = {
  id: string; title: string
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
  event: EventInfo | null
  pass: Pass | null
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
function msUntil(iso: string) { return new Date(iso).getTime() - Date.now() }
function fmtCountdown(ms: number) {
  if (ms <= 0) return null
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  if (h > 48) return `${Math.floor(h/24)}d ${h%24}h`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m ${s}s`
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

/* ─── QR display ─────────────────────────────────────────────────── */
function QRDisplay({ registrationId, eventDate, guestName }: { registrationId: string; eventDate: string; guestName: string }) {
  const [qrSrc, setQrSrc] = useState('')
  const [bright, setBright] = useState(false)
  const ticketCode = `TIKKIT-${registrationId.replace(/-/g,'').slice(0,16).toUpperCase()}`

  // Generate QR immediately — available as soon as approved/confirmed
  useEffect(() => {
    QRCode.toDataURL(ticketCode, { width: 200, margin: 2, color: { dark: '#080A10', light: '#FFFFFF' }, errorCorrectionLevel: 'H' })
      .then(setQrSrc)
  }, [ticketCode])

  return (
    <div style={{ textAlign: 'center', padding: '16px 0 8px' }}>
      <div onClick={() => setBright(b => !b)} style={{ display: 'inline-block', padding: 10, borderRadius: 14, background: bright ? 'white' : '#F9FAFB', cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,0,0,0.4)', transition: 'background 0.2s' }}>
        {qrSrc
          ? <img src={qrSrc} alt="QR" style={{ width: 180, height: 180, display: 'block', borderRadius: 8 }} />
          : <div style={{ width: 180, height: 180, background: '#E5E7EB', borderRadius: 8 }} />
        }
      </div>
      <p style={{ color: '#9CA3AF', fontSize: 11, marginTop: 8 }}>Tap to boost brightness · Show at entry</p>
      <p style={{ color: '#6B7280', fontSize: 10, fontFamily: 'monospace', marginTop: 4 }}>{ticketCode.slice(0,20)}</p>
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

  const handleFile = (f: File) => {
    if (!f.type.startsWith('image/')) { setErr('Please upload an image'); return }
    if (f.size > 8*1024*1024) { setErr('Max 8MB'); return }
    setErr(null); setFile(f)
    const r = new FileReader(); r.onload = e => setPreview(e.target?.result as string); r.readAsDataURL(f)
  }
  const handleSubmit = async () => {
    if (!file) return
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
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(5px)' }} />
      <div style={{ position: 'relative', background: '#0E1018', borderRadius: '24px 24px 0 0', padding: '0 20px 40px', border: '1px solid rgba(255,255,255,0.08)', animation: 'sheetSlideUp 0.35s cubic-bezier(0.34,1.56,0.64,1)', maxHeight: '88vh', overflowY: 'auto' }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.12)', margin: '14px auto 16px' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ color: 'white', fontSize: 17, fontWeight: 900, margin: 0, fontFamily: 'var(--font-display)' }}>Submit Payment</h3>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 10, padding: 8, cursor: 'pointer', color: '#6B7280', display: 'flex' }}><X size={15} /></button>
        </div>
        {reg.event?.ticket_price && reg.event.ticket_price > 0 && (
          <div style={{ padding: '11px 14px', background: 'rgba(30,94,255,0.07)', border: '1px solid rgba(30,94,255,0.15)', borderRadius: 12, marginBottom: 12 }}>
            <p style={{ color: '#6B7280', fontSize: 11, margin: '0 0 2px' }}>Amount due</p>
            <p style={{ color: 'white', fontSize: 22, fontWeight: 900, margin: 0, fontFamily: 'var(--font-display)' }}>PKR {reg.event.ticket_price.toLocaleString('en-PK')}</p>
          </div>
        )}
        {reg.payment_accounts && reg.payment_accounts.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <p style={{ color: '#6B7280', fontSize: 11, margin: '0 0 8px', fontWeight: 600, letterSpacing: '0.5px' }}>SEND PAYMENT TO</p>
            {reg.payment_accounts.map((acc: any) => (
              <div key={acc.id} style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, marginBottom: 8 }}>
                <p style={{ color: 'white', fontSize: 13, fontWeight: 700, margin: '0 0 3px', fontFamily: 'var(--font-display)' }}>{acc.label}</p>
                <p style={{ color: '#9CA3AF', fontSize: 12, margin: '0 0 2px' }}>{acc.account_title} · {acc.account_number}</p>
                {acc.instructions && <p style={{ color: '#6B7280', fontSize: 11, margin: 0, fontStyle: 'italic' }}>{acc.instructions}</p>}
              </div>
            ))}
          </div>
        )}
        <div onClick={() => ref.current?.click()} style={{ border: `2px dashed ${preview ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 16, padding: preview ? 0 : '28px 20px', textAlign: 'center', cursor: 'pointer', marginBottom: 14, overflow: 'hidden' }}>
          {preview
            ? <div style={{ position: 'relative' }}><img src={preview} style={{ width: '100%', maxHeight: 240, objectFit: 'cover', display: 'block', borderRadius: 14 }} /><button onClick={e => { e.stopPropagation(); setFile(null); setPreview(null) }} style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: 8, padding: 6, cursor: 'pointer', color: 'white', display: 'flex' }}><X size={13} /></button></div>
            : <><FileImage size={28} color="#6B7280" style={{ marginBottom: 8 }} /><p style={{ color: '#6B7280', fontSize: 13, margin: 0 }}>Tap to upload payment screenshot</p></>
          }
        </div>
        <input ref={ref} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
        {err && <div style={{ padding: '9px 12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 10, marginBottom: 12, color: '#FCA5A5', fontSize: 13 }}>{err}</div>}
        <button onClick={handleSubmit} disabled={!file||busy} style={{ width: '100%', padding: '13px', border: 'none', borderRadius: 14, background: !file||busy ? 'rgba(255,255,255,0.06)' : '#1E5EFF', color: !file||busy ? '#6B7280' : 'white', fontSize: 15, fontWeight: 700, cursor: !file||busy ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          {busy ? <><Loader size={15} className="animate-spin" />Uploading…</> : <><Upload size={15} />Submit Screenshot</>}
        </button>
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
function RegCard({ reg, guestName, creditScore, onPay }: {
  reg: Registration; guestName: string; creditScore: number; onPay: (r: Registration) => void
}) {
  const [expanded, setExpanded] = useState(false)
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
  const statusKey = isPayNow    ? 'eoi_approved'
    : isPayPending              ? 'payment_pending'
    : reg.status === 'pending'  ? 'eoi_submitted'   // EOI submitted, awaiting review
    : isConfirmed               ? 'confirmed'        // approved + free, or approved + paid confirmed
    : reg.status                                     // 'rejected', etc.
  const st = STATUS[statusKey] ?? STATUS.registered
  const pass = reg.pass
  const passCfg = pass ? (PASS_CFG[pass.pass_type] ?? PASS_CFG.attendance) : null
  const passIcon = pass ? (PASS_ICONS[pass.pass_type] ?? PASS_ICONS.attendance) : null


  return (
    <div style={{ background: '#0E1018', border: `1px solid ${isPast ? 'rgba(255,255,255,0.04)' : st.border}`, borderRadius: 20, overflow: 'hidden', opacity: isPast && !pass ? 0.5 : 1, transition: 'opacity 0.2s' }}>
      {/* Cover */}
      <Link href={`/guest/explore/${ev.id}`} style={{ textDecoration: 'none', display: 'block' }}>
        <div style={{ height: 100, background: ev.cover_image_url ? `url(${ev.cover_image_url}) center/cover` : grad(ev.id), position: 'relative' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(14,16,24,1) 0%, rgba(14,16,24,0.1) 100%)' }} />

          {/* Pass badge if earned */}
          {pass && passCfg && (
            <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', border: `1px solid ${passCfg.color}30` }}>
              <span style={{ color: passCfg.color, display: 'flex' }}>{passIcon}</span>
              <span style={{ color: passCfg.color, fontSize: 10, fontWeight: 700 }}>Pass Earned</span>
            </div>
          )}

          {/* Status pill */}
          <div style={{ position: 'absolute', top: 10, right: 10 }}>
            <span style={{ padding: '4px 10px', borderRadius: 20, background: st.bg, border: `1px solid ${st.border}`, color: st.color, fontSize: 10, fontWeight: 800 }}>
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
      </Link>

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

        {/* Expand toggle for QR */}
        {isConfirmed && !isPast && (
          <button onClick={() => setExpanded(e => !e)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 10, background: expanded ? 'rgba(30,94,255,0.15)' : 'rgba(255,255,255,0.05)', border: `1px solid ${expanded ? 'rgba(30,94,255,0.3)' : 'rgba(255,255,255,0.07)'}`, cursor: 'pointer', color: expanded ? '#818CF8' : '#9CA3AF', fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-body)', transition: 'all 0.15s' }}>
            <Ticket size={11} />
            {expanded ? 'Hide' : 'QR'}
            {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </button>
        )}

        {/* Pay Now button */}
        {isPayNow && (
          <button onClick={() => onPay(reg)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444', fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
            <CreditCard size={11} /> Pay Now
          </button>
        )}
        {isPayPending && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 10, background: 'rgba(129,140,248,0.1)', border: '1px solid rgba(129,140,248,0.2)', color: '#818CF8', fontSize: 11, fontWeight: 700 }}>
            <Clock size={11} /> Verifying
          </div>
        )}
      </div>

      {/* QR expanded */}
      {expanded && isConfirmed && !isPast && (
        <QRDisplay registrationId={reg.id} eventDate={ev.date_start} guestName={guestName} />
      )}

      {/* Pass details for past events */}
      {isPast && pass && passCfg && (
        <div style={{ padding: '10px 14px 14px', borderTop: '1px solid rgba(255,255,255,0.04)', marginTop: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 12, background: passCfg.bg, border: `1px solid ${passCfg.color}25` }}>
            <span style={{ color: passCfg.color, display: 'flex' }}>{passIcon}</span>
            <div>
              <p style={{ color: passCfg.color, fontSize: 12, fontWeight: 700, margin: '0 0 1px' }}>Collectible Pass</p>
              <p style={{ color: '#9CA3AF', fontSize: 11, margin: 0 }}>{passCfg.label}</p>
            </div>
          </div>
        </div>
      )}

      {/* Bottom padding */}
      {!expanded && !isPast && <div style={{ height: 14 }} />}
    </div>
  )
}

/* ─── Main ───────────────────────────────────────────────────────── */
export default function MyTikkitClient({ registrations, guestName, creditScore }: {
  registrations: Registration[]; guestName: string; creditScore: number
}) {
  const [payTarget, setPayTarget] = useState<Registration | null>(null)
  const [successMsg, setSuccessMsg] = useState(false)
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming')

  const upcoming = registrations.filter(r => r.event && new Date(r.event.date_start) >= new Date() && r.status !== 'rejected')
  const past = registrations.filter(r => r.event && new Date(r.event.date_start) < new Date())

  const tier = getCreditTier(creditScore)

  const current = tab === 'upcoming' ? upcoming : past

  return (
    <>
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
        {(['upcoming', 'past'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: '9px 0', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', borderBottom: `2px solid ${tab === t ? '#1E5EFF' : 'rgba(255,255,255,0.06)'}`, color: tab === t ? 'white' : '#6B7280', fontSize: 13, fontWeight: tab === t ? 700 : 500, transition: 'all 0.15s' }}>
            {t === 'upcoming' ? `Upcoming${upcoming.length > 0 ? ` (${upcoming.length})` : ''}` : `Past${past.length > 0 ? ` (${past.length})` : ''}`}
          </button>
        ))}
      </div>

      {/* Cards */}
      <div style={{ padding: '14px 16px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {current.length > 0
          ? current.map(r => (
              <RegCard key={r.id} reg={r} guestName={guestName} creditScore={creditScore} onPay={setPayTarget} />
            ))
          : (
            <div style={{ padding: '64px 0', textAlign: 'center', animation: 'revealUp 0.3s ease' }}>
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

      {payTarget && (
        <PaymentSheet reg={payTarget} onClose={() => setPayTarget(null)} onSuccess={() => { setPayTarget(null); setSuccessMsg(true); setTimeout(() => setSuccessMsg(false), 3000) }} />
      )}
    </>
  )
}
