'use client'

import { useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CalendarClock, Check, ImagePlus, Lock, MapPin, Plus, ShieldCheck, Ticket, Trash2, Wallet } from 'lucide-react'
import { Badge, Button, Card, CardBody, CardHeader, Field, Input, PageHeader, Select, Switch, Textarea } from '@/components/kit'
import { createClient } from '@/lib/supabase/client'
import { PAKISTAN_CITIES } from '@/lib/pakistanCities'
import { cn } from '@/lib/cn'

export type TierValue = { key: string; id?: string; name: string; price: string; qty: string; ends: string; vip: boolean }
export type EventValues = {
  id?: string
  title: string; description: string; categoryId: string; city: string; coverUrl: string
  startsAt: string; endsAt: string
  secret: boolean; areaLabel: string; venueName: string; venueAddress: string; secretAddress: string; revealAt: string
  approval: boolean; idOnly: boolean; isPrivate: boolean; capacity: string
  tiers: TierValue[]
  accountIds: string[]
  status: 'draft' | 'published' | 'completed' | 'cancelled' | 'archived'
}

export type EventFormProps = {
  mode: 'create' | 'edit'
  initial: EventValues
  categories: { id: string; name: string }[]
  accounts: { id: string; label: string; detail: string }[]
  idVerified: boolean
  limits: { registrationsPerEvent: number | null; autoReveal: boolean; idRequiredEvents: boolean; planLabel: string }
}

const PK = '+05:00'
const toIso = (local: string) => (local ? new Date(local + PK).toISOString() : null)
export const toLocal = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString('sv-SE', { timeZone: 'Asia/Karachi' }).replace(' ', 'T').slice(0, 16) : ''

export const emptyEvent = (): EventValues => ({
  title: '', description: '', categoryId: '', city: '', coverUrl: '', startsAt: '', endsAt: '',
  secret: false, areaLabel: '', venueName: '', venueAddress: '', secretAddress: '', revealAt: '',
  approval: false, idOnly: false, isPrivate: false, capacity: '',
  tiers: [{ key: 'new-1', name: 'General', price: '', qty: '', ends: '', vip: false }],
  accountIds: [], status: 'draft',
})

/** Database errors start with a code. Show the human part. */
function readable(msg: string) {
  const m = msg.match(/^[A-Z_]+(?::[a-z_]+)?: ([\s\S]*)$/)
  return m ? m[1] : msg.includes('row-level security') ? 'You do not have permission to do that.' : msg
}

