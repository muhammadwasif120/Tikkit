'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Plus, Trash2, X } from 'lucide-react'
import { Badge, Button, Card, CardBody, CardHeader, EmptyState, Field, Input, Modal, Select, Textarea, type BadgeTone } from '@/components/kit'
import { createClient } from '@/lib/supabase/client'
import { fmtDate, fmtTime, pkr } from '@/lib/format'
import { PAKISTAN_CITIES } from '@/lib/pakistanCities'
import { cn } from '@/lib/cn'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const KINDS = ['room', 'court', 'studio', 'desk', 'table', 'other']
const readable = (m: string) => (m.match(/^[A-Z_]+(?::[a-z_]+)?: ([\s\S]*)$/)?.[1]) ?? m

export type Space = { id: string; slug: string | null; name: string; kind: string; description: string | null; city: string | null; area_label: string | null; address: string | null; capacity: number | null; price_pkr_per_slot: number; slot_minutes: number; buffer_minutes: number; min_notice_hours: number; max_advance_days: number; requires_approval: boolean; status: string }
export type Hour = { id: string; weekday: number; opens: string; closes: string }
export type Blackout = { id: string; starts_at: string; ends_at: string; reason: string | null }
export type SBooking = { id: string; name: string; starts_at: string; ends_at: string; party_size: number; status: string; price: number; notes: string | null }
const bTone: Record<string, BadgeTone> = { requested: 'info', awaiting_payment: 'warning', payment_submitted: 'warning', confirmed: 'success', checked_in: 'accent', rejected: 'danger', cancelled: 'neutral', no_show: 'danger' }

export function NewSpace({ locked }: { locked: boolean }) {
  const router = useRouter(); const [open, setOpen] = useState(false)
  return (<><Button leading={<Plus className="h-4 w-4" />} onClick={() => setOpen(true)} disabled={locked}>New space</Button><SpaceForm open={open} onClose={() => setOpen(false)} onDone={id => router.push(`/dashboard/spaces/${id}`)} /></>)
}

