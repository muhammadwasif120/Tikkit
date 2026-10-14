'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/kit'
import { createClient } from '@/lib/supabase/client'

/** Approve or reject through a database function. kind picks which one. */
export default function ReviewButtons({ kind, id, userId }: { kind: 'subscription' | 'id'; id: string; userId?: string }) {
  const router = useRouter(); const supabase = useMemo(() => createClient(), [])
  const [pending, start] = useTransition(); const [err, setErr] = useState<string | null>(null)
  const go = (approve: boolean) => {
    const reason = approve ? null : prompt('Reason (the user will see it)') ?? undefined
    if (reason === undefined) return
    setErr(null)
    start(async () => {
      const { error } = kind === 'subscription'
        ? await supabase.rpc('review_subscription_payment', { p_payment: id, p_approve: approve, p_reason: reason ?? undefined })
        : await supabase.rpc('review_id_verification', { p_user: userId!, p_approve: approve, p_reason: reason ?? undefined })
      if (error) return setErr(error.message)
      router.refresh()
    })
  }
  return <div className="flex flex-col items-end gap-1"><div className="flex gap-2"><Button size="sm" loading={pending} onClick={() => go(true)}>Approve</Button><Button size="sm" variant="danger" onClick={() => go(false)}>Reject</Button></div>{err && <p role="alert" className="text-xs text-danger">{err}</p>}</div>
}
