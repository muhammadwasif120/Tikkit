'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Compass, Ticket, User, Bell } from 'lucide-react'
import { TikkitXLogo } from '@/components/ui/TikkitXLogo'

const tabs = [
  { href: '/guest/explore', label: 'Explore',   icon: Compass },
  { href: '/guest/tikkit',  label: 'My Tikkit', icon: Ticket  },
  { href: '/guest/profile', label: 'Profile',   icon: User    },
]

export default function GuestShell({
  children,
  notifCount = 0,
}: {
  children: React.ReactNode
  notifCount?: number
}) {
  const pathname = usePathname()

  return (
    <div
      className="relative mx-auto"
      style={{
        minHeight: '100svh',
        background: 'var(--guest-bg)',
        fontFamily: 'var(--font-body)',
        maxWidth: 480,
      }}
    >
      {/* ── Top bar ── */}
      <header
        className="glass-bar sticky top-0 z-50 flex items-center justify-between border-b"
        style={{ padding: '14px 20px 12px' }}
      >
        {/* Wordmark */}
        <TikkitXLogo size="md" variant="text-only" />

        {/* Notification bell */}
        <Link
          href="/guest/notifications"
          className="relative flex items-center justify-center rounded-xl border transition-all duration-200 cursor-pointer"
          style={{
            width: 38,
            height: 38,
            background: 'rgba(255,255,255,0.05)',
            borderColor: 'rgba(255,255,255,0.08)',
          }}
          aria-label="Notifications"
        >
          <Bell size={17} className="text-gray-400" />
          {notifCount > 0 && (
            <span
              className="absolute -top-1 -right-1 flex items-center justify-center rounded-full bg-red-500 text-white font-bold border-2"
              style={{
                width: 18,
                height: 18,
                fontSize: 10,
                borderColor: 'var(--guest-bg)',
              }}
            >
              {notifCount > 9 ? '9+' : notifCount}
            </span>
          )}
        </Link>
      </header>

      {/* ── Page content ── */}
      <main style={{ paddingBottom: 88 }}>{children}</main>

      {/* ── Bottom tab bar ── */}
      <nav
        className="glass-bar fixed bottom-0 z-[100] flex items-start justify-around border-t"
        style={{
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: 480,
          height: 76,
          paddingTop: 10,
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-1 flex-1 transition-opacity duration-150 cursor-pointer"
              style={{ textDecoration: 'none' }}
            >
              {/* Icon pill */}
              <div
                className="flex items-center justify-center rounded-xl transition-all duration-200"
                style={{
                  width: 44,
                  height: 32,
                  background: active ? 'rgba(30,94,255,0.18)' : 'transparent',
                  boxShadow: active ? '0 0 12px rgba(30,94,255,0.2)' : 'none',
                }}
              >
                <Icon
                  size={20}
                  color={active ? '#1E5EFF' : '#4B5563'}
                  strokeWidth={active ? 2.2 : 1.8}
                />
              </div>

              {/* Label */}
              <span
                className="transition-colors duration-200"
                style={{
                  fontSize: 10,
                  fontWeight: active ? 700 : 500,
                  color: active ? '#1E5EFF' : '#4B5563',
                  letterSpacing: '0.2px',
                  fontFamily: 'var(--font-body)',
                }}
              >
                {label}
              </span>

              {/* Active dot */}
              {active && (
                <span
                  className="rounded-full"
                  style={{
                    width: 4,
                    height: 4,
                    background: '#1E5EFF',
                    marginTop: -2,
                    boxShadow: '0 0 6px rgba(30,94,255,0.7)',
                  }}
                />
              )}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
