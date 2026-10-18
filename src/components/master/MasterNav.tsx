'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/cn'
import { SignOutButton } from '@/components/auth/SignOutButton'

const items = [
  ['/master', 'Overview'], ['/master/reports', 'Reports'], ['/master/organizers', 'Organizers'], ['/master/attendees', 'Attendees'], ['/master/events', 'Events'],
  ['/master/verification', 'ID reviews'], ['/master/payments', 'Plan payments'], ['/master/audit', 'Audit log'],
] as const

export default function MasterNav({ reports = 0 }: { reports?: number }) {
  const path = usePathname()
  return (
    <nav aria-label="Admin" className="flex gap-1 overflow-x-auto lg:h-[calc(100vh-7rem)] lg:flex-col">
      {items.map(([href, label]) => {
        const on = href === '/master' ? path === href : path.startsWith(href) || (href === '/master/organizers' && path.startsWith('/master/users'))
        return (
          <Link key={href} href={href} aria-current={on ? 'page' : undefined} className={cn('flex items-center justify-between gap-3 whitespace-nowrap rounded-[10px] px-3 py-2 text-sm font-medium transition-colors', on ? 'bg-accent/10 text-fg' : 'text-muted hover:bg-raised hover:text-fg')}>
            {label}{href === '/master/reports' && reports > 0 && <span className="rounded-full bg-warning/20 px-1.5 text-[11px] font-semibold text-warning">{reports}</span>}
          </Link>
        )
      })}
      <span className="hidden flex-1 lg:block" />
      <SignOutButton to="/master/login" className="lg:mt-4" />
    </nav>
  )
}
