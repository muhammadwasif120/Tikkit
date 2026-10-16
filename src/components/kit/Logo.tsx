import { cn } from '@/lib/cn'

// The real TIKKIT X artwork (transparent PNG cut from the brand file), shown at its true proportions.
// Wordmark is 1219 x 294. The X mark alone is used for the compact version.
const FULL = { src: '/brand/tikkit-x-logo.png', w: 1219, h: 294 }
const MARK = { src: '/brand/tikkit-x-mark.png', w: 370, h: 282 }

/** `compact` shows the X mark only. Height is set by className (default h-7); width follows the artwork. */
export function Logo({ className, compact }: { className?: string; compact?: boolean }) {
  const a = compact ? MARK : FULL
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={a.src}
      width={a.w}
      height={a.h}
      alt="TIKKIT X"
      decoding="async"
      className={cn('block h-7 w-auto select-none', className)}
      draggable={false}
    />
  )
}
