'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  LayoutDashboard, Users, Calendar, MessageSquare,
  Shield, Mail, Phone, CheckCircle, Search, ArrowUpRight,
  MoreHorizontal, Flag, Trash2, Send, X, Menu,
  UserX, UserCheck, TrendingUp, ExternalLink, RefreshCw,
  Eye, Ban, AlertTriangle, Clock, ChevronRight, ChevronLeft, BarChart2,
} from 'lucide-react'
import { TikkitXLogo } from '@/components/ui/TikkitXLogo'
import {
  getMasterOrganizers, getMasterEvents, setOrgAdminStatus,
  getMasterOrgProfile, getMasterOrgEvents, getMasterEventGuests,
  getMasterAnalytics,
  type MasterOrg, type MasterEvt, type OrgProfile, type OrgEvent, type EventGuest,
  type PlatformAnalytics,
} from '@/app/actions/masterActions'

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'overview' | 'organizers' | 'events' | 'queries' | 'analytics'
type OrgStatus = 'active' | 'review' | 'suspended'
type EventStatus = 'live' | 'draft' | 'flagged' | 'suspended' | 'ended'
type QueryStatus = 'open' | 'in_progress' | 'resolved'
type QueryPriority = 'high' | 'medium' | 'low'

type Org = MasterOrg
type Evt = MasterEvt & { status: EventStatus }
interface Query { id: string; from: string; fromType: 'organizer' | 'attendee'; subject: string; status: QueryStatus; priority: QueryPriority; date: string }

const MOCK_QUERIES: Query[] = [
  { id: 'Q-001', from: 'Nightlife Karachi',          fromType: 'organizer', subject: 'Event suspension appeal — Underground Rave', status: 'open',        priority: 'high',   date: '2026-03-17' },
  { id: 'Q-002', from: 'Aisha Malik (@aisha.malik)', fromType: 'attendee',  subject: 'Refund request — BeatDrop Vol. 3',          status: 'open',        priority: 'high',   date: '2026-03-16' },
  { id: 'Q-003', from: 'Omar Productions',           fromType: 'organizer', subject: 'Payout delay — February events',            status: 'in_progress', priority: 'medium', date: '2026-03-14' },
  { id: 'Q-004', from: 'Ali Raza (@ali.raza)',        fromType: 'attendee',  subject: 'QR code not scanning at door',              status: 'resolved',    priority: 'low',    date: '2026-03-10' },
  { id: 'Q-005', from: 'Dusk Experiences',            fromType: 'organizer', subject: 'Account verification request',              status: 'in_progress', priority: 'medium', date: '2026-03-09' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SC: Record<string, string> = {
  active: '#22C55E', review: '#F59E0B', suspended: '#EF4444',
  live: '#22C55E', draft: '#6B7280', flagged: '#F97316', ended: '#4B5563',
  open: '#EF4444', in_progress: '#F59E0B', resolved: '#22C55E',
}
const SL: Record<string, string> = {
  active: 'Active', review: 'Under Review', suspended: 'Suspended',
  live: 'Live', draft: 'Draft', flagged: 'Flagged', ended: 'Ended',
  open: 'Open', in_progress: 'In Progress', resolved: 'Resolved',
}
const PC: Record<string, string> = { high: '#EF4444', medium: '#F59E0B', low: '#6B7280' }
const AVBG = ['#1E5EFF','#8B5CF6','#EC4899','#22C55E','#F97316','#06B6D4','#FFC745']

const sc = (s: string) => SC[s] ?? '#6B7280'
const sl = (s: string) => SL[s] ?? s
const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: '2-digit' })
const initials = (n: string) => n.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
const avBg = (id: string) => AVBG[id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % AVBG.length]

// ─── Status Badge ─────────────────────────────────────────────────────────────

