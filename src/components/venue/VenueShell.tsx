'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard, CalendarDays, Clock3, Settings,
  ChevronRight, MapPin, LogOut, Grid3X3, MessageSquare,
} from 'lucide-react'
import { signOut } from '@/app/actions/guestProfileActions'

const NAV = [
  { label: 'Overview',   href: '/venue/os',              icon: LayoutDashboard, extra: [] },
  { label: 'Programmes', href: '/venue/os/programmes',   icon: CalendarDays,    extra: [] },
  { label: 'Enquiries',  href: '/venue/os/enquiries',    icon: MessageSquare,   extra: [] },
  { label: 'Slots',      href: '/venue/os/slots',        icon: Clock3,          extra: [] },
  { label: 'Spot Map',   href: '/venue/os/spot-map',     icon: Grid3X3,         extra: [] },
  { label: 'Settings',   href: '/venue/os/settings',     icon: Settings,        extra: [] },
]

const C = {
  black:   '#050508',
  emerald: '#00D4AA',   // Venues brand accent — teal/emerald (distinct from Vendor X cyan)
  violet:  '#7C3AED',   // Secondary accent
  surface: '#0A0F14',
  border:  'rgba(0,212,170,0.12)',
  muted:   'rgba(255,255,255,0.4)',
  text:    '#FFFFFF',
}

export { C as VenueColors }

export default function VenueShell({ children, venueName }: { children: React.ReactNode; venueName?: string }) {
  const pathname = usePathname()

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: C.black, color: C.text, fontFamily: 'var(--font-body, "DM Sans", sans-serif)' }}>

      {/* ── Sidebar (desktop) ── */}
      <aside style={{
        width: 220, flexShrink: 0,
        background: C.surface,
        borderRight: `1px solid ${C.border}`,
        display: 'flex', flexDirection: 'column',
        position: 'sticky', top: 0, height: '100vh', overflowY: 'auto',
      }} className="vs-sidebar">

        {/* Wordmark */}
        <div style={{ padding: '24px 20px 20px', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: `linear-gradient(135deg, ${C.emerald}, ${C.violet})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <MapPin size={14} color="#050508" strokeWidth={2.5} />
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 800, margin: 0, letterSpacing: '-0.3px', color: C.text }}>Venues</p>
              {venueName && <p style={{ fontSize: 10, color: C.muted, margin: 0 }}>{venueName}</p>}
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 10px' }}>
          {NAV.map(({ label, href, icon: Icon, extra }) => {
            const active = pathname === href
              || (href !== '/venue/os' && pathname.startsWith(href))
              || extra.some((e: string) => pathname === e || pathname.startsWith(e + '/'))
            return (
              <Link key={href} href={href} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', borderRadius: 10, marginBottom: 2,
                textDecoration: 'none',
                background: active ? `rgba(0,212,170,0.1)` : 'transparent',
                border: active ? `1px solid rgba(0,212,170,0.2)` : '1px solid transparent',
                color: active ? C.emerald : C.muted,
                fontSize: 13, fontWeight: active ? 700 : 500,
                transition: 'all 0.15s',
              }}>
                <Icon size={15} />
                {label}
                {active && <ChevronRight size={12} style={{ marginLeft: 'auto' }} />}
              </Link>
            )
          })}
        </nav>

        {/* Sign out */}
        <div style={{ padding: '12px 10px', borderTop: `1px solid ${C.border}` }}>
          <button
            onClick={() => signOut()}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px', borderRadius: 10,
              background: 'none', border: 'none', cursor: 'pointer',
              color: C.muted, fontSize: 13, fontFamily: 'inherit',
            }}
          >
            <LogOut size={15} /> Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main style={{ flex: 1, minWidth: 0, overflowY: 'auto' }}>
        {/* Mobile top bar */}
        <div className="vs-mobile-bar" style={{ display: 'none', padding: '14px 16px', borderBottom: `1px solid ${C.border}`, alignItems: 'center', gap: 10, background: C.surface }}>
          <div style={{ width: 22, height: 22, borderRadius: 6, background: `linear-gradient(135deg, ${C.emerald}, ${C.violet})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MapPin size={11} color="#050508" strokeWidth={2.5} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 800 }}>Venues</span>
        </div>

        {/* Mobile bottom nav */}
        <nav className="vs-bottom-nav" style={{ display: 'none', position: 'fixed', bottom: 0, left: 0, right: 0, background: C.surface, borderTop: `1px solid ${C.border}`, zIndex: 50, padding: '6px 0 calc(6px + env(safe-area-inset-bottom))' }}>
          <div style={{ display: 'flex' }}>
            {NAV.map(({ label, href, icon: Icon, extra }) => {
              const active = pathname === href
                || (href !== '/venue/os' && pathname.startsWith(href))
                || extra.some((e: string) => pathname === e || pathname.startsWith(e + '/'))
              return (
                <Link key={href} href={href} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '6px 0', textDecoration: 'none', color: active ? C.emerald : C.muted }}>
                  <Icon size={18} />
                  <span style={{ fontSize: 9, fontWeight: active ? 700 : 500 }}>{label}</span>
                </Link>
              )
            })}
          </div>
        </nav>

        <style>{`
          @media (max-width: 767px) {
            .vs-sidebar { display: none !important; }
            .vs-mobile-bar { display: flex !important; }
            .vs-bottom-nav { display: block !important; }
          }
        `}</style>

        <div style={{ padding: '32px 40px 64px', maxWidth: 1200 }} className="vs-content">
          <style>{`
            @media (max-width: 767px) {
              .vs-content { padding: 20px 16px 96px !important; }
            }
          `}</style>
          {children}
        </div>
      </main>
    </div>
  )
}
