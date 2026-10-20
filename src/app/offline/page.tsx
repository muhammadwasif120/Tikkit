import type { Metadata } from 'next'
import { WifiOff } from 'lucide-react'

export const metadata: Metadata = { title: 'Offline', robots: { index: false, follow: false } }

/** Shown by the service worker when a page is not available offline. Pre-cached, so it must not need a login. */
export default function OfflinePage() {
  return (
    <main className="kit grid min-h-screen place-items-center bg-canvas px-4 text-fg">
      <div className="w-full max-w-sm text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-raised text-muted"><WifiOff className="h-6 w-6" aria-hidden /></span>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight">You are offline</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted">This page is not saved on your phone. Your tickets and schedule are, so you can still open those. Everything else needs a connection.</p>
        <div className="mt-6 flex flex-col gap-2">
          <a href="/guest/tickets" className="inline-flex h-11 items-center justify-center rounded-[10px] bg-accent text-sm font-semibold text-accent-fg">Open my tickets</a>
          <a href="/guest/schedule" className="inline-flex h-11 items-center justify-center rounded-[10px] bg-raised text-sm font-medium text-fg">Open my schedule</a>
        </div>
      </div>
    </main>
  )
}
