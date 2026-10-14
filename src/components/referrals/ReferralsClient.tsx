'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { QRCodeSVG } from 'qrcode.react'
import { Check, Copy, KeyRound, Link2, Percent, Plus, QrCode, Ticket, Trash2, UserPlus } from 'lucide-react'
import { Avatar, Badge, Button, Card, CardBody, CardHeader, EmptyState, Field, Input, Modal, Select, Table, TableWrap, Td, Th, Tr, type BadgeTone } from '@/components/kit'
import { createClient } from '@/lib/supabase/client'
import { fmtDate, pkr } from '@/lib/format'

export type Promoter = { id: string; name: string; phone: string | null; email: string | null; active: boolean; sold: number; owed: number; paid: number }
export type LinkRow = { id: string; referrerId: string; promoter: string; eventId: string; eventTitle: string; eventSlug: string | null; code: string; mode: string | null; value: number | null; discountType: string | null; discountValue: number | null; uses: number; active: boolean }
export type CouponRow = { id: string; eventTitle: string; code: string; type: string; value: number; uses: number; maxUses: number | null; expires: string | null; active: boolean }
export type CommissionRow = { id: string; promoter: string; eventTitle: string; amount: number; status: string; createdAt: string; paidAt: string | null }
export type EventOpt = { id: string; title: string; slug: string | null }
export type Defaults = { mode: string; value: number; tiers: { upto?: number; value: number }[] | null }

const readable = (m: string) => (m.match(/^[A-Z_]+(?::[a-z_]+)?: ([\s\S]*)$/)?.[1]) ?? m
const ctone: Record<string, BadgeTone> = { accrued: 'warning', approved: 'info', paid: 'success', void: 'neutral' }
const modeText = (mode: string | null, v: number | null) => !mode || mode === 'none' ? 'Tracking only' : mode === 'percent' ? `${v ?? 0}%` : mode === 'fixed' ? `${pkr(v)} per ticket` : 'Tiered'

