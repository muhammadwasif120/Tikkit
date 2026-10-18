'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bell, Compass, Heart, Sun, Ticket, User } from 'lucide-react'
import { Avatar, Logo, ThemeToggle } from '@/components/kit'
import { cn } from '@/lib/cn'

const tabs = [
  { href: '/guest', label: 'Today', icon: Sun },
  { href: '/guest/explore', label: 'For you', icon: Compass },
  { href: '/guest/tickets', label: 'Tickets', icon: Ticket },
  { href: '/guest/saved', label: 'Saved', icon: Heart },
  { href: '/guest/profile', label: 'Profile', icon: User },
] as const

export default function AttendeeShell({ children, name, avatarUrl, unread, isManager = false }: { children: React.ReactNode; name: string; avatarUrl: string | null; unread: number; isManager?: boolean }) {
  const path = usePathname()
  const active = (h: string) => (h === '/guest' ? path === '/guest' : path === h || path.startsWith(h + '/'))
  return (
    <div className="kit min-h-screen bg-canvas text-fg">
      <header className="sticky top-0 z-30 border-b border-line bg-canvas/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-4xl items-center gap-6 px-4 sm:px-6">
          <Link href="/guest" aria-label="TIKKIT X"><Logo /></Link>
          <nav aria-label="Main" className="ml-4 hidden items-center gap-1 sm:flex">
            {tabs.map(t => (
              <Link key={t.href} href={t.href} aria-current={active(t.href) ? 'page' : undefined}
                className={cn('relative rounded-lg px-3 py-2 text-sm font-medium transition-colors', active(t.href) ? 'text-fg' : 'text-muted hover:text-fg')}>
                {t.label}
                {active(t.href) && <span className="absolute inset-x-3 -bottom-[17px] h-0.5 rounded-full bg-accent" aria-hidden />}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">{isManager && <Link href="/dashboard" className="hidden rounded-lg bg-magenta/12 px-3 py-1.5 text-[13px] font-medium text-magenta hover:bg-magenta/20 sm:block">Team dashboard</Link>}<Link href="/guest/notifications" aria-label={unread ? `Alerts, ${unread} unread` : 'Alerts'} data-tour="alerts" className="relative grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-raised hover:text-fg"><Bell className="h-[18px] w-[18px]" aria-hidden />{unread > 0 && <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-semibold text-accent-fg">{unread}</span>}</Link><ThemeToggle /><Link href="/guest/profile" aria-label="Profile"><Avatar name={name} src={avatarUrl} size={34} /></Link></div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-4xl px-4 pb-28 pt-6 sm:px-6 sm:pb-10 sm:pt-8">{children}</main>
      <nav aria-label="Quick navigation" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl sm:hidden">
        <ul className="grid grid-cols-5">
          {tabs.map(t => (
            <li key={t.href}>
              <Link href={t.href} className={cn('relative flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium', active(t.href) ? 'text-accent' : 'text-subtle')}>
                <t.icon className="h-5 w-5" aria-hidden />{t.label}
                
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
