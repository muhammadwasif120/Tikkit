'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Copy, Eye, EyeOff, Link2, Plus, QrCode, Trash2, Users } from 'lucide-react'
import { Avatar, Badge, Button, Card, CardBody, CardHeader, EmptyState, Field, Input, Modal, Progress, Select, Table, TableWrap, Td, Textarea, Th, Tr, type BadgeTone } from '@/components/kit'
import { createClient } from '@/lib/supabase/client'
import { fromLoose, rpcLoose } from '@/lib/rpc'
import { KIND, KINDS, type ItemKind, type ItemStatus } from '@/lib/retreats'
import { fmtDate, fmtTime, pkr } from '@/lib/format'
import { cn } from '@/lib/cn'

export type BItem = { id: string; day_id: string; kind: ItemKind; title: string; description: string | null; starts_at: string | null; ends_at: string | null; location_name: string | null; location_address: string | null; latitude: number | null; longitude: number | null; cost_pkr: number; status: ItemStatus; assignee: string | null; is_internal: boolean; requires_checkin: boolean; notes: string | null }
export type BDay = { id: string; day_number: number; day_date: string; title: string | null; summary: string | null }
export type BPerson = { id: string; full_name: string; email: string | null; phone: string | null; department: string | null; dietary: string | null; room_label: string | null; status: string; qr_token: string }
export type BLine = { id: string; category: string; label: string; estimated_pkr: number; actual_pkr: number | null; is_paid: boolean }
export type BTask = { id: string; title: string; due_date: string | null; assignee_name: string | null; is_done: boolean }
export type BUpdate = { id: string; body: string; created_at: string }
export type BRetreat = { id: string; title: string; client_company: string | null; destination: string | null; starts_on: string; ends_on: string; status: string; budget_pkr: number | null; share_token: string | null; headcount_target: number | null; accent_color: string | null }

const readable = (m: string) => (m.match(/^[A-Z_]+(?::[a-z_]+)?: ([\s\S]*)$/)?.[1]) ?? m
const TABS = [['itinerary', 'Itinerary'], ['people', 'People'], ['budget', 'Budget'], ['tasks', 'Checklist'], ['updates', 'Updates'], ['share', 'Share']] as const
type Tab = typeof TABS[number][0]
const stTone: Record<string, BadgeTone> = { planned: 'neutral', confirmed: 'info', in_progress: 'warning', done: 'success', skipped: 'danger' }
const NEXT: Record<string, ItemStatus> = { planned: 'confirmed', confirmed: 'done', in_progress: 'done', done: 'planned', skipped: 'planned' }
const toIso = (local: string) => (local ? new Date(local + '+05:00').toISOString() : null)
const toLocal = (iso: string | null) => (iso ? new Date(iso).toLocaleString('sv-SE', { timeZone: 'Asia/Karachi' }).replace(' ', 'T').slice(0, 16) : '')

