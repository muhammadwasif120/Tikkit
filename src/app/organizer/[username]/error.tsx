'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import * as Sentry from '@sentry/nextjs'

export default function OrganizerError({
  error,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <div style={{
      background: '#080A10', minHeight: '100svh',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }}>
      <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 20 }}>
        Something went wrong loading this profile.
      </p>
      <Link
        href="/guest/explore"
        style={{
          color: '#1E5EFF', fontSize: 14, textDecoration: 'none',
          border: '1px solid rgba(30,94,255,0.3)', borderRadius: 10,
          padding: '8px 16px',
        }}
      >
        ← Back to Explore
      </Link>
    </div>
  )
}
