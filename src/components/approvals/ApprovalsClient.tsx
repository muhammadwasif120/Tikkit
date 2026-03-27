'use client'

import { useState, useMemo } from 'react'
import { CheckCircle, XCircle, Clock, Search, ChevronDown, CreditCard, FileText, AlertCircle, User, Mail, Phone, Calendar, Tag, Loader2, ClipboardCheck } from 'lucide-react'


// ── Types ─────────────────────────────────────────────────────────────────────
type Event = {
  id: string
  title: string
  registration_mode: string
  require_id_verification: boolean
  require_reference_code: boolean
  reference_code: string | null
}

type Registration = {
  id: string
  event_id: string
  full_name: string
  email: string
  phone: string | null
  status: 'pending' | 'approved' | 'rejected'
  payment_status: 'not_required' | 'pending' | 'submitted' | 'confirmed' | 'rejected'
  payment_token: string
  id_document_url: string | null
  reference_code_entered: string | null
  notes: string | null
  payment_screenshot_url: string | null
  created_at: string
  reviewed_at: string | null
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', hour12: true })
}

function StatusBadge({ status, paymentStatus }: { status: string; paymentStatus: string }) {
  let label = '', color = '', bg = '', border = '', Icon = Clock

  if (status === 'rejected')                                          { label = 'Declined';          color = '#EF4444'; bg = 'rgba(239,68,68,0.1)';    border = 'rgba(239,68,68,0.2)';    Icon = XCircle       }
  else if (status === 'approved' && paymentStatus === 'confirmed')   { label = 'Confirmed';          color = '#22C55E'; bg = 'rgba(34,197,94,0.1)';   border = 'rgba(34,197,94,0.2)';    Icon = CheckCircle   }
  else if (status === 'approved' && paymentStatus === 'not_required'){ label = 'Approved';           color = '#22C55E'; bg = 'rgba(34,197,94,0.1)';   border = 'rgba(34,197,94,0.2)';    Icon = CheckCircle   }
  else if (status === 'approved' && paymentStatus === 'pending')     { label = 'Awaiting';           color = '#FFC745'; bg = 'rgba(255,199,69,0.1)';  border = 'rgba(255,199,69,0.2)';   Icon = AlertCircle   }
  else if (status === 'approved' && paymentStatus === 'submitted')   { label = 'Payment Submitted';  color = '#F97316'; bg = 'rgba(249,115,22,0.1)';  border = 'rgba(249,115,22,0.2)';   Icon = CreditCard    }
  else if (status === 'pending')                                      { label = 'Pending Review';     color = '#6B7280'; bg = 'rgba(107,114,128,0.1)'; border = 'rgba(107,114,128,0.15)'; Icon = Clock         }

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', background: bg, border: `1px solid ${border}`, borderRadius: 20, whiteSpace: 'nowrap' }}>
      <Icon size={11} color={color} />
      <span style={{ color, fontSize: 'var(--fs-xs)', fontWeight: 700 }}>{label}</span>
    </div>
  )
}

