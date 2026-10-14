'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/cn'

const items = [
  ['profile', 'Profile and public page'], ['payments', 'Payment accounts'], ['team', 'Team access'],
  ['verification', 'Verification'], ['billing', 'Plan and billing'], ['appearance', 'Appearance'],
] as const

export default function SettingsNav() {
  const path = usePathname()
  return (
    <nav aria-label="Settings" className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
      {items.map(([id, label]) => {
        const active = path.startsWith(`/dashboard/settings/${id}`)
        return (
          <Link key={id} href={`/dashboard/settings/${id}`} aria-current={active ? 'page' : undefined}
            className={cn('whitespace-nowrap rounded-[10px] px-3 py-2 text-sm font-medium transition-colors', active ? 'bg-accent/10 text-fg' : 'text-muted hover:bg-raised hover:text-fg')}>
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
