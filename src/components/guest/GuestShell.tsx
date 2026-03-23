'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Compass, User, Bell } from 'lucide-react'
import { TikkitXLogo } from '@/components/ui/TikkitXLogo'
import AddToHomeScreen from '@/components/guest/AddToHomeScreen'

/* ── Branded "X" icon for My Tikkit tab ─────────────────────────── */
function TikkitXTabIcon({ active }: { active: boolean }) {
  return (
    <span
      style={{
        fontFamily:       "'Clash Display', 'Poppins', sans-serif",
        fontWeight:       700,
        fontSize:         22,
        lineHeight:       1,
        letterSpacing:    '-0.01em',
        display:          'inline-block',
        color:            active ? '#00E5FF' : '#4B5563',
        WebkitTextStroke: active ? '1.8px #8800CC' : 'none',
        paintOrder:       'stroke fill' as React.CSSProperties['paintOrder'],
        transition:       'color 0.2s',
      }}
    >
      X
    </span>
  )
}

/* ── Tab definitions ─────────────────────────────────────────────── */
type TabIcon = 'compass' | 'x' | 'user'
const TABS: { href: string; label: string; icon: TabIcon }[] = [
  { href: '/guest/explore', label: 'Explore',   icon: 'compass' },
  { href: '/guest/tikkit',  label: 'My Tikkit', icon: 'x'       },
  { href: '/guest/profile', label: 'Profile',   icon: 'user'    },
]

function NavIcon({ type, active }: { type: TabIcon; active: boolean }) {
  if (type === 'x')       return <TikkitXTabIcon active={active} />
  if (type === 'compass') return <Compass size={20} color={active ? '#1E5EFF' : '#4B5563'} strokeWidth={active ? 2.2 : 1.8} />
  return                         <User    size={20} color={active ? '#1E5EFF' : '#4B5563'} strokeWidth={active ? 2.2 : 1.8} />
}

