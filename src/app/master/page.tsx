'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  LayoutDashboard, Users, Calendar, MessageSquare,
  Shield, Mail, Phone, CheckCircle, Search, ArrowUpRight,
  MoreHorizontal, Flag, Trash2, Send, X, Menu,
  UserX, UserCheck, TrendingUp, ExternalLink, RefreshCw,
  Eye, Ban, AlertTriangle, Clock, ChevronRight,
} from 'lucide-react'
import { TikkitXLogo } from '@/components/ui/TikkitXLogo'

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'overview' | 'organizers' | 'events' | 'queries'
type OrgStatus = 'active' | 'review' | 'suspended'
type EventStatus = 'live' | 'draft' | 'flagged' | 'suspended' | 'ended'
type QueryStatus = 'open' | 'in_progress' | 'resolved'
type QueryPriority = 'high' | 'medium' | 'low'

interface Org { id: number; name: string; username: string; email: string; phone: string; city: string; events: number; active: number; status: OrgStatus; joined: string; rating: number }
interface Evt { id: number; title: string; org: string; username: string; date: string; status: EventStatus; registered: number; capacity: number; cat: string }
interface Query { id: string; from: string; fromType: 'organizer' | 'attendee'; subject: string; status: QueryStatus; priority: QueryPriority; date: string }

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_ORGS: Org[] = [
  { id: 1, name: 'Zara Events Co.',   username: 'zaraevents',      email: 'contact@zaraevents.pk',      phone: '+92 300 1234567', city: 'Karachi',    events: 14, active: 3, status: 'active',    joined: '2025-10-08', rating: 4.9 },
  { id: 2, name: 'Omar Productions',  username: 'omarproductions',  email: 'omar@omarproductions.pk',    phone: '+92 321 9876543', city: 'Lahore',     events: 7,  active: 2, status: 'active',    joined: '2025-11-22', rating: 4.6 },
  { id: 3, name: 'Nightlife Karachi', username: 'nightlifekhi',     email: 'info@nightlifekhi.com',      phone: '+92 333 5551234', city: 'Karachi',    events: 22, active: 5, status: 'review',    joined: '2025-09-03', rating: 3.8 },
  { id: 4, name: 'Arfa Collective',   username: 'arfacollective',   email: 'arfa@collective.pk',         phone: '+92 345 6667778', city: 'Islamabad',  events: 5,  active: 1, status: 'active',    joined: '2026-01-15', rating: 5.0 },
  { id: 5, name: 'BeatDrop Events',   username: 'beatdrop',         email: 'team@beatdrop.pk',           phone: '+92 311 2223334', city: 'Lahore',     events: 9,  active: 0, status: 'suspended', joined: '2025-08-19', rating: 2.1 },
  { id: 6, name: 'Saad & Co. Events', username: 'saadco',           email: 'saad@saadco.pk',             phone: '+92 322 4445556', city: 'Karachi',    events: 3,  active: 1, status: 'active',    joined: '2026-02-28', rating: 4.4 },
  { id: 7, name: 'Dusk Experiences',  username: 'duskpk',           email: 'hello@dusk.pk',              phone: '+92 334 7778889', city: 'Lahore',     events: 6,  active: 2, status: 'review',    joined: '2025-12-01', rating: 4.1 },
]

const MOCK_EVENTS: Evt[] = [
  { id: 1, title: 'Rooftop Night Karachi',      org: 'Zara Events Co.',   username: 'zaraevents',     date: '2026-03-22', status: 'live',      registered: 84,  capacity: 150, cat: 'Party'     },
  { id: 2, title: 'Brand Launch — Lahore',       org: 'Omar Productions',  username: 'omarproductions',date: '2026-03-28', status: 'live',      registered: 203, capacity: 300, cat: 'Corporate' },
  { id: 3, title: 'Jazz Night Islamabad',        org: 'Arfa Collective',   username: 'arfacollective', date: '2026-03-30', status: 'live',      registered: 56,  capacity: 80,  cat: 'Music'     },
  { id: 4, title: 'Underground Rave — Phase 6', org: 'Nightlife Karachi', username: 'nightlifekhi',   date: '2026-03-20', status: 'flagged',   registered: 312, capacity: 250, cat: 'Party'     },
  { id: 5, title: 'Tech Summit PK 2026',         org: 'Arfa Collective',   username: 'arfacollective', date: '2026-04-05', status: 'draft',     registered: 0,   capacity: 200, cat: 'Tech'      },
  { id: 6, title: 'BeatDrop Vol. 3',             org: 'BeatDrop Events',   username: 'beatdrop',       date: '2026-02-14', status: 'suspended', registered: 180, capacity: 200, cat: 'Music'     },
  { id: 7, title: 'Saad × Dusk Collab Night',   org: 'Saad & Co. Events', username: 'saadco',         date: '2026-04-12', status: 'live',      registered: 34,  capacity: 100, cat: 'Party'     },
  { id: 8, title: 'Startup Mixer Karachi',       org: 'Arfa Collective',   username: 'arfacollective', date: '2026-04-18', status: 'live',      registered: 67,  capacity: 120, cat: 'Tech'      },
]

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
const avBg = (id: number) => AVBG[id % AVBG.length]