function SBadge({ status }: { status: string }) {
  const c = sc(status)
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 'var(--fs-xs)', fontWeight: 700, color: c, background: `${c}18`, border: `1px solid ${c}30`, borderRadius: 999, padding: '3px 9px', whiteSpace: 'nowrap' }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: c, flexShrink: 0 }} />
      {sl(status)}
    </span>
  )
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, sub, color }: { icon: React.ElementType; label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="ms-stat">
      <div style={{ width: 34, height: 34, borderRadius: 10, background: `${color}14`, border: `1px solid ${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
        <Icon size={15} color={color} />
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: '#F0F2FF', letterSpacing: '-1.5px', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 'var(--fs-sm)', color: '#6B7280', fontFamily: 'var(--font-body)', marginTop: 7 }}>{label}</div>
      {sub && <div style={{ fontSize: 'var(--fs-xs)', color, fontFamily: 'var(--font-body)', marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

// ─── Contact Panel ────────────────────────────────────────────────────────────

function ContactPanel({ org, onClose }: { org: Org; onClose: () => void }) {
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)

  const send = () => {
    if (!subject || !message) return
    setSent(true)
    setTimeout(() => { setSent(false); onClose() }, 2000)
  }

  return (
    <div className="ms-overlay">
      <div className="ms-panel">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-lg)', fontWeight: 700, color: '#F0F2FF' }}>Contact Organizer</div>
            <div style={{ fontSize: 'var(--fs-xs)', color: '#EF4444', fontFamily: 'var(--font-body)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Shield size={9} /> Sending as Tikkit Admin
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#6B7280' }}>
            <X size={13} />
          </button>
        </div>

        {/* Org info */}
        <div style={{ padding: '14px 24px', background: 'rgba(30,94,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: avBg(org.id), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--fs-base)', fontWeight: 700, color: 'white', flexShrink: 0 }}>
              {initials(org.name)}
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-md)', fontWeight: 700, color: '#F0F2FF' }}>{org.name}</div>
              {org.username && <div style={{ fontSize: 'var(--fs-sm)', color: '#6B7280' }}>@{org.username}</div>}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 'var(--fs-sm)', color: '#6B7280', fontFamily: 'var(--font-body)' }}>
              <Mail size={11} color="#4B5563" /> {org.email}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 'var(--fs-sm)', color: '#6B7280', fontFamily: 'var(--font-body)' }}>
              <Phone size={11} color="#4B5563" /> {org.phone}
            </div>
          </div>
        </div>

        {/* Compose */}
        <div style={{ padding: '20px 24px', flex: 1, display: 'flex', flexDirection: 'column', gap: 14, overflow: 'auto' }}>
          <div>
            <div style={{ fontSize: 'var(--fs-2xs)', fontWeight: 700, color: '#4B5563', letterSpacing: '0.08em', marginBottom: 6, fontFamily: 'var(--font-body)' }}>FROM</div>
            <div style={{ background: '#0F1119', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '8px 12px', fontSize: 'var(--fs-base)', color: '#4B5563', fontFamily: 'var(--font-body)' }}>admin@tikkit.app</div>
          </div>
          <div>
            <div style={{ fontSize: 'var(--fs-2xs)', fontWeight: 700, color: '#4B5563', letterSpacing: '0.08em', marginBottom: 6, fontFamily: 'var(--font-body)' }}>SUBJECT</div>
            <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Account Review Notice" className="ms-input" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 'var(--fs-2xs)', fontWeight: 700, color: '#4B5563', letterSpacing: '0.08em', marginBottom: 6, fontFamily: 'var(--font-body)' }}>MESSAGE</div>
            <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Type your message here..." className="ms-textarea" rows={6} />
          </div>
        </div>

        <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: 10 }}>
          <button
            onClick={send}
            disabled={!subject || !message || sent}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: sent ? 'rgba(34,197,94,0.15)' : 'linear-gradient(135deg,#1E5EFF,#1448CC)',
              border: sent ? '1px solid rgba(34,197,94,0.35)' : 'none',
              color: sent ? '#22C55E' : 'white', borderRadius: 10, padding: '10px',
              fontSize: 'var(--fs-base)', fontWeight: 700, fontFamily: 'var(--font-display)',
              cursor: !subject || !message || sent ? 'default' : 'pointer',
              opacity: !subject || !message ? 0.45 : 1, transition: 'all 0.3s',
            }}
          >
            {sent ? <><CheckCircle size={13} /> Sent!</> : <><Send size={13} /> Send Message</>}
          </button>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#6B7280', borderRadius: 10, padding: '10px 16px', fontSize: 'var(--fs-base)', fontWeight: 600, fontFamily: 'var(--font-display)', cursor: 'pointer' }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

// ─── Organizer Detail View ────────────────────────────────────────────────────

const GUEST_SC: Record<string, string> = {
  invited: '#6B7280', confirmed: '#1E5EFF', checked_in: '#22C55E',
  checked_out: '#4B5563', cancelled: '#EF4444',
  pending: '#F59E0B', approved: '#22C55E', rejected: '#EF4444',
}
const GUEST_SL: Record<string, string> = {
  invited: 'Invited', confirmed: 'Confirmed', checked_in: 'Checked In',
  checked_out: 'Checked Out', cancelled: 'Cancelled',
  pending: 'Pending', approved: 'Approved', rejected: 'Rejected',
}
const mapEvtBadge = (s: string) =>
  ({ published: 'live', completed: 'ended', cancelled: 'suspended' }[s] ?? s)

function OrgDetailView({
  orgId, onBack, onContact, currentStatus, onStatusChange,
}: {
  orgId: string
  onBack: () => void
  onContact: (org: Org) => void
  currentStatus: OrgStatus
  onStatusChange: (id: string, s: OrgStatus) => void
}) {
  const [profile, setProfile] = useState<OrgProfile | null>(null)
  const [orgEvents, setOrgEvents] = useState<OrgEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'active' | 'draft' | 'past'>('active')
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null)
  const [guestData, setGuestData] = useState<Record<string, EventGuest[]>>({})
  const [guestLoading, setGuestLoading] = useState<string | null>(null)
  const [statusMenuOpen, setStatusMenuOpen] = useState(false)

  useEffect(() => {
    setLoading(true)
    Promise.all([getMasterOrgProfile(orgId), getMasterOrgEvents(orgId)])
      .then(([prof, evts]) => { setProfile(prof); setOrgEvents(evts) })
      .finally(() => setLoading(false))
  }, [orgId])

  const toggleGuests = (eventId: string) => {
    if (expandedEvent === eventId) { setExpandedEvent(null); return }
    setExpandedEvent(eventId)
    if (guestData[eventId] !== undefined) return
    setGuestLoading(eventId)
    getMasterEventGuests(eventId).then(guests => {
      setGuestData(prev => ({ ...prev, [eventId]: guests }))
      setGuestLoading(null)
    })
  }

  const activeEvts = orgEvents.filter(e => e.status === 'published')
  const draftEvts  = orgEvents.filter(e => e.status === 'draft')
  const pastEvts   = orgEvents.filter(e => e.status === 'completed' || e.status === 'cancelled')
  const displayEvts = activeTab === 'active' ? activeEvts : activeTab === 'draft' ? draftEvts : pastEvts

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: '#374151', fontSize: 'var(--fs-base)', fontFamily: 'var(--font-body)' }}>
      Loading profile…
    </div>
  )
  if (!profile) return (
    <div style={{ textAlign: 'center', padding: 40, color: '#374151', fontSize: 'var(--fs-base)' }}>Profile not found</div>
  )

  const displayName = profile.company_name || profile.full_name
  const avatarBg = avBg(profile.id)

  return (
    <div onClick={() => setStatusMenuOpen(false)}>
      {/* Back */}
      <button className="od-back" onClick={onBack}><ChevronLeft size={14} /> Organizers</button>

      {/* Profile card */}
      <div className="ms-card" style={{ overflow: 'visible' }}>
        {/* Banner */}
        <div className="od-banner">
          {profile.cover_image_url
            ? <img src={profile.cover_image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, ${avatarBg}40 0%, #080A14 100%)` }} />
          }
          {/* Status actions in top-right of banner */}
          <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 8 }} onClick={e => e.stopPropagation()}>
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setStatusMenuOpen(s => !s)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '6px 12px', color: '#F0F2FF', fontSize: 'var(--fs-sm)', fontWeight: 600, fontFamily: 'var(--font-body)', cursor: 'pointer' }}
              >
                <SBadge status={currentStatus} />
                <ChevronRight size={11} style={{ transform: statusMenuOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>
              {statusMenuOpen && (
                <div className="ms-dropdown" style={{ right: 0, top: 'calc(100% + 6px)' }}>
                  {currentStatus !== 'active'    && <button className="ms-drop-item dd-green" onClick={() => { onStatusChange(orgId, 'active');    setStatusMenuOpen(false) }}><UserCheck size={13} /> Restore to Active</button>}
                  {currentStatus !== 'review'    && <button className="ms-drop-item dd-amber" onClick={() => { onStatusChange(orgId, 'review');    setStatusMenuOpen(false) }}><Flag size={13} /> Put Under Review</button>}
                  {currentStatus !== 'suspended' && <button className="ms-drop-item dd-red"   onClick={() => { onStatusChange(orgId, 'suspended'); setStatusMenuOpen(false) }}><Ban size={13} /> Suspend Account</button>}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Avatar + name row */}
        <div className="od-profile-hdr">
          <div className="od-avatar-wrap">
            {profile.logo_url
              ? <img src={profile.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <div className="od-avatar-initials" style={{ background: avatarBg }}>{initials(displayName)}</div>
            }
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="od-name">{displayName}</div>
            {profile.company_name && profile.full_name !== displayName && (
              <div className="od-subname">{profile.full_name}</div>
            )}
            {profile.username && <div className="od-username">@{profile.username}</div>}
          </div>
          <div className="od-actions">
            <button className="ms-ib blue" title="Contact" onClick={() => onContact({ id: orgId, name: displayName, username: profile.username || '', email: profile.email, phone: profile.phone_number || '', events: orgEvents.length, active: activeEvts.length, status: currentStatus, joined: profile.created_at } as Org)}>
              <Mail size={13} />
            </button>
            {profile.username
              ? <Link href={`/organizer/${profile.username}`} target="_blank" className="ms-ib" title="View public profile" style={{ color: '#6B7280', textDecoration: 'none' }}><ExternalLink size={13} /></Link>
              : <span className="ms-ib" title="No username set" style={{ opacity: 0.25, cursor: 'not-allowed' }}><ExternalLink size={13} /></span>
            }
          </div>
        </div>

        {/* Info strip */}
        <div className="od-info-strip">
          {[
            { icon: Mail,     text: profile.email },
            { icon: Phone,    text: profile.phone_number || '—' },
            { icon: Calendar, text: `Joined ${fmtDate(profile.created_at)}` },
            { icon: Calendar, text: `${orgEvents.length} event${orgEvents.length !== 1 ? 's' : ''} total` },
            { icon: Users,    text: `${orgEvents.reduce((a, e) => a + e.registered, 0)} guests registered` },
          ].map(({ icon: Icon, text }, i) => (
            <div key={i} className="od-info-item">
              <Icon size={11} color="#4B5563" style={{ flexShrink: 0 }} />
              <span style={{ color: '#9CA3AF', fontSize: 'var(--fs-sm)', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Events */}
      <div style={{ marginTop: 24 }}>
        <div className="od-tabs">
          {([
            { key: 'active', label: 'Active',  count: activeEvts.length },
            { key: 'draft',  label: 'Draft',   count: draftEvts.length  },
            { key: 'past',   label: 'Past',    count: pastEvts.length   },
          ] as const).map(t => (
            <button key={t.key} className={`od-tab${activeTab === t.key ? ' active' : ''}`} onClick={() => setActiveTab(t.key)}>
              {t.label} <span className="od-tab-count">{t.count}</span>
            </button>
          ))}
        </div>

        {displayEvts.length === 0 ? (
          <div className="od-empty">No {activeTab} events</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {displayEvts.map(event => {
              const fill = event.capacity > 0 ? Math.round((event.registered / event.capacity) * 100) : 0
              const fillColor = fill > 100 ? '#EF4444' : fill > 80 ? '#F97316' : '#22C55E'
              const isExpanded = expandedEvent === event.id
              const guests = guestData[event.id] ?? []

              return (
                <div key={event.id} className="ms-card" style={{ overflow: 'visible' }}>
                  {/* Event row */}
                  <div className="od-event-hdr" onClick={() => toggleGuests(event.id)}>
                    <div className={`od-chevron${isExpanded ? ' open' : ''}`}><ChevronRight size={13} /></div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 'var(--fs-md)', fontWeight: 600, color: '#F0F2FF', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{event.title}</div>
                      <div style={{ fontSize: 'var(--fs-xs)', color: '#4B5563', marginTop: 2 }}>
                        {event.venue_name || 'Venue TBA'} · {fmtDate(event.date_start)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexShrink: 0 }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 'var(--fs-sm)', color: fillColor, marginBottom: 4 }}>{event.registered}/{event.capacity}</div>
                        <div className="ms-bar" style={{ width: 80 }}>
                          <div style={{ height: '100%', width: `${Math.min(fill, 100)}%`, background: fillColor, borderRadius: 2 }} />
                        </div>
                      </div>
                      {event.attended > 0 && (
                        <div style={{ fontSize: 'var(--fs-xs)', color: '#22C55E', whiteSpace: 'nowrap' }}>{event.attended} attended</div>
                      )}
                      <SBadge status={mapEvtBadge(event.status)} />
                    </div>
                  </div>

                  {/* Guest list */}
                  {isExpanded && (
                    <div className="od-guest-list">
                      {guestLoading === event.id ? (
                        <div style={{ padding: '24px', textAlign: 'center', color: '#374151', fontSize: 'var(--fs-sm)', fontFamily: 'var(--font-body)' }}>Loading guests…</div>
                      ) : guests.length === 0 ? (
                        <div style={{ padding: '24px', textAlign: 'center', color: '#374151', fontSize: 'var(--fs-sm)', fontFamily: 'var(--font-body)' }}>No guests on this event yet</div>
                      ) : (
                        <>
                          <div style={{ padding: '10px 20px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: 'var(--fs-xs)', fontWeight: 700, color: '#4B5563', fontFamily: 'var(--font-body)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                              {guests.length} Guest{guests.length !== 1 ? 's' : ''}
                            </span>
                            <span style={{ fontSize: 'var(--fs-xs)', color: '#374151', fontFamily: 'var(--font-body)' }}>
                              {guests.filter(g => g.checked_in_at).length} checked in
                            </span>
                          </div>
                          <div style={{ overflowX: 'auto' }}>
                            <table className="ms-tbl" style={{ minWidth: 560 }}>
                              <thead>
                                <tr>
                                  <th>Name</th>
                                  <th className="ms-hide">Email</th>
                                  <th className="ms-hide">Phone</th>
                                  <th>Status</th>
                                  <th className="ms-hide">Source</th>
                                  <th className="ms-hide">Check-in</th>
                                </tr>
                              </thead>
                              <tbody>
                                {guests.map(g => (
                                  <tr key={g.id}>
                                    <td>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                        <span style={{ fontSize: 'var(--fs-base)', fontWeight: 500, color: '#F0F2FF', fontFamily: 'var(--font-body)' }}>{g.full_name}</span>
                                        {g.is_vip && <span style={{ fontSize: 'var(--fs-2xs)', fontWeight: 800, color: '#FFC745', background: 'rgba(255,199,69,0.1)', border: '1px solid rgba(255,199,69,0.25)', borderRadius: 4, padding: '1px 5px', letterSpacing: '0.06em' }}>VIP</span>}
                                      </div>
                                    </td>
                                    <td className="ms-hide" style={{ color: '#6B7280', fontSize: 'var(--fs-sm)' }}>{g.email || '—'}</td>
                                    <td className="ms-hide" style={{ color: '#6B7280', fontSize: 'var(--fs-sm)' }}>{g.phone || '—'}</td>
                                    <td>
                                      <span style={{ fontSize: 'var(--fs-xs)', fontWeight: 700, color: GUEST_SC[g.status] ?? '#6B7280', background: `${GUEST_SC[g.status] ?? '#6B7280'}18`, border: `1px solid ${GUEST_SC[g.status] ?? '#6B7280'}28`, borderRadius: 999, padding: '2px 8px', whiteSpace: 'nowrap' }}>
                                        {GUEST_SL[g.status] ?? g.status}
                                      </span>
                                    </td>
                                    <td className="ms-hide">
                                      <span style={{ fontSize: 'var(--fs-2xs)', fontWeight: 700, color: g.source === 'invited' ? '#4D82FF' : '#9CA3AF', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                                        {g.source === 'invited' ? 'Invited' : 'Applied'}
                                      </span>
                                    </td>
                                    <td className="ms-hide" style={{ color: '#6B7280', fontSize: 'var(--fs-sm)' }}>
                                      {g.checked_in_at
                                        ? new Date(g.checked_in_at).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })
                                        : '—'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Analytics View ───────────────────────────────────────────────────────────

const AN_COLORS = ['#1E5EFF','#8B5CF6','#EC4899','#22C55E','#F97316','#06B6D4','#FFC745','#EF4444','#14B8A6','#F59E0B','#6366F1','#84CC16','#E879F9','#0EA5E9']

function GrowthChip({ value }: { value: number | null }) {
  if (value === null) return null
  const pos = value > 0, neu = value === 0
  const color = neu ? '#4B5563' : pos ? '#22C55E' : '#EF4444'
  return (
    <span style={{ fontSize: 'var(--fs-2xs)', fontWeight: 700, color, background: `${color}14`, border: `1px solid ${color}22`, borderRadius: 999, padding: '2px 7px', whiteSpace: 'nowrap', fontFamily: 'var(--font-body)' }}>
      {neu ? '—' : pos ? `↑ +${value}%` : `↓ ${value}%`}
    </span>
  )
}

function AnalyticsView({ onOrgClick }: { onOrgClick: (id: string) => void }) {
  const [data, setData] = useState<PlatformAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [sortKey, setSortKey] = useState<'totalRegistrations' | 'totalEvents' | 'avgFillRate'>('totalRegistrations')
  const [topEvtTab, setTopEvtTab] = useState<'fill' | 'regs'>('fill')

  useEffect(() => {
    getMasterAnalytics().then(d => { setData(d); setLoading(false) })
  }, [])

  if (loading || !data) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 280, flexDirection: 'column', gap: 12 }}>
      <div style={{ width: 28, height: 28, border: '2px solid rgba(30,94,255,0.2)', borderTopColor: '#1E5EFF', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <div style={{ fontSize: 'var(--fs-sm)', color: '#374151', fontFamily: 'var(--font-body)' }}>Crunching platform data…</div>
    </div>
  )

  const { kpis, topOrganizers, categoryBreakdown, topEventsByFill, topEventsByRegs, registrationTrend, statusDistribution } = data

  const maxTrend   = Math.max(...registrationTrend.map(t => t.count), 1)
  const maxCatRegs = Math.max(...categoryBreakdown.map(c => c.registrations), 1)
  const totalEvtForStatus = Object.values(statusDistribution).reduce((a, b) => a + b, 0)
  const sortedOrgs = [...topOrganizers].sort((a, b) => b[sortKey] - a[sortKey])
  const topEvts = topEvtTab === 'fill' ? topEventsByFill : topEventsByRegs
  const maxTopEvtMetric = topEvtTab === 'fill' ? 100 : Math.max(...topEventsByRegs.map(e => e.registered), 1)

  return (
    <div>
      {/* ── KPI row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total Organizers',   value: kpis.totalOrganizers,   sub: `+${kpis.newOrgsThisMonth} this month`,  growth: kpis.orgGrowth,  color: '#1E5EFF', icon: Users       },
          { label: 'Total Events',        value: kpis.totalEvents,        sub: `${kpis.liveEvents} live now`,           growth: null,            color: '#22C55E', icon: Calendar    },
          { label: 'Total Registrations', value: kpis.totalRegistrations, sub: `+${kpis.newRegsThisMonth} this month`, growth: kpis.regGrowth,  color: '#FFC745', icon: TrendingUp  },
          { label: 'Avg Fill Rate',       value: `${kpis.avgFillRate}%`,  sub: 'across all events',                     growth: null,            color: '#8B5CF6', icon: BarChart2   },
        ].map(({ label, value, sub, growth, color, icon: Icon }) => (
          <div key={label} className="ms-stat">
            <div style={{ width: 32, height: 32, borderRadius: 9, background: `${color}14`, border: `1px solid ${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              <Icon size={14} color={color} />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: '#F0F2FF', letterSpacing: '-1.5px', lineHeight: 1 }}>{value.toLocaleString()}</div>
              {growth !== undefined && <GrowthChip value={growth} />}
            </div>
            <div style={{ fontSize: 'var(--fs-sm)', color: '#6B7280', fontFamily: 'var(--font-body)', marginTop: 6 }}>{label}</div>
            <div style={{ fontSize: 'var(--fs-xs)', color, fontFamily: 'var(--font-body)', marginTop: 3 }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* ── Trend + Status row ── */}
      <div className="ms-two-col" style={{ marginBottom: 22 }}>
        {/* Registration trend */}
        <div className="ms-card">
          <div className="ms-card-hdr">
            <span className="ms-card-title">Registration Trend</span>
            <span style={{ fontSize: 'var(--fs-xs)', color: '#374151', fontFamily: 'var(--font-body)' }}>Last 6 months</span>
          </div>
          <div style={{ padding: '20px 24px 16px', display: 'flex', gap: 10, alignItems: 'flex-end', height: 160 }}>
            {registrationTrend.map((t, i) => {
              const isLatest = i === registrationTrend.length - 1
              const h = maxTrend > 0 ? Math.max((t.count / maxTrend) * 100, t.count > 0 ? 6 : 0) : 0
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, height: '100%' }}>
                  <div style={{ fontSize: 'var(--fs-2xs)', color: t.count > 0 ? '#9CA3AF' : 'transparent', fontFamily: 'var(--font-body)', fontWeight: 600 }}>{t.count}</div>
                  <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end' }}>
                    <div style={{ width: '100%', height: `${h}%`, background: isLatest ? '#1E5EFF' : 'rgba(30,94,255,0.28)', borderRadius: '4px 4px 0 0', transition: 'height 0.5s ease', minHeight: 0 }} />
                  </div>
                  <div style={{ fontSize: 'var(--fs-2xs)', color: isLatest ? '#4D82FF' : '#374151', fontFamily: 'var(--font-body)', fontWeight: isLatest ? 700 : 400 }}>{t.label}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Status distribution */}
        <div className="ms-card">
          <div className="ms-card-hdr"><span className="ms-card-title">Event Status Mix</span></div>
          <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { key: 'published', label: 'Published / Live', color: '#22C55E' },
              { key: 'completed', label: 'Completed',         color: '#4D82FF' },
              { key: 'draft',     label: 'Draft',             color: '#6B7280' },
              { key: 'cancelled', label: 'Cancelled',         color: '#EF4444' },
            ].map(s => {
              const count = statusDistribution[s.key] || 0
              const pct = totalEvtForStatus > 0 ? Math.round((count / totalEvtForStatus) * 100) : 0
              return (
                <div key={s.key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 7, height: 7, borderRadius: 2, background: s.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 'var(--fs-sm)', color: '#9CA3AF', fontFamily: 'var(--font-body)' }}>{s.label}</span>
                    </div>
                    <span style={{ fontSize: 'var(--fs-sm)', color: '#6B7280', fontFamily: 'var(--font-body)' }}>{count} <span style={{ color: '#374151' }}>({pct}%)</span></span>
                  </div>
                  <div style={{ height: 5, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: s.color, borderRadius: 3, opacity: 0.75 }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Organizer Rankings ── */}
      <div className="ms-card" style={{ marginBottom: 22 }}>
        <div className="ms-card-hdr">
          <span className="ms-card-title">Organizer Rankings</span>
          <div className="ms-pills">
            {([
              { key: 'totalRegistrations', label: 'By Guests'    },
              { key: 'totalEvents',        label: 'By Events'    },
              { key: 'avgFillRate',        label: 'By Fill Rate' },
            ] as const).map(s => (
              <button key={s.key} className={`ms-pill${sortKey === s.key ? ' pa' : ''}`} onClick={() => setSortKey(s.key)}>
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="ms-tbl" style={{ minWidth: 640 }}>
            <thead>
              <tr>
                <th style={{ width: 40 }}>#</th>
                <th>Organizer</th>
                <th>Events</th>
                <th>Total Guests</th>
                <th>Avg Fill</th>
                <th className="ms-hide">Live Now</th>
              </tr>
            </thead>
            <tbody>
              {sortedOrgs.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: '#374151' }}>No organizer data yet</td></tr>
              )}
              {sortedOrgs.map((org, i) => {
                const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null
                return (
                  <tr key={org.id}>
                    <td style={{ color: medal ? '#FFC745' : '#374151', fontWeight: 700, fontSize: medal ? 16 : 12 }}>
                      {medal ?? `${i + 1}`}
                    </td>
                    <td>
                      <div className="od-clickable" style={{ display: 'flex', alignItems: 'center', gap: 10 }} onClick={() => onOrgClick(org.id)}>
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: avBg(org.id), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--fs-2xs)', fontWeight: 700, color: '#fff', flexShrink: 0 }}>{initials(org.name)}</div>
                        <div>
                          <div className="od-name-text" style={{ fontSize: 'var(--fs-base)', fontWeight: 600, color: '#F0F2FF', fontFamily: 'var(--font-body)', transition: 'color 0.15s' }}>{org.name}</div>
                          {org.username && <div style={{ fontSize: 'var(--fs-xs)', color: '#4B5563' }}>@{org.username}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: 'var(--fs-base)', color: '#9CA3AF' }}>{org.totalEvents}</td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-lg)', fontWeight: 800, color: '#F0F2FF', letterSpacing: '-0.5px' }}>{org.totalRegistrations.toLocaleString()}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 'var(--fs-base)', fontWeight: 700, color: org.avgFillRate >= 80 ? '#22C55E' : org.avgFillRate >= 50 ? '#F59E0B' : '#6B7280', minWidth: 36 }}>{org.avgFillRate}%</span>
                        <div className="ms-bar" style={{ width: 56 }}>
                          <div style={{ height: '100%', width: `${Math.min(org.avgFillRate, 100)}%`, background: org.avgFillRate >= 80 ? '#22C55E' : org.avgFillRate >= 50 ? '#F59E0B' : '#4B5563', borderRadius: 2 }} />
                        </div>
                      </div>
                    </td>
                    <td className="ms-hide">
                      {org.liveEvents > 0
                        ? <span style={{ fontSize: 'var(--fs-xs)', fontWeight: 700, color: '#22C55E', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.22)', borderRadius: 999, padding: '2px 8px' }}>{org.liveEvents} live</span>
                        : <span style={{ color: '#2D3140', fontSize: 'var(--fs-sm)' }}>—</span>
                      }
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Category + Top Events ── */}
      <div className="ms-two-col">
        {/* Category performance */}
        <div className="ms-card">
          <div className="ms-card-hdr"><span className="ms-card-title">Category Performance</span></div>
          <div style={{ padding: '14px 20px 18px', display: 'flex', flexDirection: 'column', gap: 13 }}>
            {categoryBreakdown.length === 0 && <div style={{ color: '#374151', fontSize: 'var(--fs-sm)', textAlign: 'center', padding: 24 }}>No category data</div>}
            {categoryBreakdown.slice(0, 10).map((cat, i) => {
              const pct = Math.round((cat.registrations / maxCatRegs) * 100)
              const color = AN_COLORS[i % AN_COLORS.length]
              return (
                <div key={i}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
                      {cat.icon && <span style={{ fontSize: 'var(--fs-md)', flexShrink: 0 }}>{cat.icon}</span>}
                      <span style={{ fontSize: 'var(--fs-sm)', color: '#D1D5DB', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cat.name}</span>
                      <span style={{ fontSize: 'var(--fs-2xs)', color: '#374151', fontFamily: 'var(--font-body)', flexShrink: 0 }}>{cat.eventCount} events</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, color: '#9CA3AF' }}>{cat.registrations}</span>
                      <span style={{ fontSize: 'var(--fs-2xs)', color: '#374151' }}>{cat.avgFillRate}% fill</span>
                    </div>
                  </div>
                  <div style={{ height: 5, background: 'rgba(255,255,255,0.04)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, opacity: 0.8 }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Top events */}
        <div className="ms-card">
          <div className="ms-card-hdr">
            <span className="ms-card-title">Top Events</span>
            <div style={{ display: 'flex', gap: 5 }}>
              <button className={`ms-pill${topEvtTab === 'fill' ? ' pg' : ''}`} onClick={() => setTopEvtTab('fill')}>Fill Rate</button>
              <button className={`ms-pill${topEvtTab === 'regs' ? ' pa' : ''}`} onClick={() => setTopEvtTab('regs')}>Registrations</button>
            </div>
          </div>
          <div>
            {topEvts.length === 0 && <div style={{ color: '#374151', fontSize: 'var(--fs-sm)', textAlign: 'center', padding: 32 }}>No events yet</div>}
            {topEvts.map((evt, i) => {
              const fillRate = (evt as any).fillRate as number | undefined
              const metric = topEvtTab === 'fill' ? `${fillRate ?? 0}%` : evt.registered.toLocaleString()
              const barW = topEvtTab === 'fill' ? (fillRate ?? 0) : Math.round((evt.registered / maxTopEvtMetric) * 100)
              const barColor = topEvtTab === 'fill' ? ((fillRate ?? 0) >= 80 ? '#22C55E' : (fillRate ?? 0) >= 50 ? '#F59E0B' : '#6B7280') : '#1E5EFF'
              return (
                <div key={evt.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 20px', borderBottom: i < topEvts.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                  <div style={{ width: 22, height: 22, borderRadius: 6, background: avBg(evt.id), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--fs-2xs)', fontWeight: 800, color: '#fff', flexShrink: 0 }}>{i + 1}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 'var(--fs-base)', fontWeight: 600, color: '#F0F2FF', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{evt.title}</div>
                    <div style={{ fontSize: 'var(--fs-xs)', color: '#4B5563', marginTop: 2 }}>{evt.org}</div>
                    <div style={{ height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 2, marginTop: 6, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${barW}%`, background: barColor, borderRadius: 2, opacity: 0.8 }} />
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-xl)', fontWeight: 800, color: '#F0F2FF', letterSpacing: '-0.5px' }}>{metric}</div>
                    <div style={{ fontSize: 'var(--fs-2xs)', color: '#374151', fontFamily: 'var(--font-body)' }}>{evt.registered}/{evt.capacity}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Auth Gate ────────────────────────────────────────────────────────────────

const MASTER_KEY = 'tkmaster2026' // ⚠️  change before going to production

function NotFoundGate({ onAuth }: { onAuth: () => void }) {
  const [showModal, setShowModal] = useState(false)
  const [pwd, setPwd] = useState('')
  const [shake, setShake] = useState(false)
  const clickCount = useRef(0)
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleSecretClick = () => {
    clickCount.current += 1
    if (clickTimer.current) clearTimeout(clickTimer.current)
    clickTimer.current = setTimeout(() => { clickCount.current = 0 }, 2500)
    if (clickCount.current >= 5) {
      clickCount.current = 0
      setShowModal(true)
    }
  }

  const handleSubmit = () => {
    if (pwd === MASTER_KEY) {
      sessionStorage.setItem('_ms', '1')
      onAuth()
    } else {
      setShake(true)
      setPwd('')
      setTimeout(() => setShake(false), 600)
    }
  }

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        .nf-page { min-height:100vh; background:#0A0C14; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px; padding:40px 24px; font-family:var(--font-body,'Inter',sans-serif); position:relative; }
        .nf-code { font-family:var(--font-display,'Space Grotesk',sans-serif); font-size:clamp(80px,18vw,180px); font-weight:900; color:rgba(255,255,255,0.04); letter-spacing:-6px; line-height:1; transition:color 0.15s; }
        .nf-code:active { color:rgba(255,255,255,0.06); }
        .nf-heading { font-family:var(--font-display,'Space Grotesk',sans-serif); font-size:clamp(20px,4vw,28px); font-weight:700; color:#F0F2FF; letter-spacing:-0.5px; }
        .nf-sub { font-size:14px; color:#4B5563; text-align:center; max-width:360px; line-height:1.6; }
        .nf-btn { margin-top:8px; display:inline-block; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1); color:#9CA3AF; font-size:13px; font-family:var(--font-body,'Inter',sans-serif); text-decoration:none; border-radius:10px; padding:9px 20px; transition:all 0.2s; }
        .nf-btn:hover { background:rgba(255,255,255,0.08); color:#F0F2FF; }
        .nf-footer { position:absolute; bottom:24px; font-size:11px; color:#1F2937; }
        .nf-modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.72); backdrop-filter:blur(6px); display:flex; align-items:center; justify-content:center; z-index:999; }
        .nf-modal { background:#0F1120; border:1px solid rgba(255,255,255,0.08); border-radius:18px; padding:34px 28px; display:flex; flex-direction:column; align-items:center; gap:18px; width:min(340px,90vw); }
        .nf-modal-input { background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1); border-radius:10px; padding:12px 16px; color:#F0F2FF; font-size:18px; letter-spacing:5px; width:100%; text-align:center; outline:none; font-family:var(--font-body,'Inter',sans-serif); transition:border-color 0.2s; }
        .nf-modal-input::placeholder { letter-spacing:2px; font-size:14px; color:#374151; }
        .nf-modal-input:focus { border-color:rgba(30,94,255,0.45); }
        .nf-modal-btn { background:#1E5EFF; border:none; border-radius:10px; padding:12px 24px; color:#fff; font-size:14px; font-weight:700; font-family:var(--font-body,'Inter',sans-serif); cursor:pointer; width:100%; transition:opacity 0.2s; letter-spacing:0.02em; }
        .nf-modal-btn:hover { opacity:0.88; }
        @keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 40%{transform:translateX(8px)} 60%{transform:translateX(-5px)} 80%{transform:translateX(5px)} }
        .nf-modal-input.shake { animation:shake 0.5s ease; border-color:rgba(239,68,68,0.5) !important; }
      `}</style>

      <div className="nf-page">
        <div
          className="nf-code"
          onClick={handleSecretClick}
          style={{ cursor: 'default', userSelect: 'none' }}
        >
          404
        </div>
        <div className="nf-heading">Page not found</div>
        <div className="nf-sub">The page you&apos;re looking for doesn&apos;t exist or has been moved.</div>
        <Link href="/" className="nf-btn">← Back to Tikkit</Link>
        <div className="nf-footer">© {new Date().getFullYear()} Tikkit</div>
      </div>

      {showModal && (
        <div className="nf-modal-overlay" onClick={() => { setShowModal(false); setPwd('') }}>
          <div className="nf-modal" onClick={e => e.stopPropagation()}>
            <TikkitXLogo size="sm" />
            <input
              className={`nf-modal-input${shake ? ' shake' : ''}`}
              type="password"
              value={pwd}
              onChange={e => setPwd(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              autoFocus
              placeholder="············"
            />
            <button className="nf-modal-btn" onClick={handleSubmit}>Continue →</button>
          </div>
        </div>
      )}
    </>
  )
}

// ─── Master Dashboard ─────────────────────────────────────────────────────────

export default function MasterPage() {
  const [authed, setAuthed] = useState(false)
  const [tab, setTab] = useState<Tab>('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('_ms') === '1') {
      setAuthed(true)
    }
  }, [])

  // Real data
  const [orgs, setOrgs] = useState<Org[]>([])
  const [events, setEvents] = useState<Evt[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!authed) return
    setLoading(true)
    Promise.all([getMasterOrganizers(), getMasterEvents()])
      .then(([orgsData, evtsData]) => {
        setOrgs(orgsData as Org[])
        setEvents(evtsData as Evt[])
      })
      .finally(() => setLoading(false))
  }, [authed])

  // Organizers state
  const [orgStatuses, setOrgStatuses] = useState<Record<string, OrgStatus>>({})
  const [removedOrgs, setRemovedOrgs] = useState<Set<string>>(new Set())
  const [orgFilter, setOrgFilter] = useState<'all' | OrgStatus>('all')
  const [orgSearch, setOrgSearch] = useState('')
  const [openOrgMenu, setOpenOrgMenu] = useState<string | null>(null)
  const [orgMenuPos, setOrgMenuPos] = useState<{ top: number; right: number }>({ top: 0, right: 0 })
  const [contactTarget, setContactTarget] = useState<Org | null>(null)

  // Events state
  const [eventStatuses, setEventStatuses] = useState<Record<string, EventStatus>>({})
  const [eventFilter, setEventFilter] = useState<'all' | EventStatus>('all')
  const [eventSearch, setEventSearch] = useState('')
  const [openEvtMenu, setOpenEvtMenu] = useState<string | null>(null)
  const [evtMenuPos, setEvtMenuPos] = useState<{ top: number; right: number }>({ top: 0, right: 0 })

  // Queries state
  const [queryStatuses, setQueryStatuses] = useState<Record<string, QueryStatus>>({})
  const [queryFilter, setQueryFilter] = useState<'all' | QueryStatus>('all')

  // Derived
  const liveOrgs = orgs.filter(o => !removedOrgs.has(o.id))
  const getOrgStatus = (o: Org): OrgStatus => orgStatuses[o.id] ?? o.status
  const setOrgStatus = (id: string, s: OrgStatus) => {
    setOrgStatuses(prev => ({...prev,[id]:s}))
    setOpenOrgMenu(null)
    setOrgAdminStatus(id, s) // persist to DB — fire and forget
  }
  const getEvtStatus = (e: Evt): EventStatus => eventStatuses[e.id] ?? e.status
  const getQStatus = (q: Query): QueryStatus => queryStatuses[q.id] ?? q.status

  const filteredOrgs = liveOrgs
    .filter(o => orgFilter === 'all' || getOrgStatus(o) === orgFilter)
    .filter(o => !orgSearch || o.name.toLowerCase().includes(orgSearch.toLowerCase()) || (o.username && o.username.toLowerCase().includes(orgSearch.toLowerCase())) || (o.email && o.email.toLowerCase().includes(orgSearch.toLowerCase())))

  const filteredEvents = events
    .filter(e => eventFilter === 'all' || getEvtStatus(e) === eventFilter)
    .filter(e => !eventSearch || e.title.toLowerCase().includes(eventSearch.toLowerCase()) || e.org.toLowerCase().includes(eventSearch.toLowerCase()))

  const filteredQueries = MOCK_QUERIES
    .filter(q => queryFilter === 'all' || getQStatus(q) === queryFilter)

  const openQCount = MOCK_QUERIES.filter(q => getQStatus(q) === 'open').length
  const reviewOrgCount = liveOrgs.filter(o => getOrgStatus(o) === 'review').length
  const flaggedEvtCount = events.filter(e => getEvtStatus(e) === 'flagged').length
  const liveEvtCount = events.filter(e => getEvtStatus(e) === 'live').length
  const totalRegistered = events.reduce((a, e) => a + e.registered, 0)

  const NAV = [
    { id: 'overview'   as Tab, icon: LayoutDashboard, label: 'Overview' },
    { id: 'organizers' as Tab, icon: Users,           label: 'Organizers',         badge: reviewOrgCount > 0 ? reviewOrgCount : undefined },
    { id: 'events'     as Tab, icon: Calendar,        label: 'Events',             badge: flaggedEvtCount > 0 ? flaggedEvtCount : undefined },
    { id: 'analytics'  as Tab, icon: BarChart2,       label: 'Analytics'           },
    { id: 'queries'    as Tab, icon: MessageSquare,   label: 'Queries & Disputes', badge: openQCount > 0 ? openQCount : undefined },
  ]

  const PAGE_TITLES: Record<Tab, string> = {
    overview: 'Overview', organizers: 'Organizers', events: 'Events', queries: 'Queries & Disputes', analytics: 'Analytics',
  }

  if (!authed) return <NotFoundGate onAuth={() => setAuthed(true)} />

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: #080A10; color: #F0F2FF; font-family: var(--font-body); -webkit-font-smoothing: antialiased; overflow-x: hidden; }

        /* ── Shell ── */
        .ms-shell { display: flex; min-height: 100vh; }

        /* ── Sidebar ── */
        .ms-sidebar {
          width: 240px; flex-shrink: 0;
          background: #0A0C14; border-right: 1px solid rgba(255,255,255,0.06);
          position: fixed; top: 0; left: 0; bottom: 0; z-index: 60;
          display: flex; flex-direction: column; overflow-y: auto;
          transition: transform 0.28s cubic-bezier(0.4,0,0.2,1);
        }
        .ms-sidebar-hdr {
          padding: 20px 20px 14px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .ms-admin-badge {
          display: inline-flex; align-items: center; gap: 5px; margin-top: 10px;
          background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.22);
          border-radius: 6px; padding: 3px 8px;
          font-size: 10px; font-weight: 700; color: #EF4444; letter-spacing: 0.1em;
          font-family: var(--font-body);
        }
        .ms-nav-btn {
          display: flex; align-items: center; gap: 10px;
          padding: 9px 14px; margin: 2px 10px; border-radius: 9px;
          font-size: 13px; font-weight: 500; color: #6B7280;
          font-family: var(--font-body); cursor: pointer;
          background: none; border: none; width: calc(100% - 20px); text-align: left;
          transition: background 0.15s, color 0.15s;
        }
        .ms-nav-btn:hover { background: rgba(255,255,255,0.04); color: #9CA3AF; }
        .ms-nav-btn.ms-active { background: rgba(30,94,255,0.1); color: #4D82FF; }
        .ms-nav-dot {
          margin-left: auto; background: rgba(239,68,68,0.16);
          border: 1px solid rgba(239,68,68,0.28); color: #EF4444;
          font-size: 10px; font-weight: 700; border-radius: 999px; padding: 1px 6px;
          font-family: var(--font-body);
        }
        .ms-sidebar-footer {
          padding: 14px 20px; border-top: 1px solid rgba(255,255,255,0.05);
          font-size: 10px; color: #2D3140; font-family: var(--font-body);
          text-align: center; letter-spacing: 0.06em; margin-top: auto;
        }

        /* ── Main ── */
        .ms-main { flex: 1; margin-left: 240px; min-height: 100vh; display: flex; flex-direction: column; }
        .ms-topbar {
          height: 54px; padding: 0 28px;
          display: flex; align-items: center; justify-content: space-between;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          background: rgba(8,10,16,0.85); backdrop-filter: blur(12px);
          position: sticky; top: 0; z-index: 40;
        }
        .ms-page-title { font-family: var(--font-display); font-size: 16px; font-weight: 700; color: '#F0F2FF'; letter-spacing: -0.3px; }
        .ms-body { padding: 28px; flex: 1; }

        /* ── Stats ── */
        .ms-stats { display: grid; grid-template-columns: repeat(4,1fr); gap: 16px; margin-bottom: 28px; }
        .ms-stat { background: #0D0F18; border: 1px solid rgba(255,255,255,0.07); border-radius: 14px; padding: 20px; transition: border-color 0.2s; }
        .ms-stat:hover { border-color: rgba(255,255,255,0.12); }

        /* ── Section cards ── */
        .ms-card { background: #0D0F18; border: 1px solid rgba(255,255,255,0.07); border-radius: 14px; overflow: hidden; }
        .ms-card-hdr {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 20px; border-bottom: 1px solid rgba(255,255,255,0.06);
          gap: 12px; flex-wrap: wrap;
        }
        .ms-card-title { font-family: var(--font-display); font-size: 14px; font-weight: 700; color: #F0F2FF; letter-spacing: -0.2px; }

        /* ── Tables ── */
        .ms-tbl { width: 100%; border-collapse: collapse; }
        .ms-tbl th {
          padding: 9px 18px; text-align: left;
          font-size: 10px; font-weight: 700; color: #374151;
          letter-spacing: 0.08em; text-transform: uppercase;
          background: rgba(255,255,255,0.015); border-bottom: 1px solid rgba(255,255,255,0.05);
          font-family: var(--font-body); white-space: nowrap;
        }
        .ms-tbl td { padding: 12px 18px; border-bottom: 1px solid rgba(255,255,255,0.04); font-size: 13px; color: #D1D5DB; font-family: var(--font-body); vertical-align: middle; }
        .ms-tbl tr:last-child td { border-bottom: none; }
        .ms-tbl tbody tr { transition: background 0.12s; }
        .ms-tbl tbody tr:hover { background: rgba(255,255,255,0.02); }

        /* ── Search ── */
        .ms-search {
          display: flex; align-items: center; gap: 8px;
          background: #0F1119; border: 1px solid rgba(255,255,255,0.08);
          border-radius: 9px; padding: 7px 12px; width: 220px;
          transition: border-color 0.2s;
        }
        .ms-search:focus-within { border-color: rgba(30,94,255,0.4); }
        .ms-search input { background: none; border: none; outline: none; color: #D1D5DB; font-size: 13px; font-family: var(--font-body); width: 100%; }
        .ms-search input::placeholder { color: #2D3140; }

        /* ── Filter pills ── */
        .ms-pills { display: flex; gap: 6px; flex-wrap: wrap; }
        .ms-pill {
          padding: 4px 12px; border-radius: 999px; font-size: 11px; font-weight: 700;
          cursor: pointer; border: 1px solid rgba(255,255,255,0.08);
          background: transparent; color: #4B5563; font-family: var(--font-body);
          transition: all 0.15s;
        }
        .ms-pill:hover { background: rgba(255,255,255,0.04); color: #9CA3AF; }
        .ms-pill.pa { background: rgba(30,94,255,0.1); border-color: rgba(30,94,255,0.3); color: #4D82FF; }
        .ms-pill.pg { background: rgba(34,197,94,0.1); border-color: rgba(34,197,94,0.28); color: #22C55E; }
        .ms-pill.py { background: rgba(245,158,11,0.1); border-color: rgba(245,158,11,0.28); color: #F59E0B; }
        .ms-pill.pr { background: rgba(239,68,68,0.1); border-color: rgba(239,68,68,0.28); color: #EF4444; }
        .ms-pill.pn { background: rgba(107,114,128,0.1); border-color: rgba(107,114,128,0.28); color: #9CA3AF; }

        /* ── Icon buttons ── */
        .ms-ib {
          display: inline-flex; align-items: center; justify-content: center;
          width: 28px; height: 28px; border-radius: 7px;
          border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.03);
          color: #6B7280; cursor: pointer; transition: all 0.15s; flex-shrink: 0;
        }
        .ms-ib:hover { background: rgba(255,255,255,0.07); color: #9CA3AF; }
        .ms-ib.danger:hover { background: rgba(239,68,68,0.12); border-color: rgba(239,68,68,0.25); color: #EF4444; }
        .ms-ib.amber:hover  { background: rgba(245,158,11,0.12); border-color: rgba(245,158,11,0.25); color: #F59E0B; }
        .ms-ib.blue:hover   { background: rgba(30,94,255,0.12);  border-color: rgba(30,94,255,0.25);  color: #4D82FF; }
        .ms-ib.green:hover  { background: rgba(34,197,94,0.12);  border-color: rgba(34,197,94,0.25);  color: #22C55E; }

        /* ── Dropdown menu ── */
        .ms-menu { position: relative; display: inline-flex; }
        .ms-dropdown {
          position: absolute; right: 0; top: calc(100% + 6px); z-index: 100;
          background: #141620; border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px; padding: 5px; min-width: 180px;
          box-shadow: 0 12px 40px rgba(0,0,0,0.5);
          animation: dropIn 0.15s ease;
        }
        @keyframes dropIn { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }
        .ms-drop-item {
          display: flex; align-items: center; gap: 9px;
          padding: 8px 10px; border-radius: 7px; cursor: pointer;
          font-size: 12px; font-weight: 500; color: #9CA3AF;
          font-family: var(--font-body); transition: background 0.12s;
          border: none; background: none; width: 100%; text-align: left; text-decoration: none;
        }
        .ms-drop-item:hover { background: rgba(255,255,255,0.05); color: #F0F2FF; }
        .ms-drop-item.dd-red { color: #EF4444; }
        .ms-drop-item.dd-red:hover { background: rgba(239,68,68,0.1); }
        .ms-drop-item.dd-amber { color: #F59E0B; }
        .ms-drop-item.dd-amber:hover { background: rgba(245,158,11,0.1); }
        .ms-drop-item.dd-green { color: #22C55E; }
        .ms-drop-item.dd-green:hover { background: rgba(34,197,94,0.1); }
        .ms-drop-divider { height: 1px; background: rgba(255,255,255,0.06); margin: 4px 0; }

        /* ── Two-column layout ── */
        .ms-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }

        /* ── Overview activity ── */
        .ms-activity-row { display: flex; align-items: flex-start; gap: 12px; padding: 12px 18px; border-bottom: 1px solid rgba(255,255,255,0.04); }
        .ms-activity-row:last-child { border-bottom: none; }

        /* ── Contact overlay ── */
        .ms-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.65); backdrop-filter: blur(4px); z-index: 200; display: flex; justify-content: flex-end; }
        .ms-panel { width: 440px; max-width: 100%; background: #0D0F18; border-left: 1px solid rgba(255,255,255,0.08); display: flex; flex-direction: column; animation: slideR 0.25s ease; }
        @keyframes slideR { from { transform: translateX(32px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .ms-input { width: 100%; background: #0F1119; border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 9px 12px; font-size: 13px; color: #F0F2FF; font-family: var(--font-body); outline: none; transition: border-color 0.2s; }
        .ms-input:focus { border-color: rgba(30,94,255,0.4); }
        .ms-textarea { width: 100%; background: #0F1119; border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 9px 12px; font-size: 13px; color: #F0F2FF; font-family: var(--font-body); outline: none; resize: vertical; transition: border-color 0.2s; min-height: 120px; }
        .ms-textarea:focus { border-color: rgba(30,94,255,0.4); }

        /* ── Capacity bar ── */
        .ms-bar { height: 4px; border-radius: 2px; background: rgba(255,255,255,0.06); overflow: hidden; width: 60px; }

        /* ── Hamburger ── */
        .ms-ham { display: none; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; width: 34px; height: 34px; align-items: center; justify-content: center; cursor: pointer; color: #6B7280; }

        /* ── Mobile overlay ── */
        .ms-mob-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 59; }

        /* ── Responsive ── */
        @media (max-width: 1060px) {
          .ms-stats { grid-template-columns: repeat(2,1fr); }
          .ms-two-col { grid-template-columns: 1fr; }
        }
        @media (max-width: 960px) {
          .ms-sidebar { transform: translateX(-100%); }
          .ms-sidebar.open { transform: translateX(0); box-shadow: 20px 0 60px rgba(0,0,0,0.5); }
          .ms-mob-overlay.open { display: block; }
          .ms-main { margin-left: 0; }
          .ms-ham { display: flex; }
          .ms-body { padding: 16px; }
          .ms-topbar { padding: 0 16px; }
          .ms-card-hdr { flex-direction: column; align-items: flex-start; }
          .ms-search { width: 100%; }
          .ms-hide { display: none; }
        }
        @media (max-width: 520px) {
          .ms-stats { grid-template-columns: 1fr 1fr; gap: 10px; }
          .ms-stat { padding: 14px; }
        }

        /* ── Organizer Detail ── */
        .od-back { display:flex; align-items:center; gap:6px; background:none; border:none; color:#4D82FF; font-size:13px; font-family:var(--font-body); font-weight:600; cursor:pointer; padding:0; margin-bottom:20px; transition:color 0.15s; }
        .od-back:hover { color:#7AA3FF; }
        .od-banner { height:140px; border-radius:12px 12px 0 0; position:relative; overflow:hidden; background:#0D111F; }
        .od-profile-hdr { padding:0 22px 18px; display:flex; align-items:flex-end; gap:14px; flex-wrap:wrap; }
        .od-avatar-wrap { width:72px; height:72px; border-radius:16px; border:3px solid #0A0C14; overflow:hidden; flex-shrink:0; margin-top:-36px; position:relative; z-index:1; }
        .od-avatar-initials { width:100%; height:100%; display:flex; align-items:center; justify-content:center; font-size:22px; font-weight:800; color:#fff; font-family:var(--font-display); }
        .od-name { font-family:var(--font-display); font-size:20px; font-weight:800; color:#F0F2FF; letter-spacing:-0.5px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .od-subname { font-size:13px; color:#9CA3AF; margin-top:2px; }
        .od-username { font-size:12px; color:#4B5563; margin-top:2px; }
        .od-actions { display:flex; align-items:center; gap:8px; flex-wrap:wrap; padding-top:6px; margin-left:auto; }
        .od-info-strip { display:flex; flex-wrap:wrap; border-top:1px solid rgba(255,255,255,0.06); }
        .od-info-item { display:flex; align-items:center; gap:7px; padding:11px 18px; flex:1; min-width:140px; border-right:1px solid rgba(255,255,255,0.05); }
        .od-info-item:last-child { border-right:none; }
        .od-tabs { display:flex; gap:4px; margin-bottom:16px; background:#0D0F18; border:1px solid rgba(255,255,255,0.07); border-radius:10px; padding:4px; width:fit-content; }
        .od-tab { padding:7px 16px; border-radius:7px; font-size:12px; font-weight:600; color:#4B5563; background:none; border:none; cursor:pointer; font-family:var(--font-body); transition:all 0.15s; display:flex; align-items:center; gap:6px; white-space:nowrap; }
        .od-tab:hover { color:#9CA3AF; }
        .od-tab.active { background:rgba(30,94,255,0.12); color:#4D82FF; }
        .od-tab-count { font-size:10px; font-weight:700; background:rgba(255,255,255,0.06); border-radius:999px; padding:1px 6px; }
        .od-tab.active .od-tab-count { background:rgba(30,94,255,0.18); }
        .od-empty { background:#0D0F18; border:1px solid rgba(255,255,255,0.07); border-radius:12px; padding:48px 24px; text-align:center; color:#374151; font-size:13px; font-family:var(--font-body); }
        .od-event-hdr { display:flex; align-items:center; gap:14px; padding:16px 20px; cursor:pointer; transition:background 0.15s; border-radius:12px 12px 0 0; }
        .od-event-hdr:hover { background:rgba(255,255,255,0.02); }
        .od-chevron { color:#4B5563; transition:transform 0.2s; flex-shrink:0; }
        .od-chevron.open { transform:rotate(90deg); }
        .od-guest-list { border-top:1px solid rgba(255,255,255,0.06); }
        .od-clickable { cursor:pointer; }
        .od-clickable:hover .od-name-text { color:#7AA3FF !important; text-decoration:underline; text-decoration-color:rgba(77,130,255,0.4); }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="ms-shell" onClick={() => { setOpenOrgMenu(null); setOpenEvtMenu(null) }}>

        {/* ── Sidebar ── */}
        <aside className={`ms-sidebar${sidebarOpen ? ' open' : ''}`} onClick={e => e.stopPropagation()}>
          <div className="ms-sidebar-hdr">
            <TikkitXLogo size="sm" />
            <div className="ms-admin-badge"><Shield size={9} /> MASTER ADMIN</div>
          </div>

          <nav style={{ flex: 1, padding: '12px 0' }}>
            {NAV.map(n => (
              <button key={n.id} className={`ms-nav-btn${tab === n.id ? ' ms-active' : ''}`} onClick={() => { setTab(n.id); setSidebarOpen(false) }}>
                <n.icon size={14} />
                <span style={{ flex: 1 }}>{n.label}</span>
                {n.badge !== undefined && <span className="ms-nav-dot">{n.badge}</span>}
              </button>
            ))}
          </nav>

          <div className="ms-sidebar-footer" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 'var(--fs-2xs)', color: '#374151', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Tikkit Internal · Confidential</div>
            <button
              onClick={() => { sessionStorage.removeItem('_ms'); setAuthed(false) }}
              style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.12)', borderRadius: 8, padding: '7px 12px', color: '#4B5563', fontSize: 'var(--fs-xs)', fontFamily: 'var(--font-body)', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s' }}
              onMouseEnter={e => { (e.target as HTMLButtonElement).style.color = '#EF4444'; (e.target as HTMLButtonElement).style.borderColor = 'rgba(239,68,68,0.3)' }}
              onMouseLeave={e => { (e.target as HTMLButtonElement).style.color = '#4B5563'; (e.target as HTMLButtonElement).style.borderColor = 'rgba(239,68,68,0.12)' }}
            >
              Sign out
            </button>
          </div>
        </aside>

        {/* Mobile sidebar overlay */}
        <div className={`ms-mob-overlay${sidebarOpen ? ' open' : ''}`} onClick={() => setSidebarOpen(false)} />

        {/* ── Main ── */}
        <main className="ms-main">
          {/* Top bar */}
          <div className="ms-topbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button className="ms-ham" onClick={e => { e.stopPropagation(); setSidebarOpen(s => !s) }}>
                <Menu size={15} />
              </button>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-lg)', fontWeight: 700, color: '#F0F2FF', letterSpacing: '-0.3px' }}>
                {PAGE_TITLES[tab]}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {openQCount > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 7, padding: '4px 9px', fontSize: 'var(--fs-xs)', fontWeight: 700, color: '#EF4444', fontFamily: 'var(--font-body)' }}>
                  <AlertTriangle size={9} /> {openQCount} open
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(30,94,255,0.08)', border: '1px solid rgba(30,94,255,0.18)', borderRadius: 7, padding: '4px 9px', fontSize: 'var(--fs-xs)', fontWeight: 700, color: '#4D82FF', fontFamily: 'var(--font-body)' }}>
                <Shield size={9} /> ADMIN
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="ms-body">

            {/* ════════════════════════════════════════════════════ OVERVIEW */}
            {tab === 'overview' && (
              <div>
                {/* Stat cards */}
                <div className="ms-stats">
                  <StatCard icon={Users}        label="Total Organizers"   value={String(liveOrgs.length)}          sub={`${reviewOrgCount} under review`}  color="#1E5EFF" />
                  <StatCard icon={Calendar}     label="Live Events"        value={String(liveEvtCount)}             sub={`${flaggedEvtCount} flagged`}       color="#22C55E" />
                  <StatCard icon={TrendingUp}   label="Total Registrations" value={totalRegistered.toLocaleString()} sub="across all events"                  color="#FFC745" />
                  <StatCard icon={MessageSquare} label="Open Queries"       value={String(openQCount)}              sub={openQCount > 0 ? 'needs attention' : 'all clear'} color={openQCount > 0 ? '#EF4444' : '#22C55E'} />
                </div>

                <div className="ms-two-col">
                  {/* Recent organizers */}
                  <div className="ms-card">
                    <div className="ms-card-hdr">
                      <span className="ms-card-title">Recent Organizers</span>
                      <button onClick={() => setTab('organizers')} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 'var(--fs-sm)', color: '#4D82FF', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600 }}>
                        View all <ChevronRight size={12} />
                      </button>
                    </div>
                    <table className="ms-tbl">
                      <thead>
                        <tr>
                          <th>Organizer</th>
                          <th>Events</th>
                          <th>Status</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading && (
                          <tr><td colSpan={4} style={{ textAlign: 'center', padding: '24px', color: '#374151', fontSize: 'var(--fs-sm)' }}>Loading…</td></tr>
                        )}
                        {!loading && orgs.length === 0 && (
                          <tr><td colSpan={4} style={{ textAlign: 'center', padding: '24px', color: '#374151', fontSize: 'var(--fs-sm)' }}>No organizers yet</td></tr>
                        )}
                        {orgs.slice(0, 5).map(o => (
                          <tr key={o.id}>
                            <td>
                              <div
                                className="od-clickable"
                                style={{ display: 'flex', alignItems: 'center', gap: 10 }}
                                onClick={() => { setSelectedOrgId(o.id); setTab('organizers') }}
                              >
                                <div style={{ width: 30, height: 30, borderRadius: 8, background: avBg(o.id), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--fs-xs)', fontWeight: 700, color: 'white', flexShrink: 0 }}>{initials(o.name)}</div>
                                <div>
                                  <div className="od-name-text" style={{ fontSize: 'var(--fs-base)', fontWeight: 600, color: '#F0F2FF', fontFamily: 'var(--font-body)', transition: 'color 0.15s' }}>{o.name}</div>
                                  {o.username && <div style={{ fontSize: 'var(--fs-xs)', color: '#4B5563' }}>@{o.username}</div>}
                                </div>
                              </div>
                            </td>
                            <td style={{ color: '#9CA3AF', fontSize: 'var(--fs-sm)' }}>{o.events} <span style={{ color: '#4B5563' }}>({o.active} live)</span></td>
                            <td><SBadge status={getOrgStatus(o)} /></td>
                            <td>
                              <button onClick={e => { e.stopPropagation(); setContactTarget(o) }} className="ms-ib blue"><Mail size={12} /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Recent queries */}
                  <div className="ms-card">
                    <div className="ms-card-hdr">
                      <span className="ms-card-title">Recent Queries</span>
                      <button onClick={() => setTab('queries')} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 'var(--fs-sm)', color: '#4D82FF', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600 }}>
                        View all <ChevronRight size={12} />
                      </button>
                    </div>
                    <div>
                      {MOCK_QUERIES.map(q => {
                        const qs = getQStatus(q)
                        return (
                          <div key={q.id} className="ms-activity-row">
                            <div style={{ width: 7, height: 7, borderRadius: '50%', background: PC[q.priority], marginTop: 5, flexShrink: 0 }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 'var(--fs-base)', color: '#D1D5DB', fontFamily: 'var(--font-body)', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.subject}</div>
                              <div style={{ fontSize: 'var(--fs-xs)', color: '#4B5563', marginTop: 2, display: 'flex', gap: 8, alignItems: 'center' }}>
                                <span>{q.from}</span>
                                <span>·</span>
                                <span>{fmtDate(q.date)}</span>
                              </div>
                            </div>
                            <SBadge status={qs} />
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* Flagged events alert */}
                {flaggedEvtCount > 0 && (
                  <div style={{ marginTop: 20, background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.2)', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <Flag size={16} color="#F97316" />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-md)', fontWeight: 700, color: '#F0F2FF' }}>{flaggedEvtCount} flagged event{flaggedEvtCount > 1 ? 's' : ''} need{flaggedEvtCount === 1 ? 's' : ''} review</div>
                      <div style={{ fontSize: 'var(--fs-sm)', color: '#6B7280', fontFamily: 'var(--font-body)', marginTop: 2 }}>Review flagged events for policy violations or over-capacity issues.</div>
                    </div>
                    <button onClick={() => setTab('events')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.3)', color: '#F97316', borderRadius: 8, padding: '8px 14px', fontSize: 'var(--fs-sm)', fontWeight: 700, fontFamily: 'var(--font-display)', cursor: 'pointer' }}>
                      Review <ArrowUpRight size={12} />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ════════════════════════════════════════════════════ ORGANIZERS */}
            {tab === 'organizers' && (
              selectedOrgId ? (
                <OrgDetailView
                  orgId={selectedOrgId}
                  onBack={() => setSelectedOrgId(null)}
                  onContact={setContactTarget}
                  currentStatus={getOrgStatus(liveOrgs.find(o => o.id === selectedOrgId) ?? { id: selectedOrgId, status: 'active' } as Org)}
                  onStatusChange={setOrgStatus}
                />
              ) :
              <div>
                <div className="ms-card">
                  <div className="ms-card-hdr">
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                      <div className="ms-search">
                        <Search size={13} color="#374151" />
                        <input value={orgSearch} onChange={e => setOrgSearch(e.target.value)} placeholder="Search organizers…" />
                      </div>
                    </div>
                    <div className="ms-pills">
                      {(['all','active','review','suspended'] as const).map(f => {
                        const cls = f === orgFilter ? (f === 'active' ? 'pg' : f === 'review' ? 'py' : f === 'suspended' ? 'pr' : 'pa') : ''
                        return <button key={f} className={`ms-pill${cls ? ' '+cls : ''}`} onClick={() => setOrgFilter(f)}>{f === 'all' ? 'All' : sl(f)}</button>
                      })}
                    </div>
                  </div>

                  <div style={{ overflowX: 'auto' }}>
                    <table className="ms-tbl" style={{ minWidth: 720 }}>
                      <thead>
                        <tr>
                          <th>Organizer</th>
                          <th className="ms-hide">Email</th>
                          <th>Events</th>
                          <th className="ms-hide">Joined</th>
                          <th>Status</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOrgs.length === 0 && (
                          <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px 20px', color: '#374151' }}>{loading ? 'Loading…' : 'No organizers found'}</td></tr>
                        )}
                        {filteredOrgs.map(o => {
                          const os = getOrgStatus(o)
                          return (
                            <tr key={o.id}>
                              <td>
                                <div
                                  className="od-clickable"
                                  style={{ display: 'flex', alignItems: 'center', gap: 10 }}
                                  onClick={() => setSelectedOrgId(o.id)}
                                >
                                  <div style={{ width: 32, height: 32, borderRadius: 9, background: avBg(o.id), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'white', flexShrink: 0 }}>{initials(o.name)}</div>
                                  <div>
                                    <div className="od-name-text" style={{ fontSize: 'var(--fs-base)', fontWeight: 600, color: '#F0F2FF', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap', transition: 'color 0.15s' }}>{o.name}</div>
                                    {o.username && <div style={{ fontSize: 'var(--fs-xs)', color: '#4B5563' }}>@{o.username}</div>}
                                  </div>
                                </div>
                              </td>
                              <td className="ms-hide" style={{ color: '#6B7280', fontSize: 'var(--fs-sm)' }}>{o.email}</td>
                              <td>
                                <span style={{ fontSize: 'var(--fs-base)', color: '#F0F2FF', fontWeight: 600 }}>{o.events}</span>
                                <span style={{ fontSize: 'var(--fs-xs)', color: '#4B5563', marginLeft: 4 }}>({o.active} live)</span>
                              </td>
                              <td className="ms-hide" style={{ color: '#6B7280', fontSize: 'var(--fs-sm)' }}>{fmtDate(o.joined)}</td>
                              <td><SBadge status={os} /></td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                                  <button className="ms-ib blue" title="Contact" onClick={e => { e.stopPropagation(); setContactTarget(o) }}><Mail size={12} /></button>
                                  {o.username ? (
                                    <Link href={`/organizer/${o.username}`} target="_blank" className="ms-ib" title="View public profile" style={{ color: '#6B7280', textDecoration: 'none' }}><ExternalLink size={12} /></Link>
                                  ) : (
                                    <span className="ms-ib" title="No username set — organizer must set one in Settings" style={{ opacity: 0.25, cursor: 'not-allowed' }}><ExternalLink size={12} /></span>
                                  )}
                                  <div className="ms-menu" onClick={e => e.stopPropagation()}>
                                    <button className="ms-ib" onClick={(e) => {
                                      if (openOrgMenu === o.id) { setOpenOrgMenu(null); return }
                                      const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
                                      setOrgMenuPos({ top: r.bottom + 6, right: window.innerWidth - r.right })
                                      setOpenOrgMenu(o.id)
                                    }}><MoreHorizontal size={13} /></button>
                                    {openOrgMenu === o.id && (
                                      <div className="ms-dropdown" style={{ position: 'fixed', top: orgMenuPos.top, right: orgMenuPos.right, left: 'auto' }}>
                                        {os !== 'active'    && <button className="ms-drop-item dd-green" onClick={() => setOrgStatus(o.id, 'active')}><UserCheck size={13} /> Restore to Active</button>}
                                        {os !== 'review'    && <button className="ms-drop-item dd-amber" onClick={() => setOrgStatus(o.id, 'review')}><Flag size={13} /> Put Under Review</button>}
                                        {os !== 'suspended' && <button className="ms-drop-item dd-red"   onClick={() => setOrgStatus(o.id, 'suspended')}><Ban size={13} /> Suspend Account</button>}
                                        <div className="ms-drop-divider" />
                                        <button className="ms-drop-item" onClick={() => { setContactTarget(o); setOpenOrgMenu(null) }}><Mail size={13} /> Contact Organizer</button>
                                        {o.username ? (
                                          <Link href={`/organizer/${o.username}`} target="_blank" className="ms-drop-item"><Eye size={13} /> View Public Profile</Link>
                                        ) : (
                                          <span className="ms-drop-item" style={{ opacity: 0.35, cursor: 'not-allowed' }}><Eye size={13} /> No username set</span>
                                        )}
                                        <div className="ms-drop-divider" />
                                        <button className="ms-drop-item dd-red" onClick={() => { setRemovedOrgs(s => new Set([...s, o.id])); setOpenOrgMenu(null) }}><Trash2 size={13} /> Remove Organizer</button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div style={{ marginTop: 12, fontSize: 'var(--fs-sm)', color: '#374151', fontFamily: 'var(--font-body)', paddingLeft: 2 }}>
                  Showing {filteredOrgs.length} of {liveOrgs.length} organizers
                </div>
              </div>
            )}

            {/* ════════════════════════════════════════════════════ EVENTS */}
            {tab === 'events' && (
              <div>
                <div className="ms-card">
                  <div className="ms-card-hdr">
                    <div className="ms-search">
                      <Search size={13} color="#374151" />
                      <input value={eventSearch} onChange={e => setEventSearch(e.target.value)} placeholder="Search events…" />
                    </div>
                    <div className="ms-pills">
                      {(['all','live','flagged','draft','suspended','ended'] as const).map(f => {
                        const active = f === eventFilter
                        const cls = active ? (f === 'live' ? 'pg' : f === 'flagged' ? 'pn' : f === 'suspended' || f === 'ended' ? 'pr' : 'pa') : ''
                        return <button key={f} className={`ms-pill${cls ? ' '+cls : ''}`} onClick={() => setEventFilter(f)}>{f === 'all' ? 'All' : sl(f)}</button>
                      })}
                    </div>
                  </div>

                  <div style={{ overflowX: 'auto' }}>
                    <table className="ms-tbl" style={{ minWidth: 760 }}>
                      <thead>
                        <tr>
                          <th>Event</th>
                          <th>Organizer</th>
                          <th className="ms-hide">Date</th>
                          <th>Fill</th>
                          <th>Status</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredEvents.length === 0 && (
                          <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px 20px', color: '#374151' }}>{loading ? 'Loading…' : 'No events found'}</td></tr>
                        )}
                        {filteredEvents.map(e => {
                          const es = getEvtStatus(e)
                          const fill = e.capacity > 0 ? Math.round((e.registered / e.capacity) * 100) : 0
                          const fillColor = fill > 100 ? '#EF4444' : fill > 80 ? '#F97316' : '#22C55E'
                          return (
                            <tr key={e.id}>
                              <td>
                                <div style={{ fontWeight: 600, color: '#F0F2FF', fontSize: 'var(--fs-base)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 220 }}>{e.title}</div>
                                <div style={{ fontSize: 'var(--fs-xs)', color: '#4B5563', marginTop: 1 }}>{e.cat}</div>
                              </td>
                              <td>
                                <div style={{ fontSize: 'var(--fs-base)', color: '#D1D5DB' }}>{e.org}</div>
                                {e.username && <div style={{ fontSize: 'var(--fs-xs)', color: '#4B5563' }}>@{e.username}</div>}
                              </td>
                              <td className="ms-hide" style={{ color: '#6B7280', fontSize: 'var(--fs-sm)', whiteSpace: 'nowrap' }}>{fmtDate(e.date)}</td>
                              <td>
                                <div style={{ fontSize: 'var(--fs-sm)', color: fillColor, marginBottom: 4 }}>{e.registered}/{e.capacity}</div>
                                <div className="ms-bar">
                                  <div style={{ height: '100%', width: `${Math.min(fill, 100)}%`, background: fillColor, borderRadius: 2, transition: 'width 0.5s ease' }} />
                                </div>
                              </td>
                              <td><SBadge status={es} /></td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                                  <div className="ms-menu" onClick={ev => ev.stopPropagation()}>
                                    <button className="ms-ib" onClick={(ev) => {
                                      if (openEvtMenu === e.id) { setOpenEvtMenu(null); return }
                                      const r = (ev.currentTarget as HTMLElement).getBoundingClientRect()
                                      setEvtMenuPos({ top: r.bottom + 6, right: window.innerWidth - r.right })
                                      setOpenEvtMenu(e.id)
                                    }}><MoreHorizontal size={13} /></button>
                                    {openEvtMenu === e.id && (
                                      <div className="ms-dropdown" style={{ position: 'fixed', top: evtMenuPos.top, right: evtMenuPos.right, left: 'auto' }}>
                                        {es === 'flagged'   && <button className="ms-drop-item dd-green" onClick={() => { setEventStatuses(s => ({...s,[e.id]:'live'})); setOpenEvtMenu(null) }}><CheckCircle size={13} /> Clear Flag</button>}
                                        {es !== 'flagged'   && es !== 'suspended' && <button className="ms-drop-item dd-amber" onClick={() => { setEventStatuses(s => ({...s,[e.id]:'flagged'})); setOpenEvtMenu(null) }}><Flag size={13} /> Flag Event</button>}
                                        {es !== 'suspended' && <button className="ms-drop-item dd-red" onClick={() => { setEventStatuses(s => ({...s,[e.id]:'suspended'})); setOpenEvtMenu(null) }}><Ban size={13} /> Suspend Event</button>}
                                        {es === 'suspended' && <button className="ms-drop-item dd-green" onClick={() => { setEventStatuses(s => ({...s,[e.id]:'live'})); setOpenEvtMenu(null) }}><RefreshCw size={13} /> Reinstate Event</button>}
                                        <div className="ms-drop-divider" />
                                        <button
                                          className="ms-drop-item"
                                          onClick={() => {
                                            const org = orgs.find(o => o.id === e.orgId)
                                            if (org) { setContactTarget(org); setTab('organizers') }
                                            setOpenEvtMenu(null)
                                          }}
                                        >
                                          <Mail size={13} /> Contact Organizer
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div style={{ marginTop: 12, fontSize: 'var(--fs-sm)', color: '#374151', fontFamily: 'var(--font-body)', paddingLeft: 2 }}>
                  {loading ? 'Loading events…' : `Showing ${filteredEvents.length} of ${events.length} events`}
                </div>
              </div>
            )}

            {/* ════════════════════════════════════════════════════ ANALYTICS */}
            {tab === 'analytics' && (
              <AnalyticsView onOrgClick={(id) => { setSelectedOrgId(id); setTab('organizers') }} />
            )}

            {/* ════════════════════════════════════════════════════ QUERIES */}
            {tab === 'queries' && (
              <div>
                {/* Foundation notice */}
                <div style={{ background: 'rgba(30,94,255,0.06)', border: '1px solid rgba(30,94,255,0.18)', borderRadius: 12, padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Clock size={15} color="#4D82FF" style={{ flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 'var(--fs-base)', fontWeight: 600, color: '#F0F2FF', fontFamily: 'var(--font-body)' }}>Disputes system — foundation laid</div>
                    <div style={{ fontSize: 'var(--fs-sm)', color: '#6B7280', fontFamily: 'var(--font-body)', marginTop: 2 }}>Full messaging, resolution workflow, and SLA tracking coming next. Currently showing incoming queries with manual status management.</div>
                  </div>
                </div>

                {/* Stats row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
                  {[
                    { label: 'Open',        count: MOCK_QUERIES.filter(q => getQStatus(q) === 'open').length,        color: '#EF4444' },
                    { label: 'In Progress', count: MOCK_QUERIES.filter(q => getQStatus(q) === 'in_progress').length, color: '#F59E0B' },
                    { label: 'Resolved',    count: MOCK_QUERIES.filter(q => getQStatus(q) === 'resolved').length,    color: '#22C55E' },
                  ].map(s => (
                    <div key={s.label} style={{ background: '#0D0F18', border: `1px solid ${s.color}22`, borderRadius: 12, padding: '16px 18px' }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-2xl)', fontWeight: 800, color: s.color, letterSpacing: '-1px' }}>{s.count}</div>
                      <div style={{ fontSize: 'var(--fs-sm)', color: '#6B7280', fontFamily: 'var(--font-body)', marginTop: 4 }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                <div className="ms-card">
                  <div className="ms-card-hdr">
                    <span className="ms-card-title">All Queries</span>
                    <div className="ms-pills">
                      {(['all','open','in_progress','resolved'] as const).map(f => {
                        const active = f === queryFilter
                        const cls = active ? (f === 'open' ? 'pr' : f === 'in_progress' ? 'py' : f === 'resolved' ? 'pg' : 'pa') : ''
                        return <button key={f} className={`ms-pill${cls ? ' '+cls : ''}`} onClick={() => setQueryFilter(f)}>{f === 'all' ? 'All' : sl(f)}</button>
                      })}
                    </div>
                  </div>

                  <div style={{ overflowX: 'auto' }}>
                    <table className="ms-tbl" style={{ minWidth: 680 }}>
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>From</th>
                          <th>Subject</th>
                          <th className="ms-hide">Priority</th>
                          <th className="ms-hide">Date</th>
                          <th>Status</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredQueries.length === 0 && (
                          <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#374151' }}>No queries found</td></tr>
                        )}
                        {filteredQueries.map(q => {
                          const qs = getQStatus(q)
                          return (
                            <tr key={q.id}>
                              <td style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--fs-sm)', color: '#4B5563', whiteSpace: 'nowrap' }}>{q.id}</td>
                              <td>
                                <div style={{ fontSize: 'var(--fs-base)', color: '#D1D5DB', whiteSpace: 'nowrap' }}>{q.from}</div>
                                <div style={{ fontSize: 'var(--fs-xs)', color: '#4B5563', marginTop: 1, textTransform: 'capitalize' }}>{q.fromType}</div>
                              </td>
                              <td style={{ maxWidth: 260 }}>
                                <div style={{ fontSize: 'var(--fs-base)', color: '#F0F2FF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.subject}</div>
                              </td>
                              <td className="ms-hide">
                                <span style={{ fontSize: 'var(--fs-xs)', fontWeight: 700, color: PC[q.priority], background: `${PC[q.priority]}16`, border: `1px solid ${PC[q.priority]}30`, borderRadius: 999, padding: '2px 8px', textTransform: 'capitalize' }}>
                                  {q.priority}
                                </span>
                              </td>
                              <td className="ms-hide" style={{ color: '#6B7280', fontSize: 'var(--fs-sm)', whiteSpace: 'nowrap' }}>{fmtDate(q.date)}</td>
                              <td><SBadge status={qs} /></td>
                              <td>
                                <div style={{ display: 'flex', gap: 5, justifyContent: 'flex-end' }}>
                                  {qs === 'open' && (
                                    <button title="Mark in progress" className="ms-ib amber" onClick={() => setQueryStatuses(s => ({...s,[q.id]:'in_progress'}))}><Clock size={11} /></button>
                                  )}
                                  {qs === 'in_progress' && (
                                    <button title="Mark resolved" className="ms-ib green" onClick={() => setQueryStatuses(s => ({...s,[q.id]:'resolved'}))}><CheckCircle size={11} /></button>
                                  )}
                                  {qs === 'resolved' && (
                                    <button title="Re-open" className="ms-ib amber" onClick={() => setQueryStatuses(s => ({...s,[q.id]:'open'}))}><RefreshCw size={11} /></button>
                                  )}
                                  {/* Contact the sender if they are an organizer */}
                                  {q.fromType === 'organizer' && (() => {
                                    const org = orgs.find((o: Org) => o.name === q.from)
                                    return org ? (
                                      <button title="Contact" className="ms-ib blue" onClick={() => setContactTarget(org)}><Mail size={11} /></button>
                                    ) : null
                                  })()}
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>

      {/* Contact panel */}
      {contactTarget && <ContactPanel org={contactTarget} onClose={() => setContactTarget(null)} />}
    </>
  )
}
