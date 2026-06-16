'use client'

import React, { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'

export interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  /** 'auto' = sheet on mobile, dialog on desktop */
  size?: 'sm' | 'md' | 'lg' | 'auto'
  showHandle?: boolean
  children: React.ReactNode
  /** Extra style applied to the panel itself */
  panelStyle?: React.CSSProperties
}

const MAX_WIDTHS = { sm: 380, md: 480, lg: 600, auto: 480 }

export function Modal({ open, onClose, title, size = 'auto', showHandle, children, panelStyle }: ModalProps) {
  const [isDesktop, setIsDesktop] = useState(false)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    setIsDesktop(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    if (!open) return
    closeRef.current?.focus()
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [open])

  if (!open) return null

  const useDialog = size !== 'auto' || isDesktop
  const maxW = MAX_WIDTHS[size]

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 300,
        display: 'flex',
        alignItems: useDialog ? 'center' : 'flex-end',
        justifyContent: 'center',
        padding: useDialog ? '20px' : '0',
      }}
    >
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.80)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: maxW,
          maxHeight: useDialog ? '90vh' : '92vh',
          overflowY: 'auto',
          background: 'var(--surface-card)',
          border: '1px solid var(--guest-border-hover)',
          borderRadius: useDialog ? 24 : '24px 24px 0 0',
          paddingBottom: useDialog ? 0 : 'env(safe-area-inset-bottom)',
          animation: useDialog
            ? 'popIn 0.35s cubic-bezier(0.34,1.56,0.64,1)'
            : 'sheetSlideUp 0.35s cubic-bezier(0.34,1.56,0.64,1)',
          ...panelStyle,
        }}
      >
        {/* Drag handle — sheet mode only */}
        {(!useDialog || showHandle) && (
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--guest-border-hover)', margin: '14px auto 0' }} />
        )}

        {/* Header */}
        {title && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px 0' }}>
            <h3
              id="modal-title"
              style={{ color: 'var(--text-primary)', fontSize: 18, fontWeight: 900, margin: 0, fontFamily: 'var(--font-display)' }}
            >
              {title}
            </h3>
            <button
              ref={closeRef}
              onClick={onClose}
              aria-label="Close"
              style={{
                background: 'var(--guest-surface-2)',
                border: '1px solid var(--guest-border)',
                borderRadius: 10,
                padding: 8,
                cursor: 'pointer',
                color: 'var(--text-muted)',
                display: 'flex',
                flexShrink: 0,
              }}
            >
              <X size={15} />
            </button>
          </div>
        )}

        {/* Close button (no title case) */}
        {!title && (
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label="Close"
            style={{
              position: 'absolute',
              top: 14,
              right: 16,
              background: 'var(--guest-surface-2)',
              border: '1px solid var(--guest-border)',
              borderRadius: 10,
              padding: 7,
              cursor: 'pointer',
              color: 'var(--text-muted)',
              display: 'flex',
              zIndex: 1,
            }}
          >
            <X size={15} />
          </button>
        )}

        {children}
      </div>
    </div>
  )
}
