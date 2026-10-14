'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => { Sentry.captureException(error) }, [error])
  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#070911', color: '#edf0f7', fontFamily: 'system-ui, sans-serif', display: 'grid', placeItems: 'center', minHeight: '100vh', textAlign: 'center' }}>
        <div><p style={{ fontSize: 64, fontWeight: 600, margin: 0, color: '#22d3ee' }}>500</p><h1 style={{ fontSize: 24 }}>Something went wrong</h1><p style={{ color: '#969fb7' }}>An unexpected error occurred. We have been notified.</p><a href="/" style={{ color: '#22d3ee' }}>Go home</a></div>
      </body>
    </html>
  )
}
