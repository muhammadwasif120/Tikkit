'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, CalendarDays, Users, ScanLine,
  Building2, BarChart3, Settings, LogOut, ClipboardCheck, X, UserCircle,
  Radio, MessageSquare, Plus,
} from 'lucide-react'
import { TikkitXLogo } from '@/components/ui/TikkitXLogo'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Database } from '@/lib/supabase/database.types'
import clsx from 'clsx'

type Profile = Database['public']['Tables']['profiles']['Row']

const navItems = [
  { href: '/dashboard',           label: 'Dashboard', icon: LayoutDashboard, exact: true, tour: 'nav-dashboard' },
  { href: '/dashboard/events',    label: 'Events',    icon: CalendarDays,                 tour: 'nav-events' },
  { href: '/dashboard/guests',    label: 'Guests',    icon: Users,                        tour: 'nav-guests' },
  { href: '/dashboard/approvals', label: 'Approvals', icon: ClipboardCheck,               tour: 'nav-approvals' },
  { href: '/dashboard/command',   label: 'Command',   icon: Radio,                        tour: 'nav-command' },
  { href: '/dashboard/scan',      label: 'Scanner',   icon: ScanLine,                     tour: 'nav-scan' },
  { href: '/dashboard/vendors',   label: 'Vendors',   icon: Building2,                    tour: 'nav-vendors' },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3,                    tour: 'nav-analytics' },
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
    <aside
      className="w-64 flex flex-col h-full"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        background: 'var(--chrome-fill)',
        backdropFilter: 'blur(40px)',
        WebkitBackdropFilter: 'blur(40px)',
        borderRight: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-[var(--border-faint)] shrink-0">
        <div className="flex items-center gap-2.5">
          <TikkitXLogo size="md" />
        </div>
        {/* Close button — mobile only */}
        <button
          onClick={onClose}
          className="lg:hidden transition-colors p-1"
          style={{ color: 'var(--mist-500)' }}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Primary CTA */}
      <div className="px-3 pt-4">
        <Link
          href="/dashboard/events/new"
          onClick={handleNavClick}
          className="btn-primary w-full"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span style={{ flex: 1, textAlign: 'left' }}>New event</span>
          <span style={{ fontSize: 11, fontWeight: 700, opacity: 0.55 }}>N</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-xs font-medium px-3 pb-2" style={{ color: 'var(--mist-500)' }}>Main menu</p>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={handleNavClick}
            data-tour={item.tour}
            className={clsx(isActive(item.href, item.exact) ? 'sidebar-link-active' : 'sidebar-link')}
            style={{ display: 'flex', alignItems: 'center' }}
          >
            <item.icon className="w-[18px] h-[18px] shrink-0" />
            <span style={{ flex: 1 }}>{item.label}</span>
          </Link>
        ))}

        <div className="divider" />
        <p className="text-xs font-medium px-3 pb-2" style={{ color: 'var(--mist-500)' }}>Account</p>
        <Link
          href="/dashboard/profile"
          onClick={handleNavClick}
          className={clsx(isActive('/dashboard/profile') ? 'sidebar-link-active' : 'sidebar-link')}
        >
          <UserCircle className="w-[18px] h-[18px] shrink-0" />
          Profile
        </Link>
        <Link
          href="/dashboard/settings"
          onClick={handleNavClick}
          className={clsx(isActive('/dashboard/settings') ? 'sidebar-link-active' : 'sidebar-link')}
        >
          <Settings className="w-[18px] h-[18px] shrink-0" />
          Settings
        </Link>
      </nav>

      {/* Profile footer */}
      <div className="p-3 border-t border-[var(--border-faint)] shrink-0">
        <div data-tour="profile-footer" className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[var(--overlay-1)] border border-[var(--border-faint)]">
          <Link href="/dashboard/profile" onClick={handleNavClick} style={{ textDecoration: 'none', flexShrink: 0 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(var(--brand-blue-rgb),0.25), rgba(var(--brand-blue-rgb),0.1))',
              border: '1px solid rgba(var(--brand-blue-rgb),0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand-blue)', fontFamily: 'var(--font-display)' }}>
                {(profile?.company_name ?? profile?.full_name)?.charAt(0)?.toUpperCase() ?? 'U'}
              </span>
            </div>
          </Link>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
              {profile?.company_name ?? profile?.full_name ?? 'Organizer'}
            </p>
            <span className="badge-gray" style={{ marginTop: 2, textTransform: 'capitalize' }}>{profile?.role}</span>
          </div>
          <button onClick={handleSignOut} className="transition-colors p-1 rounded-lg hover:bg-red-500/5" style={{ color: 'var(--mist-500)' }} title="Sign out" aria-label="Sign out">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )

  return (
    <>
      {/* Desktop — always visible */}
      <div className="hidden lg:flex shrink-0 border-r border-[var(--border-faint)]">
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