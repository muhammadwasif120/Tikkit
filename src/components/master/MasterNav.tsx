'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/cn'

const items = [['/master', 'Overview'], ['/master/payments', 'Subscription payments'], ['/master/verification', 'ID reviews'], ['/master/organizers', 'Organizers'], ['/master/events', 'Events'], ['/master/audit', 'Audit log']] as const

export default function MasterNav() {
  const path = usePathname()
  return (
    <nav aria-label="Admin" className="flex gap-1 overflow-x-auto lg:flex-col">
      {items.map(([href, label]) => {
        const on = href === '/master' ? path === href : path.startsWith(href)
        return <Link key={href} href={href} aria-current={on ? 'page' : undefined} className={cn('whitespace-nowrap rounded-[10px] px-3 py-2 text-sm font-medium transition-colors', on ? 'bg-accent/10 text-fg' : 'text-muted hover:bg-raised hover:text-fg')}>{label}</Link>
      })}
    </nav>
  )
}
