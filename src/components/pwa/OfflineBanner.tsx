'use client'

import { useEffect, useState } from 'react'
import { WifiOff } from 'lucide-react'

/** A thin notice while the phone has no connection, so nobody trusts out of date numbers. */
export default function OfflineBanner() {
  const [offline, setOffline] = useState(false)
  useEffect(() => {
    const sync = () => setOffline(!navigator.onLine)
    sync()
    window.addEventListener('online', sync); window.addEventListener('offline', sync)
    return () => { window.removeEventListener('online', sync); window.removeEventListener('offline', sync) }
  }, [])
  if (!offline) return null
  return (
    <div role="status" className="fixed inset-x-0 top-0 z-[9600] flex items-center justify-center gap-2 bg-warning px-3 py-1.5 pt-[calc(0.375rem+env(safe-area-inset-top))] text-center text-xs font-medium text-black">
      <WifiOff className="h-3.5 w-3.5 shrink-0" aria-hidden />You are offline. Showing what was last saved on this phone. Statuses may be out of date.
    </div>
  )
}
