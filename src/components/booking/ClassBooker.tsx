'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Badge, Button, Card, CardBody, CardHeader } from '@/components/kit'
import PayProof from './PayProof'
import { createClient } from '@/lib/supabase/client'
import { rpcLoose } from '@/lib/rpc'
import { fmtDate, fmtTime, pkr } from '@/lib/format'

export type PubSession = { id: string; starts_at: string; seats_left: number | null }
export type PubPass = { id: string; name: string; kind: string; sessions_count: number | null; validity_days: number; price_pkr: number }
export type MyPass = { id: string; name: string; left: string }
const readable = (m: string) => (m.match(/^[A-Z_]+(?::[a-z_]+)?: ([\s\S]*)$/)?.[1]) ?? m

export default function ClassBooker({ organizerId, price, sessions, passes, myPasses, signedIn, isAttendee, slug }: { organizerId: string; price: number; sessions: PubSession[]; passes: PubPass[]; myPasses: MyPass[]; signedIn: boolean; isAttendee: boolean; slug: string }) {
  const router = useRouter(); const supabase = useMemo(() => createClient(), [])
  const [usePass, setUsePass] = useState(myPasses[0]?.id ?? ''); const [pay, setPay] = useState<{ kind: 'class_booking' | 'pass_purchase'; id: string; amount: number } | null>(null)
  const [busy, setBusy] = useState(''); const [err, setErr] = useState<string | null>(null); const [done, setDone] = useState<string | null>(null)
  const login = `/auth/login?next=${encodeURIComponent(`/classes/${slug}`)}`

  async function book(s: PubSession) {
    if (!signedIn) return void (location.href = login)
    setErr(null); setBusy(s.id)
    const { data, error } = await rpcLoose(supabase as never, 'book_class_session', { p_session: s.id, p_pass: usePass || null })
    setBusy(''); if (error) return setErr(readable(error.message))
    if (!usePass && price > 0) return setPay({ kind: 'class_booking', id: data as string, amount: price })
    setDone(`Booked ${fmtDate(s.starts_at)} at ${fmtTime(s.starts_at)}.`); router.refresh()
  }
  async function buy(p: PubPass) {
    if (!signedIn) return void (location.href = login)
    setErr(null); setBusy(p.id)
    const { data, error } = await rpcLoose(supabase as never, 'purchase_pass', { p_product: p.id }); setBusy('')
    if (error) return setErr(readable(error.message))
    if (p.price_pkr > 0) setPay({ kind: 'pass_purchase', id: data as string, amount: p.price_pkr }); else { setDone('Pass added.'); router.refresh() }
  }

  return (
    <div className="space-y-6">
      {!isAttendee && signedIn && <p className="rounded-xl bg-raised px-4 py-3 text-sm text-muted">Use an attendee account to book classes.</p>}
      {err && <p role="alert" className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">{err}</p>}
      {done && <p role="status" className="rounded-xl bg-success/10 px-4 py-3 text-sm text-success">{done} <Link href="/guest/tickets" className="underline">See my tickets</Link></p>}
      {pay && <PayProof kind={pay.kind} subjectId={pay.id} organizerId={organizerId} amount={pay.amount} onDone={() => { setPay(null); setDone('Payment sent. The organizer will confirm it.'); router.refresh() }} />}

      <Card><CardHeader title="Upcoming sessions" description={myPasses.length ? undefined : price ? `${pkr(price)} per session` : 'Free'} />
        <CardBody className="space-y-3">
          {myPasses.length > 0 && <label className="flex items-center gap-2 text-sm text-muted">Pay with <select value={usePass} onChange={e => setUsePass(e.target.value)} className="rounded-lg bg-raised px-2 py-1.5 text-fg"><option value="">Pay per session ({pkr(price)})</option>{myPasses.map(p => <option key={p.id} value={p.id}>{p.name} ({p.left})</option>)}</select></label>}
          {sessions.length === 0 ? <p className="text-sm text-muted">No upcoming sessions.</p> : <ul className="divide-y divide-line">{sessions.map(s => (
            <li key={s.id} className="flex items-center gap-3 py-3"><div className="min-w-0 flex-1"><p className="text-sm font-medium text-fg">{fmtDate(s.starts_at, { weekday: 'long', day: 'numeric', month: 'short' })}</p><p className="text-xs text-muted">{fmtTime(s.starts_at)}</p></div>
              {s.seats_left !== null && s.seats_left <= 5 && <Badge tone={s.seats_left === 0 ? 'danger' : 'warning'}>{s.seats_left === 0 ? 'Full' : `${s.seats_left} left`}</Badge>}
              <Button size="sm" loading={busy === s.id} disabled={s.seats_left === 0 || (signedIn && !isAttendee)} onClick={() => book(s)}>Book</Button></li>))}</ul>}
        </CardBody></Card>

      {passes.length > 0 && <Card><CardHeader title="Passes" description="Save when you come often" /><CardBody><ul className="grid gap-3 sm:grid-cols-2">{passes.map(p => (
        <li key={p.id} className="rounded-xl bg-raised p-4 shadow-[inset_0_0_0_1px_rgb(var(--k-line))]"><p className="text-sm font-semibold text-fg">{p.name}</p><p className="mt-1 text-xs text-muted">{p.kind === 'pack' ? `${p.sessions_count} sessions` : 'Unlimited sessions'} · valid {p.validity_days} days</p><p className="mt-3 tnum text-lg font-semibold text-fg">{p.price_pkr ? pkr(p.price_pkr) : 'Free'}</p><Button size="sm" variant="secondary" className="mt-3 w-full" loading={busy === p.id} disabled={signedIn && !isAttendee} onClick={() => buy(p)}>Buy pass</Button></li>))}</ul></CardBody></Card>}
    </div>
  )
}