export default function EventForm({ mode, initial, categories, accounts, idVerified, limits }: EventFormProps) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const fileRef = useRef<HTMLInputElement>(null)
  const [v, setV] = useState<EventValues>(initial)
  const [busy, setBusy] = useState<null | 'draft' | 'publish'>(null)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [uploading, setUploading] = useState(false)
  const set = <K extends keyof EventValues>(k: K, val: EventValues[K]) => setV(p => ({ ...p, [k]: val }))
  const text = (k: keyof EventValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => set(k, e.target.value as never)
  const updateTier = (key: string, patch: Partial<TierValue>) => set('tiers', v.tiers.map(t => (t.key === key ? { ...t, ...patch } : t)))

  const hasPaid = v.tiers.some(t => Number(t.price) > 0)
  const checklist = [
    { label: 'Identity verified', ok: idVerified, fix: !idVerified ? { href: '/dashboard/settings/verification', text: 'Verify' } : undefined },
    { label: 'Title, date and city', ok: !!(v.title.trim() && v.startsAt && v.city) },
    { label: 'At least one ticket type', ok: v.tiers.some(t => t.name.trim()) },
    { label: hasPaid ? 'Payment account selected' : 'Free event, no payment needed', ok: !hasPaid || v.accountIds.length > 0,
      fix: hasPaid && accounts.length === 0 ? { href: '/dashboard/settings/payments', text: 'Add' } : undefined },
    { label: 'Cover image', ok: !!v.coverUrl },
  ]
  const done = checklist.filter(c => c.ok).length

  async function uploadCover(file: File) {
    setUploading(true); setError(null)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setUploading(false); return }
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`
    const { error: err } = await supabase.storage.from('event-media').upload(path, file, { contentType: file.type })
    setUploading(false)
    if (err) return setError('The image could not be uploaded. Use a JPG, PNG or WebP under 10 MB.')
    set('coverUrl', supabase.storage.from('event-media').getPublicUrl(path).data.publicUrl)
  }

  async function save(publish: boolean) {
    setError(null); setSaved(false)
    if (!v.title.trim() || !v.startsAt) return setError('Add a title and a start time.')
    const cap = v.capacity ? Number(v.capacity) : null
    if (cap !== null && (!Number.isInteger(cap) || cap < 1)) return setError('Capacity must be a whole number.')
    for (const t of v.tiers) {
      if (!t.name.trim()) return setError('Every ticket type needs a name.')
      if (t.price === '' || Number(t.price) < 0 || !Number.isFinite(Number(t.price))) return setError(`Set a price for ${t.name} (0 for free).`)
    }
    if (v.endsAt && toIso(v.endsAt)! < toIso(v.startsAt)!) return setError('The event cannot end before it starts.')

    setBusy(publish ? 'publish' : 'draft')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Please log in again.')
      const status: EventValues['status'] = publish || v.status === 'published' ? 'published' : v.status

      const row = {
        title: v.title.trim(), description: v.description.trim() || null, cover_image_url: v.coverUrl || null,
        category_id: v.categoryId || null, city: v.city || null,
        area_label: v.areaLabel.trim() || null,
        venue_name: v.secret ? null : v.venueName.trim() || null,
        venue_address: v.secret ? null : v.venueAddress.trim() || null,
        is_secret_venue: v.secret,
        starts_at: toIso(v.startsAt)!, ends_at: toIso(v.endsAt),
        capacity: cap, status, visibility: v.isPrivate ? 'private' as const : 'public' as const,
        registration_mode: v.approval ? 'approval' as const : 'open' as const,
        require_id_verified: v.idOnly,
      }

      let id = v.id
      if (id) {
        const { error: e } = await supabase.from('events').update(row).eq('id', id)
        if (e) throw e
      } else {
        const { data, error: e } = await supabase.from('events').insert({ ...row, organizer_id: user.id }).select('id').single()
        if (e) throw e
        id = data.id
      }

      // secret address and reveal time
      const { error: se } = await supabase.from('event_secrets').update({
        venue_address: v.secret ? v.secretAddress.trim() || null : null,
        reveal_at: v.secret ? toIso(v.revealAt) : null,
      }).eq('event_id', id)
      if (se) throw se

      // ticket types: update, insert, delete
      const keep = v.tiers.filter(t => t.id).map(t => t.id!)
      const { data: existing } = await supabase.from('ticket_types').select('id').eq('event_id', id)
      const gone = (existing ?? []).map(e => e.id).filter(x => !keep.includes(x))
      if (gone.length) {
        const { error: de } = await supabase.from('ticket_types').delete().in('id', gone)
        if (de) throw new Error('A ticket type that already has registrations cannot be removed. Set its quantity instead.')
      }
      for (const [i, t] of v.tiers.entries()) {
        const body = {
          name: t.name.trim(), price_pkr: Number(t.price), quantity: t.qty ? Number(t.qty) : null,
          is_vip: t.vip, sales_end: toIso(t.ends), sort: i,
        }
        const { error: te } = t.id
          ? await supabase.from('ticket_types').update(body).eq('id', t.id)
          : await supabase.from('ticket_types').insert({ ...body, event_id: id })
        if (te) throw te
      }

      // payment accounts
      const { data: links } = await supabase.from('event_payment_accounts').select('payment_account_id').eq('event_id', id)
      const have = (links ?? []).map(l => l.payment_account_id)
      const add = v.accountIds.filter(a => !have.includes(a))
      const drop = have.filter(a => !v.accountIds.includes(a))
      if (add.length) { const { error: e } = await supabase.from('event_payment_accounts').insert(add.map(a => ({ event_id: id!, payment_account_id: a }))); if (e) throw e }
      if (drop.length) { const { error: e } = await supabase.from('event_payment_accounts').delete().eq('event_id', id).in('payment_account_id', drop); if (e) throw e }

      if (mode === 'create') { router.push(`/dashboard/events/${id}`); router.refresh() }
      else { setV(p => ({ ...p, id, status })); setSaved(true); router.refresh() }
    } catch (e) {
      setError(readable(e instanceof Error ? e.message : (e as { message?: string }).message ?? 'Something went wrong.'))
    } finally {
      setBusy(null)
    }
  }

  const capLimit = limits.registrationsPerEvent
  return (
    <div className="k-fade-up">
      {mode === 'create' && (
        <PageHeader
          eyebrow="New event"
          title="Create your event"
          description="Everything saves as a draft. Publish when the checklist is green."
          actions={<><Button variant="ghost" onClick={() => save(false)} loading={busy === 'draft'}>Save draft</Button><Button onClick={() => save(true)} loading={busy === 'publish'}>Publish event</Button></>}
        />
      )}

      {error && <p role="alert" className="mb-4 rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>}
      {saved && <p role="status" className="mb-4 rounded-xl bg-success/10 px-4 py-3 text-sm text-success">Saved.</p>}

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card>
            <CardHeader title="The basics" description="What guests see first" />
            <CardBody className="grid gap-4">
              <Field label="Event name">{p => <Input {...p} value={v.title} onChange={text('title')} placeholder="Give it a name people remember" maxLength={120} />}</Field>
              <Field label="Description" hint="Vibe, dress code, what is included.">
                {p => <Textarea {...p} rows={4} value={v.description} onChange={text('description')} maxLength={2000} />}
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Category">
                  {p => (
                    <Select {...p} value={v.categoryId} onChange={text('categoryId')}>
                      <option value="">Choose</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </Select>
                  )}
                </Field>
                <Field label="City">
                  {p => (
                    <Select {...p} value={v.city} onChange={text('city')}>
                      <option value="">Choose</option>
                      {PAKISTAN_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </Select>
                  )}
                </Field>
              </div>
              <Field label="Cover image" hint="1600 x 900 or larger. JPG, PNG or WebP.">
                {() => (
                  <>
                    <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only"
                      onChange={e => { const f = e.target.files?.[0]; if (f) uploadCover(f) }} />
                    {v.coverUrl ? (
                      <div className="relative overflow-hidden rounded-2xl">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={v.coverUrl} alt="Event cover" className="h-44 w-full object-cover" />
                        <Button type="button" variant="secondary" size="sm" className="absolute right-3 top-3" onClick={() => fileRef.current?.click()}>Change</Button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => fileRef.current?.click()}
                        className="flex h-36 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line-strong bg-raised text-muted transition-colors hover:border-accent hover:text-fg">
                        <ImagePlus className="h-6 w-6" aria-hidden /><span className="text-sm font-medium">{uploading ? 'Uploading' : 'Upload cover'}</span>
                      </button>
                    )}
                  </>
                )}
              </Field>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="When and where" description="Pakistan time" action={<CalendarClock className="h-5 w-5 text-subtle" aria-hidden />} />
            <CardBody className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Starts">{p => <Input {...p} type="datetime-local" value={v.startsAt} onChange={text('startsAt')} />}</Field>
                <Field label="Ends" optional>{p => <Input {...p} type="datetime-local" value={v.endsAt} onChange={text('endsAt')} />}</Field>
              </div>

              <div className="flex items-start justify-between gap-4 rounded-xl bg-raised p-4 shadow-[inset_0_0_0_1px_rgb(var(--k-line))]">
                <div className="flex gap-3">
                  <Lock className="mt-0.5 h-5 w-5 shrink-0 text-violet" aria-hidden />
                  <div>
                    <p className="text-sm font-medium text-fg">Secret location</p>
                    <p className="mt-0.5 text-[13px] text-muted">Only the area is public. Confirmed guests get the address at the time you choose.</p>
                  </div>
                </div>
                <Switch checked={v.secret} onChange={x => set('secret', x)} label="Secret location" />
              </div>

              {v.secret ? (
                <div className="k-pop grid gap-4 sm:grid-cols-2">
                  <Field label="Public area" hint="Shown to everyone, like DHA Phase 6">{p => <Input {...p} leading={<MapPin className="h-4 w-4" />} value={v.areaLabel} onChange={text('areaLabel')} />}</Field>
                  <Field label="Reveal address at" hint={limits.autoReveal ? 'Guests are notified automatically.' : 'Automatic reveal is on the Growth plan and above. Otherwise send an announcement.'}>
                    {p => <Input {...p} type="datetime-local" value={v.revealAt} onChange={text('revealAt')} disabled={!limits.autoReveal} />}
                  </Field>
                  <Field label="Secret address" className="sm:col-span-2">{p => <Input {...p} value={v.secretAddress} onChange={text('secretAddress')} />}</Field>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Venue name">{p => <Input {...p} value={v.venueName} onChange={text('venueName')} placeholder="The Grand Hall" />}</Field>
                  <Field label="Address">{p => <Input {...p} value={v.venueAddress} onChange={text('venueAddress')} placeholder="Street, area" />}</Field>
                  <Field label="Area" hint="Short, like DHA Phase 6" className="sm:col-span-2">{p => <Input {...p} value={v.areaLabel} onChange={text('areaLabel')} />}</Field>
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Tickets" description="Add early bird tiers with a sales cutoff" action={<Ticket className="h-5 w-5 text-subtle" aria-hidden />} />
            <CardBody className="space-y-3">
              {v.tiers.map(t => (
                <div key={t.key} className="rounded-xl bg-raised p-4 shadow-[inset_0_0_0_1px_rgb(var(--k-line))]">
                  <div className="grid gap-3 sm:grid-cols-[1.4fr_1fr_1fr_auto] sm:items-end">
                    <Field label="Name">{p => <Input {...p} value={t.name} onChange={e => updateTier(t.key, { name: e.target.value })} />}</Field>
                    <Field label="Price (PKR)">{p => <Input {...p} inputMode="numeric" value={t.price} onChange={e => updateTier(t.key, { price: e.target.value.replace(/\D/g, '') })} />}</Field>
                    <Field label="Quantity" optional>{p => <Input {...p} inputMode="numeric" value={t.qty} onChange={e => updateTier(t.key, { qty: e.target.value.replace(/\D/g, '') })} />}</Field>
                    <Button variant="ghost" size="icon" aria-label={`Remove ${t.name || 'ticket'}`} disabled={v.tiers.length === 1}
                      onClick={() => set('tiers', v.tiers.filter(x => x.key !== t.key))}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                    <Field label="Stop selling at" optional>{p => <Input {...p} type="datetime-local" value={t.ends} onChange={e => updateTier(t.key, { ends: e.target.value })} />}</Field>
                    <label className="flex h-10 cursor-pointer items-center gap-2 text-sm text-muted">
                      <input type="checkbox" checked={t.vip} onChange={e => updateTier(t.key, { vip: e.target.checked })} className="h-4 w-4 accent-[rgb(var(--k-magenta))]" /> VIP perks
                    </label>
                  </div>
                </div>
              ))}
              <Button variant="secondary" leading={<Plus className="h-4 w-4" />}
                onClick={() => set('tiers', [...v.tiers, { key: `new-${Date.now()}`, name: '', price: '', qty: '', ends: '', vip: false }])}>Add ticket type</Button>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Access and payment" action={<Wallet className="h-5 w-5 text-subtle" aria-hidden />} />
            <CardBody className="divide-y divide-line">
              <div className="grid gap-4 pb-4 sm:grid-cols-2">
                <Field label="Total capacity" hint={capLimit ? `Your plan allows up to ${capLimit}.` : undefined} optional={!capLimit}>
                  {p => <Input {...p} inputMode="numeric" value={v.capacity} onChange={e => set('capacity', e.target.value.replace(/\D/g, ''))} />}
                </Field>
              </div>
              {[
                { t: 'Approve each guest', d: 'Review every request before they can pay.', val: v.approval, on: (x: boolean) => set('approval', x), locked: false },
                { t: 'Private event', d: 'Not listed publicly. Guests reach it through your link.', val: v.isPrivate, on: (x: boolean) => set('isPrivate', x), locked: false },
                { t: 'Verified IDs only', d: 'Only guests with a verified ID can register. Growth plan and above.', val: v.idOnly, on: (x: boolean) => set('idOnly', x), locked: !limits.idRequiredEvents },
              ].map(r => (
                <div key={r.t} className="flex items-start justify-between gap-4 py-4">
                  <div><p className="text-sm font-medium text-fg">{r.t}</p><p className="mt-0.5 text-[13px] text-muted">{r.d}</p></div>
                  {r.locked ? <Badge tone="magenta">Growth</Badge> : <Switch checked={r.val} onChange={r.on} label={r.t} />}
                </div>
              ))}
              <div className="pt-4">
                <p className="mb-2 text-sm font-medium text-fg">Accept payment to</p>
                {accounts.length === 0 ? (
                  <p className="text-sm text-muted">No payment accounts yet. <Link href="/dashboard/settings/payments" className="text-accent hover:underline">Add one in Settings</Link>.</p>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {accounts.map(a => {
                      const on = v.accountIds.includes(a.id)
                      return (
                        <label key={a.id} className={cn('flex cursor-pointer items-center gap-3 rounded-xl p-3.5 transition-colors', on ? 'bg-accent/8 shadow-[inset_0_0_0_1px_rgb(var(--k-accent)/0.5)]' : 'bg-raised shadow-[inset_0_0_0_1px_rgb(var(--k-line))]')}>
                          <input type="checkbox" checked={on} onChange={() => set('accountIds', on ? v.accountIds.filter(x => x !== a.id) : [...v.accountIds, a.id])} className="h-4 w-4 accent-[rgb(var(--k-accent))]" />
                          <span><span className="block text-sm font-medium text-fg">{a.label}</span><span className="tnum block text-xs text-muted">{a.detail}</span></span>
                        </label>
                      )
                    })}
                  </div>
                )}
              </div>
            </CardBody>
          </Card>

          {mode === 'edit' && (
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => save(false)} loading={busy === 'draft'}>Save changes</Button>
              {v.status === 'draft' && <Button onClick={() => save(true)} loading={busy === 'publish'}>Publish</Button>}
            </div>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24">
          {v.status === 'draft' && (
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-[15px] font-semibold text-fg">Ready to publish</h3>
                <span className="tnum text-sm text-muted">{done}/{checklist.length}</span>
              </div>
              <ul className="mt-4 space-y-3">
                {checklist.map(c => (
                  <li key={c.label} className="flex items-center gap-3 text-sm">
                    <span className={cn('flex h-5 w-5 items-center justify-center rounded-full', c.ok ? 'bg-success/15 text-success' : 'bg-overlay text-subtle')}>
                      {c.ok ? <Check className="h-3 w-3" aria-hidden /> : <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />}
                    </span>
                    <span className={cn('flex-1', c.ok ? 'text-fg' : 'text-muted')}>{c.label}</span>
                    {c.fix && <Link href={c.fix.href} className="text-xs font-medium text-accent hover:underline">{c.fix.text}</Link>}
                  </li>
                ))}
              </ul>
            </Card>
          )}
          <Card className="p-5">
            <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-accent" aria-hidden /><h3 className="text-sm font-semibold text-fg">Your plan</h3></div>
            <p className="mt-2 text-[13px] text-muted">{limits.planLabel}</p>
          </Card>
        </aside>
      </div>
    </div>
  )
}
