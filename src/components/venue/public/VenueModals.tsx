'use client'

import { useState, useEffect, useTransition, useCallback } from 'react'
import { X, Send, CheckCircle, Calendar, Clock3, Users, Phone, ChevronLeft, ChevronRight, QrCode, Check } from 'lucide-react'
import { createVenueEnquiry, createProgrammeRegistrations, createSlotBookingGuest } from '@/app/actions/venueActions'

const C = {
  bg:      '#06080C',
  card:    '#101620',
  border:  'rgba(0,212,170,0.12)',
  emerald: '#00D4AA',
  violet:  '#7C3AED',
  muted:   'rgba(255,255,255,0.38)',
  text:    '#F0F4FF',
}

// ── Shared helpers ────────────────────────────────────────────────────────────

function fmt(n: number) {
  return 'PKR ' + n.toLocaleString('en-PK')
}

function Backdrop({ onClose }: { onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.78)',
        backdropFilter: 'blur(8px)',
      }}
    />
  )
}

function ModalShell({ onClose, title, children }: { onClose: () => void; title: string; children: React.ReactNode }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const handle = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handle)
    return () => {
      window.removeEventListener('keydown', handle)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <>
      <Backdrop onClose={onClose} />
      <div style={{
        position: 'fixed', inset: 0, zIndex: 1001,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px 16px',
        pointerEvents: 'none',
      }}>
        <div style={{
          width: '100%', maxWidth: 480,
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 24,
          overflow: 'hidden',
          pointerEvents: 'auto',
          maxHeight: 'calc(100vh - 40px)',
          overflowY: 'auto',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '20px 24px 0',
          }}>
            <h2 style={{ fontSize: 17, fontWeight: 800, margin: 0, color: C.text }}>{title}</h2>
            <button onClick={onClose} style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: C.muted, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <X size={15} />
            </button>
          </div>
          {children}
        </div>
      </div>
    </>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12,
  padding: '10px 14px', color: C.text, fontSize: 14,
  fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
}

