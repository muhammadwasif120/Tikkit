'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'
import { useInstall } from '@/lib/pwa'
import { cn } from '@/lib/cn'

/** A manual way to install from a settings screen. Hidden when the app is already installed or cannot be installed here. */
export default function InstallAppButton({ className }: { className?: string }) {
  const { standalone, canPrompt, iosSafari, install } = useInstall()
  const [howTo, setHowTo] = useState(false)
  if (standalone || (!canPrompt && !iosSafari)) return null
  return (
    <div className={className}>
      <button type="button" onClick={() => (canPrompt ? install() : setHowTo(v => !v))}
        className={cn('flex h-10 w-full cursor-pointer items-center gap-3 rounded-[10px] px-3 text-sm font-medium text-muted transition-colors hover:bg-raised hover:text-fg')}>
        <Download className="h-[18px] w-[18px]" aria-hidden /> Install the app
      </button>
      {howTo && <p className="px-3 pb-2 text-xs text-muted">In Safari, tap Share, then Add to Home Screen.</p>}
    </div>
  )
}
