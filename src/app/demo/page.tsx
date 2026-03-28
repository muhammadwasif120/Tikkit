'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import {
  LayoutDashboard, CalendarDays, Users, ScanLine, Building2, BarChart3,
  Settings, ClipboardCheck, Radio, UserCircle, Star, LogOut, Menu,
  Bell, CheckCircle2, Clock, XCircle, QrCode, Receipt, TrendingUp,
  ArrowRight, Zap, ChevronLeft, ChevronRight, Sparkles, X, Check,
  MapPin, CreditCard, Search, Filter, MoreVertical,
} from 'lucide-react'

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_EVENTS = [
  { id: '1', title: 'Rooftop Night — Karachi', date: 'Sat 12 Apr 2026', capacity: 80, sold: 72, status: 'published', price: 3500, venue: 'DHA Phase 5 Rooftop' },
  { id: '2', title: 'Brand Launch — Lahore',   date: 'Fri 18 Apr 2026', capacity: 120, sold: 44, status: 'published', price: 0,    venue: 'Arfa Tower, Johar Town' },
  { id: '3', title: 'Jazz Night Islamabad',    date: 'Sun 27 Apr 2026', capacity: 60,  sold: 18, status: 'draft',     price: 2800, venue: 'F-7 Markaz Rooftop' },
  { id: '4', title: 'Art Bazaar Karachi',      date: 'Sat 3 May 2026',  capacity: 200, sold: 91, status: 'published', price: 1500, venue: 'Frere Hall Lawn' },
]

const MOCK_GUESTS = [
  { id: 1, name: 'Ayesha Farooq',  phone: '+92 301 2345678', event: 'Rooftop Night', status: 'approved', paid: true },
  { id: 2, name: 'Bilal Mahmood',  phone: '+92 333 9876543', event: 'Rooftop Night', status: 'pending',  paid: true },
  { id: 3, name: 'Sana Hussain',   phone: '+92 312 1122334', event: 'Brand Launch',  status: 'pending',  paid: false },
  { id: 4, name: 'Omar Qureshi',   phone: '+92 321 5566778', event: 'Rooftop Night', status: 'approved', paid: true },
  { id: 5, name: 'Nadia Khan',     phone: '+92 345 9988776', event: 'Jazz Night',    status: 'waitlist', paid: false },
  { id: 6, name: 'Faisal Mirza',   phone: '+92 311 4433221', event: 'Art Bazaar',    status: 'approved', paid: true },
]

const MOCK_APPROVALS = [
  { id: 1, name: 'Zara Malik',    phone: '+92 321 8877665', event: 'Jazz Night', time: '2m ago', screenshot: true },
  { id: 2, name: 'Hassan Raza',   phone: '+92 302 1234567', event: 'Jazz Night', time: '9m ago', screenshot: true },
  { id: 3, name: 'Maryam Sheikh', phone: '+92 344 5544332', event: 'Rooftop Night', time: '14m ago', screenshot: false },
]

const MOCK_VENDORS = [
  { id: 1, name: 'Digi Photography',  service: 'Photography',   event: 'Rooftop Night', amount: 45000, status: 'paid', due: 'Paid' },
  { id: 2, name: 'Sound FX Studio',  service: 'Sound & AV',     event: 'Rooftop Night', amount: 80000, status: 'pending', due: 'Apr 10' },
  { id: 3, name: 'Flowerbomb Décor', service: 'Decoration',     event: 'Brand Launch',  amount: 35000, status: 'overdue', due: 'Apr 2' },
  { id: 4, name: 'Savour Catering',  service: 'Food & Beverage', event: 'Art Bazaar',   amount: 120000, status: 'pending', due: 'Apr 28' },
]

const STATS = [
  { label: 'Total Events',       value: '4',      sub: '3 published',       color: '#1E5EFF', bg: 'rgba(30,94,255,0.1)',   border: 'rgba(30,94,255,0.15)',   icon: CalendarDays },
  { label: 'Total Guests',       value: '225',    sub: '191 checked in',    color: '#22C55E', bg: 'rgba(34,197,94,0.1)',   border: 'rgba(34,197,94,0.15)',   icon: Users },
  { label: 'Pending Approvals',  value: '3',      sub: '3 awaiting review', color: '#FFC745', bg: 'rgba(255,199,69,0.1)', border: 'rgba(255,199,69,0.35)',  icon: ClipboardCheck },
  { label: 'Pending Invoices',   value: '2',      sub: '2 unpaid',          color: '#A78BFA', bg: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.35)', icon: Receipt },
]

// ─── Tour steps ───────────────────────────────────────────────────────────────

