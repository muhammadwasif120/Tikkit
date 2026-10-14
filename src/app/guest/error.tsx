'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'
import { AlertTriangle } from 'lucide-react'
import { Button, Card, EmptyState } from '@/components/kit'

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { Sentry.captureException(error) }, [error])
  return <Card><EmptyState icon={<AlertTriangle className="h-6 w-6" />} title="This page could not load" description="Your data is safe. Try again in a moment." action={<Button onClick={reset}>Try again</Button>} /></Card>
}
