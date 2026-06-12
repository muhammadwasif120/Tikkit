'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  LayoutDashboard, Users, Calendar, MessageSquare, MessageCircle,
  Shield, Mail, Phone, CheckCircle, Search, ArrowUpRight,
  MoreHorizontal, Flag, Trash2, Send, X, Menu,
  UserCheck, TrendingUp, ExternalLink, RefreshCw,
  Eye, Ban, AlertTriangle, Clock, ChevronRight, ChevronLeft, BarChart2, Star, Download,
  ShieldCheck, ShieldX, ZoomIn, Ticket, CreditCard, Tag, Plus, Pencil, Check,
} from 'lucide-react'
import { TikkitXLogo } from '@/components/ui/TikkitXLogo'
import {
  getMasterOrganizers, getMasterEvents, setOrgAdminStatus,
  getMasterOrgProfile, getMasterOrgEvents, getMasterEventGuests,
  getMasterAnalytics, getWaitlistEntries,
  getSupportQueries, updateSupportQueryStatus,
  getMasterCnicVerifications, approveCnicVerification, rejectCnicVerification,
  getMasterAttendees, getMasterRegistrations, getMasterBadgeCounts,
  setEventAdminStatus, removeOrganizer, sendAdminEmailToOrganizer,
  getAdminCategories, createAdminCategory, updateAdminCategory, deleteAdminCategory,
  type MasterOrg, type MasterEvt, type OrgProfile, type OrgEvent, type EventGuest,
  type PlatformAnalytics, type WaitlistEntry, type SupportQuery, type CnicVerification,
  type MasterAttendee, type MasterRegistration, type AdminCategory,
} from '@/app/actions/masterActions'
import {
  getAdminSupportConversations, getAdminSupportThread, sendAdminSupportReply,
  type SupportMessage, type SupportConversationSummary,
} from '@/app/actions/supportActions'

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'overview' | 'organizers' | 'events' | 'queries' | 'support' | 'analytics' | 'waitlist' | 'verifications' | 'attendees' | 'registrations' | 'categories'
type OrgStatus = 'active' | 'review' | 'suspended'
type EventStatus = 'live' | 'draft' | 'flagged' | 'suspended' | 'ended'

type Org = MasterOrg
type Evt = MasterEvt & { status: EventStatus }

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
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState('')

  const send = async () => {
    if (!subject || !message || sending) return
    setSending(true)
    setSendError('')
    const { error } = await sendAdminEmailToOrganizer(org.id, subject, message)
    setSending(false)
    if (error) { setSendError(error); return }
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

        {sendError && (
          <div style={{ padding: '0 24px 12px', fontSize: 'var(--fs-xs)', color: '#EF4444', fontFamily: 'var(--font-body)' }}>
            ✕ {sendError}
          </div>
        )}
        <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: 10 }}>
          <button
            onClick={send}
            disabled={!subject || !message || sent || sending}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: sent ? 'rgba(34,197,94,0.15)' : 'linear-gradient(135deg,#1E5EFF,#1448CC)',
              border: sent ? '1px solid rgba(34,197,94,0.35)' : 'none',
              color: sent ? '#22C55E' : 'white', borderRadius: 10, padding: '10px',
              fontSize: 'var(--fs-base)', fontWeight: 700, fontFamily: 'var(--font-display)',
              cursor: !subject || !message || sent || sending ? 'default' : 'pointer',
              opacity: !subject || !message || sending ? 0.55 : 1, transition: 'all 0.3s',
            }}
          >
            {sent ? <><CheckCircle size={13} /> Sent!</> : sending ? '▸ Sending…' : <><Send size={13} /> Send Message</>}
          </button>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#6B7280', borderRadius: 10, padding: '10px 16px', fontSize: 'var(--fs-base)', fontWeight: 600, fontFamily: 'var(--font-display)', cursor: 'pointer' }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Query Detail Panel ───────────────────────────────────────────────────────

