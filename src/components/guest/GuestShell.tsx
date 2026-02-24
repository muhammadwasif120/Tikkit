'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Compass, CalendarCheck, Ticket, Award, User, Bell } from 'lucide-react'

const tabs = [
  { href: '/explore',       label: 'Explore',   icon: Compass       },
  { href: '/guest/events',  label: 'My Events', icon: CalendarCheck },
  { href: '/guest/tickets', label: 'Tickets',   icon: Ticket        },
  { href: '/guest/passes',  label: 'Passes',    icon: Award         },
  { href: '/guest/profile', label: 'Profile',   icon: User          },
]

export default function GuestShell({ children, notifCount = 0 }: { children: React.ReactNode; notifCount?: number }) {
  const pathname = usePathname()

  return (
    <div style={{ minHeight: '100svh', background: '#080A0F', fontFamily: "'Inter', -apple-system, sans-serif", maxWidth: 480, margin: '0 auto', position: 'relative' }}>
      {/* Top bar */}
      <div style={{
        position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 480, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 18px',
        background: 'rgba(8,10,15,0.9)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        <Link href="/explore" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <div style={{ width: 28, height: 28, background: '#1E5EFF', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Ticket size={14} color="white" strokeWidth={2.5} />
          </div>
          <span style={{ color: 'white', fontSize: 17, fontWeight: 800, fontFamily: 'Poppins, sans-serif', letterSpacing: '-0.4px' }}>tikkit</span>
        </Link>
        <Link href="/guest/notifications" style={{ position: 'relative', textDecoration: 'none' }}>
          <div style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bell size={18} color={notifCount > 0 ? '#4F8AFF' : '#6B7280'} />
          </div>
          {notifCount > 0 && (
            <div style={{ position: 'absolute', top: -3, right: -3, width: 18, height: 18, borderRadius: '50%', background: '#EF4444', border: '2px solid #080A0F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'white', fontSize: 10, fontWeight: 800 }}>{notifCount > 9 ? '9+' : notifCount}</span>
            </div>
          )}
        </Link>
      </div>

      <main style={{ paddingTop: 62, paddingBottom: 76 }}>{children}</main>

      {/* Bottom nav */}
      <nav style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 480, zIndex: 100,
        height: 72, background: 'rgba(8,10,15,0.96)', backdropFilter: 'blur(24px)',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '0 4px 4px',
      }}>
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/explore' && pathname.startsWith(href))
          return (
            <Link key={href} href={href} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '6px 8px 2px', borderRadius: 14, textDecoration: 'none', flex: 1 }}>
              <div style={{ width: 32, height: 26, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: active ? 'rgba(30,94,255,0.15)' : 'transparent', transition: 'background 0.15s' }}>
                <Icon size={20} color={active ? '#4F8AFF' : '#374151'} strokeWidth={active ? 2.5 : 2} />
              </div>
              <span style={{ fontSize: 10, fontWeight: active ? 700 : 500, color: active ? '#4F8AFF' : '#374151' }}>{label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}