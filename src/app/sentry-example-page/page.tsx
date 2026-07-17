'use client'

import { useState } from 'react'
import * as Sentry from '@sentry/nextjs'

// Diagnostic page only — not linked from anywhere in the app's navigation.
// Verifies both client-side and server-side Sentry error capture end-to-end.
// Safe to keep around for future re-verification after Sentry config changes.
export default function SentryExamplePage() {
  const [serverCallStatus, setServerCallStatus] = useState<'idle' | 'error' | 'ok'>('idle')

  const triggerServerError = async () => {
    try {
      await Sentry.startSpan({ name: 'Sentry Example Frontend Span', op: 'test' }, async () => {
        const res = await fetch('/api/sentry-example-api')
        if (!res.ok) throw new Error(`Server route responded ${res.status}`)
      })
      setServerCallStatus('ok')
    } catch {
      // Expected — the API route always throws. Sentry.captureRequestError
      // (wired in instrumentation.ts) reports the server-side error already;
      // this is just so the page can show it happened.
      setServerCallStatus('error')
    }
  }

  const triggerClientError = () => {
    throw new Error('Sentry Example Frontend Error — client-side capture test')
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 16,
      background: '#050608', color: '#F0F2FF', fontFamily: 'ui-sans-serif, system-ui, sans-serif',
      padding: 24,
    }}>
      <h1 style={{ fontSize: 20, fontWeight: 700 }}>Sentry verification page</h1>
      <p style={{ color: '#9CA3AF', fontSize: 14, maxWidth: 420, textAlign: 'center' }}>
        Not linked from anywhere in the app. Triggers a real client-side error
        and a real server-side error, both reported to Sentry.
      </p>

      <button
        onClick={triggerServerError}
        style={{ background: '#1E5EFF', color: 'white', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 14, cursor: 'pointer' }}
      >
        Trigger server error
      </button>
      {serverCallStatus === 'error' && <p style={{ color: '#F87171', fontSize: 13 }}>Server route threw — check Sentry.</p>}

      <button
        onClick={triggerClientError}
        style={{ background: '#EF4444', color: 'white', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 14, cursor: 'pointer' }}
      >
        Trigger client error
      </button>
    </div>
  )
}
