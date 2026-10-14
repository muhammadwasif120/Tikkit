'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, type ReactNode } from 'react'
import {
  BarChart3, Bell, CalendarDays, ChevronRight, CircleHelp, LayoutDashboard, Menu, Plus, QrCode,
  Receipt, Search, Settings, Share2, Users, X, Sparkles, Building2,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { Avatar, Badge, Kbd, Logo, ThemeToggle } from '@/components/kit'
import { Button } from '@/components/kit'

export type ShellNavItem = { href: string; label: string; icon: ReactNode; soon?: boolean; badge?: string }

export type OrganizerShellProps = {
  /** Base path of the app, e.g. "/dashboard" or "/design/org". */
  base: string
  children: ReactNode
  user: { name: string; company?: string; avatarUrl?: string | null }
  plan: { label: string; note: string; tone?: 'accent' | 'warning' | 'danger' }
  pendingCount?: number
}

export function OrganizerShell({ base, children, user, plan, pendingCount = 0 }: OrganizerShellProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const groups: { title?: string; items: ShellNavItem[] }[] = [
    {
      items: [
        { href: `${base}/dashboard`, label: 'Overview', icon: <LayoutDashboard className="h-[18px] w-[18px]" /> },
        { href: `${base}/events`, label: 'Events', icon: <CalendarDays className="h-[18px] w-[18px]" /> },
        { href: `${base}/guests`, label: 'Guests', icon: <Users className="h-[18px] w-[18px]" />, badge: pendingCount ? String(pendingCount) : undefined },
        { href: `${base}/event-day`, label: 'Event Day', icon: <QrCode className="h-[18px] w-[18px]" /> },
      ],
    },
    {
      title: 'Grow',
      items: [
        { href: `${base}/referrals`, label: 'Referrals', icon: <Share2 className="h-[18px] w-[18px]" /> },
        { href: `${base}/analytics`, label: 'Analytics', icon: <BarChart3 className="h-[18px] w-[18px]" /> },
      ],
    },
    {
      title: 'Business',
      items: [
        { href: `${base}/vendors`, label: 'Vendors & invoices', icon: <Receipt className="h-[18px] w-[18px]" /> },
        { href: `${base}/classes`, label: 'Classes', icon: <Sparkles className="h-[18px] w-[18px]" />, soon: true },
        { href: `${base}/spaces`, label: 'Spaces', icon: <Building2 className="h-[18px] w-[18px]" />, soon: true },
      ],
    },
  ]

  const active = (href: string) => pathname === href || pathname.startsWith(href + '/')

  const nav = (
    <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-4" aria-label="Main">
      {groups.map((g, i) => (
        <div key={i}>
          {g.title && <p className="mb-1.5 px-3 text-[11px] font-medium uppercase tracking-wider text-subtle">{g.title}</p>}
          <ul className="space-y-0.5">
            {g.items.map(it => (
              <li key={it.href}>
                <Link
                  href={it.soon ? '#' : it.href}
                  aria-disabled={it.soon}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'group relative flex h-10 items-center gap-3 rounded-[10px] px-3 text-sm font-medium transition-colors',
                    it.soon ? 'cursor-default text-subtle' : active(it.href) ? 'bg-accent/10 text-fg' : 'text-muted hover:bg-raised hover:text-fg',
                  )}
                >
                  {active(it.href) && !it.soon && <span className="absolute left-0 top-2 h-6 w-0.5 rounded-full bg-accent" aria-hidden />}
                  <span className={cn(active(it.href) && !it.soon ? 'text-accent' : '')}>{it.icon}</span>
                  <span className="flex-1 truncate">{it.label}</span>
                  {it.soon && <span className="rounded-md bg-overlay px-1.5 py-0.5 text-[10px] font-medium text-subtle">Soon</span>}
                  {it.badge && <span className="tnum rounded-full bg-accent px-1.5 text-[11px] font-semibold text-accent-fg">{it.badge}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  )

  const footer = (
    <div className="space-y-2 border-t border-line p-3">
      <Link href={`${base}/settings`} className="flex h-10 items-center gap-3 rounded-[10px] px-3 text-sm font-medium text-muted transition-colors hover:bg-raised hover:text-fg">
        <Settings className="h-[18px] w-[18px]" aria-hidden /> Settings
      </Link>
      <a href="https://wa.me/13074434195" target="_blank" rel="noopener noreferrer" className="flex h-10 items-center gap-3 rounded-[10px] px-3 text-sm font-medium text-muted transition-colors hover:bg-raised hover:text-fg">
        <CircleHelp className="h-[18px] w-[18px]" aria-hidden /> Help on WhatsApp
      </a>
      <div className="rounded-xl bg-raised p-3 shadow-[inset_0_0_0_1px_rgb(var(--k-line))]">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-semibold text-fg">{plan.label}</span>
          <Badge tone={plan.tone ?? 'accent'} dot>{plan.note}</Badge>
        </div>
        <Link href={`${base}/settings/billing`} className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline">
          Manage plan <ChevronRight className="h-3 w-3" aria-hidden />
        </Link>
      </div>
    </div>
  )

  return (
    <div className="kit flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-[248px] shrink-0 flex-col border-r border-line bg-surface/60 backdrop-blur lg:flex">
        <div className="flex h-16 items-center px-5"><Logo /></div>
        <div className="px-3">
          <Link href={`${base}/event-new`}>
            <span className="flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-[10px] bg-accent text-sm font-semibold text-accent-fg shadow-[0_0_0_1px_rgb(var(--k-accent)/0.5),0_8px_24px_-10px_rgb(var(--k-accent)/0.55)] transition-colors hover:bg-accent/90">
              <Plus className="h-4 w-4" aria-hidden /> New event
            </span>
          </Link>
        </div>
        {nav}
        {footer}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <button className="absolute inset-0 cursor-pointer bg-black/60" onClick={() => setOpen(false)} aria-label="Close menu" />
          <div className="k-pop absolute inset-y-0 left-0 flex w-[280px] flex-col border-r border-line bg-surface">
            <div className="flex h-16 items-center justify-between px-5">
              <Logo />
              <Button variant="ghost" size="icon-sm" aria-label="Close menu" onClick={() => setOpen(false)}><X className="h-4 w-4" /></Button>
            </div>
            {nav}
            {footer}
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-canvas/80 px-4 backdrop-blur-xl sm:px-6">
          <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu" onClick={() => setOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="lg:hidden"><Logo compact /></div>
          <button
            type="button"
            className="hidden h-10 w-full max-w-md cursor-pointer items-center gap-3 rounded-[10px] border border-line-strong bg-raised px-3.5 text-sm text-subtle transition-colors hover:border-subtle sm:flex"
            aria-label="Search (press slash)"
          >
            <Search className="h-4 w-4" aria-hidden />
            <span className="flex-1 text-left">Search guests, events, vendors</span>
            <Kbd>/</Kbd>
          </button>
          <div className="ml-auto flex items-center gap-1">
            <Button variant="ghost" size="icon" className="sm:hidden" aria-label="Search"><Search className="h-[18px] w-[18px]" /></Button>
            <ThemeToggle />
            <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
              <Bell className="h-[18px] w-[18px]" />
              <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-accent ring-2 ring-canvas" aria-hidden />
            </Button>
            <div className="ml-2 hidden items-center gap-2.5 sm:flex">
              <Avatar name={user.name} src={user.avatarUrl} size={34} />
              <div className="leading-tight">
                <p className="text-[13px] font-medium text-fg">{user.name}</p>
                {user.company && <p className="text-xs text-subtle">{user.company}</p>}
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 pb-28 pt-6 sm:px-6 lg:pb-10 lg:pt-8">{children}</main>

        {/* Mobile bottom navigation */}
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden" aria-label="Quick navigation">
          <ul className="mx-auto grid max-w-md grid-cols-5">
            {[
              { href: `${base}/dashboard`, label: 'Home', icon: LayoutDashboard },
              { href: `${base}/events`, label: 'Events', icon: CalendarDays },
              { href: `${base}/event-day`, label: 'Door', icon: QrCode },
              { href: `${base}/guests`, label: 'Guests', icon: Users },
              { href: `${base}/referrals`, label: 'Referrals', icon: Share2 },
            ].map(t => (
              <li key={t.href}>
                <Link
                  href={t.href}
                  className={cn('flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors', active(t.href) ? 'text-accent' : 'text-subtle')}
                >
                  <t.icon className="h-5 w-5" aria-hidden />
                  {t.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  )
}
