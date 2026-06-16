'use client'

import React from 'react'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string | null
  icon?: React.ReactNode
  wrapperStyle?: React.CSSProperties
}

export function Input({ label, error, icon, wrapperStyle, style, id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, ...wrapperStyle }}>
      {label && (
        <label
          htmlFor={inputId}
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            fontFamily: 'var(--font-body)',
          }}
        >
          {label}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        {icon && (
          <span style={{
            position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--text-muted)', display: 'flex', pointerEvents: 'none',
          }}>
            {icon}
          </span>
        )}
        <input
          id={inputId}
          style={{
            width: '100%',
            minHeight: 44,
            padding: icon ? '10px 13px 10px 38px' : '10px 13px',
            background: 'var(--guest-surface-2)',
            border: `1px solid ${error ? 'rgba(239,68,68,0.5)' : 'var(--guest-border)'}`,
            borderRadius: 12,
            color: 'var(--text-primary)',
            fontSize: 14,
            fontFamily: 'var(--font-body)',
            outline: 'none',
            transition: 'border-color 0.15s',
            boxSizing: 'border-box',
            ...style,
          }}
          {...props}
        />
      </div>
      {error && (
        <p style={{ fontSize: 12, color: '#F87171', margin: 0, lineHeight: 1.4 }}>{error}</p>
      )}
    </div>
  )
}
