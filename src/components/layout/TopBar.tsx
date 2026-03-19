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
    <header className="relative h-[calc(4rem+env(safe-area-inset-top))] pt-[env(safe-area-inset-top)] bg-brand-charcoal border-b border-white/[0.04] flex items-center justify-between px-4 md:px-6 shrink-0">
      <div className="flex items-center gap-3">
        {/* Hamburger — mobile only */}
        <button
          onClick={onMenuClick}
          className="lg:hidden text-gray-400 hover:text-white transition-colors p-1 -ml-1"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1
          className="text-lg font-bold text-white"
          style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.3px' }}
        >
          {getTitle()}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <NotificationBell />
        <div className="h-4 w-px bg-white/10" />
        <Link href="/dashboard/profile" className="flex items-center gap-2" style={{ textDecoration: 'none' }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(30,94,255,0.25), rgba(30,94,255,0.1))',
            border: '1px solid rgba(30,94,255,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#1E5EFF', fontFamily: 'var(--font-display)' }}>
              {(profile?.company_name ?? profile?.full_name)?.charAt(0)?.toUpperCase() ?? 'U'}
            </span>
          </div>
          <span className="text-sm text-gray-300 hidden md:block" style={{ fontFamily: 'var(--font-body)' }}>
            {profile?.company_name ?? profile?.full_name}
          </span>
        </Link>
      </div>
    </header>
  )
}