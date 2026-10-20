'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/kit'
import { createClient } from '@/lib/supabase/client'

/** Move a report through the queue and keep a note. Every change is written to the audit log by the database. */
export default function ReportActions({ id, status, notes }: { id: string; status: string; notes: string | null }) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [note, setNote] = useState(notes ?? '')
  const [err, setErr] = useState<string | null>(null)
  const [pending, start] = useTransition()
  const set = (next: string) => start(async () => {
    setErr(null)
    const { error } = await supabase.rpc('admin_update_report' as never, { p_report: id, p_status: next, p_notes: note || null } as never)
    if (error) return setErr(error.message.replace(/^[A-Z_]+: /, ''))
    router.refresh()
  })
  const closed = status === 'actioned' || status === 'dismissed'
  return (
    <div className="space-y-2">
      <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} placeholder="Notes for the team (not shown to the reporter)" className="w-full rounded-[10px] border border-line-strong bg-raised px-3 py-2 text-sm text-fg placeholder:text-subtle focus:border-accent focus:outline-none" />
      <div className="flex flex-wrap gap-2">
        {status === 'open' && <Button size="sm" variant="secondary" loading={pending} onClick={() => set('reviewing')}>Start review</Button>}
        {!closed && <><Button size="sm" loading={pending} onClick={() => set('actioned')}>Action taken</Button><Button size="sm" variant="ghost" loading={pending} onClick={() => set('dismissed')}>Dismiss</Button></>}
        {closed && <Button size="sm" variant="secondary" loading={pending} onClick={() => set('open')}>Reopen</Button>}
        {note !== (notes ?? '') && <Button size="sm" variant="ghost" loading={pending} onClick={() => set(status)}>Save note</Button>}
      </div>
      {err && <p role="alert" className="text-sm text-danger">{err}</p>}
    </div>
  )
}
