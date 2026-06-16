'use client'

import React from 'react'

export type BadgeVariant = 'blue' | 'yellow' | 'green' | 'red' | 'gray' | 'purple'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  size?: 'sm' | 'md'
}

const STYLES: Record<BadgeVariant, React.CSSProperties> = {
  blue:   { background: 'rgba(var(--brand-blue-rgb),0.12)', color: 'var(--brand-blue)',  border: '1px solid rgba(var(--brand-blue-rgb),0.25)' },
  yellow: { background: 'rgba(255,199,69,0.12)',   color: '#FFC745', border: '1px solid rgba(255,199,69,0.25)' },
  green:  { background: 'rgba(16,185,129,0.1)',    color: '#10B981', border: '1px solid rgba(16,185,129,0.25)' },
  red:    { background: 'rgba(239,68,68,0.1)',     color: '#F87171', border: '1px solid rgba(239,68,68,0.25)'  },
  gray:   { background: 'rgba(255,255,255,0.05)',  color: 'var(--text-muted)', border: '1px solid var(--guest-border)' },
  purple: { background: 'rgba(129,140,248,0.1)',   color: '#818CF8', border: '1px solid rgba(129,140,248,0.25)' },
}

export function Badge({ variant = 'gray', size = 'sm', children, style, ...props }: BadgeProps) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: size === 'sm' ? '2px 8px' : '4px 10px',
        borderRadius: 20,
        fontSize: size === 'sm' ? 11 : 12,
        fontWeight: 700,
        whiteSpace: 'nowrap',
        letterSpacing: '0.2px',
        ...STYLES[variant],
        ...style,
      }}
      {...props}
    >
      {children}
    </span>
  )
}