export default function RetreatBuilder(p: { retreat: BRetreat; days: BDay[]; items: BItem[]; people: BPerson[]; lines: BLine[]; tasks: BTask[]; updates: BUpdate[]; origin: string }) {
  const { retreat, days, items, people, lines, tasks, updates, origin } = p
  const router = useRouter(); const supabase = useMemo(() => createClient(), [])
  const [tab, setTab] = useState<Tab>('itinerary')
  const [pending, start] = useTransition(); const [err, setErr] = useState<string | null>(null)
  const refresh = () => router.refresh()
  const run = (fn: () => PromiseLike<{ error: { message: string } | null }>) => { setErr(null); start(async () => { const { error } = await fn(); if (error) return setErr(readable(error.message)); refresh() }) }
  const t = (name: string) => fromLoose(supabase as never, name)

  const est = lines.reduce((s, l) => s + l.estimated_pkr, 0), act = lines.reduce((s, l) => s + (l.actual_pkr ?? 0), 0)
  const done = items.filter(i => i.status === 'done').length, tdone = tasks.filter(x => x.is_done).length

  return (
    <>
      <section className="mb-6 grid gap-4 sm:grid-cols-4" aria-label="Summary">
        {[['Itinerary', `${done}/${items.length}`, 'items done'], ['People', String(people.filter(x => x.status !== 'declined').length), retreat.headcount_target ? `of ${retreat.headcount_target}` : 'invited'], ['Budget', pkr(est), retreat.budget_pkr ? `of ${pkr(retreat.budget_pkr)}` : 'estimated'], ['Checklist', `${tdone}/${tasks.length}`, 'tasks done']].map(([k, v, h]) => (
          <Card key={k} className="p-4"><p className="text-[13px] text-muted">{k}</p><p className="mt-1.5 tnum text-2xl font-semibold tracking-tight text-fg">{v}</p><p className="text-xs text-subtle">{h}</p></Card>
        ))}
      </section>

      <div role="tablist" aria-label="Retreat sections" className="mb-6 flex gap-1 overflow-x-auto border-b border-line">
        {TABS.map(([id, label]) => <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={cn('-mb-px whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium', tab === id ? 'border-accent text-fg' : 'border-transparent text-muted hover:text-fg')}>{label}</button>)}
      </div>
      {err && <p role="alert" className="mb-4 rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">{err}</p>}

      {tab === 'itinerary' && <ItineraryTab retreatId={retreat.id} days={days} items={items} run={run} pending={pending} onDone={refresh} />}
      {tab === 'people' && <PeopleTab retreatId={retreat.id} people={people} origin={origin} run={run} onDone={refresh} />}
      {tab === 'budget' && <BudgetTab retreatId={retreat.id} lines={lines} budget={retreat.budget_pkr} est={est} act={act} run={run} onDone={refresh} />}
      {tab === 'tasks' && <TasksTab retreatId={retreat.id} tasks={tasks} run={run} onDone={refresh} />}
      {tab === 'updates' && <UpdatesTab retreatId={retreat.id} updates={updates} people={people.length} onDone={refresh} />}
      {tab === 'share' && <ShareTab retreat={retreat} origin={origin} onDone={refresh} />}
    </>
  )
}

type Run = (fn: () => PromiseLike<{ error: { message: string } | null }>) => void

