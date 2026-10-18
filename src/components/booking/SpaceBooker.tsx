'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button, Card, CardBody, CardHeader, Field, Input } from '@/components/kit'
import PayProof from './PayProof'
import { createClient } from '@/lib/supabase/client'
import { fmtTime, pkr } from '@/lib/format'
import { cn } from '@/lib/cn'

type Slot = { slot_start: string; slot_end: string; is_available: boolean }
const readable = (m: string) => (m.match(/^[A-Z_]+(?::[a-z_]+)?: ([\s\S]*)$/)?.[1]) ?? m
const todayPk = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' })

export default function SpaceBooker({ spaceId, organizerId, slug, price, capacity, approval, maxDays, signedIn, isAttendee }: { spaceId: string; organizerId: string; slug: string; price: number; capacity: number | null; approval: boolean; maxDays: number; signedIn: boolean; isAttendee: boolean }) {
  const supabase = useMemo(() => createClient(), [])
  const [date, setDate] = useState(todayPk()); const [slots, setSlots] = useState<Slot[] | null>(null); const [pick, setPick] = useState<string>('')
  const [party, setParty] = useState('1'); const [notes, setNotes] = useState(''); const [busy, setBusy] = useState(false); const [err, setErr] = useState<string | null>(null)
  const [pay, setPay] = useState<string | null>(null); const [msg, setMsg] = useState<string | null>(null)
  const max = new Date(Date.now() + maxDays * 86_400_000).toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' })

  const load = useCallback(async () => { setSlots(null); setPick(''); const { data } = await supabase.rpc('space_open_slots', { p_space: spaceId, p_date: date }); setSlots((data ?? []) as Slot[]) }, [supabase, spaceId, date])
  useEffect(() => { load() }, [load])

  async function book() {
    if (!signedIn) return void (location.href = `/auth/login?next=${encodeURIComponent(`/spaces/${slug}`)}`)
    setErr(null); setBusy(true)
    const { data, error } = await supabase.rpc('book_space', { p_space: spaceId, p_starts_at: pick, p_party_size: Number(party) || 1, p_notes: notes.trim() || undefined })
    setBusy(false); if (error) { load(); return setErr(readable(error.message)) }
    if (approval) setMsg('Request sent. The host will confirm it, and you pay after approval.')
    else if (price > 0) setPay(data as string)
    else setMsg('Reserved.')
    load()
  }

  return (
    <div className="space-y-6">
      {msg && <p role="status" className="rounded-xl bg-success/10 px-4 py-3 text-sm text-success">{msg} <Link href="/guest/tickets" className="underline">See my tickets</Link></p>}
      {pay && <PayProof kind="space_booking" subjectId={pay} organizerId={organizerId} amount={price} onDone={() => { setPay(null); setMsg('Payment sent. The host will confirm it.') }} />}
      <Card><CardHeader title="Pick a time" description={price ? `${pkr(price)} per slot` : 'Free'} />
        <CardBody className="space-y-5">
          <Field label="Date">{p => <Input {...p} type="date" min={todayPk()} max={max} value={date} onChange={e => setDate(e.target.value)} />}</Field>
          {slots === null ? <div className="h-24 animate-pulse rounded-xl bg-raised" /> : slots.length === 0 ? <p className="text-sm text-muted">Closed on this day.</p> : (
            <div role="radiogroup" aria-label="Time slots" className="grid grid-cols-3 gap-2 sm:grid-cols-4">{slots.map(s => (
              <button key={s.slot_start} role="radio" aria-checked={pick === s.slot_start} disabled={!s.is_available} onClick={() => setPick(s.slot_start)} className={cn('rounded-xl px-2 py-2.5 text-sm font-medium ring-1 transition-colors', !s.is_available ? 'cursor-not-allowed text-subtle line-through ring-line opacity-50' : pick === s.slot_start ? 'bg-accent/12 text-accent ring-accent/50' : 'text-fg ring-line hover:bg-raised')}>{fmtTime(s.slot_start)}</button>))}</div>
          )}
          <div className="grid gap-4 sm:grid-cols-2"><Field label="People" hint={capacity ? `Up to ${capacity}` : undefined}>{p => <Input {...p} inputMode="numeric" value={party} onChange={e => setParty(e.target.value.replace(/\D/g, ''))} />}</Field><Field label="Note" optional>{p => <Input {...p} value={notes} onChange={e => setNotes(e.target.value)} maxLength={200} />}</Field></div>
          {err && <p role="alert" className="text-sm text-danger">{err}</p>}
          <Button size="lg" className="w-full" disabled={!pick || (signedIn && !isAttendee)} loading={busy} onClick={book}>{approval ? 'Request this slot' : price ? `Reserve · ${pkr(price)}` : 'Reserve'}</Button>
          {signedIn && !isAttendee && <p className="text-xs text-muted">Use an attendee account to reserve.</p>}
        </CardBody></Card>
    </div>
  )
}
