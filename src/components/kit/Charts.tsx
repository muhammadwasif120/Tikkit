import { cn } from '@/lib/cn'

/** Tiny dependency-free sparkline. Values are plotted left to right. */
export function Sparkline({ data, className, tone = 'accent' }: { data: number[]; className?: string; tone?: 'accent' | 'success' | 'danger' }) {
  const w = 120, h = 36, pad = 2
  const min = Math.min(...data), max = Math.max(...data)
  const span = max - min || 1
  const pts = data.map((v, i) => [pad + (i / (data.length - 1)) * (w - pad * 2), h - pad - ((v - min) / span) * (h - pad * 2)] as const)
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')
  const area = `${line} L${pts[pts.length - 1][0]} ${h} L${pts[0][0]} ${h} Z`
  const color = { accent: 'rgb(var(--k-accent))', success: 'rgb(var(--k-success))', danger: 'rgb(var(--k-danger))' }[tone]
  const id = `sg-${tone}`
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={cn('h-9 w-full', className)} preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.28" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

/** Vertical bars with a label under each. The aria-label carries the data for screen readers. */
export function BarChart({ data, className }: { data: { label: string; value: number }[]; className?: string }) {
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div className={cn('flex h-40 items-end gap-2', className)} role="img" aria-label={data.map(d => `${d.label}: ${d.value}`).join(', ')}>
      {data.map((d, i) => (
        <div key={d.label} className="flex h-full flex-1 flex-col items-center gap-2">
          <div className="flex w-full flex-1 items-end">
            <div
              className={cn('w-full rounded-t-md', i === data.length - 1 ? 'bg-accent' : 'bg-accent/30')}
              style={{ height: `${(d.value / max) * 100}%` }}
            />
          </div>
          <span className="text-[11px] text-subtle">{d.label}</span>
        </div>
      ))}
    </div>
  )
}