/* ── Shell ───────────────────────────────────────────────────────── */
export default function GuestShell({
  children,
  notifCount = 0,
}: {
  children:   React.ReactNode
  notifCount?: number
}) {
  const pathname = usePathname()

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/')

  return (
    <>
      {/* ══════════════════════════════════════════
          DESKTOP  (md and above — sidebar layout)
      ══════════════════════════════════════════ */}
      <div
        className="hidden md:flex"
        style={{ minHeight: '100svh', background: 'var(--guest-bg)', fontFamily: 'var(--font-body)' }}
      >
        {/* ── Sidebar ── */}
        <aside
          style={{
            width: 240, flexShrink: 0,
            position: 'sticky', top: 0, height: '100vh', overflow: 'hidden',
            display: 'flex', flexDirection: 'column',
            background: 'rgba(255,255,255,0.015)',
            borderRight: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          {/* Logo */}
          <div style={{ padding: '28px 24px 32px' }}>
            <TikkitXLogo size="md" variant="text-only" />
          </div>

          {/* Nav items */}
          <nav style={{ flex: 1, padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {TABS.map(({ href, label, icon }) => {
              const active = isActive(href)
              return (
                <Link
                  key={href}
                  href={href}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 12px', borderRadius: 12, textDecoration: 'none',
                    background: active ? 'rgba(30,94,255,0.1)' : 'transparent',
                    border: `1px solid ${active ? 'rgba(30,94,255,0.2)' : 'transparent'}`,
                    transition: 'background 0.15s, border-color 0.15s',
                  }}
                >
                  {/* Icon box */}
                  <div
                    style={{
                      width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: active ? 'rgba(30,94,255,0.15)' : 'rgba(255,255,255,0.04)',
                    }}
                  >
                    <NavIcon type={icon} active={active} />
                  </div>

                  <span
                    style={{
                      fontSize: 14, fontWeight: active ? 700 : 500,
                      color: active ? 'white' : '#6B7280',
                      fontFamily: 'var(--font-body)', flex: 1,
                    }}
                  >
                    {label}
                  </span>

                  {active && (
                    <span
                      style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: '#1E5EFF', flexShrink: 0,
                        boxShadow: '0 0 8px rgba(30,94,255,0.7)',
                      }}
                    />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Notification link */}
          <div style={{ padding: '12px 12px 28px' }}>
            <Link
              href="/guest/notifications"
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px', borderRadius: 12, textDecoration: 'none',
                background: 'transparent', transition: 'background 0.15s',
                position: 'relative',
              }}
            >
              <div
                style={{
                  width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(255,255,255,0.04)', position: 'relative',
                }}
              >
                <Bell size={17} color="#6B7280" />
                {notifCount > 0 && (
                  <span
                    style={{
                      position: 'absolute', top: -4, right: -4,
                      width: 16, height: 16, borderRadius: '50%',
                      background: '#EF4444', color: 'white',
                      fontSize: 9, fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    {notifCount > 9 ? '9+' : notifCount}
                  </span>
                )}
              </div>
              <span style={{ fontSize: 14, fontWeight: 500, color: '#6B7280', fontFamily: 'var(--font-body)' }}>
                Notifications
              </span>
            </Link>
          </div>
        </aside>

        {/* ── Main content ── */}
        <main style={{ flex: 1, overflowY: 'auto', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: '100%', maxWidth: 600, paddingTop: 24 }}>
            {children}
          </div>
        </main>
      </div>

      {/* ══════════════════════════════════════════
          MOBILE  (below md — bottom-bar layout)
      ══════════════════════════════════════════ */}
      <div
        className="md:hidden relative mx-auto"
        style={{
          minHeight: '100svh',
          background: 'var(--guest-bg)',
          fontFamily: 'var(--font-body)',
          maxWidth: 480,
        }}
      >
        {/* Top bar */}
        <header
          className="glass-bar sticky top-0 z-50 flex items-center justify-between border-b"
          style={{
            paddingTop:    'calc(14px + env(safe-area-inset-top))',
            paddingRight:  20,
            paddingBottom: 12,
            paddingLeft:   20,
          }}
        >
          <TikkitXLogo size="md" variant="text-only" />

          <Link
            href="/guest/notifications"
            className="relative flex items-center justify-center rounded-xl border transition-all duration-200"
            style={{
              width: 38, height: 38,
              background: 'rgba(255,255,255,0.05)',
              borderColor: 'rgba(255,255,255,0.08)',
            }}
            aria-label="Notifications"
          >
            <Bell size={17} className="text-gray-400" />
            {notifCount > 0 && (
              <span
                className="absolute -top-1 -right-1 flex items-center justify-center rounded-full bg-red-500 text-white font-bold border-2"
                style={{ width: 18, height: 18, fontSize: 10, borderColor: 'var(--guest-bg)' }}
              >
                {notifCount > 9 ? '9+' : notifCount}
              </span>
            )}
          </Link>
        </header>

        {/* Page content */}
        <main style={{ paddingBottom: 88 }}>{children}</main>

        {/* PWA install nudge — mobile only */}
        <AddToHomeScreen />

        {/* Bottom tab bar */}
        <nav
          className="glass-bar fixed bottom-0 z-[100] flex items-start justify-around border-t"
          style={{
            left: '50%', transform: 'translateX(-50%)',
            width: '100%', maxWidth: 480,
            height: 76, paddingTop: 10,
            paddingBottom: 'env(safe-area-inset-bottom)',
          }}
        >
          {TABS.map(({ href, label, icon }) => {
            const active = isActive(href)
            return (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center gap-1 flex-1"
                style={{ textDecoration: 'none' }}
              >
                {/* Icon pill */}
                <div
                  className="flex items-center justify-center rounded-xl transition-all duration-200"
                  style={{
                    width: 44, height: 32,
                    background:  active ? 'rgba(30,94,255,0.18)' : 'transparent',
                    boxShadow:   active ? '0 0 12px rgba(30,94,255,0.2)' : 'none',
                  }}
                >
                  <NavIcon type={icon} active={active} />
                </div>

                {/* Label */}
                <span
                  style={{
                    fontSize: 10, fontWeight: active ? 700 : 500,
                    color: active ? '#1E5EFF' : '#4B5563',
                    letterSpacing: '0.2px', fontFamily: 'var(--font-body)',
                    transition: 'color 0.2s',
                  }}
                >
                  {label}
                </span>

                {/* Active dot */}
                {active && (
                  <span
                    className="rounded-full"
                    style={{
                      width: 4, height: 4,
                      background: '#1E5EFF', marginTop: -2,
                      boxShadow: '0 0 6px rgba(30,94,255,0.7)',
                    }}
                  />
                )}
              </Link>
            )
          })}
        </nav>
      </div>
    </>
  )
}
