'use client'

import React from 'react'

export type CardVariant = 'default' | 'elevated' | 'glass' | 'bordered'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant
  hover?: boolean
  padding?: number | string
  radius?: number | string
}

const VARIANT_STYLE: Record<CardVariant, React.CSSProperties> = {
  default: {
    background: 'var(--surface-card)',
    border: '1px solid var(--guest-border)',
  },
  elevated: {
    background: 'var(--surface-card)',
    border: '1px solid var(--guest-border)',
    boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
  },
  glass: {
    background: 'var(--glass-bg)',
    backdropFilter: 'var(--glass-blur)',
    WebkitBackdropFilter: 'var(--glass-blur)',
    border: '1px solid var(--glass-border)',
  },
  bordered: {
    background: 'transparent',
    border: '1px solid var(--guest-border)',
  },
}

export function Card({
  variant  = 'default',
  hover    = false,
  padding  = '20px',
  radius   = 16,
  children,
  style,
  onMouseEnter,
  onMouseLeave,
  ...props
}: CardProps) {
  const [hovered, setHovered] = React.useState(false)

  return (
    <div
      style={{
        borderRadius: radius,
        padding,
        overflow: 'hidden',
        transition: 'all 0.2s',
        ...(hover && hovered
          ? { borderColor: 'var(--guest-border-hover)', transform: 'translateY(-2px)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }
          : {}),
        ...VARIANT_STYLE[variant],
        ...style,
      }}
      onMouseEnter={e => { if (hover) setHovered(true); onMouseEnter?.(e) }}
      onMouseLeave={e => { if (hover) setHovered(false); onMouseLeave?.(e) }}
      {...props}
    >
      {children}
    </div>
  )
}
