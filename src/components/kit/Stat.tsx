import type { ReactNode } from 'react'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Card } from './Card'
import { Sparkline } from './Charts'

export function StatCard({
  label, value, delta, hint, icon, spark,
}: { label: string; value: ReactNode; delta?: number; hint?: string; icon?: ReactNode; spark?: number[] }) {
  const up = (delta ?? 0) >= 0
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-muted">{label}</span>
        {icon && <span className="text-subtle">{icon}</span>}
      </div>
      <div className="mt-3 flex items-end justify-between gap-3">
        <div>
          <div className="tnum text-[28px] font-semibold leading-none tracking-tight text-fg">{value}</div>
          <div className="mt-2 flex items-center gap-2 text-xs">
            {delta !== undefined && (
              <span className={cn('inline-flex items-center gap-0.5 font-medium', up ? 'text-success' : 'text-danger')}>
                {up ? <ArrowUpRight className="h-3.5 w-3.5" aria-hidden /> : <ArrowDownRight className="h-3.5 w-3.5" aria-hidden />}
                {Math.abs(delta)}%
              </span>
            )}
            {hint && <span className="text-subtle">{hint}</span>}
          </div>
        </div>
        {spark && <div className="w-24 shrink-0"><Sparkline data={spark} tone={up ? 'accent' : 'danger'} /></div>}
      </div>
    </Card>
  )
}
