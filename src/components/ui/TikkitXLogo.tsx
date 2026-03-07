'use client'

/**
 * TikkitXLogo — shared brand wordmark.
 *
 * "tikkit" renders in the standard near-white display font.
 * " x" renders in bright electric cyan (#00E5FF) with a layered glow,
 * creating a deliberate visual offset from the rest of the blue/gold UI.
 *
 * Sizes
 *   sm  — compact nav / mobile header   (icon 30 px, text 17 px)
 *   md  — sidebar / desktop nav          (icon 32 px, text 20 px)
 *   lg  — auth page centred mark         (icon 48 px, text 28 px)
 *
 * Variants
 *   full      — icon box + wordmark
 *   text-only — wordmark only (guest mobile header)
 */

import { Ticket } from 'lucide-react'

type LogoSize    = 'sm' | 'md' | 'lg'
type LogoVariant = 'full' | 'text-only'

interface TikkitXLogoProps {
  size?:    LogoSize
  variant?: LogoVariant
  /** Extra inline styles on the outer wrapper */
  style?:   React.CSSProperties
}

const SIZES: Record<LogoSize, {
  box: number; radius: number; icon: number;
  stroke: number; text: number; x: number; gap: number;
  letterSpacing: string;
}> = {
  sm: { box: 30, radius: 8,  icon: 14, stroke: 2.5, text: 17, x: 19, gap: 8,  letterSpacing: '-0.5px'  },
  md: { box: 32, radius: 10, icon: 16, stroke: 2.5, text: 20, x: 22, gap: 10, letterSpacing: '-0.75px' },
  lg: { box: 48, radius: 14, icon: 22, stroke: 2.5, text: 28, x: 31, gap: 12, letterSpacing: '-1px'    },
}

// Layered glow at three radii — makes the X pop without feeling noisy
const X_GLOW = '0 0 8px rgba(0,229,255,0.95), 0 0 18px rgba(0,229,255,0.55), 0 0 36px rgba(0,229,255,0.25)'
const X_COLOR = '#00E5FF'

export function TikkitXLogo({ size = 'md', variant = 'full', style }: TikkitXLogoProps) {
  const s = SIZES[size]

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: s.gap,
        flexShrink: 0,
        lineHeight: 1,
        ...style,
      }}
    >
      {/* ── Icon box ── */}
      {variant === 'full' && (
        <span
          aria-hidden="true"
          style={{
            width:          s.box,
            height:         s.box,
            borderRadius:   s.radius,
            background:     'linear-gradient(135deg, #2B6FFF, #1448CC)',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            flexShrink:     0,
            // Blue glow from the box + a whisper of cyan to echo the X
            boxShadow:      `0 0 ${s.box * 0.55}px rgba(30,94,255,0.40),
                             0 0 ${s.box * 0.22}px rgba(0,229,255,0.18),
                             inset 0 1px 0 rgba(255,255,255,0.15)`,
          }}
        >
          <Ticket size={s.icon} color="white" strokeWidth={s.stroke} />
        </span>
      )}

      {/* ── Wordmark ── */}
      <span
        style={{
          fontFamily:    'var(--font-display)',
          fontWeight:    800,
          letterSpacing: s.letterSpacing,
          lineHeight:    1,
          display:       'inline-flex',
          alignItems:    'baseline',
          gap:           '0.04em',
        }}
      >
        {/* "tikkit" — standard near-white */}
        <span style={{ color: '#F0F2FF', fontSize: s.text }}>tikkit</span>

        {/* " x" — electric cyan with layered glow */}
        <span
          style={{
            color:      X_COLOR,
            fontSize:   s.x,
            textShadow: X_GLOW,
            // Sits a hair lower on the baseline so the larger x optically aligns
            position:   'relative',
            top:        '0.04em',
          }}
        >
          x
        </span>
      </span>
    </span>
  )
}
