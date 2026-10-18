'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/cn'

/** Ends the session and returns to the home page. `row` styles it as a sidebar item. */
export function SignOutButton({ className, label = 'Log out', to = '/' }: { className?: string; label?: string; to?: string }) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [busy, setBusy] = useState(false)
  return (
    <button type="button" disabled={busy}
      onClick={async () => { setBusy(true); await supabase.auth.signOut(); try { sessionStorage.removeItem('tkx-att-tour'); sessionStorage.removeItem('tkx-demo-tour') } catch {} router.push(to); router.refresh() }}
      className={cn('flex h-10 w-full cursor-pointer items-center gap-3 rounded-[10px] px-3 text-sm font-medium text-muted transition-colors hover:bg-raised hover:text-fg disabled:opacity-60', className)}>
      <LogOut className="h-[18px] w-[18px]" aria-hidden /> {busy ? 'Logging out…' : label}
    </button>
  )
}
