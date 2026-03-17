'use client'

/**
 * TikkitXLogo — matches the brand wordmark exactly.
 *
 * "TIKKIT" — bold Clash Display, solid electric cyan.
 * "X"      — bold Clash Display, electric cyan fill + thick purple outline.
 *
 * Fully transparent background, scales via size prop.
 */

type LogoSize    = 'sm' | 'md' | 'lg'
type LogoVariant = 'full' | 'text-only'

interface TikkitXLogoProps {
  size?:    LogoSize
  variant?: LogoVariant
  style?:   React.CSSProperties
}

const SIZES: Record<LogoSize, { tikkitPx: number; xPx: number; xStroke: string; gap: number }> = {
  sm: { tikkitPx: 18, xPx: 22, xStroke: '1.8px', gap: 2 },
  md: { tikkitPx: 22, xPx: 27, xStroke: '2.2px', gap: 3 },
  lg: { tikkitPx: 34, xPx: 42, xStroke: '3.2px', gap: 4 },
}

export function TikkitXLogo({ size = 'md', style }: TikkitXLogoProps) {
  const { tikkitPx, xPx, xStroke, gap } = SIZES[size]

  const fontBase: React.CSSProperties = {
    fontFamily:    "'Clash Display', 'Poppins', sans-serif",
    fontWeight:    700,
    lineHeight:    1,
    letterSpacing: '-0.01em',
    display:       'inline-block',
  }

  return (
    <span
      style={{
        display:    'inline-flex',
        alignItems: 'center',
        gap:        gap,
        flexShrink: 0,
        lineHeight: 1,
        userSelect: 'none',
        ...style,
      }}
    >
      {/* TIKKIT — solid cyan */}
      <span
        style={{
          ...fontBase,
          fontSize: tikkitPx,
          color:    '#00E5FF',
        }}
      >
        TIKKIT
      </span>

      {/* X — cyan fill + purple outline */}
      <span
        style={{
          ...fontBase,
          fontSize:            xPx,
          color:               '#00E5FF',
          WebkitTextStroke:    `${xStroke} #8800CC`,
          paintOrder:          'stroke fill' as React.CSSProperties['paintOrder'],
        }}
      >
        X
      </span>
    </span>
  )
}