function QueryDetailPanel({ query, onClose }: { query: SupportQuery; onClose: () => void }) {
  const catLabel: Record<string, string> = {
    ticket_registration: 'Ticket / Registration', event_cancellation: 'Cancellation / Refund',
    organizer_dispute: 'Organizer Dispute', attendee_dispute: 'Attendee Complaint',
    account_access: 'Account Access', payment_billing: 'Payment & Billing',
    technical_bug: 'Technical Bug', feature_request: 'Feature Request', other: 'Other',
  }
  const PC2: Record<string, string> = { high: '#EF4444', medium: '#F59E0B', low: '#6B7280' }
  const SC2: Record<string, string> = { open: '#EF4444', in_progress: '#F59E0B', resolved: '#22C55E' }
  const SL2: Record<string, string> = { open: 'Open', in_progress: 'In Progress', resolved: 'Resolved' }
  return (
    <div className="ms-overlay">
      <div className="ms-panel">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-lg)', fontWeight: 700, color: '#F0F2FF' }}>Report Details</div>
            <div style={{ fontSize: 'var(--fs-xs)', color: '#4B5563', fontFamily: 'var(--font-body)', marginTop: 2 }}>{query.id}</div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#6B7280' }}>
            <X size={13} />
          </button>
        </div>
        <div style={{ padding: '20px 24px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Meta row */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 999, background: `${PC2[query.priority]}18`, border: `1px solid ${PC2[query.priority]}30`, color: PC2[query.priority] }}>{query.priority.toUpperCase()}</span>
            <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 999, background: `${SC2[query.status]}18`, border: `1px solid ${SC2[query.status]}30`, color: SC2[query.status] }}>{SL2[query.status]}</span>
            {query.category && <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 999, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#9CA3AF' }}>{catLabel[query.category] ?? query.category}</span>}
          </div>
          {/* From */}
          <div>
            <div style={{ fontSize: 'var(--fs-2xs)', fontWeight: 700, color: '#4B5563', letterSpacing: '0.08em', marginBottom: 5, fontFamily: 'var(--font-body)' }}>FROM</div>
            <div style={{ fontSize: 'var(--fs-base)', color: '#D1D5DB', fontFamily: 'var(--font-body)', fontWeight: 600 }}>{query.from_name}</div>
            <div style={{ fontSize: 'var(--fs-xs)', color: '#4B5563', marginTop: 2, textTransform: 'capitalize' }}>{query.from_type} · {new Date(query.created_at).toLocaleString('en-PK', { dateStyle: 'medium', timeStyle: 'short' })}</div>
          </div>
          {/* Subject */}
          <div>
            <div style={{ fontSize: 'var(--fs-2xs)', fontWeight: 700, color: '#4B5563', letterSpacing: '0.08em', marginBottom: 5, fontFamily: 'var(--font-body)' }}>SUBJECT</div>
            <div style={{ fontSize: 'var(--fs-md)', color: '#F0F2FF', fontFamily: 'var(--font-body)', fontWeight: 600, lineHeight: 1.4 }}>{query.subject}</div>
          </div>
          {/* Body */}
          <div>
            <div style={{ fontSize: 'var(--fs-2xs)', fontWeight: 700, color: '#4B5563', letterSpacing: '0.08em', marginBottom: 5, fontFamily: 'var(--font-body)' }}>DESCRIPTION</div>
            {query.body ? (
              <div style={{ fontSize: 'var(--fs-base)', color: '#D1D5DB', fontFamily: 'var(--font-body)', lineHeight: 1.7, whiteSpace: 'pre-wrap', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '14px 16px' }}>
                {query.body}
              </div>
            ) : (
              <div style={{ fontSize: 'var(--fs-base)', color: '#374151', fontFamily: 'var(--font-body)', fontStyle: 'italic' }}>No description provided.</div>
            )}
          </div>
        </div>
        <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#9CA3AF', borderRadius: 10, padding: '10px 20px', fontSize: 'var(--fs-base)', fontWeight: 600, fontFamily: 'var(--font-display)', cursor: 'pointer', width: '100%' }}>
            Close
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
      .catch(() => {})
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
            ? <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={profile.cover_image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </>
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
              ? <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={profile.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </>
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
    getMasterAnalytics()
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
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


// ─── Guest List Panel ─────────────────────────────────────────────────────────

function GuestListPanel({ evt, onClose }: { evt: Evt; onClose: () => void }) {
  const [guests, setGuests] = useState<EventGuest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getMasterEventGuests(evt.id)
      .then(setGuests)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [evt.id])

  return (
    <div className="ms-overlay">
      <div className="ms-panel" style={{ width: 800, maxWidth: '90vw', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-lg)', fontWeight: 700, color: '#F0F2FF' }}>{evt.title}</div>
            <div style={{ fontSize: 'var(--fs-xs)', color: '#6B7280', fontFamily: 'var(--font-body)', marginTop: 2 }}>{guests.length} Guests Total</div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#6B7280' }}>
            <X size={13} />
          </button>
        </div>

        <div style={{ padding: '0', flex: 1, overflowY: 'auto' }}>
          <table className="ms-tbl" style={{ minWidth: 600 }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                <th>Name</th>
                <th>Contact</th>
                <th>Status</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={4} style={{ textAlign: 'center', padding: '40px 20px', color: '#6B7280' }}>Loading guests...</td></tr>}
              {!loading && guests.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', padding: '40px 20px', color: '#6B7280' }}>No guests found</td></tr>}
              {guests.map((g: EventGuest) => (
                <tr key={g.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: '#F0F2FF' }}>{g.full_name}</div>
                    {g.gender && <div style={{ fontSize: 11, color: '#6B7280', textTransform: 'capitalize' }}>{g.gender}</div>}
                  </td>
                  <td>
                    <div style={{ fontSize: 13, color: '#D1D5DB' }}>{g.email || '-'}</div>
                    <div style={{ fontSize: 12, color: '#6B7280' }}>{g.phone || '-'}</div>
                  </td>
                  <td>
                    <SBadge status={g.status} />
                    {g.checked_in_at && <div style={{ fontSize: 11, color: '#22C55E', marginTop: 4 }}>Checked in</div>}
                  </td>
                  <td>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: g.source === 'invited' ? 'rgba(34,197,94,0.1)' : 'rgba(30,94,255,0.1)', color: g.source === 'invited' ? '#22C55E' : '#1E5EFF', textTransform: 'capitalize' }}>
                      {g.source}
                    </span>
                    {g.is_vip && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: 'rgba(245,158,11,0.1)', color: '#F59E0B', marginLeft: 6 }}>VIP</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── Category Admin ───────────────────────────────────────────────────────────

const PRESET_COLORS = ['#8B5CF6','#06B6D4','#F59E0B','#10B981','#EF4444','#EC4899','#1E5EFF','#F97316','#14B8A6','#84CC16','#6366F1','#E879F9']

function CategoryAdmin() {
  const [cats, setCats]         = useState<AdminCategory[]>([])
  const [loading, setLoading]   = useState(true)
  const [editId, setEditId]     = useState<string | null>(null)
  const [showNew, setShowNew]   = useState(false)
  const [saving, setSaving]     = useState(false)
  const [err, setErr]           = useState('')

  const BLANK = { name: '', slug: '', icon: '🎉', color: '#8B5CF6', description: '', sort_order: 0 }
  const [form, setForm] = useState(BLANK)

  const load = () => {
    setLoading(true)
    getAdminCategories().then(setCats).finally(() => setLoading(false))
  }
  useEffect(load, [])

  const upd = (k: keyof typeof BLANK, v: string | number) => setForm(f => ({ ...f, [k]: v }))

  const autoSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  const startEdit = (cat: AdminCategory) => {
    setForm({ name: cat.name, slug: cat.slug, icon: cat.icon, color: cat.color, description: cat.description ?? '', sort_order: cat.sort_order })
    setEditId(cat.id)
    setShowNew(false)
    setErr('')
  }

  const startNew = () => {
    setForm(BLANK)
    setShowNew(true)
    setEditId(null)
    setErr('')
  }

  const cancel = () => { setEditId(null); setShowNew(false); setErr('') }

  const save = async () => {
    if (!form.name.trim() || !form.slug.trim() || !form.icon.trim()) { setErr('Name, slug, and icon are required.'); return }
    setSaving(true); setErr('')
    try {
      if (editId) {
        const res = await updateAdminCategory(editId, { name: form.name, slug: form.slug, icon: form.icon, color: form.color, description: form.description || undefined, sort_order: Number(form.sort_order) })
        if (res.error) { setErr(res.error); return }
      } else {
        const res = await createAdminCategory({ name: form.name, slug: form.slug, icon: form.icon, color: form.color, description: form.description || undefined, sort_order: Number(form.sort_order) })
        if (res.error) { setErr(res.error); return }
      }
      cancel()
      load()
    } finally { setSaving(false) }
  }

  const del = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? Events using this category will have it cleared.`)) return
    await deleteAdminCategory(id)
    load()
  }

  const F = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <div style={{ fontSize: 'var(--fs-2xs)', fontWeight: 700, color: '#4B5563', letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>{label}</div>
      {children}
    </div>
  )

  const isEditing = editId !== null || showNew
  const editingCat = editId ? cats.find(c => c.id === editId) : null

  return (
    <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
      {/* ── Category list ── */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-lg)', fontWeight: 700, color: '#F0F2FF' }}>
            {cats.length} Categories
          </div>
          <button onClick={startNew} disabled={isEditing} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'linear-gradient(135deg,#1E5EFF,#1448CC)', border: 'none', borderRadius: 10, padding: '9px 16px', color: '#fff', fontSize: 'var(--fs-base)', fontWeight: 700, fontFamily: 'var(--font-display)', cursor: isEditing ? 'default' : 'pointer', opacity: isEditing ? 0.5 : 1 }}>
            <Plus size={13} /> New Category
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 48, color: '#374151', fontFamily: 'var(--font-body)' }}>Loading categories…</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {cats.map(cat => (
              <div key={cat.id} className="ms-card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, background: editId === cat.id ? 'rgba(30,94,255,0.06)' : undefined, border: editId === cat.id ? '1px solid rgba(30,94,255,0.25)' : undefined }}>
                {/* Colour swatch + icon */}
                <div style={{ width: 42, height: 42, borderRadius: 12, background: `${cat.color}22`, border: `1.5px solid ${cat.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                  {cat.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 700, color: '#F0F2FF', fontFamily: 'var(--font-body)', fontSize: 'var(--fs-md)' }}>{cat.name}</span>
                    <span style={{ fontSize: 'var(--fs-2xs)', color: '#4B5563', fontFamily: 'monospace' }}>/{cat.slug}</span>
                    <span style={{ fontSize: 'var(--fs-2xs)', fontWeight: 700, padding: '2px 7px', borderRadius: 5, background: `${cat.color}18`, color: cat.color }}>{cat.color}</span>
                  </div>
                  {cat.description && (
                    <div style={{ fontSize: 'var(--fs-sm)', color: '#6B7280', marginTop: 3, fontFamily: 'var(--font-body)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat.description}</div>
                  )}
                  <div style={{ fontSize: 'var(--fs-xs)', color: '#374151', marginTop: 2 }}>Sort order: {cat.sort_order}</div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button onClick={() => startEdit(cat)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#9CA3AF' }} title="Edit">
                    <Pencil size={13} />
                  </button>
                  <button onClick={() => del(cat.id, cat.name)} style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#EF4444' }} title="Delete">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Form panel ── */}
      {isEditing && (
        <div className="ms-card" style={{ width: 360, flexShrink: 0, padding: '22px 24px', position: 'sticky', top: 24 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-lg)', fontWeight: 700, color: '#F0F2FF', marginBottom: 18 }}>
            {editingCat ? `Edit "${editingCat.name}"` : 'New Category'}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <F label="Icon (emoji)">
              <input value={form.icon} onChange={e => upd('icon', e.target.value)} className="ms-input" placeholder="🎉" style={{ fontSize: 20 }} />
            </F>

            <F label="Name">
              <input value={form.name} onChange={e => { upd('name', e.target.value); if (!editId) upd('slug', autoSlug(e.target.value)) }} className="ms-input" placeholder="e.g. Wellness" />
            </F>

            <F label="Slug">
              <input value={form.slug} onChange={e => upd('slug', autoSlug(e.target.value))} className="ms-input" placeholder="e.g. wellness" style={{ fontFamily: 'monospace' }} />
            </F>

            <F label="Colour">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {PRESET_COLORS.map(c => (
                    <button key={c} onClick={() => upd('color', c)} style={{ width: 24, height: 24, borderRadius: 6, background: c, border: form.color === c ? '2.5px solid #fff' : '2px solid transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {form.color === c && <Check size={11} color="#fff" />}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="color" value={form.color} onChange={e => upd('color', e.target.value)} style={{ width: 36, height: 30, borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', cursor: 'pointer', padding: 2 }} />
                  <input value={form.color} onChange={e => upd('color', e.target.value)} className="ms-input" style={{ flex: 1, fontFamily: 'monospace' }} placeholder="#8B5CF6" />
                </div>
              </div>
            </F>

            <F label="Description (optional)">
              <input value={form.description} onChange={e => upd('description', e.target.value)} className="ms-input" placeholder="Short description…" />
            </F>

            <F label="Sort Order">
              <input type="number" value={form.sort_order} onChange={e => upd('sort_order', Number(e.target.value))} className="ms-input" min="0" />
            </F>

            {/* Preview */}
            <div style={{ padding: '10px 14px', borderRadius: 10, background: `${form.color}14`, border: `1px solid ${form.color}30`, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 22 }}>{form.icon}</span>
              <span style={{ fontWeight: 700, color: form.color, fontSize: 'var(--fs-base)' }}>{form.name || 'Preview'}</span>
            </div>

            {err && <div style={{ fontSize: 'var(--fs-xs)', color: '#EF4444', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '8px 12px' }}>{err}</div>}

            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button onClick={save} disabled={saving} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'linear-gradient(135deg,#1E5EFF,#1448CC)', border: 'none', borderRadius: 10, padding: '10px', color: '#fff', fontSize: 'var(--fs-base)', fontWeight: 700, fontFamily: 'var(--font-display)', cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Saving…' : <><Check size={13} /> {editId ? 'Update' : 'Create'}</>}
              </button>
              <button onClick={cancel} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#6B7280', borderRadius: 10, padding: '10px 14px', fontSize: 'var(--fs-base)', fontWeight: 600, fontFamily: 'var(--font-display)', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Master Dashboard ─────────────────────────────────────────────────────────

export default function MasterPage() {
  const [tab, setTab] = useState<Tab>('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null)

  // Real data
  const [orgs, setOrgs] = useState<Org[]>([])
  const [events, setEvents] = useState<Evt[]>([])
  const [loading, setLoading] = useState(false)

  // Eager badge counts — loaded upfront so sidebar badges are accurate immediately
  const [eagerPendingVerif, setEagerPendingVerif] = useState(0)
  const [eagerPendingPayments, setEagerPendingPayments] = useState(0)
  const [eagerUnreadSupport, setEagerUnreadSupport] = useState(0)

  useEffect(() => {
    setLoading(true)
    Promise.all([getMasterOrganizers(), getMasterEvents(), getSupportQueries(), getMasterBadgeCounts()])
      .then(([orgsData, evtsData, queriesData, counts]) => {
        setOrgs(orgsData as Org[])
        setEvents(evtsData as Evt[])
        setQueries(queriesData)
        setEagerPendingVerif(counts.pendingVerifications)
        setEagerPendingPayments(counts.pendingPayments)
        setEagerUnreadSupport(counts.unreadSupport)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

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
  const [guestListEvent, setGuestListEvent] = useState<Evt | null>(null)

  // Queries state — real DB data
  const [queries, setQueries] = useState<SupportQuery[]>([])
  const [queriesLoading, setQueriesLoading] = useState(false)
  const [queryFilter, setQueryFilter] = useState<'all' | SupportQuery['status']>('all')
  const [selectedQuery, setSelectedQuery] = useState<SupportQuery | null>(null)

  // Support chat state
  const [supportFilter, setSupportFilter] = useState<'all' | 'organizer' | 'attendee'>('all')
  const [supportConvos, setSupportConvos] = useState<SupportConversationSummary[]>([])
  const [supportConvosLoading, setSupportConvosLoading] = useState(false)
  const [selectedSupportUserId, setSelectedSupportUserId] = useState<string | null>(null)
  const [supportThread, setSupportThread] = useState<Record<string, SupportMessage[]>>({})
  const [supportThreadLoading, setSupportThreadLoading] = useState(false)
  const [supportReplyInput, setSupportReplyInput] = useState('')
  const [supportReplying, setSupportReplying] = useState(false)

  // Waitlist state
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([])
  const [waitlistLoading, setWaitlistLoading] = useState(false)
  const [waitlistSearch, setWaitlistSearch] = useState('')
  const [waitlistRole, setWaitlistRole] = useState<'all' | 'organizer' | 'guest' | 'both'>('all')

  // Attendees state
  const [attendees, setAttendees] = useState<MasterAttendee[]>([])
  const [attendeesLoading, setAttendeesLoading] = useState(false)
  const [attendeesLoaded, setAttendeesLoaded] = useState(false)
  const [attendeeSearch, setAttendeeSearch] = useState('')
  const [attendeeFilter, setAttendeeFilter] = useState<'all' | 'verified' | 'unverified'>('all')

  // Registrations state
  const [registrations, setRegistrations] = useState<MasterRegistration[]>([])
  const [regsLoading, setRegsLoading] = useState(false)
  const [regsLoaded, setRegsLoaded] = useState(false)
  const [regSearch, setRegSearch] = useState('')
  const [regStatusFilter, setRegStatusFilter] = useState<'all' | 'pending' | 'approved' | 'payment_pending' | 'checked_in'>('all')
  const [regPaymentFilter, setRegPaymentFilter] = useState<'all' | 'submitted' | 'confirmed' | 'none'>('all')
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)

  useEffect(() => {
    if (tab !== 'waitlist') return
    if (waitlist.length > 0) return // already loaded
    setWaitlistLoading(true)
    getWaitlistEntries().then(setWaitlist).finally(() => setWaitlistLoading(false))
  }, [tab, waitlist.length])

  useEffect(() => {
    if (tab !== 'attendees') return
    if (attendeesLoaded) return
    setAttendeesLoading(true)
    getMasterAttendees()
      .then(setAttendees)
      .finally(() => { setAttendeesLoading(false); setAttendeesLoaded(true) })
  }, [tab, attendeesLoaded])

  useEffect(() => {
    if (tab !== 'registrations') return
    if (regsLoaded) return
    setRegsLoading(true)
    getMasterRegistrations()
      .then(setRegistrations)
      .finally(() => { setRegsLoading(false); setRegsLoaded(true) })
  }, [tab, regsLoaded])

  useEffect(() => {
    if (tab !== 'queries' && tab !== 'support') return
    // queries already loaded upfront — only load support convos lazily
    if ((tab === 'queries' || tab === 'support') && supportConvos.length === 0) {
      setSupportConvosLoading(true)
      getAdminSupportConversations().then(setSupportConvos).finally(() => setSupportConvosLoading(false))
    }
  }, [tab]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadSupportThread = async (userId: string) => {
    setSelectedSupportUserId(userId)
    if (supportThread[userId]) return
    setSupportThreadLoading(true)
    const msgs = await getAdminSupportThread(userId)
    setSupportThread(prev => ({ ...prev, [userId]: msgs }))
    setSupportThreadLoading(false)
  }

  const handleSupportReply = async () => {
    if (!selectedSupportUserId || !supportReplyInput.trim() || supportReplying) return
    const convo = supportConvos.find(c => c.userId === selectedSupportUserId)
    if (!convo) return
    setSupportReplying(true)
    const msg = supportReplyInput.trim()
    setSupportReplyInput('')
    const { error } = await sendAdminSupportReply(selectedSupportUserId, convo.userName, convo.userType as 'organizer' | 'attendee', msg)
    if (!error) {
      const newMsg: SupportMessage = {
        id: Date.now().toString(),
        user_id: selectedSupportUserId,
        user_name: convo.userName,
        user_type: convo.userType as 'organizer' | 'attendee',
        message: msg,
        sender: 'admin',
        created_at: new Date().toISOString(),
      }
      setSupportThread(prev => ({ ...prev, [selectedSupportUserId]: [...(prev[selectedSupportUserId] ?? []), newMsg] }))
      setSupportConvos(prev => prev.map(c => c.userId === selectedSupportUserId ? { ...c, lastMessage: msg, lastAt: new Date().toISOString() } : c))
    } else {
      setSupportReplyInput(msg)
    }
    setSupportReplying(false)
  }

  // CNIC verifications state
  const [cnicVerifications, setCnicVerifications] = useState<CnicVerification[]>([])
  const [cnicLoading, setCnicLoading] = useState(false)
  const [cnicFilter, setCnicFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('all')
  const [reviewCnic, setReviewCnic] = useState<CnicVerification | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [cnicAction, setCnicAction] = useState<'idle' | 'approving' | 'rejecting'>('idle')
  const [showRejectInput, setShowRejectInput] = useState(false)
  const [imageZoomed, setImageZoomed] = useState(false)

  useEffect(() => {
    if (tab !== 'verifications') return
    setCnicLoading(true)
    getMasterCnicVerifications().then(setCnicVerifications).finally(() => setCnicLoading(false))
  }, [tab])

  const handleApproveCnic = async (userId: string) => {
    setCnicAction('approving')
    const { error } = await approveCnicVerification(userId)
    if (!error) {
      setCnicVerifications(prev => prev.map(v => v.id === userId ? { ...v, cnic_status: 'verified' } : v))
      setReviewCnic(prev => prev?.id === userId ? { ...prev, cnic_status: 'verified' } : prev)
      setEagerPendingVerif(n => Math.max(0, n - 1))
    }
    setCnicAction('idle')
    setShowRejectInput(false)
  }

  const handleRejectCnic = async (userId: string) => {
    if (!rejectReason.trim()) { setShowRejectInput(true); return }
    setCnicAction('rejecting')
    const { error } = await rejectCnicVerification(userId, rejectReason)
    if (!error) {
      setCnicVerifications(prev => prev.map(v => v.id === userId ? { ...v, cnic_status: 'rejected', cnic_reject_reason: rejectReason } : v))
      setReviewCnic(prev => prev?.id === userId ? { ...prev, cnic_status: 'rejected', cnic_reject_reason: rejectReason } : prev)
      setEagerPendingVerif(n => Math.max(0, n - 1))
    }
    setCnicAction('idle')
    setShowRejectInput(false)
    setRejectReason('')
  }

  // Derived
  const liveOrgs = orgs.filter(o => !removedOrgs.has(o.id))
  const getOrgStatus = (o: Org): OrgStatus => orgStatuses[o.id] ?? o.status
  const setOrgStatus = (id: string, s: OrgStatus) => {
    setOrgStatuses(prev => ({...prev,[id]:s}))
    setOpenOrgMenu(null)
    setOrgAdminStatus(id, s) // persist to DB — fire and forget
  }
  const getEvtStatus = (e: Evt): EventStatus => eventStatuses[e.id] ?? e.status
  const setEvtStatus = (id: string, s: 'live' | 'flagged' | 'suspended') => {
    setEventStatuses(prev => ({ ...prev, [id]: s }))
    setOpenEvtMenu(null)
    setEventAdminStatus(id, s) // persist to DB — fire and forget
  }

  const setQueryStatus = (id: string, s: SupportQuery['status']) => {
    setQueries(prev => prev.map(q => q.id === id ? { ...q, status: s } : q))
    updateSupportQueryStatus(id, s) // persist to DB — fire and forget
  }

  const filteredOrgs = liveOrgs
    .filter(o => orgFilter === 'all' || getOrgStatus(o) === orgFilter)
    .filter(o => !orgSearch || o.name.toLowerCase().includes(orgSearch.toLowerCase()) || (o.username && o.username.toLowerCase().includes(orgSearch.toLowerCase())) || (o.email && o.email.toLowerCase().includes(orgSearch.toLowerCase())))

  const filteredEvents = events
    .filter(e => eventFilter === 'all' || getEvtStatus(e) === eventFilter)
    .filter(e => !eventSearch || e.title.toLowerCase().includes(eventSearch.toLowerCase()) || e.org.toLowerCase().includes(eventSearch.toLowerCase()))

  const filteredQueries = queries
    .filter(q => queryFilter === 'all' || q.status === queryFilter)

  const openQCount = queries.filter(q => q.status === 'open').length
  const reviewOrgCount = liveOrgs.filter(o => getOrgStatus(o) === 'review').length
  const flaggedEvtCount = events.filter(e => getEvtStatus(e) === 'flagged').length
  const liveEvtCount = events.filter(e => getEvtStatus(e) === 'live').length
  const totalRegistered = events.reduce((a, e) => a + e.registered, 0)
  // Use eager counts until lazy tabs are loaded, then switch to live data
  const pendingCnicCount    = cnicVerifications.length > 0 ? cnicVerifications.filter(v => v.cnic_status === 'pending').length : eagerPendingVerif
  const unreadSupportCount  = supportConvos.length > 0 ? supportConvos.reduce((sum, c) => sum + c.unreadCount, 0) : eagerUnreadSupport
  const pendingPaymentCount = registrations.length > 0 ? registrations.filter(r => r.payment_status === 'submitted').length : eagerPendingPayments

  const NAV = [
    { id: 'overview'       as Tab, icon: LayoutDashboard, label: 'Overview' },
    { id: 'organizers'     as Tab, icon: Users,           label: 'Organizers',         badge: reviewOrgCount > 0 ? reviewOrgCount : undefined },
    { id: 'attendees'      as Tab, icon: UserCheck,       label: 'Attendees'           },
    { id: 'registrations'  as Tab, icon: Ticket,          label: 'Registrations',      badge: pendingPaymentCount > 0 ? pendingPaymentCount : undefined },
    { id: 'events'         as Tab, icon: Calendar,        label: 'Events',             badge: flaggedEvtCount > 0 ? flaggedEvtCount : undefined },
    { id: 'analytics'      as Tab, icon: BarChart2,       label: 'Analytics'           },
    { id: 'queries'        as Tab, icon: MessageCircle,   label: 'Queries & Disputes', badge: openQCount > 0 ? openQCount : undefined },
    { id: 'support'        as Tab, icon: MessageSquare,   label: 'Support Chats',      badge: unreadSupportCount > 0 ? unreadSupportCount : undefined },
    { id: 'waitlist'       as Tab, icon: Star,            label: 'Waitlist',           badge: waitlist.length > 0 ? waitlist.length : undefined },
    { id: 'verifications'  as Tab, icon: ShieldCheck,     label: 'Verifications',      badge: pendingCnicCount > 0 ? pendingCnicCount : undefined },
    { id: 'categories'     as Tab, icon: Tag,             label: 'Categories'          },
  ]

  const PAGE_TITLES: Record<Tab, string> = {
    overview: 'Overview', organizers: 'Organizers', events: 'Events', queries: 'Queries & Disputes',
    support: 'Support Chats', analytics: 'Analytics', waitlist: 'Waitlist', verifications: 'Verifications',
    attendees: 'Attendee Accounts', registrations: 'All Registrations', categories: 'Event Categories',
  }


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
              onClick={async () => { const { createClient } = await import('@/lib/supabase/client'); await createClient().auth.signOut(); window.location.href = '/auth/login' }}
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
                              <div style={{ display: 'flex', gap: 6 }}>
                                <button onClick={e => { e.stopPropagation(); setContactTarget(o) }} className="ms-ib blue" title="Email Organizer"><Mail size={12} /></button>
                                <button onClick={e => {
                                  e.stopPropagation()
                                  setTab('support')
                                  setSelectedSupportUserId(o.id)
                                  setSupportFilter('organizer')
                                  import('@/app/actions/supportActions').then(m => m.markAdminSupportMessagesRead(o.id))
                                  setSupportConvos(prev => {
                                    if (prev.find(c => c.userId === o.id)) return prev.map(p => p.userId === o.id ? { ...p, unreadCount: 0 } : p)
                                    return [{ userId: o.id, userName: o.name, userType: 'organizer', lastMessage: 'Chat initiated from admin', lastAt: new Date().toISOString(), unreadCount: 0 }, ...prev]
                                  })
                                }} className="ms-ib blue" title="Chat with Organizer"><MessageSquare size={12} /></button>
                              </div>
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
                      {queries.length === 0 && (
                        <div style={{ padding: '20px 0', textAlign: 'center', color: '#4B5563', fontSize: 'var(--fs-sm)' }}>No queries yet</div>
                      )}
                      {queries.slice(0, 5).map(q => (
                        <div key={q.id} className="ms-activity-row">
                          <div style={{ width: 7, height: 7, borderRadius: '50%', background: PC[q.priority], marginTop: 5, flexShrink: 0 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 'var(--fs-base)', color: '#D1D5DB', fontFamily: 'var(--font-body)', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.subject}</div>
                            <div style={{ fontSize: 'var(--fs-xs)', color: '#4B5563', marginTop: 2, display: 'flex', gap: 8, alignItems: 'center' }}>
                              <span>{q.from_name}</span>
                              <span>·</span>
                              <span>{fmtDate(q.created_at)}</span>
                            </div>
                          </div>
                          <SBadge status={q.status} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* City breakdown */}
                {(() => {
                  const orgCityMap: Record<string, number> = {}
                  for (const o of liveOrgs) {
                    const c = o.city || 'Unknown'
                    orgCityMap[c] = (orgCityMap[c] || 0) + 1
                  }
                  const evtCityMap: Record<string, number> = {}
                  for (const e of events) {
                    const c = e.city || 'Unknown'
                    evtCityMap[c] = (evtCityMap[c] || 0) + 1
                  }
                  const cities = Array.from(new Set([...Object.keys(orgCityMap), ...Object.keys(evtCityMap)])).sort((a, b) => (orgCityMap[b] || 0) - (orgCityMap[a] || 0))
                  if (cities.length === 0) return null
                  const maxOrgs = Math.max(...cities.map(c => orgCityMap[c] || 0), 1)
                  return (
                    <div className="ms-card" style={{ marginTop: 20 }}>
                      <div className="ms-card-hdr">
                        <span className="ms-card-title">Signups by City</span>
                        <span style={{ fontSize: 'var(--fs-xs)', color: '#4B5563', fontFamily: 'var(--font-body)' }}>{liveOrgs.filter(o => o.city).length} of {liveOrgs.length} organizers have city set</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {cities.filter(c => c !== 'Unknown').map(c => {
                          const orgCount = orgCityMap[c] || 0
                          const evtCount = evtCityMap[c] || 0
                          const pct = Math.round((orgCount / maxOrgs) * 100)
                          return (
                            <div key={c}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                                <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, color: '#D1D5DB', fontFamily: 'var(--font-body)' }}>{c}</span>
                                <div style={{ display: 'flex', gap: 14 }}>
                                  <span style={{ fontSize: 'var(--fs-xs)', color: '#6B7280' }}><span style={{ color: '#1E5EFF', fontWeight: 700 }}>{orgCount}</span> organizer{orgCount !== 1 ? 's' : ''}</span>
                                  <span style={{ fontSize: 'var(--fs-xs)', color: '#6B7280' }}><span style={{ color: '#FFC745', fontWeight: 700 }}>{evtCount}</span> event{evtCount !== 1 ? 's' : ''}</span>
                                </div>
                              </div>
                              <div style={{ height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2 }}>
                                <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg,#1E5EFF,#3b82f6)', borderRadius: 2, transition: 'width 0.5s ease' }} />
                              </div>
                            </div>
                          )
                        })}
                        {orgCityMap['Unknown'] && (
                          <div style={{ fontSize: 'var(--fs-xs)', color: '#374151', marginTop: 4 }}>{orgCityMap['Unknown']} organizer{orgCityMap['Unknown'] !== 1 ? 's' : ''} haven&apos;t set a city yet</div>
                        )}
                      </div>
                    </div>
                  )
                })()}

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
                          <th className="ms-hide">City</th>
                          <th>Events</th>
                          <th className="ms-hide">Joined</th>
                          <th>Status</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOrgs.length === 0 && (
                          <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px 20px', color: '#374151' }}>{loading ? 'Loading…' : 'No organizers found'}</td></tr>
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
                              <td className="ms-hide" style={{ color: '#9CA3AF', fontSize: 'var(--fs-sm)' }}>{o.city || <span style={{ color: '#374151' }}>—</span>}</td>
                              <td>
                                <span style={{ fontSize: 'var(--fs-base)', color: '#F0F2FF', fontWeight: 600 }}>{o.events}</span>
                                <span style={{ fontSize: 'var(--fs-xs)', color: '#4B5563', marginLeft: 4 }}>({o.active} live)</span>
                              </td>
                              <td className="ms-hide" style={{ color: '#6B7280', fontSize: 'var(--fs-sm)' }}>{fmtDate(o.joined)}</td>
                              <td><SBadge status={os} /></td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                                  <div style={{ display: 'flex', gap: 6 }}>
                                    <button className="ms-ib blue" title="Email Organizer" onClick={e => { e.stopPropagation(); setContactTarget(o) }}><Mail size={12} /></button>
                                    <button className="ms-ib blue" title="Chat with Organizer" onClick={e => {
                                      e.stopPropagation()
                                      setTab('support')
                                      setSelectedSupportUserId(o.id)
                                      setSupportFilter('organizer')
                                      import('@/app/actions/supportActions').then(m => m.markAdminSupportMessagesRead(o.id))
                                      setSupportConvos(prev => {
                                        if (prev.find(c => c.userId === o.id)) return prev.map(p => p.userId === o.id ? { ...p, unreadCount: 0 } : p)
                                        return [{ userId: o.id, userName: o.name, userType: 'organizer', lastMessage: 'Chat initiated from admin', lastAt: new Date().toISOString(), unreadCount: 0 }, ...prev]
                                      })
                                    }}><MessageSquare size={12} /></button>
                                  </div>
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
                                        <button className="ms-drop-item dd-red" onClick={() => {
                                          setRemovedOrgs(s => new Set([...s, o.id]))
                                          setOpenOrgMenu(null)
                                          removeOrganizer(o.id) // ban auth + suspend profile — fire and forget
                                        }}><Trash2 size={13} /> Remove Organizer</button>
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
                                <div style={{ fontSize: 'var(--fs-xs)', color: '#4B5563', marginTop: 1 }}>{[e.city, e.cat].filter(Boolean).join(' · ') || '—'}</div>
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
                                        {es === 'flagged'   && <button className="ms-drop-item dd-green" onClick={() => setEvtStatus(e.id, 'live')}><CheckCircle size={13} /> Clear Flag</button>}
                                        {es !== 'flagged'   && es !== 'suspended' && <button className="ms-drop-item dd-amber" onClick={() => setEvtStatus(e.id, 'flagged')}><Flag size={13} /> Flag Event</button>}
                                        {es !== 'suspended' && <button className="ms-drop-item dd-red" onClick={() => setEvtStatus(e.id, 'suspended')}><Ban size={13} /> Suspend Event</button>}
                                        {es === 'suspended' && <button className="ms-drop-item dd-green" onClick={() => setEvtStatus(e.id, 'live')}><RefreshCw size={13} /> Reinstate Event</button>}
                                        <div className="ms-drop-divider" />
                                        <button className="ms-drop-item" onClick={() => { setGuestListEvent(e); setOpenEvtMenu(null) }}><Users size={13} /> View Guest List</button>
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
            {tab === 'waitlist' && (() => {
              const filtered = waitlist.filter(w => {
                const matchRole = waitlistRole === 'all' || w.role === waitlistRole
                const q = waitlistSearch.toLowerCase()
                const matchSearch = !q || w.full_name.toLowerCase().includes(q) || w.email.toLowerCase().includes(q) || (w.phone ?? '').includes(q)
                return matchRole && matchSearch
              })
              const roleColor: Record<string, string> = { organizer: '#1E5EFF', guest: '#22C55E', both: '#8B5CF6' }
              const orgCount  = waitlist.filter(w => w.role === 'organizer').length
              const guestCount = waitlist.filter(w => w.role === 'guest').length
              const bothCount  = waitlist.filter(w => w.role === 'both').length

              const exportCSV = () => {
                const rows = [['Name','Email','Phone','Role','Signed Up'], ...filtered.map(w => [w.full_name, w.email, w.phone ?? '', w.role, new Date(w.created_at).toLocaleDateString()])]
                const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
                const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'tikkit-waitlist.csv'; a.click()
              }

              return (
                <div>
                  {/* Stats row */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
                    {[
                      { label: 'Total Signups',  value: waitlist.length,  color: '#00E5FF' },
                      { label: 'Organizers',     value: orgCount,         color: '#1E5EFF' },
                      { label: 'Guests',         value: guestCount,       color: '#22C55E' },
                      { label: 'Both',           value: bothCount,        color: '#8B5CF6' },
                    ].map(s => (
                      <div key={s.label} style={{ background: '#0D0F18', border: `1px solid ${s.color}22`, borderRadius: 12, padding: '16px 18px' }}>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-2xl)', fontWeight: 800, color: s.color, letterSpacing: '-1px' }}>
                          {waitlistLoading ? '—' : s.value}
                        </div>
                        <div style={{ fontSize: 'var(--fs-sm)', color: '#6B7280', fontFamily: 'var(--font-body)', marginTop: 4 }}>{s.label}</div>
                      </div>
                    ))}
                  </div>

                  <div className="ms-card">
                    <div className="ms-card-hdr">
                      <span className="ms-card-title">Waitlist Signups</span>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        {/* Role filter pills */}
                        <div className="ms-pills">
                          {(['all','organizer','guest','both'] as const).map(r => (
                            <button key={r} className={`ms-pill${waitlistRole === r ? ' pa' : ''}`} onClick={() => setWaitlistRole(r)}>
                              {r === 'all' ? 'All' : r.charAt(0).toUpperCase() + r.slice(1)}
                            </button>
                          ))}
                        </div>
                        {/* Search */}
                        <div style={{ position: 'relative' }}>
                          <Search size={12} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#4B5563' }} />
                          <input
                            value={waitlistSearch}
                            onChange={e => setWaitlistSearch(e.target.value)}
                            placeholder="Search name / email…"
                            className="ms-input"
                            style={{ paddingLeft: 28, width: 200, fontSize: 'var(--fs-sm)' }}
                          />
                        </div>
                        {/* Export CSV */}
                        <button
                          onClick={exportCSV}
                          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.22)', color: '#00E5FF', borderRadius: 8, padding: '6px 12px', fontSize: 'var(--fs-sm)', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}
                        >
                          <Download size={12} /> Export CSV
                        </button>
                      </div>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                      {waitlistLoading ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: '#374151' }}>Loading…</div>
                      ) : (
                        <table className="ms-tbl" style={{ minWidth: 640 }}>
                          <thead>
                            <tr>
                              <th>#</th>
                              <th>Name</th>
                              <th>Email</th>
                              <th className="ms-hide">Phone</th>
                              <th>Role</th>
                              <th className="ms-hide">Signed Up</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filtered.length === 0 && (
                              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#374151' }}>No entries found</td></tr>
                            )}
                            {filtered.map((w, i) => (
                              <tr key={w.id}>
                                <td style={{ color: '#4B5563', fontSize: 'var(--fs-sm)' }}>{i + 1}</td>
                                <td>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: roleColor[w.role] ?? '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                                      {w.full_name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()}
                                    </div>
                                    <span style={{ color: '#F0F2FF', fontSize: 'var(--fs-base)', fontFamily: 'var(--font-body)' }}>{w.full_name}</span>
                                  </div>
                                </td>
                                <td style={{ color: '#9CA3AF', fontSize: 'var(--fs-sm)', fontFamily: 'var(--font-body)' }}>{w.email}</td>
                                <td className="ms-hide" style={{ color: '#6B7280', fontSize: 'var(--fs-sm)' }}>{w.phone ?? '—'}</td>
                                <td>
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 'var(--fs-xs)', fontWeight: 700, color: roleColor[w.role] ?? '#6B7280', background: `${roleColor[w.role] ?? '#6B7280'}18`, border: `1px solid ${roleColor[w.role] ?? '#6B7280'}30`, borderRadius: 999, padding: '3px 9px', textTransform: 'capitalize' }}>
                                    {w.role === 'both' ? 'Organizer & Guest' : w.role}
                                  </span>
                                </td>
                                <td className="ms-hide" style={{ color: '#6B7280', fontSize: 'var(--fs-sm)', whiteSpace: 'nowrap' }}>
                                  {new Date(w.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: '2-digit' })}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                </div>
              )
            })()}

            {tab === 'queries' && (
              <div>
                {/* Stats row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
                  {[
                    { label: 'Open',        count: queries.filter(q => q.status === 'open').length,        color: '#EF4444' },
                    { label: 'In Progress', count: queries.filter(q => q.status === 'in_progress').length, color: '#F59E0B' },
                    { label: 'Resolved',    count: queries.filter(q => q.status === 'resolved').length,    color: '#22C55E' },
                  ].map(s => (
                    <div key={s.label} style={{ background: '#0D0F18', border: `1px solid ${s.color}22`, borderRadius: 12, padding: '16px 18px' }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-2xl)', fontWeight: 800, color: s.color, letterSpacing: '-1px' }}>{s.count}</div>
                      <div style={{ fontSize: 'var(--fs-sm)', color: '#6B7280', fontFamily: 'var(--font-body)', marginTop: 4 }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Category breakdown chips */}
                {(() => {
                  const catLabels: Record<string, { label: string; color: string }> = {
                    ticket_registration:  { label: 'Ticket / Registration',     color: '#1E5EFF' },
                    event_cancellation:   { label: 'Cancellation / Refund',      color: '#EF4444' },
                    organizer_dispute:    { label: 'Organizer Dispute',          color: '#F97316' },
                    attendee_dispute:     { label: 'Attendee Complaint',         color: '#F97316' },
                    account_access:       { label: 'Account Access',             color: '#8B5CF6' },
                    payment_billing:      { label: 'Payment & Billing',          color: '#F59E0B' },
                    technical_bug:        { label: 'Technical Bug',              color: '#06B6D4' },
                    feature_request:      { label: 'Feature Request',            color: '#FACC15' },
                    other:                { label: 'Other',                      color: '#6B7280' },
                  }
                  const cats = Object.entries(catLabels).map(([key, meta]) => ({
                    key, ...meta, count: queries.filter(q => (q.category ?? 'other') === key).length,
                  })).filter(c => c.count > 0)
                  if (cats.length === 0) return null
                  return (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
                      {cats.map(c => (
                        <div key={c.key} style={{ background: `${c.color}10`, border: `1px solid ${c.color}28`, borderRadius: 20, padding: '4px 12px', fontSize: 12, color: c.color, fontWeight: 600, fontFamily: 'var(--font-body)' }}>
                          {c.label} <span style={{ opacity: 0.7 }}>({c.count})</span>
                        </div>
                      ))}
                    </div>
                  )
                })()}

                <div className="ms-card">
                  <div className="ms-card-hdr">
                    <span className="ms-card-title">All Reports</span>
                    <div className="ms-pills">
                      {(['all','open','in_progress','resolved'] as const).map(f => {
                        const active = f === queryFilter
                        const cls = active ? (f === 'open' ? 'pr' : f === 'in_progress' ? 'py' : f === 'resolved' ? 'pg' : 'pa') : ''
                        return <button key={f} className={`ms-pill${cls ? ' '+cls : ''}`} onClick={() => setQueryFilter(f)}>{f === 'all' ? 'All' : sl(f)}</button>
                      })}
                    </div>
                  </div>

                  <div style={{ overflowX: 'auto' }}>
                    <table className="ms-tbl" style={{ minWidth: 720 }}>
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>From</th>
                          <th>Category</th>
                          <th>Subject</th>
                          <th className="ms-hide">Priority</th>
                          <th className="ms-hide">Date</th>
                          <th>Status</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading && (
                          <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#4B5563' }}>Loading…</td></tr>
                        )}
                        {!loading && filteredQueries.length === 0 && (
                          <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#374151' }}>No reports found</td></tr>
                        )}
                        {filteredQueries.map(q => {
                          const catMap: Record<string, { label: string; color: string }> = {
                            ticket_registration:  { label: 'Ticket / Reg.',        color: '#1E5EFF' },
                            event_cancellation:   { label: 'Cancellation',         color: '#EF4444' },
                            organizer_dispute:    { label: 'Org. Dispute',         color: '#F97316' },
                            attendee_dispute:     { label: 'Attendee',             color: '#F97316' },
                            account_access:       { label: 'Account',              color: '#8B5CF6' },
                            payment_billing:      { label: 'Payment',              color: '#F59E0B' },
                            technical_bug:        { label: 'Bug',                  color: '#06B6D4' },
                            feature_request:      { label: 'Feature',              color: '#FACC15' },
                            other:                { label: 'Other',                color: '#6B7280' },
                          }
                          const cat = catMap[q.category ?? 'other'] ?? catMap.other
                          return (
                            <tr key={q.id}>
                              <td style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--fs-sm)', color: '#4B5563', whiteSpace: 'nowrap' }}>{q.id}</td>
                              <td>
                                <div style={{ fontSize: 'var(--fs-base)', color: '#D1D5DB', whiteSpace: 'nowrap' }}>{q.from_name}</div>
                                <div style={{ fontSize: 'var(--fs-xs)', color: '#4B5563', marginTop: 1, textTransform: 'capitalize' }}>{q.from_type}</div>
                              </td>
                              <td>
                                <span style={{ fontSize: 11, fontWeight: 700, color: cat.color, background: `${cat.color}14`, border: `1px solid ${cat.color}30`, borderRadius: 6, padding: '2px 7px', whiteSpace: 'nowrap', fontFamily: 'var(--font-body)' }}>
                                  {cat.label}
                                </span>
                              </td>
                              <td style={{ maxWidth: 220 }}>
                                <div style={{ fontSize: 'var(--fs-base)', color: '#F0F2FF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.subject}</div>
                              </td>
                              <td className="ms-hide">
                                <span style={{ fontSize: 'var(--fs-xs)', fontWeight: 700, color: PC[q.priority], background: `${PC[q.priority]}16`, border: `1px solid ${PC[q.priority]}30`, borderRadius: 999, padding: '2px 8px', textTransform: 'capitalize' }}>
                                  {q.priority}
                                </span>
                              </td>
                              <td className="ms-hide" style={{ color: '#6B7280', fontSize: 'var(--fs-sm)', whiteSpace: 'nowrap' }}>{fmtDate(q.created_at)}</td>
                              <td><SBadge status={q.status} /></td>
                              <td>
                                <div style={{ display: 'flex', gap: 5, justifyContent: 'flex-end' }}>
                                  <button title="View full report" className="ms-ib" onClick={() => setSelectedQuery(q)} style={{ color: '#9CA3AF', border: '1px solid rgba(255,255,255,0.1)' }}><Eye size={11} /></button>
                                  {q.status === 'open' && (
                                    <button title="Mark in progress" className="ms-ib amber" onClick={() => setQueryStatus(q.id, 'in_progress')}><Clock size={11} /></button>
                                  )}
                                  {q.status === 'in_progress' && (
                                    <button title="Mark resolved" className="ms-ib green" onClick={() => setQueryStatus(q.id, 'resolved')}><CheckCircle size={11} /></button>
                                  )}
                                  {q.status === 'resolved' && (
                                    <button title="Re-open" className="ms-ib amber" onClick={() => setQueryStatus(q.id, 'open')}><RefreshCw size={11} /></button>
                                  )}
                                  {q.from_type === 'organizer' && (() => {
                                    const org = orgs.find((o: Org) => o.id === q.from_id || o.name === q.from_name)
                                    return org ? (
                                      <button title="Contact via Email" className="ms-ib blue" onClick={() => setContactTarget(org)}><Mail size={11} /></button>
                                    ) : null
                                  })()}
                                  {q.from_id && (
                                    <button title="Chat with User" className="ms-ib blue" onClick={async () => {
                                      setTab('support')
                                      setSelectedSupportUserId(q.from_id!)
                                      loadSupportThread(q.from_id!)
                                      setSupportFilter(q.from_type as 'organizer' | 'attendee' | 'all')
                                      import('@/app/actions/supportActions').then(m => m.markAdminSupportMessagesRead(q.from_id!))
                                      setSupportConvos(prev => {
                                        if (prev.find(c => c.userId === q.from_id)) return prev.map(p => p.userId === q.from_id ? { ...p, unreadCount: 0 } : p)
                                        return [{
                                          userId: q.from_id!,
                                          userName: q.from_name,
                                          userType: q.from_type,
                                          lastMessage: 'Chat initiated from report',
                                          lastAt: new Date().toISOString(),
                                          unreadCount: 0
                                        }, ...prev]
                                      })
                                    }}>
                                      <MessageSquare size={11} />
                                    </button>
                                  )}
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

            {tab === 'support' && (
              <div>
                {/* ── Support Chats ── */}
                <div style={{ marginTop: 0 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-lg)', fontWeight: 700, color: '#F0F2FF', marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <MessageSquare size={16} color="#1E5EFF" />
                      TIKKIT X Support Chats
                    </div>
                    <div className="ms-pills" style={{ display: 'flex', gap: 6 }}>
                      {['all', 'organizer', 'attendee'].map(f => {
                        const active = supportFilter === f
                        const cls = active ? (f === 'organizer' ? 'pa' : f === 'attendee' ? 'pr' : 'pg') : ''
                        return (
                          <button 
                            key={f} 
                            onClick={() => setSupportFilter(f as 'all' | 'organizer' | 'attendee')} 
                            className={`ms-pill${cls ? ' '+cls : ''}`} 
                            style={{ textTransform: 'capitalize' }}
                          >
                            {f}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  {supportConvosLoading ? (
                    <div style={{ color: '#374151', fontSize: 'var(--fs-sm)', padding: 20, textAlign: 'center' }}>Loading conversations…</div>
                  ) : supportConvos.length === 0 ? (
                    <div style={{ color: '#374151', fontSize: 'var(--fs-sm)', padding: 20, textAlign: 'center', background: '#0D0F18', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12 }}>No support conversations yet.</div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: selectedSupportUserId ? '280px 1fr' : '1fr', gap: 12, minHeight: 360 }}>
                      {/* Conversation list */}
                      <div style={{ background: '#0D0F18', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        {supportConvos.filter(c => supportFilter === 'all' || c.userType === supportFilter).map(c => {
                          const active = selectedSupportUserId === c.userId
                          return (
                            <button
                              key={c.userId}
                              onClick={() => {
                                loadSupportThread(c.userId)
                                setSelectedSupportUserId(c.userId)
                                import('@/app/actions/supportActions').then(m => m.markAdminSupportMessagesRead(c.userId))
                                setSupportConvos(prev => prev.map(p => p.userId === c.userId ? { ...p, unreadCount: 0 } : p))
                              }}
                              style={{
                                display: 'flex', gap: 10, padding: '12px 14px', width: '100%', textAlign: 'left',
                                background: active ? 'rgba(30,94,255,0.1)' : 'transparent',
                                border: 'none', borderBottom: '1px solid rgba(255,255,255,0.05)',
                                cursor: 'pointer', alignItems: 'flex-start', transition: 'background 0.15s',
                              }}
                            >
                              <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, background: c.userType === 'organizer' ? 'rgba(30,94,255,0.2)' : 'rgba(139,92,246,0.2)', border: `1px solid ${c.userType === 'organizer' ? 'rgba(30,94,255,0.35)' : 'rgba(139,92,246,0.35)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: c.userType === 'organizer' ? '#1E5EFF' : '#8B5CF6' }}>
                                {c.userName.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                                  <span style={{ fontSize: 13, fontWeight: 700, color: '#D1D5DB', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{c.userName}</span>
                                  {c.unreadCount > 0 && <span style={{ fontSize: 10, fontWeight: 700, color: '#EF4444', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 999, padding: '1px 6px', flexShrink: 0, marginLeft: 4 }}>{c.unreadCount}</span>}
                                </div>
                                <div style={{ fontSize: 11, color: '#4B5563', textTransform: 'capitalize', marginBottom: 2 }}>{c.userType}</div>
                                <div style={{ fontSize: 12, color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.lastMessage}</div>
                              </div>
                            </button>
                          )
                        })}
                      </div>

                      {/* Thread view */}
                      {selectedSupportUserId && (() => {
                        const convo = supportConvos.find(c => c.userId === selectedSupportUserId)
                        const msgs = supportThread[selectedSupportUserId] ?? []
                        return (
                          <div style={{ background: '#0D0F18', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                            {/* Thread header */}
                            <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-md)', fontWeight: 700, color: '#F0F2FF', flex: 1 }}>{convo?.userName}</div>
                              <span style={{ fontSize: 11, fontWeight: 600, color: convo?.userType === 'organizer' ? '#1E5EFF' : '#8B5CF6', background: convo?.userType === 'organizer' ? 'rgba(30,94,255,0.12)' : 'rgba(139,92,246,0.12)', border: `1px solid ${convo?.userType === 'organizer' ? 'rgba(30,94,255,0.3)' : 'rgba(139,92,246,0.3)'}`, borderRadius: 999, padding: '2px 8px', textTransform: 'capitalize' }}>{convo?.userType}</span>
                            </div>
                            {/* Messages */}
                            <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10, minHeight: 240, maxHeight: 360 }}>
                              {supportThreadLoading ? (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                                  <div style={{ width: 20, height: 20, border: '2px solid rgba(30,94,255,0.2)', borderTopColor: '#1E5EFF', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                                </div>
                              ) : msgs.length === 0 ? (
                                <div style={{ color: '#374151', fontSize: 'var(--fs-sm)', textAlign: 'center', paddingTop: 40 }}>No messages yet.</div>
                              ) : msgs.map(m => {
                                const isAdmin = m.sender === 'admin'
                                return (
                                  <div key={m.id} style={{ display: 'flex', gap: 8, maxWidth: '80%', alignSelf: isAdmin ? 'flex-end' : 'flex-start', flexDirection: isAdmin ? 'row-reverse' : 'row' }}>
                                    <div style={{ width: 24, height: 24, borderRadius: '50%', flexShrink: 0, background: isAdmin ? 'rgba(239,68,68,0.2)' : 'rgba(30,94,255,0.2)', border: `1px solid ${isAdmin ? 'rgba(239,68,68,0.35)' : 'rgba(30,94,255,0.35)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 800, color: isAdmin ? '#EF4444' : '#1E5EFF' }}>
                                      {isAdmin ? 'TX' : m.user_name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()}
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                      <div style={{ fontSize: 9, fontWeight: 600, color: '#4B5563', textAlign: isAdmin ? 'right' : 'left' }}>{isAdmin ? 'TIKKIT Admin' : m.user_name} · {new Date(m.created_at).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })}</div>
                                      <div style={{ padding: '8px 12px', borderRadius: 10, fontSize: 13, lineHeight: 1.5, wordBreak: 'break-word', background: isAdmin ? 'rgba(239,68,68,0.1)' : 'rgba(30,94,255,0.1)', border: `1px solid ${isAdmin ? 'rgba(239,68,68,0.2)' : 'rgba(30,94,255,0.2)'}`, color: isAdmin ? '#FCA5A5' : '#93C5FD' }}>
                                        {m.message}
                                      </div>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                            {/* Reply input */}
                            <div style={{ padding: '10px 14px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 8 }}>
                              <input
                                value={supportReplyInput}
                                onChange={e => setSupportReplyInput(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') handleSupportReply() }}
                                placeholder="Reply as TIKKIT Admin…"
                                className="ms-input"
                                style={{ flex: 1 }}
                              />
                              <button
                                onClick={handleSupportReply}
                                disabled={!supportReplyInput.trim() || supportReplying}
                                style={{ background: 'linear-gradient(135deg,#1E5EFF,#1448CC)', border: 'none', borderRadius: 8, padding: '0 14px', color: 'white', cursor: 'pointer', opacity: !supportReplyInput.trim() || supportReplying ? 0.45 : 1, display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-display)' }}
                              >
                                <Send size={13} /> Send
                              </button>
                            </div>
                          </div>
                        )
                      })()}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Verifications Tab ── */}
            {tab === 'verifications' && (
              <div>
                {/* Filter pills */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
                  {(['all', 'pending', 'verified', 'rejected'] as const).map(f => {
                    const count = f === 'all' ? cnicVerifications.length : cnicVerifications.filter(v => v.cnic_status === f).length
                    const active = cnicFilter === f
                    const col = f === 'pending' ? '#F59E0B' : f === 'verified' ? '#22C55E' : f === 'rejected' ? '#EF4444' : '#6B7280'
                    return (
                      <button key={f} onClick={() => setCnicFilter(f)} style={{
                        padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        fontFamily: 'var(--font-body)', transition: 'all 0.15s',
                        background: active ? `${col}18` : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${active ? col + '45' : 'rgba(255,255,255,0.08)'}`,
                        color: active ? col : '#6B7280',
                      }}>
                        {f.charAt(0).toUpperCase() + f.slice(1)} <span style={{ opacity: 0.7 }}>({count})</span>
                      </button>
                    )
                  })}
                  <button onClick={() => { setCnicLoading(true); getMasterCnicVerifications().then(setCnicVerifications).finally(() => setCnicLoading(false)) }}
                    style={{ marginLeft: 'auto', padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#6B7280', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <RefreshCw size={11} /> Refresh
                  </button>
                </div>

                {/* Table */}
                {cnicLoading ? (
                  <div style={{ padding: '48px 0', textAlign: 'center', color: '#4B5563', fontSize: 13 }}>Loading verifications…</div>
                ) : cnicVerifications.filter(v => cnicFilter === 'all' || v.cnic_status === cnicFilter).length === 0 ? (
                  <div style={{ padding: '64px 0', textAlign: 'center' }}>
                    <ShieldCheck size={32} color="#2D3140" style={{ margin: '0 auto 12px' }} />
                    <p style={{ color: '#4B5563', fontSize: 14, fontWeight: 600 }}>No verifications found</p>
                    <p style={{ color: '#374151', fontSize: 12, marginTop: 4 }}>
                      {cnicFilter === 'pending' ? 'No CNICs awaiting review.' : 'Change filter to see other statuses.'}
                    </p>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                          {['User', 'Role', 'CNIC Number', 'Expiry', 'Submitted', 'Status', ''].map(h => (
                            <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: '#4B5563', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {cnicVerifications
                          .filter(v => cnicFilter === 'all' || v.cnic_status === cnicFilter)
                          .map(v => {
                            const statusCol = v.cnic_status === 'verified' ? '#22C55E' : v.cnic_status === 'rejected' ? '#EF4444' : '#F59E0B'
                            const statusLabel = v.cnic_status === 'verified' ? 'Verified' : v.cnic_status === 'rejected' ? 'Rejected' : 'Pending'
                            const name = v.full_name || v.email || '—'
                            return (
                              <tr key={v.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.12s' }}
                                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                <td style={{ padding: '12px 12px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{ width: 30, height: 30, borderRadius: 8, background: avBg(v.id), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                                      {initials(name)}
                                    </div>
                                    <div>
                                      <p style={{ color: '#E5E7EB', fontSize: 13, fontWeight: 600, margin: 0, fontFamily: 'var(--font-body)' }}>{name}</p>
                                      <p style={{ color: '#4B5563', fontSize: 11, margin: 0 }}>{v.email}</p>
                                    </div>
                                  </div>
                                </td>
                                <td style={{ padding: '12px 12px' }}>
                                  <span style={{ background: v.role === 'organizer' ? 'rgba(30,94,255,0.12)' : 'rgba(139,92,246,0.12)', color: v.role === 'organizer' ? '#4D82FF' : '#A78BFA', border: `1px solid ${v.role === 'organizer' ? 'rgba(30,94,255,0.25)' : 'rgba(139,92,246,0.25)'}`, borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-body)' }}>
                                    {v.role === 'organizer' ? 'Organizer' : 'Attendee'}
                                  </span>
                                </td>
                                <td style={{ padding: '12px 12px', color: '#9CA3AF', fontFamily: 'monospace', fontSize: 12, letterSpacing: '0.04em' }}>{v.cnic_number || '—'}</td>
                                <td style={{ padding: '12px 12px', color: '#6B7280', fontSize: 12 }}>{v.cnic_expiry || '—'}</td>
                                <td style={{ padding: '12px 12px', color: '#6B7280', fontSize: 12, whiteSpace: 'nowrap' }}>{v.cnic_submitted_at ? fmtDate(v.cnic_submitted_at) : '—'}</td>
                                <td style={{ padding: '12px 12px' }}>
                                  <span style={{ background: `${statusCol}14`, border: `1px solid ${statusCol}30`, color: statusCol, borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-body)' }}>
                                    {statusLabel}
                                  </span>
                                </td>
                                <td style={{ padding: '12px 12px', textAlign: 'right' }}>
                                  <button onClick={() => { setReviewCnic(v); setRejectReason(''); setShowRejectInput(false); setImageZoomed(false) }}
                                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#9CA3AF', borderRadius: 7, padding: '5px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                                    <Eye size={11} /> Review
                                  </button>
                                </td>
                              </tr>
                            )
                          })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

      {/* Contact panel */}
      {contactTarget && <ContactPanel org={contactTarget} onClose={() => setContactTarget(null)} />}

      {/* Guest list panel */}
      {guestListEvent && <GuestListPanel evt={guestListEvent} onClose={() => setGuestListEvent(null)} />}

      {/* Query detail panel */}
      {selectedQuery && <QueryDetailPanel query={selectedQuery} onClose={() => setSelectedQuery(null)} />}

      {/* CNIC Review Modal */}
      {reviewCnic && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
          onClick={e => { if (e.target === e.currentTarget) { setReviewCnic(null); setImageZoomed(false) } }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }} />
          <div style={{ position: 'relative', background: '#0C0E16', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', zIndex: 1 }}>
            {/* Modal header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(30,94,255,0.1)', border: '1px solid rgba(30,94,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldCheck size={16} color="#4D82FF" />
                </div>
                <div>
                  <p style={{ color: 'white', fontSize: 15, fontWeight: 700, margin: 0, fontFamily: 'var(--font-display)' }}>CNIC Review</p>
                  <p style={{ color: '#4B5563', fontSize: 12, margin: 0 }}>{reviewCnic.full_name || reviewCnic.email}</p>
                </div>
              </div>
              <button onClick={() => { setReviewCnic(null); setImageZoomed(false) }} style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', padding: 4, borderRadius: 6 }}>
                <X size={18} />
              </button>
            </div>

            {/* Meta row */}
            <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { label: 'CNIC Number', value: reviewCnic.cnic_number, mono: true },
                { label: 'Expiry Date', value: reviewCnic.cnic_expiry },
                { label: 'Role', value: reviewCnic.role === 'organizer' ? 'Organizer' : 'Attendee' },
                { label: 'Submitted', value: reviewCnic.cnic_submitted_at ? fmtDate(reviewCnic.cnic_submitted_at) : '—' },
              ].map(({ label, value, mono }) => (
                <div key={label}>
                  <p style={{ color: '#4B5563', fontSize: 11, margin: '0 0 3px', fontWeight: 600, letterSpacing: '0.05em', fontFamily: 'var(--font-body)' }}>{label.toUpperCase()}</p>
                  <p style={{ color: '#E5E7EB', fontSize: 13, margin: 0, fontFamily: mono ? 'monospace' : 'var(--font-body)', letterSpacing: mono ? '0.06em' : 'normal' }}>{value || '—'}</p>
                </div>
              ))}
            </div>

            {/* CNIC image */}
            <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <p style={{ color: '#4B5563', fontSize: 11, margin: 0, fontWeight: 600, letterSpacing: '0.05em', fontFamily: 'var(--font-body)' }}>CNIC DOCUMENT</p>
                <button onClick={() => setImageZoomed(!imageZoomed)} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#9CA3AF', borderRadius: 6, padding: '3px 8px', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <ZoomIn size={10} /> {imageZoomed ? 'Fit' : 'Zoom'}
                </button>
              </div>
              {reviewCnic.cnic_image_url ? (
                <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', background: '#080A10', cursor: 'zoom-in' }} onClick={() => setImageZoomed(!imageZoomed)}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={reviewCnic.cnic_image_url} alt="CNIC document" style={{ width: '100%', height: imageZoomed ? 'auto' : 200, objectFit: imageZoomed ? 'contain' : 'cover', display: 'block', transition: 'height 0.2s' }} />
                </div>
              ) : (
                <div style={{ height: 120, background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <p style={{ color: '#374151', fontSize: 13 }}>No image on file</p>
                </div>
              )}
            </div>

            {/* Reject reason (if already rejected) */}
            {reviewCnic.cnic_status === 'rejected' && reviewCnic.cnic_reject_reason && (
              <div style={{ padding: '12px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(239,68,68,0.04)' }}>
                <p style={{ color: '#EF4444', fontSize: 11, fontWeight: 700, margin: '0 0 4px', letterSpacing: '0.05em' }}>REJECT REASON</p>
                <p style={{ color: '#F87171', fontSize: 13, margin: 0 }}>{reviewCnic.cnic_reject_reason}</p>
              </div>
            )}

            {/* Actions */}
            <div style={{ padding: '16px 24px' }}>
              {reviewCnic.cnic_status === 'verified' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: 10, padding: '10px 14px' }}>
                  <CheckCircle size={15} color="#22C55E" />
                  <p style={{ color: '#22C55E', fontSize: 13, fontWeight: 600, margin: 0 }}>This CNIC has been verified</p>
                </div>
              ) : (
                <>
                  {/* Reject reason input */}
                  {showRejectInput && (
                    <div style={{ marginBottom: 12 }}>
                      <textarea
                        placeholder="Reason for rejection (shown to user)…"
                        value={rejectReason}
                        onChange={e => setRejectReason(e.target.value)}
                        rows={2}
                        style={{ width: '100%', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '8px 12px', color: '#F87171', fontSize: 13, fontFamily: 'var(--font-body)', resize: 'none', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      onClick={() => handleApproveCnic(reviewCnic.id)}
                      disabled={cnicAction !== 'idle'}
                      style={{ flex: 1, padding: '10px 0', borderRadius: 10, background: cnicAction !== 'idle' ? 'rgba(34,197,94,0.06)' : 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)', color: '#22C55E', fontSize: 13, fontWeight: 700, cursor: cnicAction !== 'idle' ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'background 0.15s' }}>
                      <ShieldCheck size={14} /> {cnicAction === 'approving' ? 'Approving…' : 'Approve'}
                    </button>
                    <button
                      onClick={() => handleRejectCnic(reviewCnic.id)}
                      disabled={cnicAction !== 'idle'}
                      style={{ flex: 1, padding: '10px 0', borderRadius: 10, background: cnicAction !== 'idle' ? 'rgba(239,68,68,0.04)' : 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.22)', color: '#EF4444', fontSize: 13, fontWeight: 700, cursor: cnicAction !== 'idle' ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'background 0.15s' }}>
                      <ShieldX size={14} /> {cnicAction === 'rejecting' ? 'Rejecting…' : showRejectInput ? 'Confirm Reject' : 'Reject'}
                    </button>
                  </div>
                  {showRejectInput && (
                    <button onClick={() => { setShowRejectInput(false); setRejectReason('') }} style={{ marginTop: 8, width: '100%', padding: '6px 0', background: 'none', border: 'none', color: '#4B5563', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                      Cancel
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
      {/* ── Attendees Tab ── */}
      {tab === 'attendees' && (() => {
        const cnicSC: Record<string, string> = { verified: '#22C55E', pending: '#F59E0B', rejected: '#EF4444' }
        const cnicLabel: Record<string, string> = { verified: 'Verified', pending: 'Pending', rejected: 'Rejected' }
        const q = attendeeSearch.toLowerCase()
        const filtered = attendees
          .filter(a => {
            if (attendeeFilter === 'verified') return a.is_id_verified
            if (attendeeFilter === 'unverified') return !a.is_id_verified
            return true
          })
          .filter(a => !q || a.full_name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q) || (a.phone_number ?? '').includes(q) || (a.cnic_number ?? '').includes(q))

        const totalVerified = attendees.filter(a => a.is_id_verified).length
        const totalUnverified = attendees.filter(a => !a.is_id_verified).length
        const totalAttended = attendees.reduce((s, a) => s + a.total_attended, 0)

        const exportCSV = () => {
          const rows = [['Name','Email','Phone','CNIC','Verified','Events','Attended','Credits','Joined'],
            ...filtered.map(a => [a.full_name, a.email, a.phone_number ?? '', a.cnic_number ?? '', a.is_id_verified ? 'Yes' : 'No', a.total_events, a.total_attended, a.credit_score, new Date(a.created_at).toLocaleDateString()])]
          const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
          const el = document.createElement('a'); el.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); el.download = 'tikkit-attendees.csv'; el.click()
        }

        return (
          <div>
            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
              {[
                { label: 'Total Attendees',   value: attendees.length, color: '#1E5EFF' },
                { label: 'CNIC Verified',      value: totalVerified,    color: '#22C55E' },
                { label: 'Unverified',         value: totalUnverified,  color: '#F59E0B' },
                { label: 'Total Attendances',  value: totalAttended,    color: '#8B5CF6' },
              ].map(s => (
                <div key={s.label} style={{ background: '#0D0F18', border: `1px solid ${s.color}22`, borderRadius: 12, padding: '16px 18px' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-2xl)', fontWeight: 800, color: s.color, letterSpacing: '-1px' }}>
                    {attendeesLoading ? '—' : s.value.toLocaleString()}
                  </div>
                  <div style={{ fontSize: 'var(--fs-sm)', color: '#6B7280', fontFamily: 'var(--font-body)', marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>

            <div className="ms-card">
              <div className="ms-card-hdr">
                <span className="ms-card-title">Attendee Accounts</span>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  {/* Filter pills */}
                  <div className="ms-pills">
                    {(['all','verified','unverified'] as const).map(f => (
                      <button key={f} className={`ms-pill${attendeeFilter === f ? ' pg' : ''}`} onClick={() => setAttendeeFilter(f)}>
                        {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                      </button>
                    ))}
                  </div>
                  {/* Search */}
                  <div style={{ position: 'relative' }}>
                    <Search size={12} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#4B5563' }} />
                    <input
                      value={attendeeSearch}
                      onChange={e => setAttendeeSearch(e.target.value)}
                      placeholder="Search name / email / CNIC…"
                      className="ms-input"
                      style={{ paddingLeft: 28, width: 220, fontSize: 'var(--fs-sm)' }}
                    />
                  </div>
                  <button
                    onClick={exportCSV}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(30,94,255,0.08)', border: '1px solid rgba(30,94,255,0.22)', color: '#4D82FF', borderRadius: 8, padding: '6px 12px', fontSize: 'var(--fs-sm)', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}
                  >
                    <Download size={12} /> Export CSV
                  </button>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                {attendeesLoading ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#374151' }}>Loading attendees…</div>
                ) : (
                  <table className="ms-tbl" style={{ minWidth: 780 }}>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Name</th>
                        <th>Contact</th>
                        <th className="ms-hide">CNIC</th>
                        <th>ID Status</th>
                        <th>Events</th>
                        <th className="ms-hide">Attended</th>
                        <th className="ms-hide">Credits</th>
                        <th className="ms-hide">Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.length === 0 && (
                        <tr><td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#374151' }}>No attendees found</td></tr>
                      )}
                      {filtered.map((a, i) => (
                        <tr key={a.id}>
                          <td style={{ color: '#4B5563', fontSize: 'var(--fs-sm)' }}>{i + 1}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ width: 30, height: 30, borderRadius: '50%', background: avBg(a.id), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                                {initials(a.full_name)}
                              </div>
                              <span style={{ color: '#F0F2FF', fontSize: 'var(--fs-base)', fontFamily: 'var(--font-body)', fontWeight: 500 }}>{a.full_name}</span>
                            </div>
                          </td>
                          <td>
                            <div style={{ fontSize: 'var(--fs-sm)', color: '#D1D5DB' }}>{a.email}</div>
                            <div style={{ fontSize: 11, color: '#6B7280' }}>{a.phone_number ?? '—'}</div>
                          </td>
                          <td className="ms-hide" style={{ fontSize: 'var(--fs-sm)', color: '#9CA3AF', fontFamily: 'monospace', letterSpacing: '0.03em' }}>
                            {a.cnic_number ?? <span style={{ color: '#374151' }}>—</span>}
                          </td>
                          <td>
                            {a.cnic_status ? (
                              <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: `${cnicSC[a.cnic_status] ?? '#6B7280'}18`, border: `1px solid ${cnicSC[a.cnic_status] ?? '#6B7280'}30`, color: cnicSC[a.cnic_status] ?? '#6B7280', whiteSpace: 'nowrap' }}>
                                {cnicLabel[a.cnic_status] ?? a.cnic_status}
                              </span>
                            ) : (
                              <span style={{ fontSize: 11, color: '#374151' }}>No CNIC</span>
                            )}
                          </td>
                          <td style={{ fontSize: 'var(--fs-base)', color: '#9CA3AF', fontWeight: 600 }}>{a.total_events}</td>
                          <td className="ms-hide" style={{ fontSize: 'var(--fs-base)', color: '#9CA3AF' }}>{a.total_attended}</td>
                          <td className="ms-hide">
                            <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: a.credit_score > 0 ? '#FFC745' : '#374151' }}>
                              {a.credit_score > 0 ? `${a.credit_score} pts` : '—'}
                            </span>
                          </td>
                          <td className="ms-hide" style={{ fontSize: 'var(--fs-sm)', color: '#6B7280' }}>
                            {fmtDate(a.created_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )
      })()}

      {/* ── Registrations Tab ── */}
      {tab === 'registrations' && (() => {
        const REG_SC: Record<string, string> = {
          pending: '#F59E0B', approved: '#1E5EFF', confirmed: '#22C55E',
          payment_pending: '#818CF8', attended: '#34D399', no_show: '#EF4444', refunded: '#6B7280',
          checked_in: '#22C55E', registered: '#1E5EFF', eoi_submitted: '#F59E0B', eoi_approved: '#22C55E',
        }
        const REG_SL: Record<string, string> = {
          pending: 'Pending', approved: 'Approved', confirmed: 'Confirmed',
          payment_pending: 'Pay Pending', attended: 'Attended', no_show: 'No Show', refunded: 'Refunded',
          checked_in: 'Checked In', registered: 'Registered', eoi_submitted: 'EOI Submitted', eoi_approved: 'EOI Approved',
        }
        const PAY_SC: Record<string, string> = { submitted: '#F59E0B', confirmed: '#22C55E', rejected: '#EF4444', not_required: '#4B5563', pending: '#6B7280' }
        const PAY_SL: Record<string, string> = { submitted: 'Awaiting Review', confirmed: 'Confirmed', rejected: 'Rejected', not_required: 'Free', pending: 'Pending' }

        const q = regSearch.toLowerCase()
        const filtered = registrations
          .filter(r => {
            if (regStatusFilter !== 'all' && r.status !== regStatusFilter) return false
            if (regPaymentFilter === 'submitted' && r.payment_status !== 'submitted') return false
            if (regPaymentFilter === 'confirmed' && r.payment_status !== 'confirmed') return false
            if (regPaymentFilter === 'none' && r.payment_status != null && r.payment_status !== 'not_required') return false
            if (q && !r.guest_name.toLowerCase().includes(q) && !r.guest_email.toLowerCase().includes(q) && !r.event_title.toLowerCase().includes(q) && !r.organizer_name.toLowerCase().includes(q)) return false
            return true
          })

        const pendingPayments = registrations.filter(r => r.payment_status === 'submitted').length
        const confirmed = registrations.filter(r => r.status === 'checked_in' || r.status === 'attended').length
        const paidEvents = registrations.filter(r => (r.ticket_price ?? 0) > 0).length

        const exportCSV = () => {
          const rows = [
            ['Guest','Email','Phone','Event','Organizer','Status','Payment','Price','Registered'],
            ...filtered.map(r => [r.guest_name, r.guest_email, r.guest_phone ?? '', r.event_title, r.organizer_name, r.status, r.payment_status ?? '', r.ticket_price ?? 0, new Date(r.created_at).toLocaleDateString()])
          ]
          const csv = rows.map(row => row.map(c => `"${c}"`).join(',')).join('\n')
          const el = document.createElement('a')
          el.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
          el.download = 'tikkit-registrations.csv'
          el.click()
        }

        return (
          <div>
            {/* Lightbox */}
            {lightboxUrl && (
              <div onClick={() => setLightboxUrl(null)} style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={lightboxUrl} alt="Payment screenshot" onClick={e => e.stopPropagation()} style={{ maxWidth: '90vw', maxHeight: '85vh', borderRadius: 16, objectFit: 'contain', boxShadow: '0 24px 80px rgba(0,0,0,0.8)' }} />
                <button onClick={() => setLightboxUrl(null)} style={{ position: 'fixed', top: 20, right: 20, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, padding: 10, color: 'white', cursor: 'pointer', display: 'flex' }}><X size={18} /></button>
              </div>
            )}

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
              {[
                { label: 'Total Registrations', value: registrations.length, color: '#1E5EFF' },
                { label: 'Payments Pending',    value: pendingPayments,       color: '#F59E0B' },
                { label: 'Checked In',           value: confirmed,             color: '#22C55E' },
                { label: 'Paid Event Regs',     value: paidEvents,            color: '#8B5CF6' },
              ].map(s => (
                <div key={s.label} style={{ background: '#0D0F18', border: `1px solid ${s.color}22`, borderRadius: 12, padding: '16px 18px' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-2xl)', fontWeight: 800, color: s.color, letterSpacing: '-1px' }}>
                    {regsLoading ? '—' : s.value.toLocaleString()}
                  </div>
                  <div style={{ fontSize: 'var(--fs-sm)', color: '#6B7280', fontFamily: 'var(--font-body)', marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>

            <div className="ms-card">
              <div className="ms-card-hdr">
                <span className="ms-card-title">All Registrations</span>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  {/* Status pills */}
                  <div className="ms-pills">
                    {(['all','pending','approved','payment_pending','checked_in'] as const).map(f => (
                      <button key={f} className={`ms-pill${regStatusFilter === f ? ' pa' : ''}`} onClick={() => setRegStatusFilter(f)}>
                        {f === 'all' ? 'All' : f === 'payment_pending' ? 'Pay Pending' : f === 'checked_in' ? 'Checked In' : f.charAt(0).toUpperCase() + f.slice(1)}
                      </button>
                    ))}
                  </div>
                  {/* Payment filter pills */}
                  <div className="ms-pills">
                    {([
                      { key: 'all', label: 'All Payments' },
                      { key: 'submitted', label: '⏳ Awaiting' },
                      { key: 'confirmed', label: '✓ Paid' },
                      { key: 'none', label: 'No Payment' },
                    ] as const).map(f => (
                      <button key={f.key} className={`ms-pill${regPaymentFilter === f.key ? ' pg' : ''}`} onClick={() => setRegPaymentFilter(f.key)}>
                        {f.label}
                      </button>
                    ))}
                  </div>
                  {/* Search */}
                  <div style={{ position: 'relative' }}>
                    <Search size={12} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#4B5563' }} />
                    <input
                      value={regSearch}
                      onChange={e => setRegSearch(e.target.value)}
                      placeholder="Guest name / email / event…"
                      className="ms-input"
                      style={{ paddingLeft: 28, width: 220, fontSize: 'var(--fs-sm)' }}
                    />
                  </div>
                  <button onClick={exportCSV} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(30,94,255,0.08)', border: '1px solid rgba(30,94,255,0.22)', color: '#4D82FF', borderRadius: 8, padding: '6px 12px', fontSize: 'var(--fs-sm)', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                    <Download size={12} /> Export CSV
                  </button>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                {regsLoading ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#374151' }}>Loading registrations…</div>
                ) : (
                  <table className="ms-tbl" style={{ minWidth: 860 }}>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Guest</th>
                        <th>Event</th>
                        <th className="ms-hide">Organizer</th>
                        <th>Status</th>
                        <th>Payment</th>
                        <th className="ms-hide">Price</th>
                        <th className="ms-hide">Screenshot</th>
                        <th className="ms-hide">Registered</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.length === 0 && (
                        <tr><td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#374151' }}>No registrations found</td></tr>
                      )}
                      {filtered.map((r, i) => (
                        <tr key={r.id}>
                          <td style={{ color: '#4B5563', fontSize: 'var(--fs-sm)' }}>{i + 1}</td>
                          <td>
                            <div style={{ fontWeight: 600, color: '#F0F2FF', fontSize: 'var(--fs-base)' }}>{r.guest_name}</div>
                            <div style={{ fontSize: 11, color: '#6B7280' }}>{r.guest_email}</div>
                          </td>
                          <td>
                            <div style={{ fontWeight: 500, color: '#D1D5DB', fontSize: 'var(--fs-sm)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.event_title}</div>
                            {r.event_date && <div style={{ fontSize: 11, color: '#6B7280' }}>{fmtDate(r.event_date)}</div>}
                          </td>
                          <td className="ms-hide" style={{ fontSize: 'var(--fs-sm)', color: '#9CA3AF' }}>{r.organizer_name}</td>
                          <td>
                            <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: `${REG_SC[r.status] ?? '#6B7280'}18`, border: `1px solid ${REG_SC[r.status] ?? '#6B7280'}30`, color: REG_SC[r.status] ?? '#6B7280', whiteSpace: 'nowrap' }}>
                              {REG_SL[r.status] ?? r.status}
                            </span>
                          </td>
                          <td>
                            {r.payment_status ? (
                              <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: `${PAY_SC[r.payment_status] ?? '#6B7280'}18`, border: `1px solid ${PAY_SC[r.payment_status] ?? '#6B7280'}30`, color: PAY_SC[r.payment_status] ?? '#6B7280', whiteSpace: 'nowrap' }}>
                                {PAY_SL[r.payment_status] ?? r.payment_status}
                              </span>
                            ) : (r.ticket_price ?? 0) > 0 ? (
                              <span style={{ fontSize: 11, color: '#374151' }}>Not submitted</span>
                            ) : (
                              <span style={{ fontSize: 11, color: '#374151' }}>Free</span>
                            )}
                          </td>
                          <td className="ms-hide">
                            {(r.ticket_price ?? 0) > 0 ? (
                              <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: '#FFC745' }}>PKR {(r.ticket_price!).toLocaleString('en-PK')}</span>
                            ) : (
                              <span style={{ color: '#374151', fontSize: 'var(--fs-sm)' }}>Free</span>
                            )}
                          </td>
                          <td className="ms-hide">
                            {r.payment_screenshot_url ? (
                              <button
                                onClick={() => setLightboxUrl(r.payment_screenshot_url!)}
                                style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(30,94,255,0.08)', border: '1px solid rgba(30,94,255,0.2)', borderRadius: 7, padding: '4px 10px', color: '#4D82FF', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                              >
                                <ZoomIn size={11} /> View
                              </button>
                            ) : (
                              <span style={{ color: '#374151', fontSize: 11 }}>—</span>
                            )}
                          </td>
                          <td className="ms-hide" style={{ fontSize: 'var(--fs-sm)', color: '#6B7280' }}>{fmtDate(r.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )
      })()}

            {/* ════════════════════════════════════════════════════ CATEGORIES */}
            {tab === 'categories' && <CategoryAdmin />}

          </div>
        </main>
      </div>
    </>
  )
}
