'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard, KanbanSquare, FileText, Settings,
  ChevronRight, Zap, LogOut, Receipt, BarChart2, Package
} from 'lucide-react'
import { signOut } from '@/app/actions/guestProfileActions'

const NAV = [
  { label: 'Overview',  href: '/vendor/os',          icon: LayoutDashboard },
  { label: 'Deals',     href: '/vendor/os/deals',     icon: KanbanSquare    },
  { label: 'Invoices',  href: '/vendor/os/invoices',  icon: FileText        },
  { label: 'Bills',     href: '/vendor/os/bills',     icon: Receipt         },
  { label: 'Analytics', href: '/vendor/os/analytics', icon: BarChart2       },
  { label: 'Inventory', href: '/vendor/os/inventory', icon: Package         },
  { label: 'Settings',  href: '/vendor/os/settings',  icon: Settings        },
]

const C = {
  black:   '#050508',
  cyan:    '#00E5FF',
  magenta: '#CC00FF',
  surface: '#0D0D14',
  border:  'rgba(0,229,255,0.12)',
  muted:   'rgba(255,255,255,0.4)',
  text:    '#FFFFFF',
}

export default function VendorShell({ children, tradingName }: { children: React.ReactNode; tradingName?: string }) {
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
      }} className="vx-sidebar">

        {/* Wordmark */}
        <div style={{ padding: '24px 20px 20px', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: `linear-gradient(135deg, ${C.cyan}, ${C.magenta})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Zap size={14} color="#050508" strokeWidth={2.5} />
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 800, margin: 0, letterSpacing: '-0.3px', color: C.text }}>Vendor X</p>
              {tradingName && <p style={{ fontSize: 10, color: C.muted, margin: 0 }}>{tradingName}</p>}
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 10px' }}>
          {NAV.map(({ label, href, icon: Icon }) => {
            const active = pathname === href || (href !== '/vendor/os' && pathname.startsWith(href))
            return (
              <Link key={href} href={href} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', borderRadius: 10, marginBottom: 2,
                textDecoration: 'none',
                background: active ? `rgba(0,229,255,0.1)` : 'transparent',
                border: active ? `1px solid rgba(0,229,255,0.2)` : '1px solid transparent',
                color: active ? C.cyan : C.muted,
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
        <div className="vx-mobile-bar" style={{ display: 'none', padding: '14px 16px', borderBottom: `1px solid ${C.border}`, alignItems: 'center', gap: 10, background: C.surface }}>
          <div style={{ width: 22, height: 22, borderRadius: 6, background: `linear-gradient(135deg, ${C.cyan}, ${C.magenta})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={11} color="#050508" strokeWidth={2.5} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 800 }}>Vendor X</span>
        </div>

        {/* Mobile bottom nav */}
        <nav className="vx-bottom-nav" style={{ display: 'none', position: 'fixed', bottom: 0, left: 0, right: 0, background: C.surface, borderTop: `1px solid ${C.border}`, zIndex: 50, padding: '6px 0 calc(6px + env(safe-area-inset-bottom))' }}>
          <div style={{ display: 'flex' }}>
            {NAV.slice(0, 4).map(({ label, href, icon: Icon }) => {
              const active = pathname === href || (href !== '/vendor/os' && pathname.startsWith(href))
              return (
                <Link key={href} href={href} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '6px 0', textDecoration: 'none', color: active ? C.cyan : C.muted }}>
                  <Icon size={18} />
                  <span style={{ fontSize: 9, fontWeight: active ? 700 : 500 }}>{label}</span>
                </Link>
              )
            })}
          </div>
        </nav>

        <style>{`
          @media (max-width: 767px) {
            .vx-sidebar { display: none !important; }
            .vx-mobile-bar { display: flex !important; }
            .vx-bottom-nav { display: block !important; }
          }
        `}</style>

        <div style={{ padding: '32px 40px 64px', maxWidth: 1200 }} className="vx-content">
          <style>{`
            @media (max-width: 767px) {
              .vx-content { padding: 20px 16px 96px !important; }
            }
          `}</style>
          {children}
        </div>
      </main>
    </div>
  )
}
