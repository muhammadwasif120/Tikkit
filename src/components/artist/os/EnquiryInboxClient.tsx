'use client'

import { useState } from 'react'
import { Calendar, MapPin, Users, Clock, CheckCircle2, XCircle, MessageSquare, Inbox, ChevronDown } from 'lucide-react'
import { updateEnquiryStatus, markEnquiryViewed } from '@/app/actions/artistActions'

const C = {
  black:   '#050508',
  cyan:    '#00E5FF',
  magenta: '#CC00FF',
  surface: '#0D1117',
  card:    '#111820',
  border:  'rgba(0,229,255,0.08)',
  muted:   'rgba(255,255,255,0.35)',
  text:    '#FFFFFF',
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  submitted:   { label: 'New',         color: C.cyan,    bg: `${C.cyan}12`            },
  viewed:      { label: 'Viewed',      color: '#F6C90E', bg: 'rgba(246,201,14,0.1)'   },
  responded:   { label: 'Responded',   color: '#A78BFA', bg: 'rgba(167,139,250,0.12)' },
  negotiating: { label: 'Negotiating', color: '#FB923C', bg: 'rgba(251,146,60,0.1)'   },
  booked:      { label: 'Booked',      color: '#4ADE80', bg: 'rgba(74,222,128,0.1)'   },
  declined:    { label: 'Declined',    color: '#FC8181', bg: 'rgba(252,129,129,0.08)' },
}

const TABS = [
  { id: 'all',         label: 'All'         },
  { id: 'submitted',   label: 'New'         },
  { id: 'viewed',      label: 'Viewed'      },
  { id: 'responded',   label: 'Responded'   },
  { id: 'negotiating', label: 'Negotiating' },
  { id: 'booked',      label: 'Booked'      },
  { id: 'declined',    label: 'Declined'    },
]

