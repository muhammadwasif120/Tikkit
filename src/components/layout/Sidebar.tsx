'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, CalendarDays, Users, ScanLine,
  Building2, BarChart3, Settings, LogOut, Ticket, ClipboardCheck, X, UserCircle,
} from 'lucide-react'
import { TikkitXLogo } from '@/components/ui/TikkitXLogo'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Database } from '@/lib/supabase/database.types'
import clsx from 'clsx'

type Profile = Database['public']['Tables']['profiles']['Row']

const navItems = [
  { href: '/dashboard',           label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/events',    label: 'Events',    icon: CalendarDays },
  { href: '/dashboard/guests',    label: 'Guests',    icon: Users },
  { href: '/dashboard/approvals', label: 'Approvals', icon: ClipboardCheck },
  { href: '/dashboard/scan',      label: 'Scanner',   icon: ScanLine },
  { href: '/dashboard/vendors',   label: 'Vendors',   icon: Building2 },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
]

type Props = {
  profile: Profile | null
  open: boolean
  onClose: () => void
}

export default function Sidebar({ profile, open, onClose }: Props) {
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

  const handleNavClick = () => {
    // Close drawer on mobile after navigation
    onClose()
  }

  const sidebarContent = (
    <aside className="w-60 bg-brand-charcoal flex flex-col h-full border-r border-white/[0.04]">
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-white/[0.04] shrink-0">
        <div className="flex items-center gap-2.5">
          <TikkitXLogo size="md" />
        </div>
        {/* Close button — mobile only */}
        <button
          onClick={onClose}
          className="lg:hidden text-gray-500 hover:text-white transition-colors p-1"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest px-3 pb-2">Main Menu</p>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={handleNavClick}
            className={clsx(isActive(item.href, item.exact) ? 'sidebar-link-active' : 'sidebar-link')}
          >
            <item.icon className="w-4 h-4 shrink-0" />
            {item.label}
          </Link>
        ))}

        <div className="divider" />
        <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest px-3 pb-2">Account</p>
        <Link
          href="/dashboard/profile"
          onClick={handleNavClick}
          className={clsx(isActive('/dashboard/profile') ? 'sidebar-link-active' : 'sidebar-link')}
        >
          <UserCircle className="w-4 h-4 shrink-0" />
          Profile
        </Link>
        <Link
          href="/dashboard/settings"
          onClick={handleNavClick}
          className={clsx(isActive('/dashboard/settings') ? 'sidebar-link-active' : 'sidebar-link')}
        >
          <Settings className="w-4 h-4 shrink-0" />
          Settings
        </Link>
      </nav>

      {/* Profile footer */}
      <div className="p-3 border-t border-white/[0.04] shrink-0">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
          <Link href="/dashboard/profile" onClick={handleNavClick} style={{ textDecoration: 'none', flexShrink: 0 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(30,94,255,0.25), rgba(30,94,255,0.1))',
              border: '1px solid rgba(30,94,255,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#1E5EFF', fontFamily: 'var(--font-display)' }}>
                {(profile?.company_name ?? profile?.full_name)?.charAt(0)?.toUpperCase() ?? 'U'}
              </span>
            </div>
          </Link>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate" style={{ fontFamily: 'var(--font-display)' }}>
              {profile?.company_name ?? profile?.full_name ?? 'Organizer'}
            </p>
            <p className="text-xs text-gray-500 capitalize">{profile?.role}</p>
          </div>
          <button onClick={handleSignOut} className="text-gray-500 hover:text-red-400 transition-colors p-1 rounded-lg hover:bg-red-500/5" title="Sign out">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )

  return (
    <>
      {/* Desktop — always visible */}
      <div className="hidden lg:flex shrink-0 border-r border-white/5">
        {sidebarContent}
      </div>

      {/* Mobile — slide-in drawer */}
      {/* Backdrop */}
      <div
        className={clsx(
          'fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity lg:hidden',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={clsx(
          'fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out lg:hidden',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {sidebarContent}
      </div>
    </>
  )
}