'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2 } from 'lucide-react'
import { Badge, Button, Card, CardBody, CardHeader, EmptyState, Field, Input, Modal, Select, Textarea } from '@/components/kit'
import { createClient } from '@/lib/supabase/client'
import { fromLoose, rpcLoose } from '@/lib/rpc'
import { fmtDate, fmtTime, pkr } from '@/lib/format'
import { PAKISTAN_CITIES } from '@/lib/pakistanCities'
import { cn } from '@/lib/cn'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const readable = (m: string) => (m.match(/^[A-Z_]+(?::[a-z_]+)?: ([\s\S]*)$/)?.[1]) ?? m

export type Series = { id: string; title: string; instructor_name: string | null; weekdays: number[]; start_time: string; duration_minutes: number; capacity: number | null; drop_in_price_pkr: number; status: string; starts_on: string; ends_on: string | null; city: string | null; venue_name: string | null; description: string | null; slug: string | null }
export type Session = { id: string; starts_at: string; ends_at: string; status: string; capacity: number | null; booked: number; notes: string | null }
export type Product = { id: string; name: string; kind: 'pack' | 'monthly'; sessions_count: number | null; validity_days: number; price_pkr: number; is_active: boolean }
export type Booking = { id: string; session_id: string; name: string; status: string; via_pass: boolean }

export function NewSeries({ locked }: { locked: boolean }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  return (<><Button leading={<Plus className="h-4 w-4" />} onClick={() => setOpen(true)} disabled={locked}>New class</Button><SeriesForm open={open} onClose={() => setOpen(false)} onDone={id => router.push(`/dashboard/classes/${id}`)} /></>)
}

export function SeriesForm({ open, onClose, initial, onDone }: { open: boolean; onClose: () => void; initial?: Series; onDone: (id: string) => void }) {
  const supabase = useMemo(() => createClient(), [])
  const s = initial
  const blank = () => ({ title: s?.title ?? '', instructor: s?.instructor_name ?? '', days: s?.weekdays ?? [1], time: s?.start_time?.slice(0, 5) ?? '18:00', mins: String(s?.duration_minutes ?? 60), starts: s?.starts_on ?? new Date().toISOString().slice(0, 10), ends: s?.ends_on ?? '', cap: s?.capacity ? String(s.capacity) : '', price: String(s?.drop_in_price_pkr ?? 0), city: s?.city ?? '', venue: s?.venue_name ?? '', desc: s?.description ?? '', publish: s?.status === 'published' })
  const [f, setF] = useState(blank); const [seen, setSeen] = useState(''); const [err, setErr] = useState<string | null>(null); const [busy, setBusy] = useState(false)
  const key = `${open}-${s?.id}`; if (seen !== key) { setSeen(key); setF(blank()) }

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(null)
    if (!f.title.trim()) return setErr('Give the class a name.'); if (f.days.length === 0) return setErr('Choose at least one day.')
    setBusy(true)
    const { data: { user } } = await supabase.auth.getUser()
    const body = { title: f.title.trim(), instructor_name: f.instructor.trim() || null, weekdays: f.days, start_time: f.time, duration_minutes: Number(f.mins) || 60, starts_on: f.starts, ends_on: f.ends || null, capacity: f.cap ? Number(f.cap) : null, drop_in_price_pkr: Number(f.price || 0), city: f.city || null, venue_name: f.venue.trim() || null, description: f.desc.trim() || null, status: f.publish ? 'published' : (s?.status === 'published' ? 'paused' : 'draft') }
    const t = fromLoose(supabase as never, 'class_series')
    const res = s ? await t.update(body).eq('id', s.id).select('id').single() : await t.insert({ ...body, organizer_id: user!.id }).select('id').single()
    setBusy(false)
    if (res.error) return setErr(readable(res.error.message))
    onDone((res.data as { id: string }).id)
  }
  return (
    <Modal open={open} onClose={onClose} title={s ? 'Edit class' : 'New class'} description="A class repeats on the days you choose. Sessions are created automatically." className="w-[min(94vw,620px)]">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2"><Field label="Name">{p => <Input {...p} value={f.title} onChange={e => setF({ ...f, title: e.target.value })} placeholder="Morning yoga" />}</Field><Field label="Instructor" optional>{p => <Input {...p} value={f.instructor} onChange={e => setF({ ...f, instructor: e.target.value })} />}</Field></div>
        <Field label="Repeats on">{() => <div className="flex flex-wrap gap-2">{DAYS.map((d, i) => { const on = f.days.includes(i); return <button type="button" key={d} aria-pressed={on} onClick={() => setF({ ...f, days: on ? f.days.filter(x => x !== i) : [...f.days, i].sort() })} className={cn('h-9 w-12 rounded-lg text-sm font-medium ring-1', on ? 'bg-accent/12 text-accent ring-accent/40' : 'text-muted ring-line')}>{d}</button> })}</div>}</Field>
        <div className="grid gap-4 sm:grid-cols-4"><Field label="Starts at">{p => <Input {...p} type="time" value={f.time} onChange={e => setF({ ...f, time: e.target.value })} />}</Field><Field label="Minutes">{p => <Input {...p} inputMode="numeric" value={f.mins} onChange={e => setF({ ...f, mins: e.target.value.replace(/\D/g, '') })} />}</Field><Field label="From">{p => <Input {...p} type="date" value={f.starts} onChange={e => setF({ ...f, starts: e.target.value })} />}</Field><Field label="Until" optional>{p => <Input {...p} type="date" value={f.ends} onChange={e => setF({ ...f, ends: e.target.value })} />}</Field></div>
        <div className="grid gap-4 sm:grid-cols-3"><Field label="Places" optional>{p => <Input {...p} inputMode="numeric" value={f.cap} onChange={e => setF({ ...f, cap: e.target.value.replace(/\D/g, '') })} />}</Field><Field label="Drop in price (PKR)">{p => <Input {...p} inputMode="numeric" value={f.price} onChange={e => setF({ ...f, price: e.target.value.replace(/\D/g, '') })} />}</Field><Field label="City">{p => <Select {...p} value={f.city} onChange={e => setF({ ...f, city: e.target.value })}><option value="">Choose</option>{PAKISTAN_CITIES.map(c => <option key={c}>{c}</option>)}</Select>}</Field></div>
        <Field label="Venue" optional>{p => <Input {...p} value={f.venue} onChange={e => setF({ ...f, venue: e.target.value })} />}</Field>
        <Field label="Description" optional>{p => <Textarea {...p} rows={3} value={f.desc} onChange={e => setF({ ...f, desc: e.target.value })} />}</Field>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-muted"><input type="checkbox" checked={f.publish} onChange={e => setF({ ...f, publish: e.target.checked })} className="h-4 w-4 accent-[rgb(var(--k-accent))]" /> Publish now (needs a verified ID and fits your plan)</label>
        {err && <p role="alert" className="text-sm text-danger">{err}</p>}
        <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={onClose}>Cancel</Button><Button type="submit" loading={busy}>{s ? 'Save' : 'Create class'}</Button></div>
      </form>
    </Modal>
  )
}

