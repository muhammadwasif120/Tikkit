'use client'

import { usePathname } from 'next/navigation'
import { Bell } from 'lucide-react'
import type { Database } from '@/lib/supabase/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/events': 'Events',
  '/dashboard/guests': 'Guests',
  '/dashboard/scan': 'Scanner',
  '/dashboard/vendors': 'Vendors',
  '/dashboard/analytics': 'Analytics',
  '/dashboard/settings': 'Settings',
}

export default function TopBar({ profile }: { profile: Profile | null }) {
  const pathname = usePathname()

  const getTitle = () => {
    for (const [key, value] of Object.entries(pageTitles)) {
      if (pathname === key) return value
      if (pathname.startsWith(key + '/') && key !== '/dashboard') return value
    }
    return 'Tikkit'
  }

  return (
    <header className="h-16 bg-brand-charcoal border-b border-white/5 flex items-center justify-between px-6 shrink-0">
      <h1
        className="text-base font-semibold text-white"
        style={{ fontFamily: 'Poppins, sans-serif' }}
      >
        {getTitle()}
      </h1>

      <div className="flex items-center gap-3">
        <button className="relative p-2 text-gray-400 hover:text-white transition-colors">
          <Bell className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-white/10" />

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-brand-blue/20 border border-brand-blue/30 flex items-center justify-center">
            <span className="text-xs font-semibold text-brand-blue">
              {profile?.full_name?.charAt(0)?.toUpperCase() ?? 'U'}
            </span>
          </div>
          <span className="text-sm text-gray-300 hidden md:block">{profile?.full_name}</span>
        </div>
      </div>
    </header>
  )
}
