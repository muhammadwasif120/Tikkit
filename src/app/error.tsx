'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'
import { Button } from '@/components/kit'

export default function GlobalRouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { Sentry.captureException(error) }, [error])
  return (
    <div className="kit grid min-h-screen place-items-center bg-canvas px-4 text-center text-fg">
      <div className="max-w-md">
        <p className="k-gradient-text text-7xl font-semibold tracking-tight">500</p>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">Something went wrong</h1>
        <p className="mt-2 text-muted">An unexpected error occurred. We have been notified.</p>
        <div className="mt-8 flex justify-center gap-3"><Button onClick={reset}>Try again</Button><Button variant="secondary" onClick={() => { location.href = '/' }}>Go home</Button></div>
      </div>
    </div>
  )
}