export function SpaceForm({ open, onClose, initial, onDone }: { open: boolean; onClose: () => void; initial?: Space; onDone: (id: string) => void }) {
  const supabase = useMemo(() => createClient(), []); const s = initial
  const blank = () => ({ name: s?.name ?? '', kind: s?.kind ?? 'room', desc: s?.description ?? '', city: s?.city ?? '', area: s?.area_label ?? '', address: s?.address ?? '', cap: s?.capacity ? String(s.capacity) : '', price: String(s?.price_pkr_per_slot ?? 0), slot: String(s?.slot_minutes ?? 60), buffer: String(s?.buffer_minutes ?? 0), notice: String(s?.min_notice_hours ?? 2), adv: String(s?.max_advance_days ?? 60), approval: s?.requires_approval ?? false, publish: s?.status === 'published' })
  const [f, setF] = useState(blank); const [seen, setSeen] = useState(''); const [err, setErr] = useState<string | null>(null); const [busy, setBusy] = useState(false)
  const key = `${open}-${s?.id}`; if (seen !== key) { setSeen(key); setF(blank()) }
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(null); if (!f.name.trim()) return setErr('Give the space a name.'); setBusy(true)
    const { data: { user } } = await supabase.auth.getUser()
    const body = { name: f.name.trim(), kind: f.kind as 'room' | 'court' | 'studio' | 'desk' | 'table' | 'other', description: f.desc.trim() || null, city: f.city || null, area_label: f.area.trim() || null, address: f.address.trim() || null, capacity: f.cap ? Number(f.cap) : null, price_pkr_per_slot: Number(f.price || 0), slot_minutes: Number(f.slot) || 60, buffer_minutes: Number(f.buffer || 0), min_notice_hours: Number(f.notice || 0), max_advance_days: Number(f.adv) || 60, requires_approval: f.approval, status: (f.publish ? 'published' : (s?.status === 'published' ? 'paused' : 'draft')) as 'published' | 'paused' | 'draft' }
    const t = supabase.from('spaces')
    const res = s ? await t.update(body).eq('id', s.id).select('id').single() : await t.insert({ ...body, organizer_id: user!.id }).select('id').single()
    setBusy(false); if (res.error) return setErr(readable(res.error.message)); onDone((res.data as { id: string }).id)
  }
  return (
    <Modal open={open} onClose={onClose} title={s ? 'Edit space' : 'New space'} description="Rooms, courts, studios and tables guests can reserve." className="w-[min(94vw,620px)]">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-[2fr_1fr]"><Field label="Name">{p => <Input {...p} value={f.name} onChange={e => setF({ ...f, name: e.target.value })} />}</Field><Field label="Type">{p => <Select {...p} value={f.kind} onChange={e => setF({ ...f, kind: e.target.value })}>{KINDS.map(k => <option key={k} value={k}>{k}</option>)}</Select>}</Field></div>
        <div className="grid gap-4 sm:grid-cols-3"><Field label="City">{p => <Select {...p} value={f.city} onChange={e => setF({ ...f, city: e.target.value })}><option value="">Choose</option>{PAKISTAN_CITIES.map(c => <option key={c}>{c}</option>)}</Select>}</Field><Field label="Area" optional>{p => <Input {...p} value={f.area} onChange={e => setF({ ...f, area: e.target.value })} />}</Field><Field label="Address" optional>{p => <Input {...p} value={f.address} onChange={e => setF({ ...f, address: e.target.value })} />}</Field></div>
        <div className="grid gap-4 sm:grid-cols-4"><Field label="Price per slot">{p => <Input {...p} inputMode="numeric" value={f.price} onChange={e => setF({ ...f, price: e.target.value.replace(/\D/g, '') })} />}</Field><Field label="Slot minutes">{p => <Input {...p} inputMode="numeric" value={f.slot} onChange={e => setF({ ...f, slot: e.target.value.replace(/\D/g, '') })} />}</Field><Field label="Gap after">{p => <Input {...p} inputMode="numeric" value={f.buffer} onChange={e => setF({ ...f, buffer: e.target.value.replace(/\D/g, '') })} />}</Field><Field label="Fits" optional>{p => <Input {...p} inputMode="numeric" value={f.cap} onChange={e => setF({ ...f, cap: e.target.value.replace(/\D/g, '') })} />}</Field></div>
        <div className="grid gap-4 sm:grid-cols-2"><Field label="Notice needed (hours)">{p => <Input {...p} inputMode="numeric" value={f.notice} onChange={e => setF({ ...f, notice: e.target.value.replace(/\D/g, '') })} />}</Field><Field label="Book up to (days ahead)">{p => <Input {...p} inputMode="numeric" value={f.adv} onChange={e => setF({ ...f, adv: e.target.value.replace(/\D/g, '') })} />}</Field></div>
        <Field label="Description" optional>{p => <Textarea {...p} rows={3} value={f.desc} onChange={e => setF({ ...f, desc: e.target.value })} />}</Field>
        <div className="space-y-2 text-sm text-muted"><label className="flex cursor-pointer items-center gap-2"><input type="checkbox" checked={f.approval} onChange={e => setF({ ...f, approval: e.target.checked })} className="h-4 w-4 accent-[rgb(var(--k-accent))]" /> I approve each reservation</label><label className="flex cursor-pointer items-center gap-2"><input type="checkbox" checked={f.publish} onChange={e => setF({ ...f, publish: e.target.checked })} className="h-4 w-4 accent-[rgb(var(--k-accent))]" /> Publish now (add opening hours first)</label></div>
        {err && <p role="alert" className="text-sm text-danger">{err}</p>}
        <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={onClose}>Cancel</Button><Button type="submit" loading={busy}>{s ? 'Save' : 'Create space'}</Button></div>
      </form>
    </Modal>
  )
}

