'use client'

import { useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function EventStatus({ id, value }: { id: string; value: 'live' | 'flagged' | 'suspended' }) {
  const router = useRouter(); const supabase = useMemo(() => createClient(), []); const [pending, start] = useTransition()
  return <select aria-label="Moderation status" disabled={pending} value={value} onChange={e => start(async () => { await supabase.rpc('admin_set_event_status', { p_event: id, p_status: e.target.value as 'live' | 'flagged' | 'suspended' }); router.refresh() })} className="rounded-lg bg-raised px-2 py-1 text-xs text-fg"><option value="live">Live</option><option value="flagged">Flagged</option><option value="suspended">Suspended</option></select>
}