const TOUR_STEPS = [
  { target: null,              emoji: '👋', title: 'Welcome to your dashboard',   desc: "This is exactly what you'll see when you sign up as an organizer. Let's take a 60-second tour." },
  { target: 'demo-nav-dash',  emoji: '📊', title: 'Dashboard',                   desc: 'Your command centre — live stats, upcoming events, and recent activity at a glance.' },
  { target: 'demo-nav-events',emoji: '🎟️', title: 'Events',                      desc: 'Create and manage all your events. Set capacity, pricing, and registration mode — go live in minutes.' },
  { target: 'demo-nav-guests',emoji: '👥', title: 'Guests',                      desc: 'Everyone who registered. Search, filter, approve, and message guests, all in one place.' },
  { target: 'demo-nav-appr',  emoji: '✅', title: 'Approvals',                   desc: 'Review payment screenshots and approve or reject guest registrations manually.' },
  { target: 'demo-nav-scan',  emoji: '📱', title: 'QR Scanner',                  desc: 'Scan QR tickets at the door. Share a scanner-only link with staff — your data stays private.' },
  { target: 'demo-nav-vend',  emoji: '🏢', title: 'Vendors',                     desc: 'Every vendor, invoice, and payment for your event, tracked in one dashboard.' },
  { target: 'demo-nav-anal',  emoji: '📈', title: 'Analytics',                   desc: 'Revenue, attendance rates, check-in timelines, and guest insights after every event.' },
  { target: null,              emoji: '🎉', title: "You're ready to host!", desc: 'Sign up in 2 minutes — free to start. Your first event could be live today.' },
]

// ─── Sidebar ──────────────────────────────────────────────────────────────────

const NAV = [
  { id: 'dash',   label: 'Dashboard', icon: LayoutDashboard, tourId: 'demo-nav-dash' },
  { id: 'events', label: 'Events',    icon: CalendarDays,    tourId: 'demo-nav-events' },
  { id: 'guests', label: 'Guests',    icon: Users,           tourId: 'demo-nav-guests' },
  { id: 'appr',   label: 'Approvals', icon: ClipboardCheck,  tourId: 'demo-nav-appr' },
  { id: 'scan',   label: 'Scanner',   icon: ScanLine,        tourId: 'demo-nav-scan' },
  { id: 'vend',   label: 'Vendors',   icon: Building2,       tourId: 'demo-nav-vend' },
  { id: 'anal',   label: 'Analytics', icon: BarChart3,       tourId: 'demo-nav-anal' },
]

