import { cn } from '@/lib/cn'

// Brand colors are fixed so the logo never shifts with the theme.
const CYAN = '#10E7F5'
const PURPLE = '#9B22B5'

/**
 * TIKKIT X wordmark, matching the brand logo: heavy cyan letters and a
 * large cyan X with a purple outline. `compact` renders the X alone.
 */
export function Logo({ className, compact }: { className?: string; compact?: boolean }) {
  const x = (
    <span
      aria-hidden
      className="inline-block font-black leading-none"
      style={{
        color: CYAN,
        WebkitTextStroke: `0.09em ${PURPLE}`,
        paintOrder: 'stroke fill',
        fontSize: compact ? '1.9rem' : '2.1rem',
        transform: 'translateY(0.02em)',
      }}
    >
      X
    </span>
  )

  if (compact) {
    return <span className={cn('inline-flex select-none items-center', className)} aria-label="TIKKIT X">{x}</span>
  }

  return (
    <span className={cn('inline-flex select-none items-center gap-1', className)} aria-label="TIKKIT X">
      <span
        aria-hidden
        className="font-black uppercase leading-none"
        style={{ color: CYAN, fontSize: '1.45rem', letterSpacing: '0.01em', fontStretch: 'expanded' }}
      >
        TIKKIT
      </span>
      {x}
    </span>
  )
}
