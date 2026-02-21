'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  ScanLine,
  Building2,
  BarChart3,
  Settings,
  LogOut,
  Ticket,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Database } from '@/lib/supabase/database.types'
import clsx from 'clsx'

type Profile = Database['public']['Tables']['profiles']['Row']

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/events', label: 'Events', icon: CalendarDays },
  { href: '/dashboard/guests', label: 'Guests', icon: Users },
  { href: '/dashboard/scan', label: 'Scanner', icon: ScanLine },
  { href: '/dashboard/vendors', label: 'Vendors', icon: Building2 },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
]

export default function Sidebar({ profile }: { profile: Profile | null }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <aside className="w-60 bg-brand-charcoal border-r border-white/5 flex flex-col shrink-0">
      {/* Logo */}
      <div className="h-16 flex items-center gap-2.5 px-5 border-b border-white/5">
        <div className="w-7 h-7 bg-brand-blue rounded-md flex items-center justify-center shrink-0">
          <Ticket className="w-4 h-4 text-white" />
        </div>
        <span
          className="text-lg font-bold text-white tracking-tight"
          style={{ fontFamily: 'Poppins, sans-serif' }}
        >
          Tikkit
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest px-3 pb-2">
          Main Menu
        </p>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              isActive(item.href, item.exact)
                ? 'sidebar-link-active'
                : 'sidebar-link'
            )}
          >
            <item.icon className="w-4 h-4 shrink-0" />
            {item.label}
          </Link>
        ))}

        <div className="divider" />
        <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest px-3 pb-2">
          Account
        </p>

        <Link
          href="/dashboard/settings"
          className={clsx(
            isActive('/dashboard/settings') ? 'sidebar-link-active' : 'sidebar-link'
          )}
        >
          <Settings className="w-4 h-4 shrink-0" />
          Settings
        </Link>
      </nav>

      {/* User */}
      <div className="p-3 border-t border-white/5">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-brand-blue/20 border border-brand-blue/30 flex items-center justify-center shrink-0">
            <span className="text-xs font-semibold text-brand-blue">
              {profile?.full_name?.charAt(0)?.toUpperCase() ?? 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{profile?.full_name ?? 'Organizer'}</p>
            <p className="text-xs text-gray-500 capitalize">{profile?.role}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="text-gray-500 hover:text-red-400 transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