function ItineraryTab({ retreatId, days, items, run, pending, onDone }: { retreatId: string; days: BDay[]; items: BItem[]; run: Run; pending: boolean; onDone: () => void }) {
  const supabase = useMemo(() => createClient(), [])
  const [edit, setEdit] = useState<{ day: BDay; item: BItem | null } | null>(null)
  return (
    <>
      <div className="space-y-6">
        {days.map(d => {
          const list = items.filter(i => i.day_id === d.id).sort((a, b) => (a.starts_at ?? '9').localeCompare(b.starts_at ?? '9'))
          return (
            <Card key={d.id}>
              <CardHeader title={`Day ${d.day_number}`} description={fmtDate(d.day_date, { weekday: 'long', day: 'numeric', month: 'long' })} action={<Button size="sm" variant="secondary" leading={<Plus className="h-4 w-4" />} onClick={() => setEdit({ day: d, item: null })}>Add item</Button>} />
              {list.length === 0 ? <CardBody><p className="text-sm text-muted">Nothing planned yet.</p></CardBody> : (
                <ul className="mt-3 divide-y divide-line px-3 pb-3">
                  {list.map(i => (
                    <li key={i.id} className="flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-raised">
                      <span className="text-xl" aria-hidden>{KIND[i.kind].emoji}</span>
                      <button className="min-w-0 flex-1 text-left" onClick={() => setEdit({ day: d, item: i })}>
                        <p className="truncate text-sm font-medium text-fg">{i.title}{i.is_internal && <EyeOff className="ml-2 inline h-3.5 w-3.5 text-subtle" aria-label="Internal" />}{i.requires_checkin && <QrCode className="ml-2 inline h-3.5 w-3.5 text-subtle" aria-label="Check in required" />}</p>
                        <p className="truncate text-xs text-muted">{[i.starts_at ? `${fmtTime(i.starts_at)}${i.ends_at ? ` to ${fmtTime(i.ends_at)}` : ''}` : 'All day', i.location_name, i.cost_pkr ? pkr(i.cost_pkr) : null].filter(Boolean).join(' · ')}</p>
                      </button>
                      <button disabled={pending} onClick={() => run(() => fromLoose(supabase as never, 'retreat_items').update({ status: NEXT[i.status] }).eq('id', i.id))} aria-label={`Status ${i.status}, change`}><Badge tone={stTone[i.status]}>{i.status.replace('_', ' ')}</Badge></button>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )
        })}
      </div>
      <ItemModal ctx={edit} retreatId={retreatId} onClose={() => setEdit(null)} onDone={() => { setEdit(null); onDone() }} />
    </>
  )
}

function ItemModal({ ctx, retreatId, onClose, onDone }: { ctx: { day: BDay; item: BItem | null } | null; retreatId: string; onClose: () => void; onDone: () => void }) {
  const supabase = useMemo(() => createClient(), [])
  const i = ctx?.item
  const init = () => ({ kind: (i?.kind ?? 'activity') as ItemKind, title: i?.title ?? '', description: i?.description ?? '', start: toLocal(i?.starts_at ?? null) || (ctx ? `${ctx.day.day_date}T09:00` : ''), end: toLocal(i?.ends_at ?? null), location: i?.location_name ?? '', address: i?.location_address ?? '', lat: i?.latitude?.toString() ?? '', lng: i?.longitude?.toString() ?? '', cost: i?.cost_pkr ? String(i.cost_pkr) : '', assignee: i?.assignee ?? '', internal: i?.is_internal ?? false, checkin: i?.requires_checkin ?? false, notes: i?.notes ?? '' })
  const [f, setF] = useState(init); const [key, setKey] = useState(''); const [err, setErr] = useState<string | null>(null); const [busy, setBusy] = useState(false)
  const k = `${ctx?.day.id}-${i?.id ?? 'new'}`
  if (key !== k) { setKey(k); setF(init()) }

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(null); if (!f.title.trim()) return setErr('Give the item a title.'); setBusy(true)
    const body = { kind: f.kind, title: f.title.trim(), description: f.description.trim() || null, starts_at: toIso(f.start), ends_at: toIso(f.end), location_name: f.location.trim() || null, location_address: f.address.trim() || null, latitude: f.lat ? Number(f.lat) : null, longitude: f.lng ? Number(f.lng) : null, cost_pkr: Number(f.cost || 0), assignee: f.assignee.trim() || null, is_internal: f.internal, requires_checkin: f.checkin, notes: f.notes.trim() || null }
    const tbl = fromLoose(supabase as never, 'retreat_items')
    const { error } = i ? await tbl.update(body).eq('id', i.id) : await tbl.insert({ ...body, retreat_id: retreatId, day_id: ctx!.day.id })
    setBusy(false); if (error) return setErr(readable(error.message)); onDone()
  }
  const del = async () => { if (!i || !confirm('Delete this item?')) return; await fromLoose(supabase as never, 'retreat_items').delete().eq('id', i.id); onDone() }

  return (
    <Modal open={!!ctx} onClose={onClose} title={i ? 'Edit item' : `Add to day ${ctx?.day.day_number}`} className="w-[min(94vw,620px)]">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-[1fr_2fr]"><Field label="Type">{p => <Select {...p} value={f.kind} onChange={e => setF({ ...f, kind: e.target.value as ItemKind })}>{KINDS.map(x => <option key={x} value={x}>{KIND[x].label}</option>)}</Select>}</Field><Field label="Title">{p => <Input {...p} value={f.title} onChange={e => setF({ ...f, title: e.target.value })} />}</Field></div>
        <div className="grid gap-4 sm:grid-cols-2"><Field label="Starts" optional>{p => <Input {...p} type="datetime-local" value={f.start} onChange={e => setF({ ...f, start: e.target.value })} />}</Field><Field label="Ends" optional>{p => <Input {...p} type="datetime-local" value={f.end} onChange={e => setF({ ...f, end: e.target.value })} />}</Field></div>
        <div className="grid gap-4 sm:grid-cols-2"><Field label="Place" optional>{p => <Input {...p} value={f.location} onChange={e => setF({ ...f, location: e.target.value })} />}</Field><Field label="Address" optional>{p => <Input {...p} value={f.address} onChange={e => setF({ ...f, address: e.target.value })} />}</Field></div>
        <div className="grid gap-4 sm:grid-cols-4"><Field label="Latitude" optional>{p => <Input {...p} inputMode="decimal" value={f.lat} onChange={e => setF({ ...f, lat: e.target.value })} />}</Field><Field label="Longitude" optional>{p => <Input {...p} inputMode="decimal" value={f.lng} onChange={e => setF({ ...f, lng: e.target.value })} />}</Field><Field label="Cost (PKR)" optional>{p => <Input {...p} inputMode="numeric" value={f.cost} onChange={e => setF({ ...f, cost: e.target.value.replace(/\D/g, '') })} />}</Field><Field label="Owner" optional>{p => <Input {...p} value={f.assignee} onChange={e => setF({ ...f, assignee: e.target.value })} />}</Field></div>
        <Field label="Description" hint="Shown to participants." optional>{p => <Textarea {...p} rows={3} value={f.description} onChange={e => setF({ ...f, description: e.target.value })} />}</Field>
        <Field label="Internal notes" hint="Never shown to participants." optional>{p => <Textarea {...p} rows={2} value={f.notes} onChange={e => setF({ ...f, notes: e.target.value })} />}</Field>
        <div className="flex flex-wrap gap-6 text-sm text-muted">
          <label className="flex cursor-pointer items-center gap-2"><input type="checkbox" checked={f.internal} onChange={e => setF({ ...f, internal: e.target.checked })} className="h-4 w-4 accent-[rgb(var(--k-accent))]" /> Internal only (hidden from the shared itinerary)</label>
          <label className="flex cursor-pointer items-center gap-2"><input type="checkbox" checked={f.checkin} onChange={e => setF({ ...f, checkin: e.target.checked })} className="h-4 w-4 accent-[rgb(var(--k-accent))]" /> Scan participants in</label>
        </div>
        {err && <p role="alert" className="text-sm text-danger">{err}</p>}
        <div className="flex justify-between gap-2"><div>{i && <Button type="button" variant="danger" onClick={del} leading={<Trash2 className="h-4 w-4" />}>Delete</Button>}</div><div className="flex gap-2"><Button type="button" variant="ghost" onClick={onClose}>Cancel</Button><Button type="submit" loading={busy}>Save</Button></div></div>
      </form>
    </Modal>
  )
}

function PeopleTab({ retreatId, people, origin, run, onDone }: { retreatId: string; people: BPerson[]; origin: string; run: Run; onDone: () => void }) {
  const supabase = useMemo(() => createClient(), [])
  const [open, setOpen] = useState(false); const [bulk, setBulk] = useState(false); const [copied, setCopied] = useState('')
  const [f, setF] = useState({ name: '', email: '', phone: '', dept: '', diet: '', room: '' }); const [paste, setPaste] = useState(''); const [err, setErr] = useState<string | null>(null)
  const tbl = () => fromLoose(supabase as never, 'retreat_participants')

  async function add(e: React.FormEvent) { e.preventDefault(); setErr(null); if (!f.name.trim()) return setErr('Enter a name.')
    const { error } = await tbl().insert({ retreat_id: retreatId, full_name: f.name.trim(), email: f.email.trim() || null, phone: f.phone.trim() || null, department: f.dept.trim() || null, dietary: f.diet.trim() || null, room_label: f.room.trim() || null, status: 'confirmed' })
    if (error) return setErr(error.message.includes('duplicate') ? 'That email is already on the list.' : readable(error.message)); setF({ name: '', email: '', phone: '', dept: '', diet: '', room: '' }); setOpen(false); onDone() }
  async function importList(e: React.FormEvent) { e.preventDefault(); setErr(null)
    const rows = paste.split('\n').map(l => l.split(/[,\t]/).map(x => x.trim())).filter(r => r[0]).map(r => ({ retreat_id: retreatId, full_name: r[0], email: r[1] || null, phone: r[2] || null, department: r[3] || null, status: 'confirmed' }))
    if (!rows.length) return setErr('Paste one person per line: name, email, phone, department.')
    const { error } = await tbl().insert(rows); if (error) return setErr(readable(error.message)); setPaste(''); setBulk(false); onDone() }
  const copy = async (text: string, key: string) => { await navigator.clipboard.writeText(text); setCopied(key); setTimeout(() => setCopied(''), 1500) }

  return (
    <>
      <div className="mb-4 flex justify-end gap-2"><Button variant="secondary" onClick={() => setBulk(true)}>Paste a list</Button><Button leading={<Plus className="h-4 w-4" />} onClick={() => setOpen(true)}>Add person</Button></div>
      {people.length === 0 ? <Card><EmptyState icon={<Users className="h-6 w-6" />} title="No participants yet" description="Add the team going on the trip. Each person gets a private link to their own schedule." /></Card> : (
        <TableWrap><Table>
          <thead><tr><Th>Person</Th><Th>Department</Th><Th>Dietary</Th><Th>Room</Th><Th>Status</Th><Th className="text-right">Link</Th></tr></thead>
          <tbody>{people.map(x => (
            <Tr key={x.id}>
              <Td><div className="flex items-center gap-3"><Avatar name={x.full_name} size={32} /><div className="min-w-0"><p className="truncate text-sm font-medium text-fg">{x.full_name}</p><p className="truncate text-xs text-muted">{x.email ?? x.phone ?? '—'}</p></div></div></Td>
              <Td className="text-sm text-muted">{x.department ?? '—'}</Td><Td className="text-sm text-muted">{x.dietary ?? '—'}</Td><Td className="text-sm text-muted">{x.room_label ?? '—'}</Td>
              <Td><select aria-label={`Status of ${x.full_name}`} value={x.status} onChange={e => run(() => tbl().update({ status: e.target.value }).eq('id', x.id))} className="rounded-lg bg-raised px-2 py-1 text-xs text-fg"><option value="invited">Invited</option><option value="confirmed">Confirmed</option><option value="declined">Declined</option></select></Td>
              <Td className="text-right"><Button size="icon-sm" variant="ghost" aria-label={`Copy link for ${x.full_name}`} onClick={() => copy(`${origin}/itinerary/me/${x.qr_token}`, x.id)}>{copied === x.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}</Button><Button size="icon-sm" variant="ghost" aria-label={`Remove ${x.full_name}`} onClick={() => confirm(`Remove ${x.full_name}?`) && run(() => tbl().delete().eq('id', x.id))}><Trash2 className="h-4 w-4" /></Button></Td>
            </Tr>))}</tbody>
        </Table></TableWrap>
      )}
      <Modal open={open} onClose={() => setOpen(false)} title="Add a person">
        <form onSubmit={add} className="space-y-4">
          <Field label="Full name">{p => <Input {...p} value={f.name} onChange={e => setF({ ...f, name: e.target.value })} />}</Field>
          <div className="grid gap-4 sm:grid-cols-2"><Field label="Email" optional>{p => <Input {...p} type="email" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} />}</Field><Field label="Phone" optional>{p => <Input {...p} type="tel" value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} />}</Field><Field label="Department" optional>{p => <Input {...p} value={f.dept} onChange={e => setF({ ...f, dept: e.target.value })} />}</Field><Field label="Room" optional>{p => <Input {...p} value={f.room} onChange={e => setF({ ...f, room: e.target.value })} />}</Field></div>
          <Field label="Dietary needs" optional>{p => <Input {...p} value={f.diet} onChange={e => setF({ ...f, diet: e.target.value })} placeholder="Vegetarian, no nuts" />}</Field>
          {err && <p role="alert" className="text-sm text-danger">{err}</p>}
          <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit">Add</Button></div>
        </form>
      </Modal>
      <Modal open={bulk} onClose={() => setBulk(false)} title="Paste a list" description="One person per line: name, email, phone, department.">
        <form onSubmit={importList} className="space-y-4"><Textarea rows={8} value={paste} onChange={e => setPaste(e.target.value)} aria-label="People" placeholder={'Sara Khan, sara@acme.com, 0300 1234567, Finance'} />{err && <p role="alert" className="text-sm text-danger">{err}</p>}<div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setBulk(false)}>Cancel</Button><Button type="submit">Import</Button></div></form>
      </Modal>
    </>
  )
}

function BudgetTab({ retreatId, lines, budget, est, act, run, onDone }: { retreatId: string; lines: BLine[]; budget: number | null; est: number; act: number; run: Run; onDone: () => void }) {
  const supabase = useMemo(() => createClient(), [])
  const [f, setF] = useState({ category: 'Transport', label: '', est: '' }); const [err, setErr] = useState<string | null>(null)
  const tbl = () => fromLoose(supabase as never, 'retreat_budget_lines')
  async function add(e: React.FormEvent) { e.preventDefault(); setErr(null); if (!f.label.trim()) return setErr('Describe the cost.')
    const { error } = await tbl().insert({ retreat_id: retreatId, category: f.category, label: f.label.trim(), estimated_pkr: Number(f.est || 0) }); if (error) return setErr(readable(error.message)); setF({ ...f, label: '', est: '' }); onDone() }
  return (
    <div className="grid items-start gap-6 xl:grid-cols-[1fr_320px]">
      <Card>
        <CardHeader title="Cost lines" description="Estimate first, enter the actual when the bill arrives" />
        <CardBody className="space-y-4">
          {lines.length > 0 && <ul className="divide-y divide-line">{lines.map(l => (
            <li key={l.id} className="grid grid-cols-[1fr_auto] items-center gap-3 py-3 sm:grid-cols-[1fr_120px_120px_auto]">
              <div className="min-w-0"><p className="truncate text-sm font-medium text-fg">{l.label}</p><p className="text-xs text-muted">{l.category}</p></div>
              <p className="tnum text-sm text-muted sm:text-right">{pkr(l.estimated_pkr)}</p>
              <input aria-label={`Actual cost for ${l.label}`} inputMode="numeric" defaultValue={l.actual_pkr ?? ''} placeholder="Actual" onBlur={e => { const v = e.target.value.replace(/\D/g, ''); if (String(l.actual_pkr ?? '') !== v) run(() => tbl().update({ actual_pkr: v ? Number(v) : null }).eq('id', l.id)) }} className="tnum h-9 w-full rounded-lg border border-line-strong bg-raised px-2.5 text-right text-sm text-fg focus:border-accent focus:outline-none" />
              <div className="flex items-center gap-1"><button onClick={() => run(() => tbl().update({ is_paid: !l.is_paid }).eq('id', l.id))} aria-label={l.is_paid ? 'Mark unpaid' : 'Mark paid'}><Badge tone={l.is_paid ? 'success' : 'warning'}>{l.is_paid ? 'Paid' : 'Unpaid'}</Badge></button><Button size="icon-sm" variant="ghost" aria-label="Delete line" onClick={() => run(() => tbl().delete().eq('id', l.id))}><Trash2 className="h-4 w-4" /></Button></div>
            </li>))}</ul>}
          <form onSubmit={add} className="grid gap-3 rounded-xl bg-raised p-4 shadow-[inset_0_0_0_1px_rgb(var(--k-line))] sm:grid-cols-[140px_1fr_130px_auto] sm:items-end">
            <Field label="Category">{p => <Select {...p} value={f.category} onChange={e => setF({ ...f, category: e.target.value })}>{['Transport', 'Stay', 'Food', 'Activities', 'Venue', 'Equipment', 'Staff', 'Other'].map(c => <option key={c}>{c}</option>)}</Select>}</Field>
            <Field label="What">{p => <Input {...p} value={f.label} onChange={e => setF({ ...f, label: e.target.value })} />}</Field>
            <Field label="Estimate">{p => <Input {...p} inputMode="numeric" value={f.est} onChange={e => setF({ ...f, est: e.target.value.replace(/\D/g, '') })} />}</Field>
            <Button type="submit">Add</Button>
          </form>
          {err && <p role="alert" className="text-sm text-danger">{err}</p>}
        </CardBody>
      </Card>
      <Card className="p-5"><p className="text-[13px] text-muted">Estimated</p><p className="mt-1 tnum text-2xl font-semibold text-fg">{pkr(est)}</p><p className="mt-4 text-[13px] text-muted">Actual so far</p><p className="mt-1 tnum text-2xl font-semibold text-fg">{pkr(act)}</p>
        {budget ? <div className="mt-5"><div className="mb-1.5 flex justify-between text-xs text-muted"><span>Budget {pkr(budget)}</span><span className={est > budget ? 'text-danger' : ''}>{est > budget ? `${pkr(est - budget)} over` : `${pkr(budget - est)} left`}</span></div><Progress value={Math.min(100, Math.round((est / budget) * 100))} tone={est > budget ? 'danger' : 'accent'} /></div> : null}</Card>
    </div>
  )
}

function TasksTab({ retreatId, tasks, run, onDone }: { retreatId: string; tasks: BTask[]; run: Run; onDone: () => void }) {
  const supabase = useMemo(() => createClient(), [])
  const [title, setTitle] = useState(''); const [due, setDue] = useState(''); const tbl = () => fromLoose(supabase as never, 'retreat_tasks')
  async function add(e: React.FormEvent) { e.preventDefault(); if (!title.trim()) return; await tbl().insert({ retreat_id: retreatId, title: title.trim(), due_date: due || null }); setTitle(''); setDue(''); onDone() }
  const today = new Date().toISOString().slice(0, 10)
  return (
    <Card><CardHeader title="Planning checklist" description="Everything that has to happen before the trip" />
      <CardBody className="space-y-4">
        <form onSubmit={add} className="flex flex-wrap gap-2"><div className="min-w-[200px] flex-1"><Input aria-label="New task" placeholder="Confirm the hotel block" value={title} onChange={e => setTitle(e.target.value)} /></div><Input aria-label="Due date" type="date" className="w-44" value={due} onChange={e => setDue(e.target.value)} /><Button type="submit">Add task</Button></form>
        <ul className="divide-y divide-line">{tasks.map(x => (
          <li key={x.id} className="flex items-center gap-3 py-2.5">
            <input type="checkbox" checked={x.is_done} aria-label={x.title} onChange={() => run(() => tbl().update({ is_done: !x.is_done, done_at: x.is_done ? null : new Date().toISOString() }).eq('id', x.id))} className="h-4 w-4 accent-[rgb(var(--k-accent))]" />
            <span className={cn('flex-1 text-sm', x.is_done ? 'text-subtle line-through' : 'text-fg')}>{x.title}</span>
            {x.due_date && <Badge tone={!x.is_done && x.due_date < today ? 'danger' : 'neutral'}>{fmtDate(x.due_date, { day: 'numeric', month: 'short' })}</Badge>}
            <Button size="icon-sm" variant="ghost" aria-label="Delete task" onClick={() => run(() => tbl().delete().eq('id', x.id))}><Trash2 className="h-4 w-4" /></Button>
          </li>))}</ul>
        {tasks.length === 0 && <p className="text-sm text-muted">No tasks yet.</p>}
      </CardBody></Card>
  )
}

function UpdatesTab({ retreatId, updates, people, onDone }: { retreatId: string; updates: BUpdate[]; people: number; onDone: () => void }) {
  const supabase = useMemo(() => createClient(), [])
  const [body, setBody] = useState(''); const [email, setEmail] = useState(true); const [busy, setBusy] = useState(false); const [err, setErr] = useState<string | null>(null)
  async function send() { setErr(null); setBusy(true); const { error } = await rpcLoose(supabase as never, 'post_retreat_update', { p_retreat: retreatId, p_body: body.trim(), p_send_email: email }); setBusy(false); if (error) return setErr(readable(error.message)); setBody(''); onDone() }
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[1fr_360px]">
      <Card><CardHeader title="Sent updates" />
        <CardBody>{updates.length === 0 ? <p className="text-sm text-muted">No updates yet.</p> : <ul className="space-y-3">{updates.map(u => <li key={u.id} className="rounded-xl bg-raised p-4 shadow-[inset_0_0_0_1px_rgb(var(--k-line))]"><p className="whitespace-pre-wrap text-sm text-fg">{u.body}</p><p className="mt-2 text-xs text-subtle">{fmtDate(u.created_at)} at {fmtTime(u.created_at)}</p></li>)}</ul>}</CardBody></Card>
      <Card><CardHeader title="New update" description={`Goes to ${people} participants`} />
        <CardBody className="space-y-4"><Textarea aria-label="Update" rows={5} maxLength={1500} value={body} onChange={e => setBody(e.target.value)} placeholder="Pickup moves to 6:30 am from the main lobby." />
          <label className="flex cursor-pointer items-center gap-2 text-sm text-muted"><input type="checkbox" checked={email} onChange={e => setEmail(e.target.checked)} className="h-4 w-4 accent-[rgb(var(--k-accent))]" /> Also send by email</label>
          {err && <p role="alert" className="text-sm text-danger">{err}</p>}<Button className="w-full" onClick={send} loading={busy} disabled={!body.trim()}>Send update</Button></CardBody></Card>
    </div>
  )
}