function SuccessScreen({ title, body, onClose, venuePhone, venueWA }: {
  title: string; body: string; onClose: () => void
  venuePhone?: string | null; venueWA?: string | null
}) {
  return (
    <div style={{ padding: '32px 24px', textAlign: 'center' }}>
      <div style={{
        width: 56, height: 56, borderRadius: '50%',
        background: 'rgba(0,212,170,0.12)', border: `2px solid ${C.emerald}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 16px',
      }}>
        <CheckCircle size={26} color={C.emerald} />
      </div>
      <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 8px', color: C.text }}>{title}</h3>
      <p style={{ fontSize: 14, color: C.muted, margin: '0 0 24px', lineHeight: 1.6 }}>{body}</p>

      {(venuePhone || venueWA) && (
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 11, color: C.muted, margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>
            Need to reach the venue directly?
          </p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            {venuePhone && (
              <a href={`tel:${venuePhone}`} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '8px 14px', borderRadius: 10,
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                color: C.muted, fontSize: 13, textDecoration: 'none',
              }}>
                <Phone size={13} /> Call
              </a>
            )}
            {venueWA && (
              <a href={venueWA} target="_blank" rel="noreferrer" style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '8px 14px', borderRadius: 10,
                background: 'rgba(37,211,102,0.08)', border: '1px solid rgba(37,211,102,0.2)',
                color: '#25D366', fontSize: 13, textDecoration: 'none', fontWeight: 700,
              }}>
                WhatsApp
              </a>
            )}
          </div>
        </div>
      )}

      <button onClick={onClose} style={{
        width: '100%', padding: '12px', borderRadius: 14,
        background: C.emerald, border: 'none', color: '#06080C',
        fontSize: 14, fontWeight: 800, cursor: 'pointer',
      }}>
        Done
      </button>
    </div>
  )
}

function QRConfirmScreen({ qrToken, title, subtitle, onClose }: {
  qrToken: string; title: string; subtitle: string; onClose: () => void
}) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrToken)}&size=200x200&bgcolor=101620&color=00D4AA&margin=12`

  return (
    <div style={{ padding: '24px 24px 32px', textAlign: 'center' }}>
      <div style={{
        width: 56, height: 56, borderRadius: '50%',
        background: 'rgba(0,212,170,0.12)', border: `2px solid ${C.emerald}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 16px',
      }}>
        <CheckCircle size={26} color={C.emerald} />
      </div>
      <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 6px', color: C.text }}>{title}</h3>
      <p style={{ fontSize: 14, color: C.muted, margin: '0 0 20px', lineHeight: 1.6 }}>{subtitle}</p>

      <div style={{
        background: '#101620', border: `1px solid ${C.border}`,
        borderRadius: 16, padding: 16, display: 'inline-block', marginBottom: 20,
      }}>
        <img src={qrUrl} alt="QR code" width={160} height={160} style={{ display: 'block', borderRadius: 8 }} />
      </div>
      <p style={{ fontSize: 11, color: C.muted, margin: '0 0 20px' }}>Show this QR at the venue</p>

      <button onClick={onClose} style={{
        width: '100%', padding: '12px', borderRadius: 14,
        background: C.emerald, border: 'none', color: '#06080C',
        fontSize: 14, fontWeight: 800, cursor: 'pointer',
      }}>
        Done
      </button>
    </div>
  )
}

// ── Enquiry Modal ─────────────────────────────────────────────────────────────

export type EnquiryTarget = {
  type: 'programme' | 'resource' | 'venue'
  id?: string
  name: string
  venueId: string
  venueName: string
  venuePhone?: string | null
  venueWA?: string | null
}

export function EnquiryModal({ target, onClose, userProfile }: {
  target: EnquiryTarget
  onClose: () => void
  userProfile?: { name?: string; phone?: string } | null
}) {
  const [name, setName]       = useState(userProfile?.name ?? '')
  const [phone, setPhone]     = useState(userProfile?.phone ?? '')
  const [msg, setMsg]         = useState('')
  const [done, setDone]       = useState(false)
  const [err, setErr]         = useState('')
  const [pending, startTr]    = useTransition()

  const defaultMsg = target.type === 'programme'
    ? `Hi, I'm interested in "${target.name}" — could you share more details?`
    : target.type === 'resource'
      ? `Hi, I'd like to enquire about booking "${target.name}".`
      : `Hi, I have a question about ${target.venueName}.`

  function submit() {
    if (!name.trim() || !msg.trim()) { setErr('Name and message are required.'); return }
    setErr('')
    const fd = new FormData()
    fd.set('venue_id', target.venueId)
    if (target.type === 'programme' && target.id) fd.set('programme_id', target.id)
    if (target.type === 'resource' && target.id)  fd.set('resource_id', target.id)
    fd.set('guest_name', name)
    fd.set('guest_phone', phone)
    fd.set('message', msg || defaultMsg)

    startTr(async () => {
      const res = await createVenueEnquiry(fd)
      if (res.error) { setErr(res.error); return }
      setDone(true)
    })
  }

  const title = target.type === 'programme' ? `Enquire — ${target.name}`
    : target.type === 'resource' ? `Enquire — ${target.name}`
    : `Contact ${target.venueName}`

  return (
    <ModalShell onClose={onClose} title={title}>
      {done ? (
        <SuccessScreen
          title="Enquiry sent!"
          body="The venue will get back to you shortly. You'll see their reply here in the app."
          onClose={onClose}
          venuePhone={target.venuePhone}
          venueWA={target.venueWA}
        />
      ) : (
        <div style={{ padding: '20px 24px 28px' }}>
          <Field label="Your name">
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Full name" style={inputStyle} />
          </Field>
          <Field label="Phone (optional)">
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+92 300 0000000" style={inputStyle} type="tel" />
          </Field>
          <Field label="Message">
            <textarea
              value={msg || defaultMsg}
              onChange={e => setMsg(e.target.value)}
              rows={4}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
            />
          </Field>

          {err && <p style={{ color: '#FC8181', fontSize: 13, margin: '0 0 14px' }}>{err}</p>}

          <button onClick={submit} disabled={pending} style={{
            width: '100%', padding: '13px', borderRadius: 14,
            background: C.emerald, border: 'none', color: '#06080C',
            fontSize: 14, fontWeight: 800, cursor: pending ? 'wait' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            opacity: pending ? 0.7 : 1,
          }}>
            <Send size={15} /> {pending ? 'Sending…' : 'Send Enquiry'}
          </button>
        </div>
      )}
    </ModalShell>
  )
}

// ── Programme Registration Modal ──────────────────────────────────────────────

export type RegTarget = {
  programme: {
    id: string; title: string; price: number; capacity: number
    start_time: string; duration_mins: number; description?: string | null
  }
  instances: { id: string; date: string }[]
  venueId: string
  venueName: string
}

export function ProgrammeRegModal({ target, onClose, userProfile }: {
  target: RegTarget
  onClose: () => void
  userProfile?: { name?: string; phone?: string } | null
}) {
  // Multi-select: Set of selected instance IDs
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    target.instances[0] ? new Set([target.instances[0].id]) : new Set()
  )
  const [guestCount, setGuestCount] = useState(1)
  const [name, setName]   = useState(userProfile?.name ?? '')
  const [phone, setPhone] = useState(userProfile?.phone ?? '')
  const [notes, setNotes] = useState('')
  const [err, setErr]     = useState('')
  const [results, setResults] = useState<{ id: string; qr_token: string }[] | null>(null)
  const [pending, startTr] = useTransition()

  const prog = target.programme
  const sessionCount = selectedIds.size || 1
  const total = prog.price * guestCount * sessionCount

  function toggleDate(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function submit() {
    if (!name.trim()) { setErr('Name is required.'); return }
    if (target.instances.length > 0 && selectedIds.size === 0) { setErr('Please select at least one date.'); return }
    setErr('')

    startTr(async () => {
      const instanceIds = Array.from(selectedIds)
      const res = await createProgrammeRegistrations(
        prog.id, target.venueId, instanceIds,
        name, phone, guestCount, prog.price, notes,
      )
      if (res.error) { setErr(res.error); return }
      setResults(res.registrations ?? [])
    })
  }

  if (results) {
    const multiDay = results.length > 1
    return (
      <ModalShell onClose={onClose} title="You're registered!">
        <div style={{ padding: '24px 24px 32px', textAlign: 'center' }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'rgba(0,212,170,0.12)', border: `2px solid ${C.emerald}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
          }}>
            <CheckCircle size={26} color={C.emerald} />
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 8px', color: C.text }}>
            {multiDay ? `${results.length} sessions booked!` : 'Registration confirmed!'}
          </h3>
          <p style={{ fontSize: 14, color: C.muted, margin: '0 0 20px', lineHeight: 1.6 }}>
            {multiDay
              ? `You're registered for ${results.length} sessions of ${prog.title} at ${target.venueName}.`
              : `You're registered for ${prog.title} at ${target.venueName}.`}
            {' '}Show your QR at the door for each session.
          </p>

          {/* Show first QR, mention others are in My Tikkit */}
          <div style={{
            background: C.card, border: `1px solid ${C.border}`,
            borderRadius: 16, padding: 16, display: 'inline-block', marginBottom: 12,
          }}>
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(results[0].qr_token)}&size=160x160&bgcolor=101620&color=00D4AA&margin=10`}
              alt="QR" width={140} height={140} style={{ display: 'block', borderRadius: 8 }}
            />
          </div>
          {multiDay && (
            <p style={{ fontSize: 12, color: C.muted, margin: '0 0 20px' }}>
              QR shown for session 1 of {results.length} — all QRs are in My Tikkit → Experiences
            </p>
          )}

          <button onClick={onClose} style={{
            width: '100%', padding: '12px', borderRadius: 14,
            background: C.emerald, border: 'none', color: '#06080C',
            fontSize: 14, fontWeight: 800, cursor: 'pointer',
          }}>Done</button>
        </div>
      </ModalShell>
    )
  }

  return (
    <ModalShell onClose={onClose} title={`Register — ${prog.title}`}>
      <div style={{ padding: '20px 24px 28px' }}>
        {/* Programme summary */}
        <div style={{
          background: 'rgba(0,212,170,0.05)', border: '1px solid rgba(0,212,170,0.12)',
          borderRadius: 14, padding: '14px 16px', marginBottom: 20,
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <div>
            <p style={{ margin: '0 0 3px', fontSize: 13, fontWeight: 700, color: C.text }}>{prog.title}</p>
            <p style={{ margin: 0, fontSize: 12, color: C.muted }}>
              {prog.duration_mins} min · {prog.price > 0 ? `${fmt(prog.price)} / person / session` : 'Free'}
            </p>
          </div>
          {/* Time badge */}
          <div style={{
            marginLeft: 'auto', flexShrink: 0,
            background: 'rgba(0,212,170,0.1)', border: '1px solid rgba(0,212,170,0.2)',
            borderRadius: 10, padding: '6px 12px', textAlign: 'center',
          }}>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 900, color: C.emerald, lineHeight: 1 }}>
              {prog.start_time.slice(0, 5)}
            </p>
            <p style={{ margin: '2px 0 0', fontSize: 9, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              each session
            </p>
          </div>
        </div>

        {/* Multi-select dates */}
        {target.instances.length > 0 && (
          <Field label={`Select sessions — tap to toggle (${selectedIds.size} selected)`}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {target.instances.map(inst => {
                const isSelected = selectedIds.has(inst.id)
                const d = new Date(inst.date + 'T00:00:00')
                const dayLabel = d.toLocaleDateString('en-PK', { weekday: 'long', month: 'short', day: 'numeric' })
                return (
                  <button
                    key={inst.id}
                    onClick={() => toggleDate(inst.id)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 14px', borderRadius: 12, cursor: 'pointer', textAlign: 'left',
                      border: `1px solid ${isSelected ? C.emerald : 'rgba(255,255,255,0.08)'}`,
                      background: isSelected ? 'rgba(0,212,170,0.08)' : 'rgba(255,255,255,0.03)',
                      transition: 'all 0.15s',
                      width: '100%',
                    }}
                  >
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: isSelected ? C.emerald : C.text, display: 'block' }}>
                        {dayLabel}
                      </span>
                      <span style={{ fontSize: 11, color: C.muted }}>
                        {prog.start_time.slice(0, 5)} · {prog.duration_mins} min
                      </span>
                    </div>
                    <div style={{
                      width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                      border: `2px solid ${isSelected ? C.emerald : 'rgba(255,255,255,0.15)'}`,
                      background: isSelected ? C.emerald : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.15s',
                    }}>
                      {isSelected && <Check size={13} color="#06080C" strokeWidth={3} />}
                    </div>
                  </button>
                )
              })}
            </div>
            {selectedIds.size > 1 && (
              <p style={{ margin: '8px 0 0', fontSize: 11, color: C.emerald, fontWeight: 700 }}>
                ✓ {selectedIds.size} sessions selected — you'll get a separate QR for each
              </p>
            )}
          </Field>
        )}

        {/* Guest count */}
        <Field label="Number of people per session">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => setGuestCount(c => Math.max(1, c - 1))}
              style={{ width: 36, height: 36, borderRadius: 10, cursor: 'pointer', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              −
            </button>
            <span style={{ fontSize: 18, fontWeight: 800, color: C.text, minWidth: 24, textAlign: 'center' }}>{guestCount}</span>
            <button onClick={() => setGuestCount(c => Math.min(prog.capacity, c + 1))}
              style={{ width: 36, height: 36, borderRadius: 10, cursor: 'pointer', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              +
            </button>
            <span style={{ fontSize: 12, color: C.muted }}>max {prog.capacity}</span>
          </div>
        </Field>

        <Field label="Your name">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Full name" style={inputStyle} />
        </Field>
        <Field label="Phone (optional)">
          <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+92 300 0000000" style={inputStyle} type="tel" />
        </Field>
        <Field label="Notes (optional)">
          <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any special requirements?" style={inputStyle} />
        </Field>

        {/* Price summary */}
        {prog.price > 0 && (
          <div style={{
            background: C.bg, borderRadius: 12, padding: '12px 16px', marginBottom: 16,
          }}>
            {selectedIds.size > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: C.muted }}>{selectedIds.size} sessions × {guestCount} pax × {fmt(prog.price)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: C.muted }}>Total</span>
              <span style={{ fontSize: 17, fontWeight: 900, color: C.emerald }}>{fmt(total)}</span>
            </div>
          </div>
        )}

        {err && <p style={{ color: '#FC8181', fontSize: 13, margin: '0 0 14px' }}>{err}</p>}

        <button onClick={submit} disabled={pending || selectedIds.size === 0} style={{
          width: '100%', padding: '13px', borderRadius: 14,
          background: selectedIds.size > 0 ? C.emerald : 'rgba(255,255,255,0.08)',
          border: 'none',
          color: selectedIds.size > 0 ? '#06080C' : C.muted,
          fontSize: 14, fontWeight: 800, cursor: pending ? 'wait' : 'pointer',
          opacity: pending ? 0.7 : 1, transition: 'all 0.2s',
        }}>
          {pending
            ? 'Registering…'
            : prog.price > 0
              ? `Confirm & Pay ${fmt(total)}`
              : selectedIds.size > 1
                ? `Confirm ${selectedIds.size} Sessions`
                : 'Confirm Registration'}
        </button>
        {prog.price > 0 && (
          <p style={{ fontSize: 11, color: C.muted, textAlign: 'center', margin: '10px 0 0' }}>
            Payment is settled directly with the venue
          </p>
        )}
      </div>
    </ModalShell>
  )
}

// ── Slot Booking Modal ────────────────────────────────────────────────────────

export type BookTarget = {
  resource: {
    id: string; name: string; resource_type: string
    open_time: string; close_time: string; duration_unit_mins: number
    price_per_slot: number; capacity: number; active_days: number[]
    max_advance_days?: number
  }
  venueId: string
  venueName: string
}

function generateTimeSlots(openTime: string, closeTime: string, durationMins: number): string[] {
  const [oh, om] = openTime.split(':').map(Number)
  const [ch, cm] = closeTime.split(':').map(Number)
  const openMins  = oh * 60 + om
  const closeMins = ch * 60 + cm
  const slots: string[] = []
  for (let m = openMins; m + durationMins <= closeMins; m += durationMins) {
    const h = Math.floor(m / 60)
    const min = m % 60
    slots.push(`${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`)
  }
  return slots
}

function addMins(time: string, mins: number): string {
  const [h, m] = time.split(':').map(Number)
  const total = h * 60 + m + mins
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

function jsWeekdayToDb(jsDay: number): number {
  // JS: 0=Sun, 1=Mon..6=Sat → DB: 1=Mon..7=Sun
  return jsDay === 0 ? 7 : jsDay
}

export function SlotBookingModal({ target, onClose, userProfile }: {
  target: BookTarget
  onClose: () => void
  userProfile?: { name?: string; phone?: string } | null
}) {
  const res = target.resource
  const maxDays = res.max_advance_days ?? 30
  const today = new Date()

  const availableDates: Date[] = []
  for (let i = 1; i <= maxDays; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    if (res.active_days.includes(jsWeekdayToDb(d.getDay()))) {
      availableDates.push(d)
    }
  }

  const [calPage, setCalPage]     = useState(0) // page of 14 days
  const [selectedDate, setDate]   = useState<Date | null>(null)
  const [selectedTime, setTime]   = useState<string | null>(null)
  const [guestCount, setGuests]   = useState(1)
  const [name, setName]           = useState(userProfile?.name ?? '')
  const [phone, setPhone]         = useState(userProfile?.phone ?? '')
  const [notes, setNotes]         = useState('')
  const [err, setErr]             = useState('')
  const [result, setResult]       = useState<{ qr_token: string } | null>(null)
  const [pending, startTr]        = useTransition()

  const timeSlots = generateTimeSlots(res.open_time, res.close_time, res.duration_unit_mins)
  const pageSize  = 14
  const pageDates = availableDates.slice(calPage * pageSize, (calPage + 1) * pageSize)

  const total = res.price_per_slot

  function submit() {
    if (!selectedDate || !selectedTime) { setErr('Please select a date and time.'); return }
    if (!name.trim()) { setErr('Name is required.'); return }
    setErr('')

    const dateStr  = selectedDate.toISOString().slice(0, 10)
    const endTime  = addMins(selectedTime, res.duration_unit_mins)

    const fd = new FormData()
    fd.set('resource_id', res.id)
    fd.set('date', dateStr)
    fd.set('start_time', selectedTime)
    fd.set('end_time', endTime)
    fd.set('duration_mins', String(res.duration_unit_mins))
    fd.set('guest_count', String(guestCount))
    fd.set('total_price', String(total))
    fd.set('notes', notes)

    startTr(async () => {
      const r = await createSlotBookingGuest(fd)
      if (r.error) { setErr(r.error); return }
      setResult({ qr_token: r.qr_token })
    })
  }

  if (result) {
    return (
      <ModalShell onClose={onClose} title="Booking confirmed!">
        <QRConfirmScreen
          qrToken={result.qr_token}
          title="Booking confirmed"
          subtitle={`${res.name} at ${target.venueName} — ${selectedDate?.toLocaleDateString('en-PK', { weekday: 'short', month: 'short', day: 'numeric' })} at ${selectedTime}`}
          onClose={onClose}
        />
      </ModalShell>
    )
  }

  return (
    <ModalShell onClose={onClose} title={`Book — ${res.name}`}>
      <div style={{ padding: '20px 24px 28px' }}>
        {/* Resource summary */}
        <div style={{
          background: 'rgba(124,58,237,0.05)', border: '1px solid rgba(124,58,237,0.15)',
          borderRadius: 14, padding: '12px 16px', marginBottom: 20,
        }}>
          <p style={{ margin: '0 0 3px', fontSize: 13, fontWeight: 700, color: C.text }}>{res.name}</p>
          <p style={{ margin: 0, fontSize: 12, color: C.muted }}>
            {res.duration_unit_mins} min slots · {res.open_time.slice(0,5)} – {res.close_time.slice(0,5)}
            {res.price_per_slot > 0 ? ` · ${fmt(res.price_per_slot)} / slot` : ' · Free'}
          </p>
        </div>

        {/* Date picker */}
        <Field label="Pick a date">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <button onClick={() => setCalPage(p => Math.max(0, p - 1))} disabled={calPage === 0}
              style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: C.muted, cursor: calPage === 0 ? 'default' : 'pointer', padding: '4px 8px', opacity: calPage === 0 ? 0.3 : 1 }}>
              <ChevronLeft size={14} />
            </button>
            <span style={{ flex: 1, textAlign: 'center', fontSize: 12, color: C.muted }}>
              {pageDates[0]?.toLocaleDateString('en-PK', { month: 'short', day: 'numeric' })} –{' '}
              {pageDates[pageDates.length - 1]?.toLocaleDateString('en-PK', { month: 'short', day: 'numeric' })}
            </span>
            <button onClick={() => setCalPage(p => p + 1)} disabled={(calPage + 1) * pageSize >= availableDates.length}
              style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: C.muted, cursor: (calPage + 1) * pageSize >= availableDates.length ? 'default' : 'pointer', padding: '4px 8px', opacity: (calPage + 1) * pageSize >= availableDates.length ? 0.3 : 1 }}>
              <ChevronRight size={14} />
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
            {pageDates.map(d => {
              const isSelected = selectedDate?.toDateString() === d.toDateString()
              return (
                <button key={d.toISOString()} onClick={() => { setDate(d); setTime(null) }}
                  style={{
                    padding: '7px 4px', borderRadius: 8, cursor: 'pointer',
                    border: `1px solid ${isSelected ? C.emerald : 'rgba(255,255,255,0.08)'}`,
                    background: isSelected ? 'rgba(0,212,170,0.12)' : 'rgba(255,255,255,0.03)',
                    color: isSelected ? C.emerald : C.muted,
                    fontSize: 11, fontWeight: isSelected ? 800 : 500,
                    textAlign: 'center', transition: 'all 0.15s',
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: 9, marginBottom: 2 }}>
                    {d.toLocaleDateString('en', { weekday: 'narrow' })}
                  </div>
                  {d.getDate()}
                </button>
              )
            })}
          </div>
        </Field>

        {/* Time slots — only show if date selected */}
        {selectedDate && (
          <Field label="Pick a time">
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {timeSlots.map(t => {
                const isSelected = selectedTime === t
                return (
                  <button key={t} onClick={() => setTime(t)}
                    style={{
                      padding: '7px 12px', borderRadius: 9, cursor: 'pointer', fontSize: 13, fontWeight: 700,
                      border: `1px solid ${isSelected ? C.violet : 'rgba(255,255,255,0.1)'}`,
                      background: isSelected ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.04)',
                      color: isSelected ? '#A78BFA' : C.muted,
                      transition: 'all 0.15s',
                    }}
                  >{t}</button>
                )
              })}
            </div>
          </Field>
        )}

        {/* Guest count */}
        <Field label="Guests">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => setGuests(c => Math.max(1, c - 1))}
              style={{ width: 36, height: 36, borderRadius: 10, cursor: 'pointer', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              −
            </button>
            <span style={{ fontSize: 18, fontWeight: 800, color: C.text, minWidth: 24, textAlign: 'center' }}>{guestCount}</span>
            <button onClick={() => setGuests(c => Math.min(res.capacity, c + 1))}
              style={{ width: 36, height: 36, borderRadius: 10, cursor: 'pointer', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              +
            </button>
            <span style={{ fontSize: 12, color: C.muted }}>max {res.capacity}</span>
          </div>
        </Field>

        <Field label="Your name">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Full name" style={inputStyle} />
        </Field>
        <Field label="Phone (optional)">
          <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+92 300 0000000" style={inputStyle} type="tel" />
        </Field>
        <Field label="Notes (optional)">
          <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Equipment needed, questions…" style={inputStyle} />
        </Field>

        {/* Price */}
        {res.price_per_slot > 0 && (
          <div style={{
            background: C.bg, borderRadius: 12, padding: '12px 16px', marginBottom: 16,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ fontSize: 13, color: C.muted }}>1 slot × {fmt(res.price_per_slot)}</span>
            <span style={{ fontSize: 17, fontWeight: 900, color: C.emerald }}>{fmt(total)}</span>
          </div>
        )}

        {err && <p style={{ color: '#FC8181', fontSize: 13, margin: '0 0 14px' }}>{err}</p>}

        <button onClick={submit} disabled={pending || !selectedDate || !selectedTime} style={{
          width: '100%', padding: '13px', borderRadius: 14,
          background: selectedDate && selectedTime ? C.emerald : 'rgba(255,255,255,0.08)',
          border: 'none', color: selectedDate && selectedTime ? '#06080C' : C.muted,
          fontSize: 14, fontWeight: 800, cursor: pending ? 'wait' : 'pointer',
          opacity: pending ? 0.7 : 1, transition: 'all 0.2s',
        }}>
          {pending ? 'Booking…' : res.price_per_slot > 0 ? `Confirm Booking · ${fmt(total)}` : 'Confirm Booking'}
        </button>
        {res.price_per_slot > 0 && (
          <p style={{ fontSize: 11, color: C.muted, textAlign: 'center', margin: '10px 0 0' }}>
            Payment is settled directly with the venue
          </p>
        )}
      </div>
    </ModalShell>
  )
}
