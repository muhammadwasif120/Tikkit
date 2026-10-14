'use client'

import { cn } from '@/lib/cn'

export type TabItem<T extends string> = { id: T; label: string; count?: number }

/** Segmented control: use for filters that change the list below. */
export function Segmented<T extends string>({
  items, value, onChange, className, label,
}: { items: TabItem<T>[]; value: T; onChange: (v: T) => void; className?: string; label: string }) {
  return (
    <div role="tablist" aria-label={label} className={cn('inline-flex max-w-full gap-1 overflow-x-auto rounded-xl bg-raised p-1 shadow-[inset_0_0_0_1px_rgb(var(--k-line))]', className)}>
      {items.map(it => {
        const active = it.id === value
        return (
          <button
            key={it.id} role="tab" aria-selected={active} type="button" onClick={() => onChange(it.id)}
            className={cn(
              'inline-flex h-8 cursor-pointer items-center gap-2 whitespace-nowrap rounded-lg px-3 text-[13px] font-medium transition-colors',
              active ? 'bg-surface text-fg shadow-card' : 'text-muted hover:text-fg',
            )}
          >
            {it.label}
            {it.count !== undefined && (
              <span className={cn('tnum rounded-full px-1.5 text-[11px]', active ? 'bg-accent/15 text-accent' : 'bg-overlay text-subtle')}>{it.count}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