function ShareTab({ retreat, origin, onDone }: { retreat: BRetreat; origin: string; onDone: () => void }) {
  const supabase = useMemo(() => createClient(), [])
  const [busy, setBusy] = useState(false); const [copied, setCopied] = useState(false)
  const url = retreat.share_token ? `${origin}/itinerary/${retreat.share_token}` : null
  async function toggle() { setBusy(true); await rpcLoose(supabase as never, retreat.share_token ? 'disable_retreat_sharing' : 'enable_retreat_sharing', { p_retreat: retreat.id }); setBusy(false); onDone() }
  return (
    <Card><CardHeader title="Share the itinerary" description="A private, interactive page for the client. Costs, internal items and notes never appear on it." action={<Link2 className="h-5 w-5 text-subtle" aria-hidden />} />
      <CardBody className="space-y-4">
        {url ? (<>
          <p className="break-all rounded-lg bg-raised p-3 font-mono text-xs text-fg">{url}</p>
          <div className="flex flex-wrap gap-2"><Button variant="secondary" leading={copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} onClick={async () => { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1500) }}>{copied ? 'Copied' : 'Copy link'}</Button><a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center gap-2 rounded-[10px] px-4 text-sm font-medium text-muted hover:bg-raised hover:text-fg"><Eye className="h-4 w-4" />Preview</a><Button variant="danger" onClick={toggle} loading={busy}>Turn off sharing</Button></div>
        </>) : (<><p className="text-sm text-muted">Sharing is off. Turn it on to get a link you can send to the client.</p><Button onClick={toggle} loading={busy}>Turn on sharing</Button></>)}
      </CardBody></Card>
  )
}