export function SeriesManage({ series, sessions, products, bookings, origin }: { series: Series; sessions: Session[]; products: Product[]; bookings: Booking[]; origin: string }) {
  const router = useRouter(); const supabase = useMemo(() => createClient(), [])
  const [tab, setTab] = useState<'sessions' | 'passes' | 'details'>('sessions'); const [pending, start] = useTransition(); const [err, setErr] = useState<string | null>(null)
  const [edit, setEdit] = useState(false); const [openS, setOpenS] = useState<string | null>(null); const [pm, setPm] = useState(false)
  const [pf, setPf] = useState({ name: '', kind: 'pack', count: '5', days: '90', price: '' })
  const refresh = () => router.refresh()

  const cancel = (s: Session) => { const reason = prompt('Why is it cancelled? Booked guests are told.'); if (reason === null) return; setErr(null); start(async () => { const { error } = await rpcLoose(supabase as never, 'cancel_class_session', { p_session: s.id, p_reason: reason || null }); if (error) return setErr(readable(error.message)); refresh() }) }
  async function addProduct(e: React.FormEvent) { e.preventDefault(); setErr(null); if (!pf.name.trim() || !pf.price) return setErr('Add a name and a price.')
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await fromLoose(supabase as never, 'pass_products').insert({ organizer_id: user!.id, series_id: series.id, name: pf.name.trim(), kind: pf.kind, sessions_count: pf.kind === 'pack' ? Number(pf.count) : null, validity_days: Number(pf.days) || 90, price_pkr: Number(pf.price) })
    if (error) return setErr(readable(error.message)); setPm(false); setPf({ name: '', kind: 'pack', count: '5', days: '90', price: '' }); refresh() }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center gap-2"><Badge tone={series.status === 'published' ? 'success' : 'neutral'}>{series.status}</Badge><span className="text-sm text-muted">{series.weekdays.map(d => DAYS[d]).join(', ')} at {series.start_time.slice(0, 5)} · {series.duration_minutes} min · {series.drop_in_price_pkr ? pkr(series.drop_in_price_pkr) : 'Free'}</span>
        {series.slug && series.status === 'published' && <a className="text-sm text-accent hover:underline" href={`${origin}/classes/${series.slug}`} target="_blank" rel="noopener noreferrer">Public page</a>}<Button size="sm" variant="secondary" className="ml-auto" onClick={() => setEdit(true)}>Edit class</Button></div>
      <div role="tablist" className="mb-6 flex gap-1 border-b border-line">{([['sessions', 'Sessions'], ['passes', 'Passes']] as const).map(([id, l]) => <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={cn('-mb-px border-b-2 px-4 py-2.5 text-sm font-medium', tab === id ? 'border-accent text-fg' : 'border-transparent text-muted')}>{l}</button>)}</div>
      {err && <p role="alert" className="mb-4 rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">{err}</p>}

      {tab === 'sessions' && (sessions.length === 0 ? <Card><EmptyState icon={<Plus className="h-6 w-6" />} title="No sessions yet" description={series.status === 'published' ? 'Sessions are created for the next 12 weeks.' : 'Publish the class to create sessions.'} /></Card> : (
        <ul className="space-y-3">{sessions.map(s => {
          const list = bookings.filter(b => b.session_id === s.id && !['cancelled', 'rejected'].includes(b.status)); const cap = s.capacity ?? series.capacity
          return (
            <Card key={s.id}><div className="flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-0 flex-1"><p className="text-sm font-medium text-fg">{fmtDate(s.starts_at, { weekday: 'long', day: 'numeric', month: 'short' })} · {fmtTime(s.starts_at)}</p><p className="text-xs text-muted">{list.length}{cap ? ` / ${cap}` : ''} booked</p></div>
              <Badge tone={s.status === 'cancelled' ? 'danger' : s.status === 'completed' ? 'info' : 'success'}>{s.status}</Badge>
              <Button size="sm" variant="ghost" onClick={() => setOpenS(openS === s.id ? null : s.id)}>{openS === s.id ? 'Hide' : 'Roster'}</Button>
              {s.status === 'scheduled' && <Button size="sm" variant="ghost" loading={pending} onClick={() => cancel(s)}>Cancel</Button>}
            </div>{openS === s.id && <ul className="border-t border-line px-4 py-2">{list.length === 0 ? <li className="py-2 text-sm text-muted">No bookings yet.</li> : list.map(b => <li key={b.id} className="flex items-center gap-2 py-1.5 text-sm"><span className="flex-1 text-fg">{b.name}</span>{b.via_pass && <Badge tone="violet">Pass</Badge>}<Badge tone={b.status === 'confirmed' || b.status === 'checked_in' ? 'success' : 'warning'}>{b.status.replace('_', ' ')}</Badge></li>)}</ul>}</Card>
          )
        })}</ul>
      ))}

      {tab === 'passes' && (
        <Card><CardHeader title="Passes" description="Packs and monthly passes guests can buy for this class" action={<Button size="sm" leading={<Plus className="h-4 w-4" />} onClick={() => setPm(true)}>New pass</Button>} />
          <CardBody>{products.length === 0 ? <p className="text-sm text-muted">No passes yet. Drop in booking still works.</p> : <ul className="divide-y divide-line">{products.map(p => <li key={p.id} className="flex items-center gap-3 py-3"><div className="min-w-0 flex-1"><p className="text-sm font-medium text-fg">{p.name}</p><p className="text-xs text-muted">{p.kind === 'pack' ? `${p.sessions_count} sessions` : 'Unlimited'} · valid {p.validity_days} days</p></div><span className="tnum text-sm text-fg">{pkr(p.price_pkr)}</span><Button size="sm" variant="ghost" onClick={() => start(async () => { await fromLoose(supabase as never, 'pass_products').update({ is_active: !p.is_active }).eq('id', p.id); refresh() })}>{p.is_active ? 'Pause' : 'Resume'}</Button><Button size="icon-sm" variant="ghost" aria-label="Delete pass" onClick={() => confirm('Delete this pass?') && start(async () => { const { error } = await fromLoose(supabase as never, 'pass_products').delete().eq('id', p.id); if (error) setErr('This pass has been bought. Pause it instead.'); refresh() })}><Trash2 className="h-4 w-4" /></Button></li>)}</ul>}</CardBody></Card>
      )}

      <SeriesForm open={edit} onClose={() => setEdit(false)} initial={series} onDone={() => { setEdit(false); refresh() }} />
      <Modal open={pm} onClose={() => setPm(false)} title="New pass">
        <form onSubmit={addProduct} className="space-y-4">
          <Field label="Name">{p => <Input {...p} value={pf.name} onChange={e => setPf({ ...pf, name: e.target.value })} placeholder="10 class pack" />}</Field>
          <div className="grid gap-4 sm:grid-cols-2"><Field label="Type">{p => <Select {...p} value={pf.kind} onChange={e => setPf({ ...pf, kind: e.target.value })}><option value="pack">Pack of sessions</option><option value="monthly">Monthly unlimited</option></Select>}</Field>{pf.kind === 'pack' && <Field label="Sessions">{p => <Input {...p} inputMode="numeric" value={pf.count} onChange={e => setPf({ ...pf, count: e.target.value.replace(/\D/g, '') })} />}</Field>}</div>
          <div className="grid gap-4 sm:grid-cols-2"><Field label="Valid for (days)">{p => <Input {...p} inputMode="numeric" value={pf.days} onChange={e => setPf({ ...pf, days: e.target.value.replace(/\D/g, '') })} />}</Field><Field label="Price (PKR)">{p => <Input {...p} inputMode="numeric" value={pf.price} onChange={e => setPf({ ...pf, price: e.target.value.replace(/\D/g, '') })} />}</Field></div>
          {err && <p role="alert" className="text-sm text-danger">{err}</p>}<div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setPm(false)}>Cancel</Button><Button type="submit">Create pass</Button></div>
        </form>
      </Modal>
    </>
  )
}