export function SpaceManage({ space, hours, blackouts, bookings, origin }: { space: Space; hours: Hour[]; blackouts: Blackout[]; bookings: SBooking[]; origin: string }) {
  const router = useRouter(); const supabase = useMemo(() => createClient(), [])
  const [tab, setTab] = useState<'bookings' | 'hours' | 'blackouts'>('bookings'); const [edit, setEdit] = useState(false); const [err, setErr] = useState<string | null>(null); const [pending, start] = useTransition()
  const [h, setH] = useState({ days: [1, 2, 3, 4, 5] as number[], opens: '09:00', closes: '18:00' }); const [bo, setBo] = useState({ from: '', to: '', reason: '' })
  const refresh = () => router.refresh()
  const run = (fn: () => PromiseLike<{ error: { message: string } | null }>) => { setErr(null); start(async () => { const { error } = await fn(); if (error) return setErr(readable(error.message)); refresh() }) }
  const review = (b: SBooking, ok: boolean) => run(() => supabase.rpc('review_space_booking', { p_booking: b.id, p_approve: ok, p_reason: ok ? undefined : prompt('Reason (optional)') || undefined }))
  async function addHours(e: React.FormEvent) { e.preventDefault(); setErr(null); if (!h.days.length || h.closes <= h.opens) return setErr('Choose days and a closing time after opening.')
    const { error } = await supabase.from('space_hours').insert(h.days.map(d => ({ space_id: space.id, weekday: d, opens: h.opens, closes: h.closes }))); if (error) return setErr(error.message.includes('duplicate') ? 'Some of those hours already exist.' : readable(error.message)); refresh() }
  async function addBlackout(e: React.FormEvent) { e.preventDefault(); setErr(null); if (!bo.from || !bo.to) return setErr('Choose a start and end.')
    const { error } = await supabase.from('space_blackouts').insert({ space_id: space.id, starts_at: new Date(bo.from + '+05:00').toISOString(), ends_at: new Date(bo.to + '+05:00').toISOString(), reason: bo.reason.trim() || null }); if (error) return setErr(readable(error.message)); setBo({ from: '', to: '', reason: '' }); refresh() }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center gap-2"><Badge tone={space.status === 'published' ? 'success' : 'neutral'}>{space.status}</Badge><span className="text-sm text-muted">{space.price_pkr_per_slot ? `${pkr(space.price_pkr_per_slot)} per ${space.slot_minutes} min` : `Free · ${space.slot_minutes} min slots`}{space.requires_approval ? ' · approval needed' : ''}</span>
        {space.slug && space.status === 'published' && <a className="text-sm text-accent hover:underline" href={`${origin}/spaces/${space.slug}`} target="_blank" rel="noopener noreferrer">Public page</a>}<Button size="sm" variant="secondary" className="ml-auto" onClick={() => setEdit(true)}>Edit space</Button></div>
      <div role="tablist" className="mb-6 flex gap-1 border-b border-line">{([['bookings', `Reservations ${bookings.length}`], ['hours', 'Opening hours'], ['blackouts', 'Closed dates']] as const).map(([id, l]) => <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={cn('-mb-px border-b-2 px-4 py-2.5 text-sm font-medium', tab === id ? 'border-accent text-fg' : 'border-transparent text-muted')}>{l}</button>)}</div>
      {err && <p role="alert" className="mb-4 rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">{err}</p>}

      {tab === 'bookings' && (bookings.length === 0 ? <Card><EmptyState icon={<Plus className="h-6 w-6" />} title="No reservations yet" description={hours.length === 0 ? 'Add opening hours so guests can book.' : 'Reservations show up here.'} /></Card> : (
        <ul className="space-y-3">{bookings.map(b => (
          <Card key={b.id}><div className="flex flex-wrap items-center gap-3 p-4">
            <div className="min-w-0 flex-1"><p className="text-sm font-medium text-fg">{b.name} <span className="font-normal text-muted">· {b.party_size} {b.party_size === 1 ? 'person' : 'people'}</span></p><p className="text-xs text-muted">{fmtDate(b.starts_at, { weekday: 'short', day: 'numeric', month: 'short' })} · {fmtTime(b.starts_at)} to {fmtTime(b.ends_at)} · {b.price ? pkr(b.price) : 'Free'}{b.notes ? ` · ${b.notes}` : ''}</p></div>
            <Badge tone={bTone[b.status] ?? 'neutral'}>{b.status.replace('_', ' ')}</Badge>
            {b.status === 'requested' && <><Button size="sm" leading={<Check className="h-4 w-4" />} loading={pending} onClick={() => review(b, true)}>Approve</Button><Button size="icon-sm" variant="ghost" aria-label="Decline" onClick={() => review(b, false)}><X className="h-4 w-4" /></Button></>}
            {['awaiting_payment', 'confirmed'].includes(b.status) && <Button size="sm" variant="ghost" onClick={() => confirm('Cancel this reservation?') && run(() => supabase.rpc('cancel_space_booking', { p_booking: b.id }))}>Cancel</Button>}
          </div></Card>))}</ul>
      ))}

      {tab === 'hours' && (
        <div className="grid items-start gap-6 lg:grid-cols-[1fr_360px]">
          <Card><CardHeader title="Weekly hours" description="Pakistan time. Slots are created inside these hours." />
            <CardBody>{hours.length === 0 ? <p className="text-sm text-muted">Not open yet.</p> : <ul className="divide-y divide-line">{[...hours].sort((a, b) => a.weekday - b.weekday || a.opens.localeCompare(b.opens)).map(x => <li key={x.id} className="flex items-center gap-3 py-2.5 text-sm"><span className="w-12 font-medium text-fg">{DAYS[x.weekday]}</span><span className="flex-1 text-muted">{x.opens.slice(0, 5)} to {x.closes.slice(0, 5)}</span><Button size="icon-sm" variant="ghost" aria-label="Remove" onClick={() => run(() => supabase.from('space_hours').delete().eq('id', x.id))}><Trash2 className="h-4 w-4" /></Button></li>)}</ul>}</CardBody></Card>
          <Card><CardHeader title="Add hours" /><CardBody><form onSubmit={addHours} className="space-y-4"><div className="flex flex-wrap gap-2">{DAYS.map((d, i) => { const on = h.days.includes(i); return <button type="button" key={d} aria-pressed={on} onClick={() => setH({ ...h, days: on ? h.days.filter(x => x !== i) : [...h.days, i] })} className={cn('h-9 w-12 rounded-lg text-sm font-medium ring-1', on ? 'bg-accent/12 text-accent ring-accent/40' : 'text-muted ring-line')}>{d}</button> })}</div><div className="grid grid-cols-2 gap-3"><Field label="Opens">{p => <Input {...p} type="time" value={h.opens} onChange={e => setH({ ...h, opens: e.target.value })} />}</Field><Field label="Closes">{p => <Input {...p} type="time" value={h.closes} onChange={e => setH({ ...h, closes: e.target.value })} />}</Field></div><Button type="submit" className="w-full">Add hours</Button></form></CardBody></Card>
        </div>
      )}

      {tab === 'blackouts' && (
        <div className="grid items-start gap-6 lg:grid-cols-[1fr_360px]">
          <Card><CardHeader title="Closed dates" description="Holidays, maintenance, private hire" /><CardBody>{blackouts.length === 0 ? <p className="text-sm text-muted">None.</p> : <ul className="divide-y divide-line">{blackouts.map(b => <li key={b.id} className="flex items-center gap-3 py-2.5 text-sm"><span className="flex-1 text-fg">{fmtDate(b.starts_at)} {fmtTime(b.starts_at)} to {fmtDate(b.ends_at)} {fmtTime(b.ends_at)}<span className="block text-xs text-muted">{b.reason}</span></span><Button size="icon-sm" variant="ghost" aria-label="Remove" onClick={() => run(() => supabase.from('space_blackouts').delete().eq('id', b.id))}><Trash2 className="h-4 w-4" /></Button></li>)}</ul>}</CardBody></Card>
          <Card><CardHeader title="Close the space" /><CardBody><form onSubmit={addBlackout} className="space-y-4"><Field label="From">{p => <Input {...p} type="datetime-local" value={bo.from} onChange={e => setBo({ ...bo, from: e.target.value })} />}</Field><Field label="Until">{p => <Input {...p} type="datetime-local" value={bo.to} onChange={e => setBo({ ...bo, to: e.target.value })} />}</Field><Field label="Reason" optional>{p => <Input {...p} value={bo.reason} onChange={e => setBo({ ...bo, reason: e.target.value })} />}</Field><Button type="submit" className="w-full">Close these dates</Button></form></CardBody></Card>
        </div>
      )}
      <SpaceForm open={edit} onClose={() => setEdit(false)} initial={space} onDone={() => { setEdit(false); refresh() }} />
    </>
  )
}