// ─── Status Badge ─────────────────────────────────────────────────────────────

function SBadge({ status }: { status: string }) {
  const c = sc(status)
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: c, background: `${c}18`, border: `1px solid ${c}30`, borderRadius: 999, padding: '3px 9px', whiteSpace: 'nowrap' }}>
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
      <div style={{ fontSize: 12, color: '#6B7280', fontFamily: 'var(--font-body)', marginTop: 7 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color, fontFamily: 'var(--font-body)', marginTop: 4 }}>{sub}</div>}
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
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: '#F0F2FF' }}>Contact Organizer</div>
            <div style={{ fontSize: 11, color: '#EF4444', fontFamily: 'var(--font-body)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
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
            <div style={{ width: 38, height: 38, borderRadius: 10, background: avBg(org.id), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'white', flexShrink: 0 }}>
              {initials(org.name)}
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: '#F0F2FF' }}>{org.name}</div>
              <div style={{ fontSize: 12, color: '#6B7280' }}>@{org.username}</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: '#6B7280', fontFamily: 'var(--font-body)' }}>
              <Mail size={11} color="#4B5563" /> {org.email}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: '#6B7280', fontFamily: 'var(--font-body)' }}>
              <Phone size={11} color="#4B5563" /> {org.phone}
            </div>
          </div>
        </div>

        {/* Compose */}
        <div style={{ padding: '20px 24px', flex: 1, display: 'flex', flexDirection: 'column', gap: 14, overflow: 'auto' }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#4B5563', letterSpacing: '0.08em', marginBottom: 6, fontFamily: 'var(--font-body)' }}>FROM</div>
            <div style={{ background: '#0F1119', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#4B5563', fontFamily: 'var(--font-body)' }}>admin@tikkit.app</div>
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#4B5563', letterSpacing: '0.08em', marginBottom: 6, fontFamily: 'var(--font-body)' }}>SUBJECT</div>
            <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Account Review Notice" className="ms-input" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#4B5563', letterSpacing: '0.08em', marginBottom: 6, fontFamily: 'var(--font-body)' }}>MESSAGE</div>
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
              fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-display)',
              cursor: !subject || !message || sent ? 'default' : 'pointer',
              opacity: !subject || !message ? 0.45 : 1, transition: 'all 0.3s',
            }}
          >
            {sent ? <><CheckCircle size={13} /> Sent!</> : <><Send size={13} /> Send Message</>}
          </button>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#6B7280', borderRadius: 10, padding: '10px 16px', fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-display)', cursor: 'pointer' }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MasterPage() {
  const [tab, setTab] = useState<Tab>('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Organizers state
  const [orgStatuses, setOrgStatuses] = useState<Record<number, OrgStatus>>({})
  const [removedOrgs, setRemovedOrgs] = useState<Set<number>>(new Set())
  const [orgFilter, setOrgFilter] = useState<'all' | OrgStatus>('all')
  const [orgSearch, setOrgSearch] = useState('')
  const [openOrgMenu, setOpenOrgMenu] = useState<number | null>(null)
  const [contactTarget, setContactTarget] = useState<Org | null>(null)

  // Events state
  const [eventStatuses, setEventStatuses] = useState<Record<number, EventStatus>>({})
  const [eventFilter, setEventFilter] = useState<'all' | EventStatus>('all')
  const [eventSearch, setEventSearch] = useState('')
  const [openEvtMenu, setOpenEvtMenu] = useState<number | null>(null)

  // Queries state
  const [queryStatuses, setQueryStatuses] = useState<Record<string, QueryStatus>>({})
  const [queryFilter, setQueryFilter] = useState<'all' | QueryStatus>('all')

  // Derived
  const liveOrgs = MOCK_ORGS.filter(o => !removedOrgs.has(o.id))
  const getOrgStatus = (o: Org): OrgStatus => orgStatuses[o.id] ?? o.status
  const getEvtStatus = (e: Evt): EventStatus => eventStatuses[e.id] ?? e.status
  const getQStatus = (q: Query): QueryStatus => queryStatuses[q.id] ?? q.status

  const filteredOrgs = liveOrgs
    .filter(o => orgFilter === 'all' || getOrgStatus(o) === orgFilter)
    .filter(o => !orgSearch || o.name.toLowerCase().includes(orgSearch.toLowerCase()) || o.username.toLowerCase().includes(orgSearch.toLowerCase()))

  const filteredEvents = MOCK_EVENTS
    .filter(e => eventFilter === 'all' || getEvtStatus(e) === eventFilter)
    .filter(e => !eventSearch || e.title.toLowerCase().includes(eventSearch.toLowerCase()) || e.org.toLowerCase().includes(eventSearch.toLowerCase()))

  const filteredQueries = MOCK_QUERIES
    .filter(q => queryFilter === 'all' || getQStatus(q) === queryFilter)

  const openQCount = MOCK_QUERIES.filter(q => getQStatus(q) === 'open').length
  const reviewOrgCount = liveOrgs.filter(o => getOrgStatus(o) === 'review').length
  const flaggedEvtCount = MOCK_EVENTS.filter(e => getEvtStatus(e) === 'flagged').length
  const liveEvtCount = MOCK_EVENTS.filter(e => getEvtStatus(e) === 'live').length
  const totalRegistered = MOCK_EVENTS.reduce((a, e) => a + e.registered, 0)

  const NAV = [
    { id: 'overview'   as Tab, icon: LayoutDashboard, label: 'Overview' },
    { id: 'organizers' as Tab, icon: Users,           label: 'Organizers',        badge: reviewOrgCount > 0 ? reviewOrgCount : undefined },
    { id: 'events'     as Tab, icon: Calendar,        label: 'Events',            badge: flaggedEvtCount > 0 ? flaggedEvtCount : undefined },
    { id: 'queries'    as Tab, icon: MessageSquare,   label: 'Queries & Disputes', badge: openQCount > 0 ? openQCount : undefined },
  ]

  const PAGE_TITLES: Record<Tab, string> = {
    overview: 'Overview', organizers: 'Organizers', events: 'Events', queries: 'Queries & Disputes',
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

          <div className="ms-sidebar-footer">TIKKIT INTERNAL · CONFIDENTIAL</div>
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
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: '#F0F2FF', letterSpacing: '-0.3px' }}>
                {PAGE_TITLES[tab]}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {openQCount > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 7, padding: '4px 9px', fontSize: 11, fontWeight: 700, color: '#EF4444', fontFamily: 'var(--font-body)' }}>
                  <AlertTriangle size={9} /> {openQCount} open
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(30,94,255,0.08)', border: '1px solid rgba(30,94,255,0.18)', borderRadius: 7, padding: '4px 9px', fontSize: 11, fontWeight: 700, color: '#4D82FF', fontFamily: 'var(--font-body)' }}>
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
                      <button onClick={() => setTab('organizers')} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#4D82FF', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600 }}>
                        View all <ChevronRight size={12} />
                      </button>
                    </div>
                    <table className="ms-tbl">
                      <thead>
                        <tr>
                          <th>Organizer</th>
                          <th>City</th>
                          <th>Status</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {MOCK_ORGS.slice(0, 5).map(o => (
                          <tr key={o.id}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 30, height: 30, borderRadius: 8, background: avBg(o.id), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'white', flexShrink: 0 }}>{initials(o.name)}</div>
                                <div>
                                  <div style={{ fontSize: 13, fontWeight: 600, color: '#F0F2FF', fontFamily: 'var(--font-body)' }}>{o.name}</div>
                                  <div style={{ fontSize: 11, color: '#4B5563' }}>@{o.username}</div>
                                </div>
                              </div>
                            </td>
                            <td style={{ color: '#6B7280', fontSize: 12 }}>{o.city}</td>
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
                      <button onClick={() => setTab('queries')} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#4D82FF', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600 }}>
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
                              <div style={{ fontSize: 13, color: '#D1D5DB', fontFamily: 'var(--font-body)', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.subject}</div>
                              <div style={{ fontSize: 11, color: '#4B5563', marginTop: 2, display: 'flex', gap: 8, alignItems: 'center' }}>
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
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: '#F0F2FF' }}>{flaggedEvtCount} flagged event{flaggedEvtCount > 1 ? 's' : ''} need{flaggedEvtCount === 1 ? 's' : ''} review</div>
                      <div style={{ fontSize: 12, color: '#6B7280', fontFamily: 'var(--font-body)', marginTop: 2 }}>Review flagged events for policy violations or over-capacity issues.</div>
                    </div>
                    <button onClick={() => setTab('events')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.3)', color: '#F97316', borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-display)', cursor: 'pointer' }}>
                      Review <ArrowUpRight size={12} />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ════════════════════════════════════════════════════ ORGANIZERS */}
            {tab === 'organizers' && (
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
                          <th className="ms-hide">City</th>
                          <th>Events</th>
                          <th className="ms-hide">Joined</th>
                          <th className="ms-hide">Rating</th>
                          <th>Status</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOrgs.length === 0 && (
                          <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px 20px', color: '#374151' }}>No organizers found</td></tr>
                        )}
                        {filteredOrgs.map(o => {
                          const os = getOrgStatus(o)
                          return (
                            <tr key={o.id}>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                  <div style={{ width: 32, height: 32, borderRadius: 9, background: avBg(o.id), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'white', flexShrink: 0 }}>{initials(o.name)}</div>
                                  <div>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: '#F0F2FF', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>{o.name}</div>
                                    <div style={{ fontSize: 11, color: '#4B5563' }}>@{o.username}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="ms-hide" style={{ color: '#6B7280', fontSize: 12 }}>{o.city}</td>
                              <td>
                                <span style={{ fontSize: 13, color: '#F0F2FF', fontWeight: 600 }}>{o.events}</span>
                                <span style={{ fontSize: 11, color: '#4B5563', marginLeft: 4 }}>({o.active} live)</span>
                              </td>
                              <td className="ms-hide" style={{ color: '#6B7280', fontSize: 12 }}>{fmtDate(o.joined)}</td>
                              <td className="ms-hide">
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <span style={{ color: '#FFC745', fontSize: 12 }}>★</span>
                                  <span style={{ fontSize: 13, color: '#D1D5DB' }}>{o.rating.toFixed(1)}</span>
                                </div>
                              </td>
                              <td><SBadge status={os} /></td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                                  <button className="ms-ib blue" title="Contact" onClick={e => { e.stopPropagation(); setContactTarget(o) }}><Mail size={12} /></button>
                                  <Link href={`/organizer/${o.username}`} target="_blank" className="ms-ib" title="View profile" style={{ color: '#6B7280', textDecoration: 'none' }}><ExternalLink size={12} /></Link>
                                  <div className="ms-menu" onClick={e => e.stopPropagation()}>
                                    <button className="ms-ib" onClick={() => setOpenOrgMenu(openOrgMenu === o.id ? null : o.id)}><MoreHorizontal size={13} /></button>
                                    {openOrgMenu === o.id && (
                                      <div className="ms-dropdown">
                                        {os !== 'active'    && <button className="ms-drop-item dd-green" onClick={() => setOrgStatus(o.id, 'active')}><UserCheck size={13} /> Restore to Active</button>}
                                        {os !== 'review'    && <button className="ms-drop-item dd-amber" onClick={() => setOrgStatus(o.id, 'review')}><Flag size={13} /> Put Under Review</button>}
                                        {os !== 'suspended' && <button className="ms-drop-item dd-red"   onClick={() => setOrgStatus(o.id, 'suspended')}><Ban size={13} /> Suspend Account</button>}
                                        <div className="ms-drop-divider" />
                                        <button className="ms-drop-item" onClick={() => { setContactTarget(o); setOpenOrgMenu(null) }}><Mail size={13} /> Contact Organizer</button>
                                        <Link href={`/organizer/${o.username}`} target="_blank" className="ms-drop-item"><Eye size={13} /> View Public Profile</Link>
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

                <div style={{ marginTop: 12, fontSize: 12, color: '#374151', fontFamily: 'var(--font-body)', paddingLeft: 2 }}>
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
                          <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px 20px', color: '#374151' }}>No events found</td></tr>
                        )}
                        {filteredEvents.map(e => {
                          const es = getEvtStatus(e)
                          const fill = e.capacity > 0 ? Math.round((e.registered / e.capacity) * 100) : 0
                          const fillColor = fill > 100 ? '#EF4444' : fill > 80 ? '#F97316' : '#22C55E'
                          return (
                            <tr key={e.id}>
                              <td>
                                <div style={{ fontWeight: 600, color: '#F0F2FF', fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 220 }}>{e.title}</div>
                                <div style={{ fontSize: 11, color: '#4B5563', marginTop: 1 }}>{e.cat}</div>
                              </td>
                              <td>
                                <div style={{ fontSize: 13, color: '#D1D5DB' }}>{e.org}</div>
                                <div style={{ fontSize: 11, color: '#4B5563' }}>@{e.username}</div>
                              </td>
                              <td className="ms-hide" style={{ color: '#6B7280', fontSize: 12, whiteSpace: 'nowrap' }}>{fmtDate(e.date)}</td>
                              <td>
                                <div style={{ fontSize: 12, color: fillColor, marginBottom: 4 }}>{e.registered}/{e.capacity}</div>
                                <div className="ms-bar">
                                  <div style={{ height: '100%', width: `${Math.min(fill, 100)}%`, background: fillColor, borderRadius: 2, transition: 'width 0.5s ease' }} />
                                </div>
                              </td>
                              <td><SBadge status={es} /></td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                                  <div className="ms-menu" onClick={ev => ev.stopPropagation()}>
                                    <button className="ms-ib" onClick={() => setOpenEvtMenu(openEvtMenu === e.id ? null : e.id)}><MoreHorizontal size={13} /></button>
                                    {openEvtMenu === e.id && (
                                      <div className="ms-dropdown">
                                        {es === 'flagged'   && <button className="ms-drop-item dd-green" onClick={() => { setEventStatuses(s => ({...s,[e.id]:'live'})); setOpenEvtMenu(null) }}><CheckCircle size={13} /> Clear Flag</button>}
                                        {es !== 'flagged'   && es !== 'suspended' && <button className="ms-drop-item dd-amber" onClick={() => { setEventStatuses(s => ({...s,[e.id]:'flagged'})); setOpenEvtMenu(null) }}><Flag size={13} /> Flag Event</button>}
                                        {es !== 'suspended' && <button className="ms-drop-item dd-red" onClick={() => { setEventStatuses(s => ({...s,[e.id]:'suspended'})); setOpenEvtMenu(null) }}><Ban size={13} /> Suspend Event</button>}
                                        {es === 'suspended' && <button className="ms-drop-item dd-green" onClick={() => { setEventStatuses(s => ({...s,[e.id]:'live'})); setOpenEvtMenu(null) }}><RefreshCw size={13} /> Reinstate Event</button>}
                                        <div className="ms-drop-divider" />
                                        <button
                                          className="ms-drop-item"
                                          onClick={() => {
                                            const org = MOCK_ORGS.find(o => o.username === e.username)
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
                <div style={{ marginTop: 12, fontSize: 12, color: '#374151', fontFamily: 'var(--font-body)', paddingLeft: 2 }}>
                  Showing {filteredEvents.length} of {MOCK_EVENTS.length} events
                </div>
              </div>
            )}

            {/* ════════════════════════════════════════════════════ QUERIES */}
            {tab === 'queries' && (
              <div>
                {/* Foundation notice */}
                <div style={{ background: 'rgba(30,94,255,0.06)', border: '1px solid rgba(30,94,255,0.18)', borderRadius: 12, padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Clock size={15} color="#4D82FF" style={{ flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#F0F2FF', fontFamily: 'var(--font-body)' }}>Disputes system — foundation laid</div>
                    <div style={{ fontSize: 12, color: '#6B7280', fontFamily: 'var(--font-body)', marginTop: 2 }}>Full messaging, resolution workflow, and SLA tracking coming next. Currently showing incoming queries with manual status management.</div>
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
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, color: s.color, letterSpacing: '-1px' }}>{s.count}</div>
                      <div style={{ fontSize: 12, color: '#6B7280', fontFamily: 'var(--font-body)', marginTop: 4 }}>{s.label}</div>
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
                              <td style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#4B5563', whiteSpace: 'nowrap' }}>{q.id}</td>
                              <td>
                                <div style={{ fontSize: 13, color: '#D1D5DB', whiteSpace: 'nowrap' }}>{q.from}</div>
                                <div style={{ fontSize: 11, color: '#4B5563', marginTop: 1, textTransform: 'capitalize' }}>{q.fromType}</div>
                              </td>
                              <td style={{ maxWidth: 260 }}>
                                <div style={{ fontSize: 13, color: '#F0F2FF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.subject}</div>
                              </td>
                              <td className="ms-hide">
                                <span style={{ fontSize: 11, fontWeight: 700, color: PC[q.priority], background: `${PC[q.priority]}16`, border: `1px solid ${PC[q.priority]}30`, borderRadius: 999, padding: '2px 8px', textTransform: 'capitalize' }}>
                                  {q.priority}
                                </span>
                              </td>
                              <td className="ms-hide" style={{ color: '#6B7280', fontSize: 12, whiteSpace: 'nowrap' }}>{fmtDate(q.date)}</td>
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
                                    const org = MOCK_ORGS.find(o => o.name === q.from)
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
