'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, Inbox, Music2, Settings, ChevronRight, Mic2, LogOut, Bell } from 'lucide-react'
import { signOut } from '@/app/actions/guestProfileActions'

const NAV = [
  { label: 'Roster',    href: '/artist-mgmt/os',           icon: Music2,          extra: ['/artist-mgmt/os/roster'] },
  { label: 'Enquiries', href: '/artist-mgmt/os/enquiries', icon: Inbox,           extra: [] },
  { label: 'Overview',  href: '/artist-mgmt/os/overview',  icon: LayoutDashboard, extra: [] },
  { label: 'Settings',  href: '/artist-mgmt/os/settings',  icon: Settings,        extra: [] },
]

export const C = {
  black:   '#050508',
  cyan:    '#00E5FF',
  magenta: '#CC00FF',
  surface: '#0A0F14',
  border:  'rgba(0,229,255,0.1)',
  muted:   'rgba(255,255,255,0.4)',
  text:    '#FFFFFF',
}

export default function ArtistMgmtShell({
  children,
  companyName,
  unreadCount = 0,
}: {
  children: React.ReactNode
  companyName?: string
  unreadCount?: number
}) {
  const pathname = usePathname()

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: C.black, color: C.text, fontFamily: 'var(--font-body, "DM Sans", sans-serif)' }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: 220, flexShrink: 0,
        background: C.surface,
        borderRight: `1px solid ${C.border}`,
        display: 'flex', flexDirection: 'column',
        position: 'sticky', top: 0, height: '100vh', overflowY: 'auto',
      }} className="am-sidebar">

        {/* Wordmark */}
        <div style={{ padding: '24px 20px 20px', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 9,
              background: `linear-gradient(135deg, ${C.cyan}, ${C.magenta})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Mic2 size={15} color="#050508" strokeWidth={2.5} />
            </div>
            <div>
              <p style={{ fontSize: 12, fontWeight: 900, margin: 0, letterSpacing: '0.5px', textTransform: 'uppercase', background: `linear-gradient(90deg, ${C.cyan}, ${C.magenta})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Artists</p>
              {companyName && <p style={{ fontSize: 10, color: C.muted, margin: 0, WebkitTextFillColor: C.muted }}>{companyName}</p>}
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 10px' }}>
          {NAV.map(({ label, href, icon: Icon, extra }) => {
            const active = pathname === href
              || (href !== '/artist-mgmt/os' && pathname.startsWith(href))
              || extra.some((e: string) => pathname === e || pathname.startsWith(e + '/'))
            const isEnquiries = label === 'Enquiries'
            return (
              <Link key={href} href={href} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', borderRadius: 10, marginBottom: 2,
                textDecoration: 'none',
                background: active ? `rgba(0,229,255,0.08)` : 'transparent',
                border: active ? `1px solid rgba(0,229,255,0.18)` : '1px solid transparent',
                color: active ? C.cyan : C.muted,
                fontSize: 13, fontWeight: active ? 700 : 500,
                transition: 'all 0.15s',
                position: 'relative',
              }}>
                <Icon size={15} />
                {label}
                {isEnquiries && unreadCount > 0 && (
                  <span style={{ marginLeft: 'auto', minWidth: 18, height: 18, borderRadius: 9, background: C.magenta, color: '#fff', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
                {active && !isEnquiries && <ChevronRight size={12} style={{ marginLeft: 'auto' }} />}
              </Link>
            )
          })}
        </nav>

        {/* Sign out */}
        <div style={{ padding: '12px 10px', borderTop: `1px solid ${C.border}` }}>
          <Link href="/artists" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 10, textDecoration: 'none', color: C.muted, fontSize: 12, marginBottom: 4 }}>
            <Music2 size={13} /> View Public Directory
          </Link>
          <button onClick={() => signOut()} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10, background: 'none', border: 'none', cursor: 'pointer', color: C.muted, fontSize: 13, fontFamily: 'inherit' }}>
            <LogOut size={15} /> Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main style={{ flex: 1, minWidth: 0, overflowY: 'auto' }}>

        {/* Mobile top bar */}
        <div className="am-mobile-bar" style={{ display: 'none', padding: '14px 16px', borderBottom: `1px solid ${C.border}`, alignItems: 'center', gap: 10, background: C.surface }}>
          <div style={{ width: 24, height: 24, borderRadius: 7, background: `linear-gradient(135deg, ${C.cyan}, ${C.magenta})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Mic2 size={12} color="#050508" strokeWidth={2.5} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 900, letterSpacing: '0.5px', textTransform: 'uppercase', background: `linear-gradient(90deg, ${C.cyan}, ${C.magenta})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Artists</span>
          {unreadCount > 0 && (
            <span style={{ marginLeft: 'auto', minWidth: 20, height: 20, borderRadius: 10, background: C.magenta, color: '#fff', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px' }}>
              {unreadCount}
            </span>
          )}
        </div>

        {/* Mobile bottom nav */}
        <nav className="am-bottom-nav" style={{ display: 'none', position: 'fixed', bottom: 0, left: 0, right: 0, background: C.surface, borderTop: `1px solid ${C.border}`, zIndex: 50, padding: '6px 0 calc(6px + env(safe-area-inset-bottom))' }}>
          <div style={{ display: 'flex' }}>
            {NAV.map(({ label, href, icon: Icon, extra }) => {
              const active = pathname === href
                || (href !== '/artist-mgmt/os' && pathname.startsWith(href))
                || extra.some((e: string) => pathname === e || pathname.startsWith(e + '/'))
              return (
                <Link key={href} href={href} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '6px 0', textDecoration: 'none', color: active ? C.cyan : C.muted, position: 'relative' }}>
                  <Icon size={18} />
                  <span style={{ fontSize: 9, fontWeight: active ? 700 : 500 }}>{label}</span>
                  {label === 'Enquiries' && unreadCount > 0 && (
                    <span style={{ position: 'absolute', top: 2, right: '50%', transform: 'translateX(8px)', width: 14, height: 14, borderRadius: 7, background: C.magenta, fontSize: 8, fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        </nav>

        <style>{`
          @media (max-width: 767px) {
            .am-sidebar { display: none !important; }
            .am-mobile-bar { display: flex !important; }
            .am-bottom-nav { display: block !important; }
          }
        `}</style>

        <div style={{ padding: '32px 40px 80px', maxWidth: 1200 }} className="am-content">
          <style>{`
            @media (max-width: 767px) {
              .am-content { padding: 20px 16px 96px !important; }
            }
          `}</style>
          {children}
        </div>
      </main>
    </div>
  )
}
