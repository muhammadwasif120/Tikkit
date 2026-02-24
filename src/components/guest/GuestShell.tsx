'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Compass, Ticket, Zap, User } from 'lucide-react'

const tabs = [
  { href: '/explore',        label: 'Explore', icon: Compass },
  { href: '/guest/passes',   label: 'Passes',  icon: Ticket  },
  { href: '/guest/credits',  label: 'Credits', icon: Zap     },
  { href: '/guest/profile',  label: 'Profile', icon: User    },
]

export default function GuestShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div style={{ minHeight: '100svh', background: '#0A0C12', fontFamily: "'Inter', sans-serif" }}>
      <main style={{ paddingBottom: 80 }}>{children}</main>

      {/* Bottom nav */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
        height: 68,
        background: 'rgba(10,12,18,0.92)',
        backdropFilter: 'blur(24px)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-around',
        padding: '0 8px',
      }}>
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link key={href} href={href} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              padding: '8px 20px', borderRadius: 14, textDecoration: 'none',
              background: active ? 'rgba(30,94,255,0.12)' : 'transparent',
              transition: 'all 0.18s',
            }}>
              <Icon size={21} color={active ? '#4F8AFF' : '#3D4148'} strokeWidth={active ? 2.5 : 2} />
              <span style={{
                fontSize: 10, fontWeight: active ? 700 : 500, letterSpacing: '0.03em',
                color: active ? '#4F8AFF' : '#3D4148',
              }}>{label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}