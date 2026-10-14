import { cn } from '@/lib/cn'

/** TIKKIT X wordmark. The X carries the brand gradient (cyan into violet). */
export function Logo({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn('inline-flex select-none items-center gap-2 font-semibold tracking-tight text-fg', className)} aria-label="TIKKIT X">
      <span
        aria-hidden
        className="relative flex h-7 w-7 items-center justify-center rounded-lg text-[15px] font-bold leading-none text-white"
        style={{ background: 'linear-gradient(135deg, rgb(var(--k-accent)), rgb(var(--k-violet)))' }}
      >
        X
      </span>
      {!compact && (
        <span className="text-[17px] leading-none">
          TIKKIT <span className="bg-gradient-to-r from-accent to-violet bg-clip-text text-transparent">X</span>
        </span>
      )}
    </span>
  )
}
