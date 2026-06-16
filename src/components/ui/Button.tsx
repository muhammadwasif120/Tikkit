'use client'

import React from 'react'
import { Loader } from 'lucide-react'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize    = 'sm' | 'md' | 'lg'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  fullWidth?: boolean
}

const SIZE: Record<ButtonSize, React.CSSProperties> = {
  sm: { padding: '6px 14px',  fontSize: 12, borderRadius: 8,  gap: 5  },
  md: { padding: '10px 20px', fontSize: 14, borderRadius: 12, gap: 6  },
  lg: { padding: '13px 24px', fontSize: 15, borderRadius: 14, gap: 7  },
}

const VARIANT: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    background: 'var(--brand-blue)',
    color: '#fff',
    border: 'none',
  },
  secondary: {
    background: 'var(--guest-surface-2)',
    color: 'var(--text-primary)',
    border: '1px solid var(--guest-border)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--text-muted)',
    border: '1px solid var(--guest-border)',
  },
  danger: {
    background: 'rgba(239,68,68,0.1)',
    color: '#F87171',
    border: '1px solid rgba(239,68,68,0.2)',
  },
}

export function Button({
  variant  = 'primary',
  size     = 'md',
  loading  = false,
  fullWidth = false,
  disabled,
  children,
  style,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading

  return (
    <button
      disabled={isDisabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-body)',
        fontWeight: 600,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.55 : 1,
        transition: 'all 0.2s',
        whiteSpace: 'nowrap',
        width: fullWidth ? '100%' : undefined,
        ...SIZE[size],
        ...VARIANT[variant],
        ...style,
      }}
      {...props}
    >
      {loading && <Loader size={size === 'sm' ? 12 : 14} style={{ animation: 'spin 1s linear infinite' }} />}
      {children}
    </button>
  )
}
