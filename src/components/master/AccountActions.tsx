'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Ban, RotateCcw } from 'lucide-react'
import { Button, Modal } from '@/components/kit'
import { createClient } from '@/lib/supabase/client'

/** Suspend or reinstate an account. A suspension needs a reason, blocks sign in, and hides an organizer's public listings. */
export default function AccountActions({ userId, name, role, suspended }: { userId: string; name: string; role: string; suspended: boolean }) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)
  const [pending, start] = useTransition()

  function go() {
    setErr(null)
    start(async () => {
      const { data, error } = await supabase.rpc('admin_set_account_status' as never, { p_user: userId, p_suspend: !suspended, p_reason: reason || null } as never)
      if (error) return setErr(error.message.replace(/^[A-Z_]+: /, ''))
      const r = data as unknown as { events_hidden?: number; classes_hidden?: number; spaces_hidden?: number } | null
      setDone(suspended ? 'Account reinstated.' : role === 'organizer' ? `Account suspended. ${r?.events_hidden ?? 0} events, ${r?.classes_hidden ?? 0} classes and ${r?.spaces_hidden ?? 0} spaces hidden from the public site.` : 'Account suspended.')
      setOpen(false); setReason(''); router.refresh()
    })
  }

  return (
    <div>
      {suspended
        ? <Button variant="secondary" leading={<RotateCcw className="h-4 w-4" />} onClick={() => setOpen(true)}>Reinstate account</Button>
        : <Button variant="danger" leading={<Ban className="h-4 w-4" />} onClick={() => setOpen(true)}>Suspend account</Button>}
      {done && <p role="status" className="mt-2 text-sm text-success">{done}</p>}
      <Modal open={open} onClose={() => setOpen(false)} title={suspended ? `Reinstate ${name}?` : `Suspend ${name}?`}
        description={suspended ? 'They can sign in again and anything their suspension hid comes back.' : role === 'organizer' ? 'They are signed out and cannot sign in. Their events, classes and spaces leave the public site until you reinstate them.' : 'They are signed out and cannot sign in. Their tickets stay in the system.'}>
        <div className="space-y-4">
          {!suspended && (
            <label className="block text-sm"><span className="text-muted">Reason (kept in the audit log; the person sees a short notice)</span>
              <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} maxLength={500} className="mt-1.5 w-full rounded-[10px] border border-line-strong bg-raised px-3 py-2 text-sm text-fg focus:border-accent focus:outline-none" /></label>
          )}
          {err && <p role="alert" className="text-sm text-danger">{err}</p>}
          <div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button variant={suspended ? 'primary' : 'danger'} loading={pending} disabled={!suspended && reason.trim().length < 5} onClick={go}>{suspended ? 'Reinstate' : 'Suspend'}</Button></div>
        </div>
      </Modal>
    </div>
  )
}
