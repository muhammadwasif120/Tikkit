'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  const router = useRouter()

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--guest-bg, #050608)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'var(--font-body, ui-sans-serif, system-ui, sans-serif)',
      padding: '24px',
    }}>
      <div style={{ textAlign: 'center', maxWidth: 420 }}>
        <p style={{
          fontSize: 'clamp(56px, 12vw, 80px)',
          fontWeight: 900,
          color: 'rgba(255,255,255,0.04)',
          letterSpacing: '-4px',
          lineHeight: 1,
          margin: '0 0 16px',
          userSelect: 'none',
        }}>Error</p>
        <p style={{ fontSize: 16, fontWeight: 600, color: 'rgba(255,255,255,0.75)', margin: '0 0 8px' }}>
          Dashboard error
        </p>
        <p style={{ fontSize: 13, color: '#4B5563', margin: '0 0 28px', lineHeight: 1.6 }}>
          Something went wrong loading this page. Your data is safe.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={reset}
            style={{
              background: '#1E5EFF',
              border: 'none',
              borderRadius: 8,
              padding: '10px 20px',
              color: 'white',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              padding: '10px 20px',
              color: '#9CA3AF',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Go to dashboard
          </button>
        </div>
      </div>
    </div>
  )
}
