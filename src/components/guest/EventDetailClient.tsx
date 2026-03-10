'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, MapPin, Calendar, Users, Lock, Clock,
  CheckCircle, AlertCircle, Upload,
  FileImage, X, Loader, Share2, Heart, ExternalLink,
  Ticket, CreditCard,
} from 'lucide-react'
import QRCode from 'qrcode'
import { registerForEvent, submitEOI } from '@/app/actions/eventRegistrationActions'
import { submitPaymentScreenshot } from '@/app/actions/guestPaymentActions'

/* ─── Types ──────────────────────────────────────────────────────── */
type PaymentAccount = {
  id: string; bank_name: string; account_title: string
  account_number: string; account_name: string
}
type Event = {
  id: string; title: string; description: string | null
  venue_name: string | null; venue_address: string | null
  secret_venue: boolean; venue_reveal_at: string | null
  date_start: string; date_end: string | null
  capacity: number | null; cover_image_url: string | null
  tags: string[] | null; ticket_price: number | null
  registration_mode: string; is_private: boolean
  organizer: { full_name: string | null; company_name: string | null; avatar_url?: string | null } | null
  registered_count: number
  payment_accounts: PaymentAccount[]
}
type ExistingReg = {
  id: string; status: string; payment_status: string | null
} | null

/* ─── Gradients ──────────────────────────────────────────────────── */
const GRADIENTS = [
  'linear-gradient(135deg,#0F2027,#203A43,#2C5364)',
  'linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)',
  'linear-gradient(135deg,#200122,#6f0000)',
  'linear-gradient(135deg,#0d0d0d,#1a3a1a,#0a2a0a)',
  'linear-gradient(135deg,#1f0033,#2d0050)',
  'linear-gradient(135deg,#001233,#023e8a)',
]
function getGradient(id: string) { return GRADIENTS[id.charCodeAt(0) % GRADIENTS.length] }

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
  const d = Math.floor(ms / 86400000)
  const h = Math.floor((ms % 86400000) / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m ${Math.floor((ms % 60000) / 1000)}s`
}
function daysUntil(iso: string) { return Math.ceil(msUntil(iso) / 86400000) }

/* ─── Registration status banner ────────────────────────────────── */
function StatusBanner({ status, paymentStatus }: { status: string; paymentStatus: string | null }) {
  // Map actual DB status values → display key
  let key = status
  if (status === 'pending')   key = 'eoi_submitted'
  if (status === 'approved') {
    if (paymentStatus === 'pending')   key = 'eoi_approved'
    else if (paymentStatus === 'submitted') key = 'payment_pending'
    else key = 'confirmed' // not_required or confirmed → they're in
  }

  const cfg: Record<string, { label: string; sub: string; color: string; bg: string; border: string; icon: any }> = {
    eoi_submitted:   { label: 'Interest Submitted',    sub: 'Waiting for organizer review',                     color: '#EAB308', bg: 'rgba(234,179,8,0.08)',   border: 'rgba(234,179,8,0.2)',   icon: Clock        },
    eoi_approved:    { label: 'Approved — Pay Now',    sub: 'Complete payment to confirm your spot',             color: '#EF4444', bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.2)',  icon: AlertCircle  },
    payment_pending: { label: 'Payment Verifying',     sub: 'Screenshot received, awaiting confirmation',        color: '#818CF8', bg: 'rgba(129,140,248,0.08)', border: 'rgba(129,140,248,0.2)', icon: Loader      },
    confirmed:       { label: "You're Confirmed",      sub: 'Tap "View Ticket" below to see your QR code',      color: '#10B981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)', icon: CheckCircle  },
    registered:      { label: 'Registered',            sub: 'Tap "View Ticket" below to see your QR code',      color: '#10B981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)', icon: CheckCircle  },
    rejected:        { label: 'Not Approved',          sub: 'Your application was not approved',                 color: '#6B7280', bg: 'rgba(107,114,128,0.08)', border: 'rgba(107,114,128,0.15)', icon: X          },
  }
  const s = cfg[key]
  if (!s) return null
  const Icon = s.icon
  return (
    <div style={{ margin: '16px 16px 0', padding: '13px 15px', borderRadius: 16, background: s.bg, border: `1px solid ${s.border}`, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <Icon size={18} color={s.color} style={{ flexShrink: 0, marginTop: 1 }} />
      <div>
        <p style={{ color: s.color, fontSize: 13, fontWeight: 800, margin: '0 0 2px', fontFamily: 'var(--font-display)' }}>{s.label}</p>
        <p style={{ color: s.color, fontSize: 12, margin: 0, opacity: 0.75 }}>{s.sub}</p>
      </div>
    </div>
  )
}

/* ─── QR Modal ───────────────────────────────────────────────────── */
function QRModal({ regId, guestName, event, onClose }: {
  regId: string; guestName: string; event: Event; onClose: () => void
}) {
  const [qrSrc, setQrSrc] = useState('')
  const [bright, setBright] = useState(false)
  const ticketCode = `TIKKIT-${regId.replace(/-/g, '').slice(0, 16).toUpperCase()}`

  useEffect(() => {
    QRCode.toDataURL(ticketCode, {
      width: 260, margin: 2,
      color: { dark: '#080A10', light: '#FFFFFF' },
      errorCorrectionLevel: 'H',
    }).then(setQrSrc)
  }, [ticketCode])

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }}>
      <div style={{ position: 'relative', background: '#0E1018', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 28, padding: '28px 24px 24px', width: 'calc(100% - 48px)', maxWidth: 340, animation: 'popIn 0.35s cubic-bezier(0.34,1.56,0.64,1)' }}>
        {/* Close */}
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 7, cursor: 'pointer', color: '#6B7280', display: 'flex' }}>
          <X size={15} />
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', marginBottom: 10 }}>
            <Ticket size={12} color="#10B981" />
            <span style={{ color: '#10B981', fontSize: 11, fontWeight: 800, letterSpacing: '0.5px' }}>YOUR TICKET</span>
          </div>
          <h3 style={{ color: 'white', fontSize: 16, fontWeight: 900, margin: '0 0 3px', fontFamily: 'var(--font-display)' }}>{event.title}</h3>
          <p style={{ color: '#6B7280', fontSize: 12, margin: 0 }}>{new Date(event.date_start).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })} · {fmtTime(event.date_start)}</p>
          {event.venue_name && <p style={{ color: '#6B7280', fontSize: 12, margin: '2px 0 0' }}>{event.venue_name}</p>}
        </div>

        {/* QR Code */}
        <div
          onClick={() => setBright(b => !b)}
          style={{ background: 'white', borderRadius: 20, padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', filter: bright ? 'brightness(1.15)' : 'brightness(1)', transition: 'filter 0.2s', marginBottom: 16 }}
        >
          {qrSrc
            ? <img src={qrSrc} alt="QR Code" style={{ width: 200, height: 200, display: 'block' }} />
            : <div style={{ width: 200, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Loader size={32} color="#080A10" className="animate-spin" />
              </div>
          }
        </div>

        {/* Tap hint */}
        <p style={{ color: '#4B5563', fontSize: 11, textAlign: 'center', margin: '0 0 14px' }}>Tap QR to brighten for scanning</p>

        {/* Guest chip */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '10px 14px', textAlign: 'center' }}>
          <p style={{ color: '#6B7280', fontSize: 10, fontWeight: 700, margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Guest</p>
          <p style={{ color: 'white', fontSize: 15, fontWeight: 800, margin: '0 0 2px', fontFamily: 'var(--font-display)' }}>{guestName}</p>
          <p style={{ color: '#4B5563', fontSize: 10, margin: 0, fontFamily: 'monospace', letterSpacing: '0.5px' }}>{ticketCode}</p>
        </div>
      </div>
    </div>
  )
}

/* ─── Pay Sheet ──────────────────────────────────────────────────── */
function PaySheet({ regId, event, onClose, onSuccess }: {
  regId: string; event: Event; onClose: () => void; onSuccess: () => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const account = event.payment_accounts?.[0]

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
      fd.append('registrationId', regId)
      fd.append('screenshot', file)
      const res = await submitPaymentScreenshot(fd)
      if (res?.error) { setErr(res.error); return }
      onSuccess()
    } catch { setErr('Something went wrong. Try again.') }
    finally { setBusy(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(5px)' }} />
      <div style={{ position: 'relative', background: '#0E1018', borderRadius: '24px 24px 0 0', padding: '0 0 40px', border: '1px solid rgba(255,255,255,0.08)', animation: 'sheetSlideUp 0.35s cubic-bezier(0.34,1.56,0.64,1)', maxHeight: '92vh', overflowY: 'auto', width: '100%', maxWidth: 480 }}>
        {/* Handle */}
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.12)', margin: '14px auto 0' }} />

        {/* Header */}
        <div style={{ padding: '16px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
          <div>
            <h3 style={{ color: 'white', fontSize: 18, fontWeight: 900, margin: '0 0 3px', fontFamily: 'var(--font-display)' }}>Complete Payment</h3>
            <p style={{ color: '#6B7280', fontSize: 13, margin: 0 }}>{event.title}</p>
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
                <span style={{ color: 'white', fontSize: 18, fontWeight: 900, fontFamily: 'var(--font-display)' }}>PKR {(event.ticket_price ?? 0).toLocaleString('en-PK')}</span>
              </div>
              <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', marginBottom: 8 }} />
              {[
                { label: 'Bank', value: account.bank_name },
                { label: 'Account #', value: account.account_number },
                { label: 'Account Title', value: account.account_title },
              ].map(row => (
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
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />

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
                onClick={() => fileRef.current?.click()}
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

/* ─── Register Sheet ─────────────────────────────────────────────── */
function RegisterSheet({ event, onClose, onSuccess, isEOI, userProfile }: {
  event: Event; onClose: () => void; onSuccess: (status: string) => void
  isEOI: boolean; userProfile: { full_name: string; email: string } | null
}) {
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const isPaid = (event.ticket_price ?? 0) > 0
  const account = event.payment_accounts?.[0]

  const handleSubmit = async () => {
    if (!userProfile?.email) { setErr('Profile email missing. Please update your profile.'); return }
    setBusy(true); setErr(null)
    try {
      const fd = new FormData()
      fd.append('eventId', event.id)
      fd.append('name', userProfile!.full_name)
      fd.append('email', userProfile!.email)
      fd.append('phone', '')
      fd.append('note', note.trim())
      const action = isEOI ? submitEOI : registerForEvent
      const res = await action(fd)
      if (res?.error) { setErr(res.error); return }
      onSuccess(isEOI ? 'eoi_submitted' : 'registered')
    } catch { setErr('Something went wrong. Try again.') }
    finally { setBusy(false) }
  }

  const inputStyle = {
    width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 12, padding: '11px 13px', color: 'white', fontSize: 14,
    fontFamily: 'var(--font-body)', outline: 'none', boxSizing: 'border-box' as const,
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(5px)' }} />
      <div style={{ position: 'relative', background: '#0E1018', borderRadius: '24px 24px 0 0', padding: '0 0 40px', border: '1px solid rgba(255,255,255,0.08)', animation: 'sheetSlideUp 0.35s cubic-bezier(0.34,1.56,0.64,1)', maxHeight: '92vh', overflowY: 'auto' }}>
        {/* Handle */}
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.12)', margin: '14px auto 0' }} />

        {/* Header */}
        <div style={{ padding: '16px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
          <div>
            <h3 style={{ color: 'white', fontSize: 18, fontWeight: 900, margin: '0 0 3px', fontFamily: 'var(--font-display)' }}>
              {isEOI ? 'Express Interest' : 'Register'}
            </h3>
            <p style={{ color: '#6B7280', fontSize: 13, margin: 0 }}>{event.title}</p>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 10, padding: 8, cursor: 'pointer', color: '#6B7280', display: 'flex' }}>
            <X size={16} />
          </button>
        </div>

        {/* Payment info for paid events */}
        {isPaid && account && (
          <div style={{ margin: '16px 20px 0', padding: '13px 15px', borderRadius: 14, background: 'rgba(30,94,255,0.07)', border: '1px solid rgba(30,94,255,0.15)' }}>
            <p style={{ color: '#818CF8', fontSize: 11, fontWeight: 800, margin: '0 0 8px', letterSpacing: '0.5px' }}>PAYMENT DETAILS</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <span style={{ color: '#6B7280', fontSize: 12 }}>Amount</span>
              <span style={{ color: 'white', fontSize: 14, fontWeight: 800, fontFamily: 'var(--font-display)' }}>PKR {event.ticket_price!.toLocaleString('en-PK')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <span style={{ color: '#6B7280', fontSize: 12 }}>Bank</span>
              <span style={{ color: 'white', fontSize: 12, fontWeight: 600 }}>{account.bank_name}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <span style={{ color: '#6B7280', fontSize: 12 }}>Account</span>
              <span style={{ color: 'white', fontSize: 12, fontWeight: 600 }}>{account.account_number}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#6B7280', fontSize: 12 }}>Title</span>
              <span style={{ color: 'white', fontSize: 12, fontWeight: 600 }}>{account.account_title}</span>
            </div>
            <p style={{ color: '#6B7280', fontSize: 11, margin: '10px 0 0', lineHeight: 1.5 }}>
              {isEOI ? "If approved, you'll be asked to submit your payment screenshot." : 'Make payment and upload screenshot on the next step.'}
            </p>
          </div>
        )}

        {/* Form */}
        <div style={{ padding: '16px 20px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Profile card */}
          <div style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14 }}>
            <p style={{ color: '#6B7280', fontSize: 10, fontWeight: 700, margin: '0 0 6px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Registering as</p>
            <p style={{ color: 'white', fontSize: 15, fontWeight: 700, margin: '0 0 2px', fontFamily: 'var(--font-display)' }}>{userProfile?.full_name || 'No name set'}</p>
            <p style={{ color: '#6B7280', fontSize: 13, margin: 0 }}>{userProfile?.email}</p>
            {!userProfile?.full_name && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#EAB308', fontSize: 11, margin: '6px 0 0' }}>
                <AlertCircle size={11} />
                Update your profile name before registering
              </div>
            )}
          </div>
          {isEOI && (
            <div>
              <label style={{ color: '#6B7280', fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Why do you want to attend?</label>
              <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Tell the organizer about yourself..." rows={3}
                style={{ ...inputStyle, resize: 'none' }} />
            </div>
          )}

          {err && (
            <div style={{ display: 'flex', gap: 8, padding: '10px 12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 12 }}>
              <AlertCircle size={14} color="#F87171" style={{ flexShrink: 0, marginTop: 1 }} />
              <span style={{ color: '#FCA5A5', fontSize: 13 }}>{err}</span>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={busy}
            style={{ width: '100%', padding: '14px', border: 'none', borderRadius: 14, background: busy ? 'rgba(255,255,255,0.06)' : (isEOI ? '#A855F7' : '#1E5EFF'), color: busy ? '#6B7280' : 'white', fontSize: 15, fontWeight: 800, cursor: busy ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s' }}>
            {busy
              ? <><Loader size={16} className="animate-spin" /> Please wait…</>
              : isEOI
                ? <><Users size={16} /> Submit Interest</>
                : <><Ticket size={16} /> Confirm Registration</>
            }
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Success overlay ────────────────────────────────────────────── */
function SuccessOverlay({ isEOI, onClose }: { isEOI: boolean; onClose: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}>
      <div style={{ background: '#0E1018', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: '36px 28px', maxWidth: 320, width: '90%', textAlign: 'center', animation: 'popIn 0.4s cubic-bezier(0.34,1.56,0.64,1)' }}>
        <div style={{ width: 64, height: 64, borderRadius: 20, background: isEOI ? 'rgba(168,85,247,0.12)' : 'rgba(30,94,255,0.12)', border: `1px solid ${isEOI ? 'rgba(168,85,247,0.25)' : 'rgba(30,94,255,0.25)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          {isEOI
            ? <Users size={28} color="#A855F7" />
            : <Ticket size={28} color="#1E5EFF" />
          }
        </div>
        <h3 style={{ color: 'white', fontSize: 20, fontWeight: 900, margin: '0 0 8px', fontFamily: 'var(--font-display)' }}>
          {isEOI ? 'Interest Submitted!' : "You're Registered!"}
        </h3>
        <p style={{ color: '#6B7280', fontSize: 14, margin: '0 0 24px', lineHeight: 1.5 }}>
          {isEOI
            ? 'The organizer will review your application and notify you in-app.'
            : 'Your QR ticket is ready — tap View Ticket to see it.'}
        </p>
        <button onClick={onClose} style={{ width: '100%', padding: '13px', border: 'none', borderRadius: 14, background: '#1E5EFF', color: 'white', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
          Got it
        </button>
      </div>
    </div>
  )
}

/* ─── Payment Success overlay ────────────────────────────────────── */
function PaymentSuccessOverlay({ onClose }: { onClose: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}>
      <div style={{ background: '#0E1018', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: '36px 28px', maxWidth: 320, width: '90%', textAlign: 'center', animation: 'popIn 0.4s cubic-bezier(0.34,1.56,0.64,1)' }}>
        <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(129,140,248,0.12)', border: '1px solid rgba(129,140,248,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <CreditCard size={28} color="#818CF8" />
        </div>
        <h3 style={{ color: 'white', fontSize: 20, fontWeight: 900, margin: '0 0 8px', fontFamily: 'var(--font-display)' }}>Screenshot Submitted!</h3>
        <p style={{ color: '#6B7280', fontSize: 14, margin: '0 0 24px', lineHeight: 1.5 }}>
          The organizer will verify your payment and confirm your spot shortly.
        </p>
        <button onClick={onClose} style={{ width: '100%', padding: '13px', border: 'none', borderRadius: 14, background: '#818CF8', color: 'white', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
          Got it
        </button>
      </div>
    </div>
  )
}

/* ─── Main ───────────────────────────────────────────────────────── */
export default function EventDetailClient({
  event, existingReg, isLoggedIn, userProfile = null,
}: {
  event: Event; existingReg: ExistingReg; isLoggedIn: boolean; userProfile: { full_name: string; email: string } | null
}) {
  const router = useRouter()
  const [showSheet, setShowSheet] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showPaySheet, setShowPaySheet] = useState(false)
  const [showPaySuccess, setShowPaySuccess] = useState(false)
  const [showQRModal, setShowQRModal] = useState(false)
  const [regStatus, setRegStatus] = useState(existingReg?.status ?? null)
  const [paymentStatus, setPaymentStatus] = useState(existingReg?.payment_status ?? null)
  const [countdown, setCountdown] = useState(msUntil(event.date_start))
  const [liked, setLiked] = useState(false)

  const spotsLeft = event.capacity ? event.capacity - event.registered_count : null
  const isFull = spotsLeft !== null && spotsLeft <= 0
  const isPaid = (event.ticket_price ?? 0) > 0
  const isEOI = event.registration_mode === 'expression_of_interest'
  const isInviteOnly = event.registration_mode === 'invite_only'
  const isConfirmedGuest = existingReg !== null &&
    (['confirmed', 'registered'].includes(existingReg.status) ||
     (existingReg.status === 'approved' && (existingReg.payment_status === 'confirmed' || existingReg.payment_status === 'not_required')))
  const days = daysUntil(event.date_start)
  const gradient = getGradient(event.id)
  const organiser = event.organizer?.company_name ?? event.organizer?.full_name ?? 'Tikkit'

  useEffect(() => {
    const t = setInterval(() => setCountdown(msUntil(event.date_start)), 1000)
    return () => clearInterval(t)
  }, [event.date_start])

  const ctaLabel = () => {
    if (!isLoggedIn) return { label: 'Sign in to Register', color: '#1E5EFF', disabled: false }

    // Actual DB status values
    if (regStatus === 'pending') return { label: 'Interest Submitted', color: '#EAB308', disabled: true }
    if (regStatus === 'approved') {
      if (paymentStatus === 'pending')   return { label: 'Pay Now →', color: '#EF4444', disabled: false, action: 'pay' }
      if (paymentStatus === 'submitted') return { label: 'Payment Verifying…', color: '#818CF8', disabled: true }
      // not_required or confirmed → ticket is ready
      return { label: 'View Ticket →', color: '#10B981', disabled: false, action: 'ticket' }
    }

    // Legacy UI-side status values (set client-side after successful registration on this page)
    if (regStatus === 'eoi_submitted') return { label: 'Interest Submitted', color: '#EAB308', disabled: true }
    if (regStatus === 'eoi_approved') return { label: 'Pay Now →', color: '#EF4444', disabled: false, action: 'pay' }
    if (regStatus === 'payment_pending') return { label: 'Payment Verifying…', color: '#818CF8', disabled: true }
    if (regStatus === 'confirmed' || regStatus === 'registered') return { label: 'View Ticket →', color: '#10B981', disabled: false, action: 'ticket' }
    if (regStatus === 'rejected') return { label: 'Not Approved', color: '#4B5563', disabled: true }

    if (isFull) return { label: 'Sold Out', color: '#4B5563', disabled: true }
    if (isInviteOnly) return { label: 'Invite Only', color: '#4B5563', disabled: true }
    if (isEOI) return { label: 'Express Interest', color: '#A855F7', disabled: false }
    return { label: 'Register Now', color: '#1E5EFF', disabled: false }
  }
  const cta = ctaLabel()

  return (
    <>
      <div style={{ background: '#080A10', minHeight: '100svh', maxWidth: 480, margin: '0 auto', fontFamily: 'var(--font-body)', paddingBottom: 200 }}>

        {/* Hero */}
        <div style={{ position: 'relative', height: 280, background: event.cover_image_url ? `url(${event.cover_image_url}) center/cover` : gradient, overflow: 'hidden' }}>
          {/* Noise texture */}
          <div style={{ position: 'absolute', inset: 0, opacity: 0.04, backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 40%, rgba(8,10,16,0.95) 100%)' }} />

          {/* Back + actions */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button onClick={() => router.back()} style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}>
              <ArrowLeft size={18} />
            </button>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setLiked(l => !l)} style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)', border: `1px solid ${liked ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.1)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>
                <Heart size={16} color={liked ? '#EF4444' : 'white'} fill={liked ? '#EF4444' : 'none'} />
              </button>
              <button onClick={() => navigator.share?.({ title: event.title, url: window.location.href })} style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}>
                <Share2 size={16} />
              </button>
            </div>
          </div>

          {/* Tags */}
          <div style={{ position: 'absolute', bottom: 16, left: 16, right: 16 }}>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 8 }}>
              {(event.tags ?? []).map(tag => (
                <span key={tag} style={{ padding: '3px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(6px)', color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Status banner for existing registrations */}
        {regStatus && <StatusBanner status={regStatus} paymentStatus={paymentStatus} />}

        {/* Main content */}
        <div style={{ padding: '20px 16px 0', animation: 'revealUp 0.4s ease' }}>

          {/* Title + organiser */}
          <div style={{ marginBottom: 16 }}>
            <h1 style={{ color: 'white', fontSize: 26, fontWeight: 900, margin: '0 0 6px', fontFamily: 'var(--font-display)', letterSpacing: '-0.8px', lineHeight: 1.15 }}>
              {event.title}
            </h1>
            <p style={{ color: '#6B7280', fontSize: 13, margin: 0, fontStyle: 'italic' }}>by {organiser}</p>
          </div>

          {/* Key info grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
            {[
              { icon: <Calendar size={14} color="#818CF8" />, label: 'Date',     value: `${days <= 0 ? 'Today' : days === 1 ? 'Tomorrow' : `${days}d away`}`, sub: new Date(event.date_start).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' }) },
              { icon: <Clock    size={14} color="#818CF8" />, label: 'Time',     value: fmtTime(event.date_start), sub: event.date_end ? `until ${fmtTime(event.date_end)}` : '' },
              { icon: <MapPin   size={14} color="#818CF8" />, label: 'Venue',    value: event.secret_venue && !isConfirmedGuest ? 'Secret' : (event.venue_name ?? 'TBA'), sub: event.secret_venue && !isConfirmedGuest ? 'Revealed upon confirmation' : (event.venue_address ?? '') },
              { icon: <Users    size={14} color="#818CF8" />, label: 'Capacity', value: event.capacity ? `${event.registered_count} / ${event.capacity}` : 'Unlimited', sub: spotsLeft !== null && spotsLeft > 0 && spotsLeft <= 20 ? `${spotsLeft} spots left` : '' },
            ].map((item, i) => (
              <div key={i} style={{ background: '#0E1018', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '12px 13px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
                  {item.icon}
                  <span style={{ color: '#6B7280', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{item.label}</span>
                </div>
                <p style={{ color: item.label === 'Venue' && event.secret_venue && !isConfirmedGuest ? '#FFC745' : 'white', fontSize: 13, fontWeight: 700, margin: '0 0 1px', fontFamily: 'var(--font-display)' }}>
                  {item.label === 'Venue' && event.secret_venue && !isConfirmedGuest
                    ? <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Lock size={11} />{item.value}</span>
                    : item.value
                  }
                </p>
                {item.sub && <p style={{ color: '#6B7280', fontSize: 11, margin: 0 }}>{item.sub}</p>}
              </div>
            ))}
          </div>

          {/* Countdown */}
          {countdown > 0 && (
            <div style={{ background: '#0E1018', border: '1px solid rgba(129,140,248,0.15)', borderRadius: 14, padding: '14px 16px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#6B7280', fontSize: 12, fontWeight: 600 }}>Event starts in</span>
              <span style={{ color: '#818CF8', fontSize: 18, fontWeight: 900, fontFamily: 'var(--font-display)', letterSpacing: '-0.5px' }}>
                {fmtCountdown(countdown)}
              </span>
            </div>
          )}

          {/* Price */}
          {isPaid && (
            <div style={{ background: '#0E1018', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '13px 15px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#6B7280', fontSize: 12, fontWeight: 600 }}>Ticket Price</span>
              <span style={{ color: 'white', fontSize: 20, fontWeight: 900, fontFamily: 'var(--font-display)' }}>
                PKR {event.ticket_price!.toLocaleString('en-PK')}
              </span>
            </div>
          )}

          {/* Description */}
          {event.description && (
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ color: 'white', fontSize: 14, fontWeight: 800, margin: '0 0 8px', fontFamily: 'var(--font-display)' }}>About</h3>
              <p style={{ color: '#9CA3AF', fontSize: 14, lineHeight: 1.7, margin: 0 }}>{event.description}</p>
            </div>
          )}

          {/* Venue map link */}
          {(!event.secret_venue || isConfirmedGuest) && event.venue_address && (
            <a href={`https://maps.google.com/?q=${encodeURIComponent(event.venue_address)}`} target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 15px', background: '#0E1018', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, marginBottom: 16, textDecoration: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <MapPin size={16} color="#818CF8" />
                <div>
                  <p style={{ color: 'white', fontSize: 13, fontWeight: 600, margin: '0 0 1px' }}>{event.venue_name}</p>
                  <p style={{ color: '#6B7280', fontSize: 11, margin: 0 }}>{event.venue_address}</p>
                </div>
              </div>
              <ExternalLink size={14} color="#6B7280" />
            </a>
          )}
        </div>
      </div>

      {/* Fixed CTA */}
      <div style={{ position: 'fixed', bottom: 76, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 480, padding: '12px 16px 12px', background: 'linear-gradient(to top, #080A10 60%, transparent)', zIndex: 50 }}>
        <button
          onClick={() => {
            if (!isLoggedIn) { router.push('/auth/login'); return }
            if ((cta as any).action === 'pay') { setShowPaySheet(true); return }
            if ((cta as any).action === 'ticket') { setShowQRModal(true); return }
            if (!cta.disabled) setShowSheet(true)
          }}
          disabled={cta.disabled}
          style={{ width: '100%', padding: '15px', border: 'none', borderRadius: 16, background: cta.disabled ? 'rgba(255,255,255,0.06)' : cta.color, color: cta.disabled ? '#6B7280' : 'white', fontSize: 16, fontWeight: 800, cursor: cta.disabled ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-display)', letterSpacing: '-0.2px', transition: 'all 0.2s', boxShadow: cta.disabled ? 'none' : `0 8px 24px ${cta.color}40` }}>
          {cta.label}
        </button>
      </div>

      {/* Register / EOI sheet */}
      {showSheet && (
        <RegisterSheet
          event={event} isEOI={isEOI} userProfile={userProfile}
          onClose={() => setShowSheet(false)}
          onSuccess={status => { setShowSheet(false); setRegStatus(status); setShowSuccess(true) }}
        />
      )}

      {/* Pay sheet */}
      {showPaySheet && existingReg && (
        <PaySheet
          regId={existingReg.id}
          event={event}
          onClose={() => setShowPaySheet(false)}
          onSuccess={() => {
            setShowPaySheet(false)
            setPaymentStatus('submitted')
            setRegStatus(prev => prev === 'approved' ? 'approved' : prev)
            setShowPaySuccess(true)
          }}
        />
      )}

      {/* QR modal */}
      {showQRModal && existingReg && (
        <QRModal
          regId={existingReg.id}
          guestName={userProfile?.full_name ?? 'Guest'}
          event={event}
          onClose={() => setShowQRModal(false)}
        />
      )}

      {/* Success overlay */}
      {showSuccess && <SuccessOverlay isEOI={isEOI} onClose={() => setShowSuccess(false)} />}

      {/* Payment success overlay */}
      {showPaySuccess && <PaymentSuccessOverlay onClose={() => setShowPaySuccess(false)} />}
    </>
  )
}