// ── Registration Detail Modal ─────────────────────────────────────────────────
function RegistrationModal({
  reg, event, onClose, onAction,
}: {
  reg: Registration
  event: Event | undefined
  onClose: () => void
  onAction: () => void
}) {
  const [loading, setLoading]   = useState<'approve' | 'reject' | null>(null)
  const [actionError, setActionError] = useState('')
  const [rejectNote, setNote]   = useState('')
  const [showReject, setShowRej] = useState(false)
  const [imgZoom, setImgZoom]   = useState<string | null>(null)

  const canApprove = reg.status === 'pending' || (reg.status === 'approved' && reg.payment_status === 'submitted')
  const isPaymentReview = reg.payment_status === 'submitted'

  const handleApprove = async () => {
    setLoading('approve')
    setActionError('')
    try {
      if (isPaymentReview) {
        const res = await fetch('/api/confirm-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ registrationId: reg.id }),
        })
        if (!res.ok) throw new Error('failed')
      } else {
        const res = await fetch('/api/approve-registration', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ registrationId: reg.id }),
        })
        if (!res.ok) throw new Error('failed')
      }
      onAction()
      onClose()
    } catch {
      setActionError('Something went wrong. Please try again.')
    }
    setLoading(null)
  }

  const handleReject = async () => {
    setLoading('reject')
    setActionError('')
    try {
      const res = await fetch('/api/reject-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registrationId: reg.id, notes: rejectNote }),
      })
      if (!res.ok) throw new Error('failed')
      onAction()
      onClose()
    } catch {
      setActionError('Something went wrong. Please try again.')
    }
    setLoading(null)
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', zIndex: 100 }} />

      <div
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-32px)] sm:w-full max-w-[560px] max-h-[88vh] overflow-y-auto rounded-[20px] z-[101] p-5 sm:p-7"
        style={{ background: '#111318', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h2 style={{ color: 'white', fontSize: 'var(--fs-xl)', fontWeight: 800, margin: '0 0 6px', fontFamily: 'var(--font-display)' }}>{reg.full_name}</h2>
            <p style={{ color: '#6B7280', fontSize: 'var(--fs-base)', margin: 0 }}>{event?.title ?? 'Unknown event'}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <StatusBadge status={reg.status} paymentStatus={reg.payment_status} />
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#9CA3AF', cursor: 'pointer', width: 32, height: 32, borderRadius: 8, fontSize: 'var(--fs-xl)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
          </div>
        </div>

        {/* Applicant info */}
        <div style={{ background: '#0C0E16', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '16px', marginBottom: 12 }}>
          <p style={{ color: '#4B5563', fontSize: 'var(--fs-xs)', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', margin: '0 0 12px' }}>Applicant Details</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { icon: User,     label: 'Name',    value: reg.full_name },
              { icon: Mail,     label: 'Email',   value: reg.email },
              { icon: Phone,    label: 'Phone',   value: reg.phone ?? '—' },
              { icon: Calendar, label: 'Applied', value: `${fmtDate(reg.created_at)} at ${fmtTime(reg.created_at)}` },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Icon size={14} color="#4B5563" style={{ flexShrink: 0 }} />
                <span style={{ color: '#6B7280', fontSize: 'var(--fs-base)', width: 60, flexShrink: 0 }}>{label}</span>
                <span style={{ color: '#E5E7EB', fontSize: 'var(--fs-base)' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Reference code */}
        {event?.require_reference_code && (
          <div style={{ background: '#0C0E16', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '14px 16px', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Tag size={13} color="#4B5563" />
              <p style={{ color: '#4B5563', fontSize: 'var(--fs-xs)', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', margin: 0 }}>Reference Code</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <code style={{ color: '#E5E7EB', fontSize: 'var(--fs-md)', fontFamily: 'monospace', background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: 6 }}>
                {reg.reference_code_entered ?? '(not entered)'}
              </code>
              {event.reference_code && (
                <span style={{ fontSize: 'var(--fs-sm)', color: reg.reference_code_entered === event.reference_code ? '#22C55E' : '#EF4444', fontWeight: 600 }}>
                  {reg.reference_code_entered === event.reference_code ? '✓ Correct' : '✗ Incorrect'}
                </span>
              )}
            </div>
          </div>
        )}

        {/* ID document */}
        {reg.id_document_url && (
          <div style={{ background: '#0C0E16', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '14px 16px', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <FileText size={13} color="#4B5563" />
              <p style={{ color: '#4B5563', fontSize: 'var(--fs-xs)', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', margin: 0 }}>ID Document</p>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={reg.id_document_url}
              alt="ID document"
              onClick={() => setImgZoom(reg.id_document_url!)}
              style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 10, cursor: 'zoom-in', border: '1px solid rgba(255,255,255,0.08)' }}
            />
          </div>
        )}

        {/* Payment screenshot */}
        {reg.payment_screenshot_url && (
          <div style={{ background: '#0C0E16', border: '1px solid rgba(255,199,69,0.2)', borderRadius: 14, padding: '14px 16px', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <CreditCard size={13} color="#FFC745" />
              <p style={{ color: '#FFC745', fontSize: 'var(--fs-xs)', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', margin: 0 }}>Payment Submission</p>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={reg.payment_screenshot_url}
              alt="Payment screenshot"
              onClick={() => setImgZoom(reg.payment_screenshot_url!)}
              style={{ width: '100%', maxHeight: 240, objectFit: 'cover', borderRadius: 10, cursor: 'zoom-in', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 8 }}
            />
            <p style={{ color: '#6B7280', fontSize: 'var(--fs-sm)', margin: 0 }}>Tap to zoom</p>
          </div>
        )}

        {/* Notes from applicant */}
        {reg.notes && (
          <div style={{ background: '#0C0E16', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '14px 16px', marginBottom: 12 }}>
            <p style={{ color: '#4B5563', fontSize: 'var(--fs-xs)', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', margin: '0 0 6px' }}>Applicant Note</p>
            <p style={{ color: '#9CA3AF', fontSize: 'var(--fs-base)', margin: 0, lineHeight: 1.6 }}>{reg.notes}</p>
          </div>
        )}

        {/* Rejection note field */}
        {showReject && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ color: '#6B7280', fontSize: 'var(--fs-sm)', fontWeight: 600, display: 'block', marginBottom: 6 }}>Reason for rejection (optional)</label>
            <textarea
              value={rejectNote} onChange={e => setNote(e.target.value)}
              placeholder="Let the applicant know why they were declined..."
              rows={3}
              style={{ width: '100%', padding: '10px 12px', background: '#0C0E16', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: 'white', fontSize: 'var(--fs-base)', resize: 'none', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
            />
          </div>
        )}

        {/* Action error */}
        {actionError && (
          <p style={{ color: '#F97316', fontSize: 'var(--fs-sm)', marginBottom: 12, padding: '8px 12px', background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)', borderRadius: 8 }}>
            {actionError}
          </p>
        )}

        {/* Action buttons */}
        {canApprove && (
          <div style={{ display: 'flex', gap: 10 }}>
            {!showReject ? (
              <>
                <button
                  onClick={() => setShowRej(true)}
                  style={{ flex: 1, padding: '12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, color: '#EF4444', fontSize: 'var(--fs-md)', fontWeight: 700, cursor: 'pointer' }}
                >
                  Decline
                </button>
                <button
                  onClick={handleApprove}
                  disabled={!!loading}
                  style={{ flex: 2, padding: '12px', background: '#22C55E', border: 'none', borderRadius: 12, color: 'white', fontSize: 'var(--fs-md)', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: loading ? 0.7 : 1 }}
                >
                  {loading === 'approve' ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle size={16} />}
                  {isPaymentReview ? 'Confirm Payment' : 'Approve'}
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setShowRej(false)} style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: '#6B7280', fontSize: 'var(--fs-md)', fontWeight: 600, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={!!loading}
                  style={{ flex: 2, padding: '12px', background: '#EF4444', border: 'none', borderRadius: 12, color: 'white', fontSize: 'var(--fs-md)', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: loading ? 0.7 : 1 }}
                >
                  {loading === 'reject' ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <XCircle size={16} />}
                  Confirm Rejection
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Image zoom */}
      {imgZoom && (
        <div onClick={() => setImgZoom(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, cursor: 'zoom-out' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imgZoom} alt="Full view" style={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: 12, objectFit: 'contain' }} />
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </>
  )
}

// ── Status icon for list rows ─────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function StatusIcon({ status, paymentStatus }: { status: string; paymentStatus: string }) {
  let Icon = Clock, color = '#4B5563'
  if (status === 'rejected')                                           { Icon = XCircle;    color = '#EF4444' }
  else if (status === 'approved' && paymentStatus === 'confirmed')    { Icon = CheckCircle; color = '#22C55E' }
  else if (status === 'approved' && paymentStatus === 'not_required') { Icon = CheckCircle; color = '#22C55E' }
  else if (status === 'approved' && paymentStatus === 'pending')      { Icon = AlertCircle; color = '#FFC745' }
  else if (status === 'approved' && paymentStatus === 'submitted')    { Icon = CreditCard;  color = '#F97316' }
  return <Icon size={16} color={color} />
}

// ── Main Component ─────────────────────────────────────────────────────────────
const FILTERS = ['All', 'Pending', 'Payment Review', 'Approved', 'Declined'] as const
type Filter = typeof FILTERS[number]

export default function ApprovalsClient({
  registrations: initialRegistrations,
  events,
}: {
  registrations: Registration[]
  events: Event[]
}) {
  const [registrations] = useState(initialRegistrations)
  const [selected, setSelected]           = useState<Registration | null>(null)
  const [filter, setFilter]               = useState<Filter>('All')
  const [search, setSearch]               = useState('')
  const [eventFilter, setEventFilter]     = useState<string>('all')

  const eventMap = useMemo(() => {
    const m: Record<string, Event> = {}
    for (const e of events) m[e.id] = e
    return m
  }, [events])

  const counts = useMemo(() => ({
    'All':            registrations.length,
    'Pending':        registrations.filter(r => r.status === 'pending').length,
    'Payment Review': registrations.filter(r => r.status === 'approved' && r.payment_status === 'submitted').length,
    'Approved':       registrations.filter(r => r.status === 'approved' && r.payment_status !== 'submitted').length,
    'Declined':       registrations.filter(r => r.status === 'rejected').length,
  }), [registrations])

  const filtered = useMemo(() => {
    return registrations
      .filter(r => {
        if (filter === 'Pending')        return r.status === 'pending'
        if (filter === 'Payment Review') return r.status === 'approved' && r.payment_status === 'submitted'
        if (filter === 'Approved')       return r.status === 'approved' && r.payment_status !== 'submitted'
        if (filter === 'Declined')       return r.status === 'rejected'
        return true
      })
      .filter(r => eventFilter === 'all' || r.event_id === eventFilter)
      .filter(r => {
        if (!search) return true
        const s = search.toLowerCase()
        return r.full_name.toLowerCase().includes(s) || r.email.toLowerCase().includes(s)
      })
      .sort((a, b) => {
        const priority = (r: Registration) =>
          r.status === 'pending' ? 2 :
          (r.status === 'approved' && r.payment_status === 'submitted') ? 1 : 0
        return priority(b) - priority(a) || new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })
  }, [registrations, filter, search, eventFilter])

  const refresh = () => window.location.reload()

  const urgentCount = counts['Pending'] + counts['Payment Review']

  return (
    <div className="max-w-5xl px-0 pt-2 pb-6 sm:px-6 sm:pt-7">

      {/* ── Header ──────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 20 }}>
        <div style={{
          width: 52, height: 52, borderRadius: 16, flexShrink: 0,
          background: 'linear-gradient(135deg, rgba(30,94,255,0.2), rgba(168,85,247,0.12))',
          border: '1px solid rgba(30,94,255,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(30,94,255,0.15)',
        }}>
          <ClipboardCheck size={22} color="#1E5EFF" />
        </div>
        <div>
          <h1 style={{ color: 'white', fontSize: 'var(--fs-2xl)', fontWeight: 900, margin: '0 0 4px', fontFamily: 'var(--font-display)', letterSpacing: '-0.4px' }}>
            Approvals
          </h1>
          <p style={{ color: '#6B7280', fontSize: 'var(--fs-base)', margin: 0, lineHeight: 1.5 }}>
            Review applications and payment submissions across all events
          </p>
        </div>
      </div>

      {/* ── Needs attention strip ────────────────────────────── */}
      {urgentCount > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(255,199,69,0.08) 0%, rgba(249,115,22,0.05) 100%)',
          border: '1px solid rgba(255,199,69,0.2)',
          borderRadius: 16, padding: '16px 20px', marginBottom: 24,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <AlertCircle size={16} color="#FFC745" style={{ flexShrink: 0 }} />
          <p style={{ color: '#FFC745', fontSize: 'var(--fs-base)', fontWeight: 700, margin: 0 }}>
            {urgentCount} {urgentCount === 1 ? 'registration needs' : 'registrations need'} your attention
          </p>
        </div>
      )}

      {/* ── Search + event filter ────────────────────────────── */}
      <div style={{ background: '#0C0E16', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '16px', marginBottom: 10 }}>
        <div style={{ position: 'relative', marginBottom: events.length > 1 ? 10 : 0 }}>
          <Search size={15} color="#4B5563" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '10px 12px 10px 36px',
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12, color: 'white', fontSize: 'var(--fs-base)', outline: 'none',
              fontFamily: 'inherit', boxSizing: 'border-box',
            }}
          />
        </div>
        {events.length > 1 && (
          <div style={{ position: 'relative' }}>
            <select
              value={eventFilter}
              onChange={e => setEventFilter(e.target.value)}
              style={{
                width: '100%', padding: '10px 32px 10px 12px', appearance: 'none',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12, color: 'white', fontSize: 'var(--fs-base)', cursor: 'pointer',
                fontFamily: 'inherit', outline: 'none',
              }}
            >
              <option value="all">All Events</option>
              {events.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
            </select>
            <ChevronDown size={14} color="#4B5563" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          </div>
        )}
      </div>

      {/* ── Filter tabs ──────────────────────────────────────── */}
      <div className="grid [grid-template-columns:repeat(2,minmax(0,1fr))] sm:[grid-template-columns:repeat(5,minmax(0,1fr))] gap-2" style={{ marginBottom: 20 }}>
        {FILTERS.map((f, i) => {
          const isActive  = filter === f
          const isUrgent  = f === 'Pending' || f === 'Payment Review'
          const isFirst   = i === 0
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={isFirst ? 'col-span-2 sm:col-span-1' : undefined}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 14px', borderRadius: 14, cursor: 'pointer', transition: 'all 0.15s',
                background: isActive
                  ? isUrgent ? 'rgba(255,199,69,0.1)' : 'rgba(30,94,255,0.12)'
                  : '#0C0E16',
                border: isActive
                  ? isUrgent ? '1px solid rgba(255,199,69,0.3)' : '1px solid rgba(30,94,255,0.3)'
                  : '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <span style={{
                fontSize: 'var(--fs-sm)', fontWeight: 700,
                color: isActive ? (isUrgent ? '#FFC745' : 'white') : '#6B7280',
              }}>
                <span className="sm:hidden">{f === 'Payment Review' ? 'Pay Review' : f}</span>
                <span className="hidden sm:inline">{f}</span>
              </span>
              <span style={{
                marginLeft: 8, fontSize: 'var(--fs-xs)', fontWeight: 800, padding: '2px 7px', borderRadius: 20, flexShrink: 0,
                background: isActive
                  ? isUrgent ? 'rgba(255,199,69,0.2)' : 'rgba(30,94,255,0.2)'
                  : 'rgba(255,255,255,0.05)',
                color: isActive
                  ? isUrgent ? '#FFC745' : '#7DA4FF'
                  : '#4B5563',
              }}>{counts[f]}</span>
            </button>
          )
        })}
      </div>

      {/* ── Count label ──────────────────────────────────────── */}
      <p style={{ color: '#4B5563', fontSize: 'var(--fs-xs)', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', margin: '0 0 12px' }}>
        {filtered.length} {filtered.length === 1 ? 'registration' : 'registrations'}
      </p>

      {/* ── Registration list ────────────────────────────────── */}
      <div style={{ background: '#0C0E16', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 18, overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '72px 24px' }}>
            <div style={{
              width: 56, height: 56, borderRadius: 18, margin: '0 auto 16px',
              background: 'rgba(30,94,255,0.1)', border: '1px solid rgba(30,94,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ClipboardCheck size={24} color="#1E5EFF" />
            </div>
            <p style={{ color: 'white', fontSize: 'var(--fs-md)', fontWeight: 800, margin: '0 0 6px', fontFamily: 'var(--font-display)' }}>
              {search ? 'No results found' : `No ${filter.toLowerCase()} applications`}
            </p>
            <p style={{ color: '#4B5563', fontSize: 'var(--fs-base)', margin: 0, lineHeight: 1.6 }}>
              {!search && filter === 'All' ? 'Applications will appear here as people register for your events' : ''}
            </p>
          </div>
        ) : (
          <>
            {/* Mobile list */}
            <div className="md:hidden">
              {filtered.map(reg => {
                const needsAttention = reg.status === 'pending' || (reg.status === 'approved' && reg.payment_status === 'submitted')
                return (
                  <div
                    key={reg.id}
                    onClick={() => setSelected(reg)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '12px 14px', cursor: 'pointer',
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      background: needsAttention ? 'rgba(255,199,69,0.02)' : 'transparent',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        {needsAttention && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#FFC745', flexShrink: 0 }} />}
                        <p style={{ color: 'white', fontSize: 'var(--fs-base)', fontWeight: 700, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{reg.full_name}</p>
                      </div>
                      <p style={{ color: '#4B5563', fontSize: 'var(--fs-xs)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{eventMap[reg.event_id]?.title ?? '—'}</p>
                    </div>
                    <div style={{ flexShrink: 0 }}>
                      <StatusBadge status={reg.status} paymentStatus={reg.payment_status} />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table style={{ width: '100%', minWidth: 600, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    {['Applicant', 'Event', 'Email', 'Status'].map(h => (
                      <th key={h} style={{ padding: '12px 20px', textAlign: 'left', color: '#4B5563', fontSize: 'var(--fs-xs)', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(reg => {
                    const event = eventMap[reg.event_id]
                    const needsAttention = reg.status === 'pending' || (reg.status === 'approved' && reg.payment_status === 'submitted')
                    return (
                      <tr
                        key={reg.id}
                        onClick={() => setSelected(reg)}
                        className="approval-row"
                        style={{
                          borderBottom: '1px solid rgba(255,255,255,0.04)',
                          cursor: 'pointer',
                          background: needsAttention ? 'rgba(255,199,69,0.02)' : 'transparent',
                        }}
                      >
                        <td style={{ padding: '14px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {needsAttention && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#FFC745', flexShrink: 0 }} />}
                            <span style={{ color: 'white', fontSize: 'var(--fs-base)', fontWeight: 700 }}>{reg.full_name}</span>
                          </div>
                        </td>
                        <td style={{ padding: '14px 20px', color: '#6B7280', fontSize: 'var(--fs-base)' }}>{event?.title ?? '—'}</td>
                        <td style={{ padding: '14px 20px', color: '#6B7280', fontSize: 'var(--fs-base)' }}>{reg.email}</td>
                        <td style={{ padding: '14px 20px' }}>
                          <StatusBadge status={reg.status} paymentStatus={reg.payment_status} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {selected && (
        <RegistrationModal
          reg={selected}
          event={eventMap[selected.event_id]}
          onClose={() => setSelected(null)}
          onAction={refresh}
        />
      )}

      <style>{`
        .approval-row:hover { background: rgba(255,255,255,0.02) !important; }
      `}</style>
    </div>
  )
}
