'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Compass, Ticket, User, Bell } from 'lucide-react'

const tabs = [
  { href: '/guest/explore',  label: 'Explore',    icon: Compass },
  { href: '/guest/tikkit',   label: 'My Tikkit',  icon: Ticket  },
  { href: '/guest/profile',  label: 'Profile',    icon: User    },
]

export default function GuestShell({ children, notifCount = 0 }: { children: React.ReactNode; notifCount?: number }) {
  const pathname = usePathname()

  return (
    <div style={{ minHeight: '100svh', background: '#080A10', fontFamily: "'DM Sans', 'Inter', sans-serif", maxWidth: 480, margin: '0 auto', position: 'relative' }}>
      {/* Top bar */}
      <div style={{ position: 'sticky', top: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px 12px', background: 'rgba(8,10,16,0.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <span style={{ fontSize: 20, fontWeight: 800, fontFamily: "'Clash Display', sans-serif", background: 'linear-gradient(135deg,#fff 0%,#1E5EFF 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.5px' }}>
          tikkit
        </span>
        <Link href="/guest/notifications" style={{ position: 'relative', width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)', textDecoration: 'none' }}>
          <Bell size={17} color="#9CA3AF" />
          {notifCount > 0 && (
            <span style={{ position: 'absolute', top: -4, right: -4, width: 18, height: 18, borderRadius: '50%', background: '#EF4444', border: '2px solid #080A10', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'white' }}>
              {notifCount > 9 ? '9+' : notifCount}
            </span>
          )}
        </Link>
      </div>

      {/* Content */}
      <main style={{ paddingBottom: 88 }}>{children}</main>

      {/* Bottom tab bar */}
      <nav style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 480, zIndex: 100, height: 76, background: 'rgba(8,10,16,0.96)', backdropFilter: 'blur(28px)', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-around', paddingTop: 10, paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href)
          return (
            <Link key={href} href={href} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, textDecoration: 'none', flex: 1, transition: 'opacity 0.15s' }}>
              <div style={{ width: 44, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 12, background: active ? 'rgba(30,94,255,0.15)' : 'transparent', transition: 'background 0.2s' }}>
                <Icon size={21} color={active ? '#1E5EFF' : '#4B5563'} strokeWidth={active ? 2.2 : 1.8} />
              </div>
              <span style={{ fontSize: 10, fontWeight: active ? 700 : 500, color: active ? '#1E5EFF' : '#4B5563', letterSpacing: '0.2px' }}>
                {label}
              </span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
