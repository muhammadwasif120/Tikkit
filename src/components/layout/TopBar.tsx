'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'
import NotificationBell from '@/components/NotificationBell'
import type { Database } from '@/lib/supabase/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']

const pageTitles: Record<string, string> = {
  '/dashboard':            'Dashboard',
  '/dashboard/events':     'Events',
  '/dashboard/guests':     'Guests',
  '/dashboard/approvals':  'Approvals',
  '/dashboard/scan':       'Scanner',
  '/dashboard/vendors':    'Vendors',
  '/dashboard/analytics':  'Analytics',
  '/dashboard/profile':    'Profile',
  '/dashboard/settings':   'Settings',
}

type Props = {
  profile: Profile | null
  onMenuClick: () => void
}

export default function TopBar({ profile, onMenuClick }: Props) {
  const pathname = usePathname()

  const getTitle = () => {
    for (const [key, value] of Object.entries(pageTitles)) {
      if (pathname === key) return value
      if (pathname.startsWith(key + '/') && key !== '/dashboard') return value
    }
    return 'Tikkit'
  }

  return (
    <header
      className="relative h-[calc(4rem+env(safe-area-inset-top))] pt-[env(safe-area-inset-top)] flex items-center justify-between px-4 md:px-6 shrink-0"
      style={{
        background: 'var(--chrome-fill-strong)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="flex items-center gap-3">
        {/* Hamburger — mobile only */}
        <button
          onClick={onMenuClick}
          className="lg:hidden transition-colors p-1 -ml-1"
          style={{ color: 'var(--mist-400)' }}
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1
          className="text-lg font-semibold"
          style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.3px', color: 'var(--text-primary)' }}
        >
          {getTitle()}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <NotificationBell />
        <div className="h-4 w-px" style={{ background: 'var(--guest-border)' }} />
        <Link href="/dashboard/profile" className="flex items-center gap-2" style={{ textDecoration: 'none' }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(var(--brand-blue-rgb),0.25), rgba(var(--brand-blue-rgb),0.1))',
            border: '1px solid rgba(var(--brand-blue-rgb),0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--brand-blue)', fontFamily: 'var(--font-display)' }}>
              {(profile?.company_name ?? profile?.full_name)?.charAt(0)?.toUpperCase() ?? 'U'}
            </span>
          </div>
          <span className="text-sm hidden md:block" style={{ fontFamily: 'var(--font-body)', color: 'var(--mist-300)' }}>
            {profile?.company_name ?? profile?.full_name}
          </span>
        </Link>
      </div>
    </header>
  )
}