export default function ReferralsClient(props: { promoters: Promoter[]; links: LinkRow[]; coupons: CouponRow[]; commissions: CommissionRow[]; events: EventOpt[]; defaults: Defaults; origin: string }) {
  const { promoters, links, coupons, commissions, events, defaults, origin } = props
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [modal, setModal] = useState<null | 'promoter' | 'link' | 'coupon' | 'rules'>(null)
  const [linkFor, setLinkFor] = useState<string>('')
  const [secret, setSecret] = useState<string | null>(null)
  const [qr, setQr] = useState<LinkRow | null>(null)
  const [copied, setCopied] = useState('')

  const act = (fn: () => PromiseLike<{ error: { message: string } | null }>) => { setError(null); start(async () => { const { error: e } = await fn(); if (e) return setError(readable(e.message)); router.refresh() }) }
  const linkUrl = (l: LinkRow) => `${origin}/events/${l.eventSlug}?ref=${encodeURIComponent(l.code)}`
  const copy = async (text: string, key: string) => { await navigator.clipboard.writeText(text); setCopied(key); setTimeout(() => setCopied(''), 1600) }

  const owed = commissions.filter(c => ['accrued', 'approved'].includes(c.status)).reduce((s, c) => s + c.amount, 0)
  const paid = commissions.filter(c => c.status === 'paid').reduce((s, c) => s + c.amount, 0)
  const sold = promoters.reduce((s, p) => s + p.sold, 0)

  return (
    <>
      {error && <p role="alert" className="mb-4 rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>}

      <section className="mb-6 grid gap-4 sm:grid-cols-3" aria-label="Totals">
        {[['Referred sales', String(sold), 'confirmed tickets'], ['Commission owed', pkr(owed), 'accrued or approved'], ['Paid out', pkr(paid), 'to promoters']].map(([k, v, h], i) => (
          <Card key={k} className="p-5"><p className="text-[13px] font-medium text-muted">{k}</p><p className={`mt-2 tnum text-3xl font-semibold tracking-tight ${i === 1 ? 'text-magenta' : 'text-fg'}`}>{v}</p><p className="mt-1 text-xs text-subtle">{h}</p></Card>
        ))}
      </section>

      <div className="grid items-start gap-6 xl:grid-cols-[1fr_340px]">
        <Card>
          <CardHeader title="Promoters" description="Each promoter gets links, codes and a private dashboard" action={<Button size="sm" leading={<UserPlus className="h-4 w-4" />} onClick={() => setModal('promoter')}>Add promoter</Button>} />
          {promoters.length === 0 ? (
            <EmptyState icon={<UserPlus className="h-6 w-6" />} title="No promoters yet" description="Add the people who sell for you. Every sale they bring is tracked." action={<Button onClick={() => setModal('promoter')}>Add promoter</Button>} />
          ) : (
            <ul className="mt-3 divide-y divide-line px-2 pb-2 sm:px-3">
              {promoters.map(p => {
                const mine = links.filter(l => l.referrerId === p.id)
                return (
                  <li key={p.id} className="px-3 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={p.name} size={40} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-fg">{p.name}{!p.active && <Badge tone="neutral" className="ml-2">Inactive</Badge>}</p>
                        <p className="truncate text-xs text-muted">{p.phone ?? p.email ?? 'No contact'} · {p.sold} sold</p>
                      </div>
                      <div className="text-right"><p className="tnum text-sm font-medium text-fg">{pkr(p.owed)}</p><p className="text-xs text-subtle">owed</p></div>
                      <Button size="icon-sm" variant="ghost" aria-label={`New link for ${p.name}`} onClick={() => { setLinkFor(p.id); setModal('link') }}><Plus className="h-4 w-4" /></Button>
                      <Button size="icon-sm" variant="ghost" aria-label={`New dashboard link for ${p.name}`} title="New dashboard link" onClick={() => act(async () => { const { data, error: e } = await supabase.rpc('rotate_referrer_token', { p_referrer: p.id }); if (!e) setSecret(`${origin}/promoter/${data}`); return { error: e } })}><KeyRound className="h-4 w-4" /></Button>
                    </div>
                    {mine.length > 0 && (
                      <ul className="mt-3 space-y-2 pl-[52px]">
                        {mine.map(l => (
                          <li key={l.id} className="flex flex-wrap items-center gap-2 rounded-xl bg-raised px-3 py-2 text-sm shadow-[inset_0_0_0_1px_rgb(var(--k-line))]">
                            <code className="rounded-md bg-magenta/12 px-2 py-0.5 font-mono text-xs text-magenta">{l.code}</code>
                            <span className="min-w-0 flex-1 truncate text-muted">{l.eventTitle} · {modeText(l.mode, l.value)}{l.discountValue ? ` · buyer ${l.discountType === 'percent' ? `${l.discountValue}%` : pkr(l.discountValue)} off` : ''}</span>
                            <span className="tnum text-xs text-subtle">{l.uses} uses</span>
                            <Button size="icon-sm" variant="ghost" aria-label="Copy link" onClick={() => copy(linkUrl(l), l.id)}>{copied === l.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}</Button>
                            <Button size="icon-sm" variant="ghost" aria-label="Show QR code" onClick={() => setQr(l)}><QrCode className="h-4 w-4" /></Button>
                            <Button size="icon-sm" variant="ghost" aria-label="Delete link" onClick={() => confirm('Delete this link? Past sales keep their attribution.') && act(() => supabase.from('referral_links').delete().eq('id', l.id))}><Trash2 className="h-4 w-4" /></Button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Default commission" description="Applies to new links unless overridden" action={<Percent className="h-4 w-4 text-subtle" aria-hidden />} />
            <CardBody className="space-y-3">
              <p className="text-2xl font-semibold tracking-tight text-fg">{modeText(defaults.mode, defaults.value)}</p>
              {defaults.mode === 'tiered' && defaults.tiers && <p className="text-xs text-muted">{defaults.tiers.map(t => `${t.upto ? `first ${t.upto}` : 'then'}: ${t.value}`).join(' · ')}</p>}
              <Button variant="secondary" size="sm" onClick={() => setModal('rules')}>Change rule</Button>
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Coupon codes" description="Open to anyone you give them to" action={<Button size="sm" variant="secondary" leading={<Plus className="h-4 w-4" />} onClick={() => setModal('coupon')}>New</Button>} />
            <CardBody>
              {coupons.length === 0 ? <p className="text-sm text-muted">No coupons yet.</p> : (
                <ul className="divide-y divide-line">
                  {coupons.map(c => (
                    <li key={c.id} className="flex items-center gap-2 py-2.5 text-sm">
                      <Ticket className="h-4 w-4 text-subtle" aria-hidden />
                      <div className="min-w-0 flex-1"><code className="font-mono text-xs text-fg">{c.code}</code><p className="truncate text-xs text-muted">{c.eventTitle} · {c.type === 'percent' ? `${c.value}%` : pkr(c.value)} off · {c.uses}{c.maxUses ? `/${c.maxUses}` : ''} used</p></div>
                      <Button size="sm" variant="ghost" onClick={() => act(() => supabase.from('coupons').update({ is_active: !c.active }).eq('id', c.id))}>{c.active ? 'Pause' : 'Resume'}</Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      <h2 className="mb-3 mt-10 text-lg font-semibold tracking-tight text-fg">Commissions</h2>
      {commissions.length === 0 ? <Card><CardBody><p className="text-sm text-muted">Commissions appear here when a referred payment is approved.</p></CardBody></Card> : (
        <TableWrap>
          <Table>
            <thead><tr><Th>Promoter</Th><Th>Event</Th><Th>Date</Th><Th className="text-right">Amount</Th><Th>Status</Th><Th className="text-right">Actions</Th></tr></thead>
            <tbody>
              {commissions.map(c => (
                <Tr key={c.id}>
                  <Td className="text-sm font-medium text-fg">{c.promoter}</Td><Td className="text-sm text-muted">{c.eventTitle}</Td><Td className="text-sm text-muted">{fmtDate(c.createdAt)}</Td>
                  <Td className="text-right"><span className="tnum text-sm text-fg">{pkr(c.amount)}</span></Td>
                  <Td><Badge tone={ctone[c.status] ?? 'neutral'}>{c.status}</Badge></Td>
                  <Td className="text-right">
                    {c.status === 'accrued' && <Button size="sm" variant="secondary" loading={pending} onClick={() => act(() => supabase.from('commissions').update({ status: 'approved' }).eq('id', c.id))}>Approve</Button>}
                    {c.status === 'approved' && <Button size="sm" loading={pending} onClick={() => act(() => supabase.from('commissions').update({ status: 'paid' }).eq('id', c.id))}>Mark paid</Button>}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </TableWrap>
      )}

      <PromoterModal open={modal === 'promoter'} onClose={() => setModal(null)} onCreated={url => { setModal(null); setSecret(url); router.refresh() }} origin={origin} />
      <LinkModal open={modal === 'link'} onClose={() => setModal(null)} promoters={promoters} events={events} defaultPromoter={linkFor} defaults={defaults} onDone={() => { setModal(null); router.refresh() }} />
      <CouponModal open={modal === 'coupon'} onClose={() => setModal(null)} events={events} onDone={() => { setModal(null); router.refresh() }} />
      <RulesModal open={modal === 'rules'} onClose={() => setModal(null)} defaults={defaults} onDone={() => { setModal(null); router.refresh() }} />

      <Modal open={!!secret} onClose={() => setSecret(null)} title="Promoter dashboard link" description="Share this with the promoter. It is only shown once.">
        {secret && <div className="space-y-4"><p className="break-all rounded-lg bg-raised p-3 font-mono text-xs text-fg">{secret}</p><div className="flex justify-end"><Button onClick={() => copy(secret, 'secret')} leading={copied === 'secret' ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}>{copied === 'secret' ? 'Copied' : 'Copy link'}</Button></div></div>}
      </Modal>
      <Modal open={!!qr} onClose={() => setQr(null)} title={qr ? `${qr.promoter}: ${qr.code}` : ''} description="Print it or share the image. Scans open the event with the code applied.">
        {qr && <div className="flex flex-col items-center gap-4"><div className="rounded-2xl bg-white p-4"><QRCodeSVG value={linkUrl(qr)} size={220} /></div><p className="break-all text-center text-xs text-muted">{linkUrl(qr)}</p></div>}
      </Modal>
    </>
  )
}

function PromoterModal({ open, onClose, onCreated, origin }: { open: boolean; onClose: () => void; onCreated: (url: string) => void; origin: string }) {
  const supabase = useMemo(() => createClient(), [])
  const [f, setF] = useState({ name: '', phone: '', email: '' }); const [err, setErr] = useState<string | null>(null); const [busy, setBusy] = useState(false)
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(null); if (!f.name.trim()) return setErr('Enter a name.')
    setBusy(true)
    const { data, error } = await supabase.rpc('create_referrer', { p_name: f.name.trim(), p_phone: f.phone.trim() || undefined, p_email: f.email.trim() || undefined })
    setBusy(false)
    if (error) return setErr(readable(error.message))
    const token = (data as { token?: string } | null)?.token
    setF({ name: '', phone: '', email: '' }); onCreated(token ? `${origin}/promoter/${token}` : origin)
  }
  return (
    <Modal open={open} onClose={onClose} title="Add a promoter" description="They do not need an account.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Name">{p => <Input {...p} value={f.name} onChange={e => setF({ ...f, name: e.target.value })} />}</Field>
        <div className="grid gap-4 sm:grid-cols-2"><Field label="Phone" optional>{p => <Input {...p} type="tel" value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} />}</Field><Field label="Email" optional>{p => <Input {...p} type="email" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} />}</Field></div>
        {err && <p role="alert" className="text-sm text-danger">{err}</p>}
        <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={onClose}>Cancel</Button><Button type="submit" loading={busy}>Add promoter</Button></div>
      </form>
    </Modal>
  )
}

function LinkModal({ open, onClose, promoters, events, defaultPromoter, defaults, onDone }: { open: boolean; onClose: () => void; promoters: Promoter[]; events: EventOpt[]; defaultPromoter: string; defaults: Defaults; onDone: () => void }) {
  const supabase = useMemo(() => createClient(), [])
  const [f, setF] = useState({ event: '', code: '', mode: 'default', value: '', dtype: 'percent', dvalue: '', funder: 'organizer', max: '' })
  const [err, setErr] = useState<string | null>(null); const [busy, setBusy] = useState(false)
  const promoter = promoters.find(p => p.id === defaultPromoter)
  const suggest = (promoter?.name.split(' ')[0] ?? 'REF').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) + Math.floor(10 + Math.random() * 90)
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(null)
    const event = f.event || events[0]?.id; const code = (f.code || suggest).trim()
    if (!event) return setErr('Create an event first.')
    if (!/^[A-Za-z0-9_-]{3,24}$/.test(code)) return setErr('The code can use letters, numbers, dash and underscore, 3 to 24 characters.')
    setBusy(true)
    const { error } = await supabase.from('referral_links').insert({
      event_id: event, referrer_id: defaultPromoter, code,
      ...(f.mode !== 'default' ? { commission_mode: f.mode as 'none' | 'percent' | 'fixed', commission_value: Number(f.value || 0) } : {}),
      ...(f.dvalue ? { buyer_discount_type: f.dtype as 'percent' | 'fixed', buyer_discount_value: Number(f.dvalue), discount_funded_by: f.funder as 'organizer' | 'referrer' | 'split' } : {}),
      max_uses: f.max ? Number(f.max) : null,
    })
    setBusy(false)
    if (error) return setErr(error.message.includes('duplicate') ? 'That code is already used for this event.' : readable(error.message))
    setF({ ...f, code: '', value: '', dvalue: '', max: '' }); onDone()
  }
  return (
    <Modal open={open} onClose={onClose} title={`New link${promoter ? ` for ${promoter.name}` : ''}`} description={`Default commission: ${modeText(defaults.mode, defaults.value)}`}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Event">{p => <Select {...p} value={f.event || events[0]?.id || ''} onChange={e => setF({ ...f, event: e.target.value })}>{events.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}</Select>}</Field>
        <Field label="Code" hint="What the promoter shares. Leave empty to generate one.">{p => <Input {...p} value={f.code} onChange={e => setF({ ...f, code: e.target.value })} placeholder={suggest} maxLength={24} />}</Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Commission">{p => <Select {...p} value={f.mode} onChange={e => setF({ ...f, mode: e.target.value })}><option value="default">Use my default</option><option value="none">Tracking only</option><option value="percent">Percent of ticket</option><option value="fixed">PKR per ticket</option></Select>}</Field>
          {['percent', 'fixed'].includes(f.mode) && <Field label={f.mode === 'percent' ? 'Percent' : 'PKR per ticket'}>{p => <Input {...p} inputMode="numeric" value={f.value} onChange={e => setF({ ...f, value: e.target.value.replace(/\D/g, '') })} />}</Field>}
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Buyer discount" optional>{p => <Input {...p} inputMode="numeric" value={f.dvalue} onChange={e => setF({ ...f, dvalue: e.target.value.replace(/\D/g, '') })} />}</Field>
          <Field label="Type">{p => <Select {...p} value={f.dtype} onChange={e => setF({ ...f, dtype: e.target.value })}><option value="percent">%</option><option value="fixed">PKR</option></Select>}</Field>
          <Field label="Paid by">{p => <Select {...p} value={f.funder} onChange={e => setF({ ...f, funder: e.target.value })}><option value="organizer">Me</option><option value="referrer">Promoter</option><option value="split">Split</option></Select>}</Field>
        </div>
        <Field label="Max uses" optional>{p => <Input {...p} inputMode="numeric" value={f.max} onChange={e => setF({ ...f, max: e.target.value.replace(/\D/g, '') })} />}</Field>
        {err && <p role="alert" className="text-sm text-danger">{err}</p>}
        <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={onClose}>Cancel</Button><Button type="submit" loading={busy}>Create link</Button></div>
      </form>
    </Modal>
  )
}

function CouponModal({ open, onClose, events, onDone }: { open: boolean; onClose: () => void; events: EventOpt[]; onDone: () => void }) {
  const supabase = useMemo(() => createClient(), [])
  const [f, setF] = useState({ event: '', code: '', type: 'percent', value: '', max: '', expires: '' }); const [err, setErr] = useState<string | null>(null); const [busy, setBusy] = useState(false)
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(null)
    if (!/^[A-Za-z0-9_-]{3,24}$/.test(f.code.trim())) return setErr('The code needs 3 to 24 letters or numbers.')
    if (!Number(f.value)) return setErr('Enter the discount amount.')
    setBusy(true)
    const { error } = await supabase.from('coupons').insert({ event_id: f.event || events[0]?.id, code: f.code.trim(), discount_type: f.type as 'percent' | 'fixed', discount_value: Number(f.value), max_uses: f.max ? Number(f.max) : null, expires_at: f.expires ? new Date(f.expires + '+05:00').toISOString() : null })
    setBusy(false)
    if (error) return setErr(error.message.includes('duplicate') ? 'That code is already used for this event.' : readable(error.message))
    setF({ event: '', code: '', type: 'percent', value: '', max: '', expires: '' }); onDone()
  }
  return (
    <Modal open={open} onClose={onClose} title="New coupon" description="A code anyone can enter at registration.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Event">{p => <Select {...p} value={f.event || events[0]?.id || ''} onChange={e => setF({ ...f, event: e.target.value })}>{events.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}</Select>}</Field>
        <Field label="Code">{p => <Input {...p} value={f.code} onChange={e => setF({ ...f, code: e.target.value })} maxLength={24} />}</Field>
        <div className="grid gap-4 sm:grid-cols-2"><Field label="Discount">{p => <Input {...p} inputMode="numeric" value={f.value} onChange={e => setF({ ...f, value: e.target.value.replace(/\D/g, '') })} />}</Field><Field label="Type">{p => <Select {...p} value={f.type} onChange={e => setF({ ...f, type: e.target.value })}><option value="percent">Percent</option><option value="fixed">PKR</option></Select>}</Field></div>
        <div className="grid gap-4 sm:grid-cols-2"><Field label="Max uses" optional>{p => <Input {...p} inputMode="numeric" value={f.max} onChange={e => setF({ ...f, max: e.target.value.replace(/\D/g, '') })} />}</Field><Field label="Expires" optional>{p => <Input {...p} type="datetime-local" value={f.expires} onChange={e => setF({ ...f, expires: e.target.value })} />}</Field></div>
        {err && <p role="alert" className="text-sm text-danger">{err}</p>}
        <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={onClose}>Cancel</Button><Button type="submit" loading={busy}>Create coupon</Button></div>
      </form>
    </Modal>
  )
}

function RulesModal({ open, onClose, defaults, onDone }: { open: boolean; onClose: () => void; defaults: Defaults; onDone: () => void }) {
  const supabase = useMemo(() => createClient(), [])
  const [mode, setMode] = useState(defaults.mode); const [value, setValue] = useState(String(defaults.value || ''))
  const [first, setFirst] = useState(String(defaults.tiers?.[0]?.upto ?? '')); const [firstV, setFirstV] = useState(String(defaults.tiers?.[0]?.value ?? '')); const [thenV, setThenV] = useState(String(defaults.tiers?.[1]?.value ?? ''))
  const [err, setErr] = useState<string | null>(null); const [busy, setBusy] = useState(false)
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(null); setBusy(true)
    const { data: { user } } = await supabase.auth.getUser()
    const tiers = mode === 'tiered' ? [{ upto: Number(first), value: Number(firstV) }, { value: Number(thenV) }] : null
    const { error } = await supabase.from('organizer_commission_defaults').upsert({ organizer_id: user!.id, mode: mode as 'none' | 'percent' | 'fixed' | 'tiered', value: mode === 'tiered' ? 0 : Number(value || 0), tiers })
    setBusy(false)
    if (error) return setErr(readable(error.message))
    onDone()
  }
  return (
    <Modal open={open} onClose={onClose} title="Default commission" description="Links can override this. Percent, fixed and tiered rules are on Growth and Pro.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Rule">{p => <Select {...p} value={mode} onChange={e => setMode(e.target.value)}><option value="none">Tracking only, no commission</option><option value="percent">Percent of each ticket</option><option value="fixed">Fixed PKR per ticket</option><option value="tiered">Tiered</option></Select>}</Field>
        {(mode === 'percent' || mode === 'fixed') && <Field label={mode === 'percent' ? 'Percent' : 'PKR per ticket'}>{p => <Input {...p} inputMode="numeric" value={value} onChange={e => setValue(e.target.value.replace(/\D/g, ''))} />}</Field>}
        {mode === 'tiered' && (
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="First N tickets">{p => <Input {...p} inputMode="numeric" value={first} onChange={e => setFirst(e.target.value.replace(/\D/g, ''))} />}</Field>
            <Field label="Percent for those">{p => <Input {...p} inputMode="numeric" value={firstV} onChange={e => setFirstV(e.target.value.replace(/\D/g, ''))} />}</Field>
            <Field label="Percent after">{p => <Input {...p} inputMode="numeric" value={thenV} onChange={e => setThenV(e.target.value.replace(/\D/g, ''))} />}</Field>
          </div>
        )}
        {err && <p role="alert" className="text-sm text-danger">{err}</p>}
        <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={onClose}>Cancel</Button><Button type="submit" loading={busy}>Save rule</Button></div>
      </form>
    </Modal>
  )
}
