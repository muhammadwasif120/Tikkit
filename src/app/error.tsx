'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html lang="en">
      <body style={{
        minHeight: '100vh',
        background: '#050608',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        color: '#9CA3AF',
        padding: '24px',
        margin: 0,
      }}>
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <p style={{
            fontSize: 'clamp(64px, 15vw, 96px)',
            fontWeight: 900,
            color: 'rgba(255,255,255,0.04)',
            letterSpacing: '-4px',
            lineHeight: 1,
            margin: '0 0 16px',
            userSelect: 'none',
          }}>500</p>
          <p style={{ fontSize: 16, fontWeight: 600, color: 'rgba(255,255,255,0.7)', margin: '0 0 8px' }}>
            Something went wrong
          </p>
          <p style={{ fontSize: 13, color: '#4B5563', margin: '0 0 28px', lineHeight: 1.6 }}>
            An unexpected error occurred. Our team has been notified.
          </p>
          <button
            onClick={reset}
            style={{
              background: '#1E5EFF',
              border: 'none',
              borderRadius: 8,
              padding: '10px 24px',
              color: 'white',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              letterSpacing: '0.02em',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
