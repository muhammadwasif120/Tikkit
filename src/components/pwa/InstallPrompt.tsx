'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Share, SquarePlus, X } from 'lucide-react'
import { Button, Logo } from '@/components/kit'
import { useInstall } from '@/lib/pwa'

const SNOOZE_KEY = 'tkx-install-snooze'
const VISITS_KEY = 'tkx-visits'
const QUIET = ['/auth', '/demo', '/master', '/suspended', '/offline', '/staff', '/promoter', '/itinerary']

/** Offers to install the app: the browser's own prompt where there is one, and the steps for Safari on iPhone. */
export default function InstallPrompt() {
  const { standalone, canPrompt, iosSafari, install } = useInstall()
  const path = usePathname()
  const [ready, setReady] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [steps, setSteps] = useState(false)
  const inApp = path.startsWith('/guest') || path.startsWith('/dashboard')

  useEffect(() => {
    try {
      if (Number(localStorage.getItem(SNOOZE_KEY) ?? 0) > Date.now()) return
      // Count visits once per browser session. Offer after the second one, or after a while inside the app.
      if (!sessionStorage.getItem(VISITS_KEY)) { sessionStorage.setItem(VISITS_KEY, '1'); localStorage.setItem(VISITS_KEY, String(Number(localStorage.getItem(VISITS_KEY) ?? 0) + 1)) }
      const eligible = Number(localStorage.getItem(VISITS_KEY) ?? 0) >= 2 || inApp
      if (!eligible) return
      const t = setTimeout(() => setReady(true), inApp ? 15000 : 25000)
      return () => clearTimeout(t)
    } catch { /* storage blocked: stay quiet */ }
  }, [inApp])

  const snooze = (days: number) => { try { localStorage.setItem(SNOOZE_KEY, String(Date.now() + days * 86_400_000)) } catch { /* ignore */ } setHidden(true) }

  if (standalone || hidden || !ready || QUIET.some(p => path === p || path.startsWith(p + '/'))) return null
  if (!canPrompt && !iosSafari) return null

  return (
    <div role="dialog" aria-label="Install TIKKIT X" style={{ bottom: inApp ? 'calc(88px + env(safe-area-inset-bottom))' : 'calc(16px + env(safe-area-inset-bottom))' }}
      className="k-pop-in fixed inset-x-3 z-[9300] mx-auto max-w-sm rounded-2xl bg-surface p-4 shadow-2xl ring-1 ring-line sm:inset-x-auto sm:left-4 sm:mx-0 lg:!bottom-4">
      <button type="button" onClick={() => snooze(14)} aria-label="Not now" className="absolute right-3 top-3 cursor-pointer text-subtle hover:text-fg"><X className="h-4 w-4" /></button>
      <div className="flex items-center gap-3"><Logo compact className="h-7" /><div><p className="text-sm font-semibold text-fg">Install TIKKIT X</p><p className="text-xs text-muted">Open your tickets from your home screen, even with a weak signal.</p></div></div>
      {steps ? (
        <ol className="mt-3 space-y-2 text-sm text-muted">
          <li className="flex items-center gap-2"><Share className="h-4 w-4 shrink-0 text-accent" aria-hidden />Tap the Share button in Safari.</li>
          <li className="flex items-center gap-2"><SquarePlus className="h-4 w-4 shrink-0 text-accent" aria-hidden />Choose Add to Home Screen, then Add.</li>
        </ol>
      ) : (
        <div className="mt-3 flex gap-2">
          {canPrompt ? <Button size="sm" onClick={async () => { const ok = await install(); if (!ok) snooze(7) }}>Install</Button> : <Button size="sm" onClick={() => setSteps(true)}>Show me how</Button>}
          <Button size="sm" variant="ghost" onClick={() => snooze(14)}>Not now</Button>
        </div>
      )}
    </div>
  )
}
