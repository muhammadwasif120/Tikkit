'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Flag } from 'lucide-react'
import { Button, Modal } from '@/components/kit'
import { createClient } from '@/lib/supabase/client'

type Kind = 'organizer' | 'attendee' | 'event'

const CATS: Record<Kind, [string, string][]> = {
  organizer: [['fraud_scam', 'Fraud or scam'], ['no_refund', 'Refused a refund they owe'], ['fake_event', 'Fake or misleading events'], ['harassment', 'Harassment or abuse'], ['impersonation', 'Pretending to be someone else'], ['inappropriate_content', 'Inappropriate content'], ['safety', 'Safety concern'], ['other', 'Something else']],
  event: [['fake_event', 'Fake or misleading event'], ['fraud_scam', 'Looks like a scam'], ['inappropriate_content', 'Inappropriate content'], ['safety', 'Safety concern'], ['other', 'Something else']],
  attendee: [['fraud_scam', 'Fake payment or fraud'], ['harassment', 'Harassment or abuse'], ['impersonation', 'Pretending to be someone else'], ['safety', 'Safety concern'], ['other', 'Something else']],
}
const TITLE: Record<Kind, string> = { organizer: 'Report this organizer', event: 'Report this event', attendee: 'Report this guest' }

/** Sends a report to the TIKKIT X team. The database checks that the reporter is allowed to report this person or event. */
export default function ReportButton({ kind, subjectId, subjectName, label, icon = false, className }: { kind: Kind; subjectId: string; subjectName: string; label?: string; icon?: boolean; className?: string }) {
  const supabase = useMemo(() => createClient(), [])
  const [open, setOpen] = useState(false)
  const [signedIn, setSignedIn] = useState<boolean | null>(null)
  const [category, setCategory] = useState(CATS[kind][0][0])
  const [details, setDetails] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function show() {
    setOpen(true); setErr(null); setDone(false)
    const { data: { session } } = await supabase.auth.getSession()
    setSignedIn(!!session)
  }

  async function send() {
    setErr(null)
    if (details.trim().length < 10) return setErr('Please describe what happened in a few words.')
    setBusy(true)
    const { error } = await supabase.rpc('submit_report' as never, { p_kind: kind, p_subject: subjectId, p_category: category, p_details: details.trim(), p_event: kind === 'event' ? subjectId : null } as never)
    setBusy(false)
    if (error) return setErr(error.message.replace(/^[A-Z_]+: /, '') || 'We could not send that. Try again.')
    setDone(true); setDetails('')
  }

  return (
    <>
      {icon
        ? <Button type="button" size="sm" variant="ghost" aria-label={`${TITLE[kind]}: ${subjectName}`} onClick={show} className={className}><Flag className="h-4 w-4" /></Button>
        : <button type="button" onClick={show} className={className ?? 'inline-flex cursor-pointer items-center gap-1.5 text-xs text-subtle hover:text-fg'}><Flag className="h-3.5 w-3.5" aria-hidden />{label ?? TITLE[kind]}</button>}
      <Modal open={open} onClose={() => setOpen(false)} title={TITLE[kind]} description={subjectName}>
        {signedIn === false ? (
          <p className="text-sm text-muted">Log in to send a report, so we can follow up. <Link href={`/auth/login?next=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname : '/')}`} className="text-accent hover:underline">Log in</Link></p>
        ) : done ? (
          <div className="space-y-4"><p role="status" className="text-sm text-success">Thank you. The TIKKIT X team will review this report.</p><div className="flex justify-end"><Button onClick={() => setOpen(false)}>Close</Button></div></div>
        ) : (
          <div className="space-y-4">
            <label className="block text-sm"><span className="text-muted">What is the problem?</span>
              <select value={category} onChange={e => setCategory(e.target.value)} className="mt-1.5 h-10 w-full rounded-[10px] border border-line-strong bg-raised px-3 text-sm text-fg focus:border-accent focus:outline-none">{CATS[kind].map(([v, t]) => <option key={v} value={v}>{t}</option>)}</select></label>
            <label className="block text-sm"><span className="text-muted">What happened?</span>
              <textarea value={details} onChange={e => setDetails(e.target.value)} rows={4} maxLength={2000} placeholder="Give the details that will help us look into it: what, when and who." className="mt-1.5 w-full rounded-[10px] border border-line-strong bg-raised px-3 py-2 text-sm text-fg placeholder:text-subtle focus:border-accent focus:outline-none" /></label>
            <p className="text-xs text-subtle">Payments and refunds are agreed between the organizer and the guest, and TIKKIT X does not hold the money. We can suspend accounts and remove events that break the rules, but we cannot issue refunds.</p>
            {err && <p role="alert" className="text-sm text-danger">{err}</p>}
            <div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button loading={busy} onClick={send}>Send report</Button></div>
          </div>
        )}
      </Modal>
    </>
  )
}