function DemoSidebarContent({ active, setActive, onClose }: { active: string; setActive: (s: string) => void; onClose: () => void }) {
  return (
    <aside style={{ width: 240, background: '#0D0F18', display: 'flex', flexDirection: 'column', height: '100%', borderRight: '1px solid rgba(255,255,255,0.04)', flexShrink: 0 }}>
      {/* Logo */}
      <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg,#2B6FFF,#1448CC)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px rgba(30,94,255,0.4)' }}>
            <Star size={15} color="#fff" fill="#fff" />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, color: '#fff', letterSpacing: '-0.4px' }}>Tikkit</span>
          <span style={{ fontSize: 9, background: 'rgba(255,199,69,0.12)', border: '1px solid rgba(255,199,69,0.25)', color: '#FFC745', padding: '2px 7px', borderRadius: 99, fontWeight: 700, letterSpacing: '0.06em' }}>DEMO</span>
        </div>
        {/* Close button — mobile only */}
        <button onClick={onClose} className="lg:hidden" style={{ background: 'transparent', border: 'none', color: '#6B7280', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}>
          <X size={18} />
        </button>
      </div>
      {/* Nav */}
      <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.12em', padding: '0 12px', marginBottom: 8 }}>Main Menu</p>
        {NAV.map(item => {
          const Icon = item.icon
          const isActiveItem = active === item.id
          return (
            <button id={item.tourId} key={item.id} onClick={() => { setActive(item.id); onClose() }}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', background: isActiveItem ? 'rgba(30,94,255,0.12)' : 'transparent', color: isActiveItem ? '#4D82FF' : '#9CA3AF', fontFamily: 'var(--font-display)', fontSize: 13.5, fontWeight: isActiveItem ? 700 : 500, transition: 'all 0.15s', boxShadow: isActiveItem ? 'inset 3px 0 0 #1E5EFF' : 'none' }}>
              <Icon size={15} color={isActiveItem ? '#1E5EFF' : '#4B5563'} />
              {item.label}
            </button>
          )
        })}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.04)', margin: '8px 0' }} />
        <p style={{ fontSize: 10, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.12em', padding: '0 12px', marginBottom: 8 }}>Account</p>
        {[{ icon: UserCircle, label: 'Profile' }, { icon: Settings, label: 'Settings' }].map(i => (
          <button key={i.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10, border: 'none', cursor: 'default', width: '100%', textAlign: 'left', background: 'transparent', color: '#6B7280', fontFamily: 'var(--font-display)', fontSize: 13.5, fontWeight: 500 }}>
            <i.icon size={15} color="#4B5563" /> {i.label}
          </button>
        ))}
      </nav>
      {/* Profile footer */}
      <div style={{ padding: 12, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,rgba(30,94,255,0.25),rgba(30,94,255,0.1))', border: '1px solid rgba(30,94,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#1E5EFF', fontFamily: 'var(--font-display)' }}>R</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', margin: 0, fontFamily: 'var(--font-display)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Rooftop Events</p>
            <p style={{ fontSize: 11, color: '#6B7280', margin: 0 }}>organizer</p>
          </div>
          <LogOut size={14} color="#4B5563" style={{ flexShrink: 0 }} />
        </div>
      </div>
    </aside>
  )
}

function DemoSidebar({ active, setActive, open, onClose }: { active: string; setActive: (s: string) => void; open: boolean; onClose: () => void }) {
  return (
    <>
      {/* Desktop — always visible */}
      <div className="hidden lg:flex" style={{ flexShrink: 0 }}>
        <DemoSidebarContent active={active} setActive={setActive} onClose={onClose} />
      </div>
      {/* Mobile backdrop */}
      <div
        onClick={onClose}
        className="lg:hidden"
        style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none', transition: 'opacity 0.25s' }}
      />
      {/* Mobile drawer */}
      <div
        className="lg:hidden"
        style={{ position: 'fixed', inset: '0 auto 0 0', zIndex: 50, transform: open ? 'translateX(0)' : 'translateX(-100%)', transition: 'transform 0.3s ease' }}
      >
        <DemoSidebarContent active={active} setActive={setActive} onClose={onClose} />
      </div>
    </>
  )
}

function DemoTopBar({ section, onStartTour, onMenuClick }: { section: string; onStartTour: () => void; onMenuClick: () => void }) {
  const titles: Record<string, string> = { dash: 'Dashboard', events: 'Events', guests: 'Guests', appr: 'Approvals', scan: 'Scanner', vend: 'Vendors', anal: 'Analytics' }
  return (
    <div style={{ height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', borderBottom: '1px solid rgba(255,255,255,0.04)', background: '#080A10', flexShrink: 0, gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        {/* Hamburger — mobile only */}
        <button onClick={onMenuClick} className="lg:hidden" style={{ background: 'transparent', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: '4px 2px', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          <Menu size={20} />
        </button>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '-0.4px', whiteSpace: 'nowrap' }}>{titles[section] ?? 'Dashboard'}</h1>
        <span style={{ fontSize: 9, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', color: '#22C55E', padding: '2px 8px', borderRadius: 99, fontWeight: 700, letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>LIVE DEMO</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <button onClick={onStartTour} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(30,94,255,0.08)', border: '1px solid rgba(30,94,255,0.2)', color: '#4D82FF', borderRadius: 9, padding: '6px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-display)', whiteSpace: 'nowrap' }}>
          <Sparkles size={11} /> <span className="hidden sm:inline">Replay </span>Tour
        </button>
        <Link href="/register" style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#1E5EFF', color: '#fff', textDecoration: 'none', borderRadius: 9, padding: '7px 13px', fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-display)', boxShadow: '0 0 20px rgba(30,94,255,0.3)', whiteSpace: 'nowrap' }}>
          Get Started <ArrowRight size={12} />
        </Link>
      </div>
    </div>
  )
}

// ─── Helper UI ────────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { c: string; bg: string; bd: string }> = {
    published: { c: '#22C55E', bg: 'rgba(34,197,94,0.1)',   bd: 'rgba(34,197,94,0.2)' },
    draft:     { c: '#6B7280',  bg: 'rgba(107,114,128,0.1)', bd: 'rgba(107,114,128,0.2)' },
    approved:  { c: '#22C55E', bg: 'rgba(34,197,94,0.1)',   bd: 'rgba(34,197,94,0.2)' },
    pending:   { c: '#FFC745', bg: 'rgba(255,199,69,0.1)',  bd: 'rgba(255,199,69,0.2)' },
    waitlist:  { c: '#6B7280',  bg: 'rgba(107,114,128,0.1)', bd: 'rgba(107,114,128,0.2)' },
    paid:      { c: '#22C55E', bg: 'rgba(34,197,94,0.1)',   bd: 'rgba(34,197,94,0.2)' },
    overdue:   { c: '#EF4444', bg: 'rgba(239,68,68,0.1)',   bd: 'rgba(239,68,68,0.2)' },
  }
  const s = map[status] ?? map.draft
  return <span style={{ fontSize: 11, fontWeight: 700, color: s.c, background: s.bg, border: `1px solid ${s.bd}`, borderRadius: 6, padding: '2px 8px', textTransform: 'capitalize' }}>{status}</span>
}

function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background: '#0D0F18', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, ...style }}>{children}</div>
}

function ScrHeader({ title, sub, action }: { title: string; sub: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, gap: 16 }}>
      <div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: '#fff', margin: '0 0 4px', letterSpacing: '-0.5px' }}>{title}</h2>
        <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>{sub}</p>
      </div>
      {action}
    </div>
  )
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

