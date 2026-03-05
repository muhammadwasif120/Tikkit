'use client'

import { useState, useMemo } from 'react'
import { CheckCircle, XCircle, Clock, Search, Filter, ChevronDown, Eye, CreditCard, FileText, AlertCircle, User, Mail, Phone, Calendar, Tag, Loader2 } from 'lucide-react'
import { approvePaymentSubmission, rejectPaymentSubmission } from '@/app/actions/paymentAccountActions'

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
  let label = '', color = '', bg = '', Icon = Clock

  if (status === 'rejected')                                          { label = 'Declined';          color = '#EF4444'; bg = 'rgba(239,68,68,0.12)';    Icon = XCircle       }
  else if (status === 'approved' && paymentStatus === 'confirmed')   { label = 'Confirmed';          color = '#22C55E'; bg = 'rgba(34,197,94,0.12)';   Icon = CheckCircle   }
  else if (status === 'approved' && paymentStatus === 'not_required'){ label = 'Approved';           color = '#22C55E'; bg = 'rgba(34,197,94,0.12)';   Icon = CheckCircle   }
  else if (status === 'approved' && paymentStatus === 'pending')     { label = 'Awaiting Payment';   color = '#FFC745'; bg = 'rgba(255,199,69,0.12)';  Icon = AlertCircle   }
  else if (status === 'approved' && paymentStatus === 'submitted')   { label = 'Payment Submitted';  color = '#F97316'; bg = 'rgba(249,115,22,0.12)';  Icon = CreditCard    }
  else if (status === 'pending')                                      { label = 'Pending Review';     color = '#6B7280'; bg = 'rgba(107,114,128,0.12)'; Icon = Clock         }

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', background: bg, borderRadius: 20, whiteSpace: 'nowrap' }}>
      <Icon size={11} color={color} />
      <span style={{ color, fontSize: 11, fontWeight: 700 }}>{label}</span>
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
  const [rejectNote, setNote]   = useState('')
  const [showReject, setShowRej] = useState(false)
  const [imgZoom, setImgZoom]   = useState<string | null>(null)

  const canApprove = reg.status === 'pending' || (reg.status === 'approved' && reg.payment_status === 'submitted')
  const isPaymentReview = reg.payment_status === 'submitted'

  const handleApprove = async () => {
    setLoading('approve')
    try {
      if (isPaymentReview) {
        const res = await fetch('/api/confirm-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ registrationId: reg.id }),
        })
        if (!res.ok) throw new Error(await res.text())
      } else {
        // EOI approval — no payment needed yet
        const res = await fetch('/api/approve-registration', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ registrationId: reg.id }),
        })
        if (!res.ok) throw new Error(await res.text())
      }
      onAction()
      onClose()
    } catch (e: any) {
      alert('Error: ' + e.message)
    }
    setLoading(null)
  }

  const handleReject = async () => {
    setLoading('reject')
    try {
      if (isPaymentReview) {
        const res = await fetch('/api/reject-registration', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ registrationId: reg.id, notes: rejectNote }),
        })
        if (!res.ok) throw new Error(await res.text())
      } else {
        const res = await fetch('/api/reject-registration', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ registrationId: reg.id, notes: rejectNote }),
        })
        if (!res.ok) throw new Error(await res.text())
      }
      onAction()
      onClose()
    } catch (e: any) {
      alert('Error: ' + e.message)
    }
    setLoading(null)
  }

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', zIndex: 100 }} />

      {/* Modal */}
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto',
        background: '#111318', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 20, zIndex: 101, padding: '28px',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h2 style={{ color: 'white', fontSize: 18, fontWeight: 700, margin: '0 0 6px' }}>{reg.full_name}</h2>
            <p style={{ color: '#6B7280', fontSize: 13, margin: 0 }}>{event?.title ?? 'Unknown event'}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <StatusBadge status={reg.status} paymentStatus={reg.payment_status} />
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#9CA3AF', cursor: 'pointer', width: 32, height: 32, borderRadius: 8, fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
          </div>
        </div>

        {/* Applicant info */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '16px', marginBottom: 16 }}>
          <p style={{ color: '#6B7280', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 12px' }}>Applicant Details</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { icon: User,     label: 'Name',    value: reg.full_name },
              { icon: Mail,     label: 'Email',   value: reg.email },
              { icon: Phone,    label: 'Phone',   value: reg.phone ?? '—' },
              { icon: Calendar, label: 'Applied', value: `${fmtDate(reg.created_at)} at ${fmtTime(reg.created_at)}` },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Icon size={14} color="#4B5563" style={{ flexShrink: 0 }} />
                <span style={{ color: '#6B7280', fontSize: 13, width: 60, flexShrink: 0 }}>{label}</span>
                <span style={{ color: '#E5E7EB', fontSize: 13 }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Reference code */}
        {event?.require_reference_code && (
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '14px 16px', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Tag size={13} color="#4B5563" />
              <p style={{ color: '#6B7280', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>Reference Code</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <code style={{ color: '#E5E7EB', fontSize: 14, fontFamily: 'monospace', background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: 6 }}>
                {reg.reference_code_entered ?? '(not entered)'}
              </code>
              {event.reference_code && (
                <span style={{ fontSize: 12, color: reg.reference_code_entered === event.reference_code ? '#22C55E' : '#EF4444', fontWeight: 600 }}>
                  {reg.reference_code_entered === event.reference_code ? '✓ Correct' : '✗ Incorrect'}
                </span>
              )}
            </div>
          </div>
        )}

        {/* ID document */}
        {reg.id_document_url && (
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '14px 16px', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <FileText size={13} color="#4B5563" />
              <p style={{ color: '#6B7280', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>ID Document</p>
            </div>
            <img
              src={reg.id_document_url}
              alt="ID document"
              onClick={() => setImgZoom(reg.id_document_url!)}
              style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 8, cursor: 'zoom-in', border: '1px solid rgba(255,255,255,0.08)' }}
            />
          </div>
        )}

        {/* Payment screenshot */}
        {reg.payment_screenshot_url && (
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,199,69,0.15)', borderRadius: 12, padding: '14px 16px', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <CreditCard size={13} color="#FFC745" />
              <p style={{ color: '#FFC745', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>Payment Submission</p>

            </div>
            <img
              src={reg.payment_screenshot_url}
              alt="Payment screenshot"
              onClick={() => setImgZoom(reg.payment_screenshot_url!)}
              style={{ width: '100%', maxHeight: 240, objectFit: 'cover', borderRadius: 8, cursor: 'zoom-in', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 8 }}
            />
            <p style={{ color: '#6B7280', fontSize: 12, margin: 0 }}>
              Submitted — tap to zoom
            </p>
          </div>
        )}

        {/* Notes from applicant */}
        {reg.notes && (
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '14px 16px', marginBottom: 16 }}>
            <p style={{ color: '#6B7280', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 6px' }}>Applicant Note</p>
            <p style={{ color: '#9CA3AF', fontSize: 13, margin: 0, lineHeight: 1.6 }}>{reg.notes}</p>
          </div>
        )}

        {/* Rejection note field */}
        {showReject && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ color: '#6B7280', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>Reason for rejection (optional)</label>
            <textarea
              value={rejectNote} onChange={e => setNote(e.target.value)}
              placeholder="Let the applicant know why they were declined..."
              rows={3}
              style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: 'white', fontSize: 13, resize: 'none', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
            />
          </div>
        )}

        {/* Action buttons */}
        {canApprove && (
          <div style={{ display: 'flex', gap: 10 }}>
            {!showReject ? (
              <>
                <button
                  onClick={() => setShowRej(true)}
                  style={{ flex: 1, padding: '12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, color: '#EF4444', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
                >
                  Decline
                </button>
                <button
                  onClick={handleApprove}
                  disabled={!!loading}
                  style={{ flex: 2, padding: '12px', background: '#22C55E', border: 'none', borderRadius: 12, color: 'white', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: loading ? 0.7 : 1 }}
                >
                  {loading === 'approve' ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle size={16} />}
                  {isPaymentReview ? 'Confirm Payment' : 'Approve'}
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setShowRej(false)} style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: '#6B7280', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={!!loading}
                  style={{ flex: 2, padding: '12px', background: '#EF4444', border: 'none', borderRadius: 12, color: 'white', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: loading ? 0.7 : 1 }}
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
          <img src={imgZoom} alt="Full view" style={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: 12, objectFit: 'contain' }} />
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </>
  )
}

// ── Registration Row ──────────────────────────────────────────────────────────
function RegistrationRow({ reg, event, onClick }: { reg: Registration; event: Event | undefined; onClick: () => void }) {
  const needsAttention = reg.status === 'pending' || (reg.status === 'approved' && reg.payment_status === 'submitted')

  return (
    <div
      onClick={onClick}
      style={{
        display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 12, alignItems: 'center',
        padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.04)',
        cursor: 'pointer', transition: 'background 0.15s',
        background: needsAttention ? 'rgba(255,199,69,0.02)' : 'transparent',
      }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = needsAttention ? 'rgba(255,199,69,0.02)' : 'transparent'}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          {needsAttention && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#FFC745', flexShrink: 0 }} />}
          <p style={{ color: 'white', fontSize: 14, fontWeight: 600, margin: 0 }}>{reg.full_name}</p>
        </div>
        <p style={{ color: '#4B5563', fontSize: 12, margin: 0 }}>{reg.email} · {event?.title ?? '—'}</p>
      </div>
      <p style={{ color: '#374151', fontSize: 12, margin: 0, whiteSpace: 'nowrap' }}>{fmtDate(reg.created_at)}</p>
      <StatusBadge status={reg.status} paymentStatus={reg.payment_status} />
    </div>
  )
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
  const [registrations, setRegistrations] = useState(initialRegistrations)
  const [selected, setSelected]           = useState<Registration | null>(null)
  const [filter, setFilter]               = useState<Filter>('All')
  const [search, setSearch]               = useState('')
  const [eventFilter, setEventFilter]       = useState<string>('all')

  const eventMap = useMemo(() => {
    const m: Record<string, Event> = {}
    for (const e of events) m[e.id] = e
    return m
  }, [events])

  // Count badges
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
        // Pending and payment-submitted first
        const priority = (r: Registration) =>
          r.status === 'pending' ? 2 :
          (r.status === 'approved' && r.payment_status === 'submitted') ? 1 : 0
        return priority(b) - priority(a) || new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })
  }, [registrations, filter, search, eventFilter])

  const refresh = async () => {
    // Re-fetch by reloading the page data — simplest approach
    window.location.reload()
  }

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", color: 'white' }}>
      {/* Header */}
      <div style={{ padding: '24px 24px 0', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <h1 style={{ color: 'white', fontSize: 22, fontWeight: 800, margin: 0, fontFamily: 'Poppins, sans-serif', letterSpacing: '-0.4px' }}>Approvals</h1>
          {counts['Pending'] + counts['Payment Review'] > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', background: 'rgba(255,199,69,0.12)', border: '1px solid rgba(255,199,69,0.25)', borderRadius: 20 }}>
              <AlertCircle size={13} color="#FFC745" />
              <span style={{ color: '#FFC745', fontSize: 12, fontWeight: 700 }}>
                {counts['Pending'] + counts['Payment Review']} need attention
              </span>
            </div>
          )}
        </div>
        <p style={{ color: '#4B5563', fontSize: 14, margin: 0 }}>Review applications and payment submissions</p>
      </div>

      {/* Event filter dropdown */}
      {events.length > 1 && (
        <div style={{ padding: '0 24px', marginBottom: 12 }}>
          <select
            value={eventFilter}
            onChange={e => setEventFilter(e.target.value)}
            style={{ width: '100%', background: '#1A1D2E', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '10px 14px', color: eventFilter === 'all' ? '#6B7280' : 'white', fontSize: 13, fontFamily: "'Cabinet Grotesk', sans-serif", outline: 'none', cursor: 'pointer' }}
          >
            <option value="all">All Events ({registrations.length})</option>
            {events.map(e => (
              <option key={e.id} value={e.id}>
                {e.title} ({registrations.filter(r => r.event_id === e.id).length})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Search */}
      <div style={{ padding: '0 24px', marginBottom: 16 }}>
        <div style={{ position: 'relative' }}>
          <Search size={15} color="#4B5563" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input
            type="text" placeholder="Search by name or email..." value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '10px 14px 10px 36px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, color: 'white', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, padding: '0 24px', marginBottom: 16, overflowX: 'auto', scrollbarWidth: 'none' }}>
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
            background: filter === f ? '#1E5EFF' : 'rgba(255,255,255,0.06)',
            color: filter === f ? 'white' : '#6B7280', fontSize: 13, fontWeight: filter === f ? 700 : 500,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            {f}
            {counts[f] > 0 && (
              <span style={{ background: filter === f ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)', color: filter === f ? 'white' : '#6B7280', fontSize: 11, fontWeight: 700, padding: '1px 6px', borderRadius: 10 }}>
                {counts[f]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table header */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 12, padding: '8px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <span style={{ color: '#374151', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Applicant</span>
        <span style={{ color: '#374151', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Date</span>
        <span style={{ color: '#374151', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Status</span>
      </div>

      {/* Rows */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 24px' }}>
          <CheckCircle size={32} color="#1F2937" style={{ marginBottom: 12 }} />
          <p style={{ color: '#374151', fontSize: 15, fontWeight: 600, margin: '0 0 4px' }}>
            {search ? 'No results found' : `No ${filter.toLowerCase()} applications`}
          </p>
          <p style={{ color: '#1F2937', fontSize: 13, margin: 0 }}>
            {!search && filter === 'All' ? 'Applications will appear here as people register for your events' : ''}
          </p>
        </div>
      ) : (
        filtered.map(reg => (
          <RegistrationRow
            key={reg.id}
            reg={reg}
            event={eventMap[reg.event_id]}
            onClick={() => setSelected(reg)}
          />
        ))
      )}

      {/* Detail modal */}
      {selected && (
        <RegistrationModal
          reg={selected}
          event={eventMap[selected.event_id]}
          onClose={() => setSelected(null)}
          onAction={refresh}
        />
      )}
    </div>
  )
}