const NEXT_STATUSES: Record<string, string[]> = {
  submitted:   ['responded', 'declined'],
  viewed:      ['responded', 'declined'],
  responded:   ['negotiating', 'booked', 'declined'],
  negotiating: ['booked', 'declined'],
  booked:      [],
  declined:    [],
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: C.muted, bg: 'rgba(255,255,255,0.05)' }
  return (
    <span style={{ padding: '3px 9px', borderRadius: 6, background: cfg.bg, fontSize: 10, fontWeight: 800, color: cfg.color, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{cfg.label}</span>
  )
}

function DeclineModal({ onConfirm, onCancel, loading }: { onConfirm: (reason: string) => void; onCancel: () => void; loading: boolean }) {
  const [reason, setReason] = useState('')
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#0D1117', border: `1px solid rgba(252,129,129,0.2)`, borderRadius: 20, padding: 28, width: '100%', maxWidth: 420 }}>
        <p style={{ fontSize: 16, fontWeight: 800, margin: '0 0 6px' }}>Decline Enquiry</p>
        <p style={{ fontSize: 13, color: C.muted, margin: '0 0 18px' }}>Optionally provide a reason that will be shared with the organiser.</p>
        <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Artist not available on this date…" rows={3} style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px', color: C.text, fontSize: 14, fontFamily: 'inherit', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: '11px 0', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: C.muted, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
          <button onClick={() => onConfirm(reason)} disabled={loading} style={{ flex: 1, padding: '11px 0', borderRadius: 12, background: 'rgba(252,129,129,0.12)', border: '1px solid rgba(252,129,129,0.3)', color: '#FC8181', fontSize: 14, fontWeight: 800, cursor: loading ? 'wait' : 'pointer', fontFamily: 'inherit', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Declining…' : 'Confirm Decline'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function EnquiryInboxClient({
  enquiries, artistFilter,
}: {
  enquiries: any[]
  artistFilter: string | null
}) {
  const [tab, setTab]             = useState('all')
  const [expanded, setExpanded]   = useState<string | null>(null)
  const [declineFor, setDeclineFor] = useState<string | null>(null)
  const [updating, setUpdating]   = useState<string | null>(null)
  const [localEnqs, setLocalEnqs] = useState(enquiries)

  const filtered = localEnqs.filter(e => {
    const matchTab    = tab === 'all' || e.status === tab
    const matchArtist = !artistFilter || e.artist_id === artistFilter
    return matchTab && matchArtist
  })

  async function handleExpand(id: string) {
    const current = localEnqs.find(e => e.id === id)
    if (!current) return
    if (expanded === id) { setExpanded(null); return }
    setExpanded(id)
    if (current.status === 'submitted') {
      await markEnquiryViewed(id)
      setLocalEnqs(prev => prev.map(e => e.id === id ? { ...e, status: 'viewed', viewed_at: new Date().toISOString() } : e))
    }
  }

  async function handleStatus(enquiryId: string, newStatus: string, declineReason?: string) {
    setUpdating(enquiryId)
    const res = await updateEnquiryStatus(enquiryId, newStatus, declineReason)
    if (!res.error) {
      setLocalEnqs(prev => prev.map(e => e.id === enquiryId ? { ...e, status: newStatus } : e))
    }
    setUpdating(null)
    setDeclineFor(null)
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 4px' }}>Enquiry Inbox</p>
        <p style={{ fontSize: 22, fontWeight: 900, margin: 0, letterSpacing: '-0.5px' }}>{localEnqs.length} Enquir{localEnqs.length !== 1 ? 'ies' : 'y'}</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2, marginBottom: 20 }}>
        {TABS.map(t => {
          const count = t.id === 'all' ? localEnqs.length : localEnqs.filter(e => e.status === t.id).length
          const active = tab === t.id
          return (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '7px 14px', borderRadius: 20, fontSize: 12, fontWeight: active ? 700 : 500, background: active ? `${C.cyan}15` : 'rgba(255,255,255,0.04)', border: `1px solid ${active ? C.cyan + '30' : 'rgba(255,255,255,0.07)'}`, color: active ? C.cyan : C.muted, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
              {t.label}
              {count > 0 && <span style={{ minWidth: 18, height: 18, borderRadius: 9, background: active ? C.cyan : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: active ? C.black : C.muted, padding: '0 4px' }}>{count}</span>}
            </button>
          )
        })}
      </div>

      {/* Empty */}
      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Inbox size={36} color="rgba(255,255,255,0.06)" style={{ marginBottom: 12 }} />
          <p style={{ fontSize: 14, color: C.muted }}>{tab === 'all' ? 'No enquiries yet.' : `No ${TABS.find(t => t.id === tab)?.label.toLowerCase()} enquiries.`}</p>
        </div>
      )}

      {/* Enquiry list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.map(enq => {
          const isExpanded  = expanded === enq.id
          const cfg         = STATUS_CONFIG[enq.status] ?? STATUS_CONFIG.submitted
          const nextActions = NEXT_STATUSES[enq.status] ?? []
          const organiser   = enq.profiles
          const artist      = enq.artists

          return (
            <div key={enq.id} style={{ background: C.card, border: `1px solid ${enq.status === 'submitted' ? C.cyan + '20' : C.border}`, borderRadius: 16, overflow: 'hidden', transition: 'border-color 0.2s' }}>
              {/* Row header */}
              <button onClick={() => handleExpand(enq.id)} style={{ width: '100%', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', color: C.text, fontFamily: 'inherit' }}>
                {/* Artist photo */}
                <div style={{ width: 40, height: 40, borderRadius: 10, background: `linear-gradient(135deg, ${C.cyan}20, ${C.magenta}20)`, flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: C.muted }}>
                  {artist?.profile_photo_url ? <img src={artist.profile_photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (artist?.name?.[0] ?? '?')}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 14, fontWeight: 800 }}>{enq.event_name}</span>
                    <StatusBadge status={enq.status} />
                    {enq.status === 'submitted' && <span style={{ fontSize: 10, fontWeight: 700, color: C.magenta, textTransform: 'uppercase', letterSpacing: '0.4px' }}>• New</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 12, marginTop: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12, color: C.muted }}>for <span style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>{artist?.name}</span></span>
                    <span style={{ fontSize: 12, color: C.muted, display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Calendar size={10} /> {new Date(enq.event_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    <span style={{ fontSize: 12, color: C.muted, display: 'flex', alignItems: 'center', gap: 3 }}>
                      <MapPin size={10} /> {enq.event_city}
                    </span>
                  </div>
                </div>

                <ChevronDown size={16} color={C.muted} style={{ flexShrink: 0, transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'none' }} />
              </button>

              {/* Expanded detail */}
              {isExpanded && (
                <div style={{ borderTop: `1px solid rgba(255,255,255,0.05)`, padding: '20px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                    {/* Left: event details */}
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 12px' }}>Event Details</p>
                      {[
                        { icon: Calendar, label: 'Date',        val: new Date(enq.event_date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) },
                        { icon: MapPin,   label: 'Location',    val: `${enq.event_city}${enq.event_venue ? ` · ${enq.event_venue}` : ''}` },
                        { icon: Users,    label: 'Attendance',  val: enq.estimated_attendance + ' people' },
                        { icon: Clock,    label: 'Duration',    val: enq.performance_duration },
                      ].map(({ icon: Icon, label, val }) => (
                        <div key={label} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                          <Icon size={13} color={C.cyan} style={{ marginTop: 2, flexShrink: 0 }} />
                          <div>
                            <p style={{ fontSize: 11, color: C.muted, margin: '0 0 1px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px' }}>{label}</p>
                            <p style={{ fontSize: 13, margin: 0, fontWeight: 600 }}>{val}</p>
                          </div>
                        </div>
                      ))}
                      {enq.event_type && (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 2, padding: '3px 10px', borderRadius: 6, background: `${C.cyan}10`, border: `1px solid ${C.cyan}20` }}>
                          <span style={{ fontSize: 12, color: C.cyan, fontWeight: 600 }}>{enq.event_type}</span>
                        </div>
                      )}
                      {enq.set_type && <p style={{ fontSize: 12, color: C.muted, margin: '10px 0 0' }}>Set type: <span style={{ color: 'rgba(255,255,255,0.7)' }}>{enq.set_type}</span></p>}
                      {enq.additional_notes && (
                        <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                          <p style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.4px', margin: '0 0 6px' }}>Notes</p>
                          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', margin: 0, lineHeight: 1.6 }}>{enq.additional_notes}</p>
                        </div>
                      )}
                    </div>

                    {/* Right: organiser info */}
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 12px' }}>Organiser</p>
                      <div style={{ padding: '14px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                          <div style={{ width: 36, height: 36, borderRadius: 18, background: `${C.magenta}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: C.magenta }}>
                            {(organiser?.full_name ?? organiser?.company_name ?? 'O')[0]}
                          </div>
                          <div>
                            <p style={{ fontSize: 14, fontWeight: 800, margin: 0 }}>{organiser?.full_name || organiser?.company_name || 'Organiser'}</p>
                            {organiser?.company_name && organiser?.full_name && <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>{organiser.company_name}</p>}
                          </div>
                        </div>
                        {organiser?.email && <p style={{ fontSize: 12, color: C.muted, margin: '0 0 4px' }}><span style={{ color: 'rgba(255,255,255,0.5)' }}>Email:</span> {organiser.email}</p>}
                        {organiser?.phone_number && <p style={{ fontSize: 12, color: C.muted, margin: 0 }}><span style={{ color: 'rgba(255,255,255,0.5)' }}>Phone:</span> {organiser.phone_number}</p>}
                      </div>

                      {/* Submitted at */}
                      <p style={{ fontSize: 11, color: C.muted, marginTop: 12 }}>
                        Submitted {new Date(enq.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                      {enq.expires_at && new Date(enq.expires_at) > new Date() && (
                        <p style={{ fontSize: 11, color: '#F6C90E', margin: '2px 0 0' }}>
                          Expires {new Date(enq.expires_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Status actions */}
                  {nextActions.length > 0 && (
                    <div style={{ display: 'flex', gap: 10, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      {nextActions.map(action => {
                        const isDecline    = action === 'declined'
                        const isBooked     = action === 'booked'
                        const isResponded  = action === 'responded'
                        const isNegotiating = action === 'negotiating'
                        const color = isDecline ? '#FC8181' : isBooked ? '#4ADE80' : isNegotiating ? '#FB923C' : '#A78BFA'
                        const label = isDecline ? 'Decline' : isBooked ? '✓ Mark Booked' : isNegotiating ? 'Move to Negotiating' : 'Mark Responded'
                        return (
                          <button key={action} onClick={() => isDecline ? setDeclineFor(enq.id) : handleStatus(enq.id, action)} disabled={updating === enq.id} style={{ padding: '10px 18px', borderRadius: 12, background: `${color}12`, border: `1px solid ${color}30`, color, fontSize: 13, fontWeight: 700, cursor: updating === enq.id ? 'wait' : 'pointer', fontFamily: 'inherit', opacity: updating === enq.id ? 0.6 : 1 }}>
                            {updating === enq.id ? '…' : label}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Decline modal */}
      {declineFor && (
        <DeclineModal
          loading={updating === declineFor}
          onCancel={() => setDeclineFor(null)}
          onConfirm={reason => handleStatus(declineFor, 'declined', reason)}
        />
      )}
    </div>
  )
}