function DashboardScreen() {
  return (
    <div>
      <ScrHeader title="Dashboard" sub="Here's what's happening across your events." />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10, marginBottom: 20 }}>
        {STATS.map(s => {
          const Icon = s.icon
          return (
            <Card key={s.label} style={{ padding: '16px 18px', cursor: 'default' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div style={{ width: 26, height: 26, borderRadius: 8, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={13} color={s.color} />
                </div>
                <p style={{ fontSize: 11, color: '#6B7280', margin: 0 }}>{s.label}</p>
              </div>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: '#fff', margin: '0 0 2px', letterSpacing: '-0.5px' }}>{s.value}</p>
              <p style={{ fontSize: 11, color: '#4B5563', margin: 0 }}>{s.sub}</p>
            </Card>
          )
        })}
      </div>
      <div className="demo-dash-grid">
        <Card style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: '#fff', margin: 0 }}>Upcoming Events</h3>
            <span style={{ fontSize: 12, color: '#1E5EFF' }}>View all →</span>
          </div>
          {MOCK_EVENTS.slice(0,3).map(e => (
            <div key={e.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', margin: '0 0 2px' }}>{e.title}</p>
                <p style={{ fontSize: 11, color: '#6B7280', margin: 0 }}>{e.date}</p>
              </div>
              <span style={{ fontSize: 11, background: 'rgba(30,94,255,0.1)', color: '#4D82FF', border: '1px solid rgba(30,94,255,0.2)', borderRadius: 6, padding: '2px 8px', fontWeight: 700 }}>{e.capacity} cap</span>
            </div>
          ))}
        </Card>
        <Card style={{ padding: 20 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: '#fff', margin: '0 0 16px' }}>Quick Actions</h3>
          {[
            { icon: CalendarDays, label: 'Create a new event', desc: 'Set up public or private event', color: '#1E5EFF' },
            { icon: Users,        label: 'Manage guests',      desc: 'Invite guests and manage list',   color: '#22C55E' },
            { icon: ScanLine,     label: 'Open scanner',        desc: 'QR entry/exit scanning',          color: '#FFC745' },
            { icon: Building2,    label: 'Add a vendor',        desc: 'Track vendors and invoices',      color: '#A78BFA' },
          ].map(a => {
            const Icon = a.icon
            return (
              <div key={a.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'default' }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: `${a.color}18`, border: `1px solid ${a.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={15} color={a.color} />
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', margin: '0 0 1px' }}>{a.label}</p>
                  <p style={{ fontSize: 11, color: '#6B7280', margin: 0 }}>{a.desc}</p>
                </div>
              </div>
            )
          })}
        </Card>
      </div>
    </div>
  )
}

// ── Events ────────────────────────────────────────────────────────────────────

function EventsScreen() {
  return (
    <div>
      <ScrHeader title="Events" sub="All your events in one place." action={
        <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#1E5EFF', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 18px', fontWeight: 700, fontSize: 13, cursor: 'default', fontFamily: 'var(--font-display)', boxShadow: '0 0 20px rgba(30,94,255,0.3)' }}>
          <Zap size={14} /> New Event
        </button>
      } />
      <Card>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, color: '#6B7280' }}>{MOCK_EVENTS.length} events</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '6px 12px', color: '#9CA3AF', fontSize: 12, cursor: 'default' }}><Filter size={11} /> Filter</button>
          </div>
        </div>
        {MOCK_EVENTS.map((e, i) => (
          <div key={e.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px', borderBottom: i < MOCK_EVENTS.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#fff', margin: 0 }}>{e.title}</p>
                <StatusPill status={e.status} />
              </div>
              <div style={{ display: 'flex', gap: 14, fontSize: 12, color: '#6B7280' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><CalendarDays size={11} /> {e.date}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={11} /> {e.venue}</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexShrink: 0, marginLeft: 16 }}>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: e.price ? '#FFC745' : '#22C55E', margin: '0 0 2px' }}>{e.price ? `₨${e.price.toLocaleString()}` : 'Free'}</p>
                <p style={{ fontSize: 11, color: '#6B7280', margin: 0 }}>{e.sold}/{e.capacity} sold</p>
              </div>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'default' }}>
                <MoreVertical size={14} color="#6B7280" />
              </div>
            </div>
          </div>
        ))}
      </Card>
    </div>
  )
}

// ── Guests ────────────────────────────────────────────────────────────────────

function GuestsScreen() {
  const [guests, setGuests] = useState(MOCK_GUESTS)
  const approve = (id: number) => setGuests(g => g.map(x => x.id === id ? { ...x, status: 'approved' } : x))
  const deny    = (id: number) => setGuests(g => g.map(x => x.id === id ? { ...x, status: 'waitlist' } : x))
  return (
    <div>
      <ScrHeader title="Guests" sub={`${guests.length} guests across all events.`} />
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <div style={{ flex: 1, background: '#0D0F18', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '9px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Search size={13} color="#4B5563" />
          <span style={{ fontSize: 13, color: '#4B5563' }}>Search guests…</span>
        </div>
      </div>
      <Card>
        {guests.map((g, i) => (
          <div key={g.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 18px', borderBottom: i < guests.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: `hsl(${g.id * 60},50%,40%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{g.name[0]}</div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', margin: '0 0 2px' }}>{g.name}</p>
                <p style={{ fontSize: 11, color: '#6B7280', margin: 0 }}>{g.phone} · {g.event}</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <StatusPill status={g.status} />
              {g.status === 'pending' && (
                <div style={{ display: 'flex', gap: 5 }}>
                  <button onClick={() => approve(g.id)} style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', color: '#22C55E', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check size={13} /></button>
                  <button onClick={() => deny(g.id)}   style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', color: '#F87171', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>✕</button>
                </div>
              )}
            </div>
          </div>
        ))}
      </Card>
    </div>
  )
}

// ── Approvals ─────────────────────────────────────────────────────────────────

function ApprovalsScreen() {
  const [items, setItems] = useState(MOCK_APPROVALS)
  const resolve = (id: number) => setItems(a => a.filter(x => x.id !== id))
  return (
    <div>
      <ScrHeader title="Approvals" sub={`${items.length} registration${items.length !== 1 ? 's' : ''} awaiting review.`} />
      {items.length === 0 ? (
        <Card style={{ padding: 40, textAlign: 'center' }}>
          <CheckCircle2 size={36} color="#22C55E" style={{ margin: '0 auto 12px', display: 'block' }} />
          <p style={{ fontSize: 15, fontWeight: 600, color: '#fff', margin: '0 0 6px' }}>All caught up!</p>
          <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>No pending approvals.</p>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {items.map(a => (
            <Card key={a.id} style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: `hsl(${a.id * 80},50%,40%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{a.name[0]}</div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#fff', margin: '0 0 2px' }}>{a.name}</p>
                    <p style={{ fontSize: 12, color: '#6B7280', margin: 0 }}>{a.phone} · {a.event} · {a.time}</p>
                  </div>
                </div>
                {a.screenshot && <span style={{ fontSize: 11, background: 'rgba(30,94,255,0.1)', border: '1px solid rgba(30,94,255,0.2)', color: '#4D82FF', borderRadius: 6, padding: '3px 8px', fontWeight: 700 }}>📸 Screenshot</span>}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => resolve(a.id)} style={{ flex: 1, background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)', color: '#22C55E', borderRadius: 9, padding: '10px 0', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-display)' }}>✓ Approve</button>
                <button onClick={() => resolve(a.id)} style={{ flex: 1, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)', color: '#F87171', borderRadius: 9, padding: '10px 0', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-display)' }}>✕ Reject</button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Scanner ───────────────────────────────────────────────────────────────────

function ScannerScreen() {
  const [state, setState] = useState<'idle'|'scanning'|'success'>('idle')
  const [checkedIn, setCheckedIn] = useState(62)
  const scan = () => { setState('scanning'); setTimeout(() => { setState('success'); setCheckedIn(n => n + 1) }, 1400) }
  const reset = () => setState('idle')
  return (
    <div>
      <ScrHeader title="QR Scanner" sub="Scan guest QR codes at the venue entrance." />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
          <Card style={{ width: '100%', padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 220, height: 220, background: '#080A10', border: `2px solid ${state === 'success' ? '#22C55E' : state === 'scanning' ? '#1E5EFF' : 'rgba(255,255,255,0.08)'}`, borderRadius: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, transition: 'border-color 0.4s', position: 'relative', overflow: 'hidden' }}>
              {state === 'idle'     && <><QrCode size={72} color="rgba(255,255,255,0.1)" /><p style={{ fontSize: 13, color: '#4B5563', textAlign: 'center', padding: '0 20px' }}>Ready to scan</p></>}
              {state === 'scanning' && <><div style={{ position: 'absolute', left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,transparent,#1E5EFF,transparent)', animation: 'scanLine 1s ease-in-out infinite' }} /><QrCode size={72} color="#1E5EFF" /><p style={{ fontSize: 13, color: '#4D82FF', fontWeight: 600 }}>Scanning…</p></>}
              {state === 'success'  && <><CheckCircle2 size={64} color="#22C55E" /><p style={{ fontSize: 14, fontWeight: 700, color: '#22C55E' }}>Checked In! ✓</p></>}
            </div>
            {state === 'idle'    && <button onClick={scan}  style={{ background: '#1E5EFF', color: '#fff', border: 'none', borderRadius: 11, padding: '12px 28px', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'var(--font-display)', boxShadow: '0 0 24px rgba(30,94,255,0.4)', display: 'flex', alignItems: 'center', gap: 8 }}><ScanLine size={16} /> Simulate Scan</button>}
            {state === 'success' && <button onClick={reset} style={{ background: 'transparent', color: '#6B7280', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 24px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Scan Next Guest</button>}
          </Card>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, width: '100%' }}>
            {[{ n: '84', l: 'Total', c: '#1E5EFF'  }, { n: checkedIn.toString(), l: 'Checked In', c: '#22C55E' }, { n: (84 - checkedIn).toString(), l: 'Remaining', c: '#FFC745' }].map(s => (
              <Card key={s.l} style={{ padding: '14px 12px', textAlign: 'center' }}>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: s.c, margin: '0 0 3px' }}>{s.n}</p>
                <p style={{ fontSize: 11, color: '#6B7280', margin: 0 }}>{s.l}</p>
              </Card>
            ))}
          </div>
        </div>
        <Card style={{ padding: 20 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', margin: '0 0 14px', fontFamily: 'var(--font-display)' }}>Check-in Log</p>
          {['Omar Qureshi · 10:02 PM', 'Ayesha Farooq · 10:05 PM', ...(state === 'success' ? ['Latest Scan · just now'] : []), 'Bilal Mahmood · 10:09 PM'].map((row, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 6px #22C55E', flexShrink: 0 }} />
              <p style={{ fontSize: 12, color: '#D1D5DB', margin: 0 }}>{row}</p>
            </div>
          ))}
          <div style={{ background: 'rgba(30,94,255,0.06)', border: '1px solid rgba(30,94,255,0.15)', borderRadius: 12, padding: 14, marginTop: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#7BA7FF', margin: '0 0 4px' }}>⚡ Staff Mode</p>
            <p style={{ fontSize: 12, color: '#6B7280', margin: 0 }}>Share a scanner-only link with your team — they can scan without seeing your dashboard or guest data.</p>
          </div>
        </Card>
      </div>
    </div>
  )
}

// ── Vendors ───────────────────────────────────────────────────────────────────

function VendorsScreen() {
  return (
    <div>
      <ScrHeader title="Vendors" sub="Track all vendors and payment status across your events." action={
        <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#1E5EFF', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 18px', fontWeight: 700, fontSize: 13, cursor: 'default', fontFamily: 'var(--font-display)', boxShadow: '0 0 20px rgba(30,94,255,0.3)' }}>+ Add Vendor</button>
      } />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 20 }}>
        {[{ l: 'Total Vendors', v: '4', c: '#1E5EFF' }, { l: 'Total Value', v: '₨280K', c: '#FFC745' }, { l: 'Outstanding', v: '₨235K', c: '#EF4444' }].map(s => (
          <Card key={s.l} style={{ padding: '16px 18px' }}>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: s.c, margin: '0 0 4px' }}>{s.v}</p>
            <p style={{ fontSize: 12, color: '#6B7280', margin: 0 }}>{s.l}</p>
          </Card>
        ))}
      </div>
      <Card>
        {MOCK_VENDORS.map((v, i) => (
          <div key={v.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px', borderBottom: i < MOCK_VENDORS.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Building2 size={16} color="#A78BFA" />
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', margin: '0 0 2px' }}>{v.name}</p>
                <p style={{ fontSize: 11, color: '#6B7280', margin: 0 }}>{v.service} · {v.event}</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: '#fff', margin: '0 0 2px' }}>₨{v.amount.toLocaleString()}</p>
                <p style={{ fontSize: 11, color: '#6B7280', margin: 0 }}>Due {v.due}</p>
              </div>
              <StatusPill status={v.status} />
            </div>
          </div>
        ))}
      </Card>
    </div>
  )
}

// ── Analytics ─────────────────────────────────────────────────────────────────

function AnalyticsScreen() {
  const bars = [{ t: '7pm', p: 8 }, { t: '8pm', p: 32 }, { t: '9pm', p: 71 }, { t: '10pm', p: 100 }, { t: '11pm', p: 88 }, { t: '12am', p: 55 }]
  return (
    <div>
      <ScrHeader title="Analytics" sub="Performance insights across all your events." />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10, marginBottom: 20 }}>
        {[
          { l: 'Total Revenue',   v: '₨280,000', s: '80 tickets sold',    c: '#FFC745' },
          { l: 'Attendance Rate', v: '94%',       s: '75 of 80 scanned',  c: '#22C55E' },
          { l: 'Avg Ticket Price',v: '₨3,500',   s: 'Across 3 events',   c: '#4D82FF' },
          { l: 'Demand Overflow', v: '23',        s: 'Waitlisted guests',  c: '#A855F7' },
        ].map(s => (
          <Card key={s.l} style={{ padding: '20px 22px' }}>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, color: s.c, margin: '0 0 4px', letterSpacing: '-0.5px' }}>{s.v}</p>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', margin: '0 0 2px' }}>{s.l}</p>
            <p style={{ fontSize: 11, color: '#6B7280', margin: 0 }}>{s.s}</p>
          </Card>
        ))}
      </div>
      <Card style={{ padding: 24 }}>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: '#fff', margin: '0 0 24px' }}>Check-in Timeline — Rooftop Night</p>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, height: 120 }}>
          {bars.map((b, i) => (
            <div key={b.t} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{ width: '100%', background: 'linear-gradient(180deg,#1E5EFF,rgba(30,94,255,0.3))', borderRadius: '6px 6px 0 0', height: `${b.p}%`, transition: 'height 1s cubic-bezier(0.34,1.1,0.64,1)', transitionDelay: `${i * 0.08}s`, minHeight: 4 }} />
              <span style={{ fontSize: 10, color: '#6B7280', whiteSpace: 'nowrap' }}>{b.t}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

// ─── Tour Overlay ─────────────────────────────────────────────────────────────

type TourHighlight = { top: number; left: number; width: number; height: number }

function TourOverlay({ step, total, onNext, onPrev, onDismiss }: {
  step: number; total: number; onNext: () => void; onPrev: () => void; onDismiss: () => void
}) {
  const current = TOUR_STEPS[step]
  const isCenter = !current.target
  const isFirst = step === 0
  const isLast = step === total - 1
  const progress = (step / (total - 1)) * 100
  const [hl, setHl] = useState<TourHighlight | null>(null)

  useEffect(() => {
    if (!current.target) { setHl(null); return }
    const el = document.getElementById(current.target)
    if (!el) { setHl(null); return }
    const r = el.getBoundingClientRect()
    setHl({ top: r.top, left: r.left, width: r.width, height: r.height })
  }, [step, current.target])

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') onNext()
      if (e.key === 'ArrowLeft') onPrev()
      if (e.key === 'Escape') onDismiss()
    }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [onNext, onPrev, onDismiss])

  const PAD = 6
  let tooltipStyle: React.CSSProperties = {}
  if (hl && !isCenter) {
    const vw = window.innerWidth
    const TOOLTIP_W = 280
    let left = hl.left + hl.width + 16
    if (left + TOOLTIP_W > vw - 12) left = hl.left - TOOLTIP_W - 16
    left = Math.max(12, left)
    let top = hl.top + hl.height / 2 - 110
    top = Math.max(12, Math.min(top, window.innerHeight - 240))
    tooltipStyle = { position: 'fixed', top, left, width: TOOLTIP_W, zIndex: 10001 }
  }

  const card = (
    <div style={{ background: 'rgba(10,12,20,0.97)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 14, padding: isCenter ? 26 : 20, boxShadow: '0 20px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.03)', backdropFilter: 'blur(20px)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: isCenter ? 28 : 22, flexShrink: 0 }}>{current.emoji}</span>
          <div>
            <p style={{ fontSize: isCenter ? 17 : 14, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-display)', margin: '0 0 2px' }}>{current.title}</p>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', margin: 0 }}>{step + 1} / {total}</p>
          </div>
        </div>
        <button onClick={onDismiss} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 7, width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', flexShrink: 0 }}>
          <X size={12} />
        </button>
      </div>
      <p style={{ fontSize: isCenter ? 14 : 12.5, color: 'rgba(255,255,255,0.6)', lineHeight: 1.65, margin: '0 0 16px', fontFamily: 'var(--font-body)' }}>{current.desc}</p>
      {isLast && (
        <Link href="/register" style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#1E5EFF', color: '#fff', textDecoration: 'none', borderRadius: 9, padding: '10px 16px', fontWeight: 700, fontSize: 13, fontFamily: 'var(--font-display)', boxShadow: '0 0 24px rgba(30,94,255,0.4)', marginBottom: 14, justifyContent: 'center' }}>
          <Zap size={14} /> Get Started — It's Free
        </Link>
      )}
      <div style={{ height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.07)', marginBottom: 14, overflow: 'hidden' }}>
        <div style={{ height: '100%', borderRadius: 99, width: `${progress}%`, background: 'linear-gradient(90deg,#1E5EFF,#3b82f6)', transition: 'width 0.3s ease' }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
        <button onClick={onPrev} disabled={isFirst} style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '7px 12px', fontSize: 11, fontWeight: 600, borderRadius: 7, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.05)', color: isFirst ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.55)', cursor: isFirst ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-display)' }}>
          <ChevronLeft size={12} />Back
        </button>
        <div style={{ display: 'flex', gap: 3, alignItems: 'center', flex: 1, justifyContent: 'center' }}>
          {TOUR_STEPS.map((_, i) => (
            <div key={i} style={{ width: i === step ? 14 : 5, height: 5, borderRadius: 99, background: i === step ? '#1E5EFF' : i < step ? 'rgba(30,94,255,0.4)' : 'rgba(255,255,255,0.12)', transition: 'all 0.25s ease', flexShrink: 0 }} />
          ))}
        </div>
        <button onClick={onNext} style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '7px 14px', fontSize: 11, fontWeight: 700, borderRadius: 7, border: 'none', background: 'linear-gradient(135deg,#1E5EFF,#3b82f6)', color: '#fff', cursor: 'pointer', fontFamily: 'var(--font-display)', boxShadow: '0 3px 10px rgba(30,94,255,0.3)' }}>
          {isLast ? <><Sparkles size={11} />Done</> : <>Next<ChevronRight size={12} /></>}
        </button>
      </div>
    </div>
  )

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 9998, background: isCenter ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.6)', backdropFilter: isCenter ? 'blur(4px)' : 'none', transition: 'background 0.3s' }} onClick={onDismiss} />
      {hl && !isCenter && (
        <div style={{ position: 'fixed', top: hl.top - PAD, left: hl.left - PAD, width: hl.width + PAD * 2, height: hl.height + PAD * 2, zIndex: 9999, borderRadius: 12, boxShadow: '0 0 0 3px #1E5EFF, 0 0 0 7px rgba(30,94,255,0.22), 0 0 32px rgba(30,94,255,0.15)', background: 'rgba(30,94,255,0.04)', pointerEvents: 'none', transition: 'all 0.28s cubic-bezier(0.4,0,0.2,1)' }} />
      )}
      {isCenter && (
        <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 10001, width: 'min(380px, calc(100vw - 32px))' }}>
          {card}
        </div>
      )}
      {!isCenter && hl && (
        <div style={tooltipStyle}>{card}</div>
      )}
    </>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

const SCREENS: Record<string, React.FC> = {
  dash: DashboardScreen, events: EventsScreen, guests: GuestsScreen,
  appr: ApprovalsScreen, scan: ScannerScreen, vend: VendorsScreen, anal: AnalyticsScreen,
}

export default function DemoPage() {
  const [active, setActive] = useState('dash')
  const [tourStep, setTourStep] = useState(0)
  const [tourActive, setTourActive] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setTourActive(true), 900)
    return () => clearTimeout(t)
  }, [])

  const next = useCallback(() => {
    if (tourStep === TOUR_STEPS.length - 1) { setTourActive(false); return }
    const nextStep = tourStep + 1
    setTourStep(nextStep)
    const target = TOUR_STEPS[nextStep]?.target
    if (target) {
      const navMap: Record<string, string> = { 'demo-nav-dash': 'dash', 'demo-nav-events': 'events', 'demo-nav-guests': 'guests', 'demo-nav-appr': 'appr', 'demo-nav-scan': 'scan', 'demo-nav-vend': 'vend', 'demo-nav-anal': 'anal' }
      const section = navMap[target]
      if (section) setActive(section)
    }
  }, [tourStep])

  const prev = useCallback(() => setTourStep(s => Math.max(0, s - 1)), [])
  const dismiss = useCallback(() => setTourActive(false), [])
  const startTour = useCallback(() => { setTourStep(0); setActive('dash'); setTourActive(true) }, [])

  const Screen = SCREENS[active] ?? DashboardScreen

  return (
    <>
      <style>{`
        @keyframes scanLine { 0%,100%{top:8%} 50%{top:88%} }
        * { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; overflow: hidden; height: 100%; background: #080A10; }
        .demo-main-pad { padding: 28px; }
        .demo-announce-text { font-size: 13px; }
        .demo-announce-link { display: flex; }
        .demo-dash-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        @media (max-width: 768px) {
          .demo-main-pad { padding: 16px 14px; }
          .demo-announce-text { font-size: 11px; }
          .demo-announce-link { display: none; }
          .demo-dash-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
      {/* Announcement bar */}
      <div style={{ background: 'linear-gradient(90deg, rgba(30,94,255,0.15), rgba(30,94,255,0.08))', borderBottom: '1px solid rgba(30,94,255,0.15)', padding: '7px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, flexShrink: 0 }}>
        <span className="demo-announce-text" style={{ color: '#9CA3AF' }}>
          👋 You're viewing an interactive demo of the Tikkit organizer dashboard.
        </span>
        <Link href="/register" className="demo-announce-link" style={{ fontSize: 13, fontWeight: 700, color: '#4D82FF', textDecoration: 'none', alignItems: 'center', gap: 4 }}>
          Sign up free <ArrowRight size={12} />
        </Link>
      </div>
      {/* Dashboard shell */}
      <div style={{ display: 'flex', height: 'calc(100dvh - 41px)', overflow: 'hidden' }}>
        <DemoSidebar active={active} setActive={setActive} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <DemoTopBar section={active} onStartTour={startTour} onMenuClick={() => setSidebarOpen(true)} />
          <main style={{ flex: 1, overflowY: 'auto', background: '#080A10' }} className="demo-main-pad">
            <div style={{ maxWidth: 900 }}>
              <Screen />
            </div>
          </main>
        </div>
      </div>

      {tourActive && (
        <TourOverlay step={tourStep} total={TOUR_STEPS.length} onNext={next} onPrev={prev} onDismiss={dismiss} />
      )}
    </>
  )
}
