'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { CheckCircle2, Clock, Copy, Lock, MapPin, ShieldCheck, Upload } from 'lucide-react'
import { Badge, Button, Card, CardBody, Field, Input } from '@/components/kit'
import { createClient } from '@/lib/supabase/client'
import { fmtDateTime, pkr } from '@/lib/format'
import { cn } from '@/lib/cn'

export type Tier = { id: string; name: string; price: number; original: number | null; isVip: boolean; seatsLeft: number | null; salesEnd: string | null }
type Reg = { id: string; status: string; qr_token: string; price_due_pkr: number; is_vip: boolean; ticket_types: { name: string } | null }
type Account = { method: string; account_title: string; account_number: string; bank_name: string | null; iban: string | null; instructions: string | null }

const readable = (m: string) => (m.match(/^[A-Z_]+(?::[a-z_]+)?: ([\s\S]*)$/)?.[1]) ?? m

export default function RegisterPanel({ eventId, slug, tiers, approval, signedIn, role, isSecret, initialRef, soldOut, ended }: {
  eventId: string; slug: string; tiers: Tier[]; approval: boolean; signedIn: boolean; role: string | null; isSecret: boolean; initialRef: string; soldOut: boolean; ended: boolean
}) {
  const supabase = useMemo(() => createClient(), [])
  const [reg, setReg] = useState<Reg | null>(null)
  const [loaded, setLoaded] = useState(!signedIn)
  const [tier, setTier] = useState(tiers.find(t => t.seatsLeft !== 0)?.id ?? '')
  const [code, setCode] = useState(initialRef)
  const [codeInfo, setCodeInfo] = useState<{ ok: boolean; text: string } | null>(null)
  const [plusOne, setPlusOne] = useState(false)
  const [busy, setBusy] = useState(false); const [err, setErr] = useState<string | null>(null)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [secret, setSecret] = useState<{ venue_address?: string | null; venue_notes?: string | null } | null>(null)
  const [file, setFile] = useState<File | null>(null); const [ref, setRef] = useState('')

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return setLoaded(true)
    const { data } = await supabase.from('registrations').select('id, status, qr_token, price_due_pkr, is_vip, ticket_types(name)')
      .eq('event_id', eventId).eq('attendee_id', user.id).not('status', 'in', '(cancelled,rejected)').maybeSingle()
    setReg(data as Reg | null); setLoaded(true)
    if (data?.status === 'awaiting_payment') {
      const { data: links } = await supabase.from('event_payment_accounts').select('payment_accounts(method, account_title, account_number, bank_name, iban, instructions)').eq('event_id', eventId)
      setAccounts((links ?? []).map(l => l.payment_accounts as unknown as Account).filter(Boolean))
    }
    if (data && ['confirmed', 'checked_in'].includes(data.status)) {
      const { data: s } = await supabase.rpc('get_event_secret', { p_event: eventId })
      setSecret(s as typeof secret)
    }
  }, [supabase, eventId])
  useEffect(() => { if (signedIn) load() }, [signedIn, load])

  const selected = tiers.find(t => t.id === tier)
  async function checkCode() {
    if (!code.trim()) return setCodeInfo(null)
    const { data, error } = await supabase.rpc('preview_code', { p_event: eventId, p_code: code.trim(), p_ticket_type: tier || undefined })
    const d = data as { valid?: boolean; discount_pkr?: number; kind?: string; reason?: string } | null
    setCodeInfo(error || !d?.valid ? { ok: false, text: d?.reason ?? 'That code is not valid for this event.' } : { ok: true, text: d.discount_pkr ? `Code applied: ${pkr(d.discount_pkr)} off` : 'Code applied' })
  }

  async function register() {
    setErr(null); setBusy(true)
    const { error } = await supabase.rpc('register_for_event', { p_event: eventId, p_ticket_type: tier || undefined, p_code: code.trim() || undefined, p_plus_one: plusOne })
    setBusy(false)
    if (error) return setErr(readable(error.message))
    await load()
  }

  async function pay(e: React.FormEvent) {
    e.preventDefault(); setErr(null)
    if (!reg || !file) return setErr('Attach your transfer screenshot.')
    setBusy(true)
    const { data: { user } } = await supabase.auth.getUser()
    const path = `${user!.id}/${reg.id}/${crypto.randomUUID()}.${file.name.split('.').pop()}`
    const up = await supabase.storage.from('payment-proofs').upload(path, file, { contentType: file.type })
    if (up.error) { setBusy(false); return setErr('The screenshot could not be uploaded.') }
    const { error } = await supabase.rpc('submit_payment', { p_registration: reg.id, p_screenshot_path: path, p_reference: ref.trim() || undefined })
    setBusy(false)
    if (error) return setErr(readable(error.message))
    setFile(null); await load()
  }

  const cancel = async () => { if (reg && confirm('Cancel your registration?')) { await supabase.rpc('cancel_registration', { p_registration: reg.id }); setReg(null) } }

  if (!loaded) return <Card><CardBody><div className="h-40 animate-pulse rounded-xl bg-raised" /></CardBody></Card>

  // already registered
  if (reg) {
    const s = reg.status
    return (
      <Card className="k-gradient-ring"><CardBody className="space-y-4">
        {s === 'requested' && <Status icon={<Clock className="h-6 w-6 text-info" />} title="Request sent" body="The organizer will review it. We will notify you." />}
        {s === 'waitlisted' && <Status icon={<Clock className="h-6 w-6 text-info" />} title="You are on the waitlist" body="You will hear from us if a place opens up." />}
        {s === 'payment_submitted' && <Status icon={<Clock className="h-6 w-6 text-warning" />} title="Payment received" body="The organizer is checking your screenshot. Your QR ticket appears once it is approved." />}
        {s === 'no_show' && <Status icon={<Clock className="h-6 w-6 text-muted" />} title="Marked as a no show" body="You did not check in to this event." />}

        {s === 'awaiting_payment' && (
          <>
            <Status icon={<Upload className="h-6 w-6 text-accent" />} title={`Pay ${pkr(reg.price_due_pkr)}`} body="Send the amount, then upload the screenshot." />
            {accounts.map((a, i) => (
              <div key={i} className="rounded-xl bg-raised p-3.5 text-sm shadow-[inset_0_0_0_1px_rgb(var(--k-line))]">
                <p className="font-medium text-fg">{a.bank_name ?? a.method} <span className="font-normal text-muted">· {a.account_title}</span></p>
                <p className="mt-1 flex items-center gap-2 font-mono text-[13px] text-fg">{a.account_number}<button onClick={() => navigator.clipboard.writeText(a.account_number)} aria-label="Copy account number" className="text-subtle hover:text-fg"><Copy className="h-3.5 w-3.5" /></button></p>
                {a.iban && <p className="font-mono text-xs text-muted">{a.iban}</p>}{a.instructions && <p className="mt-1 text-xs text-muted">{a.instructions}</p>}
              </div>
            ))}
            <form onSubmit={pay} className="space-y-3">
              <Field label="Transfer screenshot">{p => <label className="flex h-24 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed border-line-strong bg-raised text-sm text-muted hover:border-accent"><Upload className="h-5 w-5" />{file ? file.name : 'Choose a screenshot'}<input {...p} type="file" accept="image/*,application/pdf" className="sr-only" onChange={e => setFile(e.target.files?.[0] ?? null)} /></label>}</Field>
              <Field label="Reference" optional>{p => <Input {...p} value={ref} onChange={e => setRef(e.target.value)} placeholder="Transaction ID" />}</Field>
              {err && <p role="alert" className="text-sm text-danger">{err}</p>}
              <Button type="submit" className="w-full" loading={busy}>Submit payment</Button>
            </form>
          </>
        )}

        {['confirmed', 'checked_in'].includes(s) && (
          <>
            <Status icon={<CheckCircle2 className="h-6 w-6 text-success" />} title={s === 'checked_in' ? 'You are checked in' : "You're in"} body={`${reg.ticket_types?.name ?? 'Ticket'}${reg.is_vip ? ' · VIP' : ''}`} />
            <div className="mx-auto w-fit rounded-2xl bg-white p-4"><QRCodeSVG value={reg.qr_token} size={188} /></div>
            <p className="text-center text-xs text-muted">Show this at the door. Do not share it.</p>
            {secret?.venue_address ? (
              <div className="rounded-xl bg-violet/10 p-3.5 text-sm"><p className="flex items-center gap-2 font-medium text-fg"><MapPin className="h-4 w-4 text-violet" />{secret.venue_address}</p>{secret.venue_notes && <p className="mt-1 text-muted">{secret.venue_notes}</p>}</div>
            ) : isSecret ? <p className="flex items-center gap-2 rounded-xl bg-violet/10 p-3.5 text-sm text-muted"><Lock className="h-4 w-4 text-violet" />The location is revealed to you before the event.</p> : null}
            <Link href="/guest/tickets" className="block text-center text-sm font-medium text-accent hover:underline">All my tickets</Link>
          </>
        )}
        {!['checked_in', 'no_show'].includes(s) && <button onClick={cancel} className="w-full text-center text-xs text-subtle hover:text-danger">Cancel registration</button>}
      </CardBody></Card>
    )
  }

  // not registered
  const priceNow = selected?.price ?? 0
  return (
    <Card className="k-gradient-ring"><CardBody className="space-y-4">
      <h2 className="text-lg font-semibold tracking-tight text-fg">{approval ? 'Request a place' : 'Get your ticket'}</h2>
      {tiers.length > 0 && (
        <fieldset className="space-y-2"><legend className="sr-only">Choose a ticket</legend>
          {tiers.map(t => {
            const out = t.seatsLeft === 0; const on = tier === t.id
            return (
              <label key={t.id} className={cn('flex cursor-pointer items-center gap-3 rounded-xl p-3.5 transition-colors', out && 'cursor-not-allowed opacity-50', on ? (t.isVip ? 'bg-magenta/8 shadow-[inset_0_0_0_1.5px_rgb(var(--k-magenta))]' : 'bg-accent/8 shadow-[inset_0_0_0_1.5px_rgb(var(--k-accent))]') : 'bg-raised shadow-[inset_0_0_0_1px_rgb(var(--k-line))] hover:bg-overlay')}>
                <input type="radio" name="ticket" className="sr-only" disabled={out} checked={on} onChange={() => setTier(t.id)} />
                <span className={cn('grid h-5 w-5 place-items-center rounded-full border-2', on ? (t.isVip ? 'border-magenta' : 'border-accent') : 'border-line-strong')}>{on && <span className={cn('h-2.5 w-2.5 rounded-full', t.isVip ? 'bg-magenta' : 'bg-accent')} />}</span>
                <span className="min-w-0 flex-1"><span className="flex items-center gap-2 text-sm font-medium text-fg">{t.name}{t.isVip && <Badge tone="magenta">VIP</Badge>}{out ? <Badge tone="danger">Sold out</Badge> : t.seatsLeft !== null && t.seatsLeft <= 10 && <Badge tone="warning">{t.seatsLeft} left</Badge>}</span>{t.salesEnd && <span className="block text-xs text-muted">Until {fmtDateTime(t.salesEnd)}</span>}</span>
                <span className="text-right">{t.original && t.original > t.price && <span className="tnum block text-xs text-subtle line-through">{pkr(t.original)}</span>}<span className="tnum text-sm font-semibold text-fg">{t.price === 0 ? 'Free' : pkr(t.price)}</span></span>
              </label>
            )
          })}
        </fieldset>
      )}
      <div className="flex gap-2">
        <Input aria-label="Promo or referral code" placeholder="Have a code?" value={code} onChange={e => { setCode(e.target.value); setCodeInfo(null) }} onBlur={checkCode} />
        <Button variant="secondary" type="button" onClick={checkCode}>Apply</Button>
      </div>
      {codeInfo && <p role="status" className={cn('text-sm', codeInfo.ok ? 'text-success' : 'text-danger')}>{codeInfo.text}</p>}
      <label className="flex cursor-pointer items-center gap-2 text-sm text-muted"><input type="checkbox" checked={plusOne} onChange={e => setPlusOne(e.target.checked)} className="h-4 w-4 accent-[rgb(var(--k-accent))]" /> I am bringing a plus one</label>
      {err && <p role="alert" className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">{err}</p>}

      {!signedIn ? (
        <Button size="lg" className="w-full" onClick={() => { location.href = `/auth/login?next=${encodeURIComponent(`/events/${slug}${initialRef ? `?ref=${initialRef}` : ''}`)}` }}>Log in to register</Button>
      ) : role !== 'attendee' ? (
        <p className="rounded-xl bg-raised px-3 py-2.5 text-sm text-muted">Organizer accounts cannot register. Use an attendee account to attend events.</p>
      ) : (
        <Button size="lg" className="w-full" onClick={register} loading={busy} disabled={soldOut || ended || !tier}>
          {ended ? 'Registration closed' : soldOut ? 'Sold out' : approval ? 'Request to attend' : priceNow === 0 ? 'Register free' : `Register · ${pkr(priceNow)}`}
        </Button>
      )}
      <p className="flex items-center justify-center gap-1.5 text-xs text-subtle"><ShieldCheck className="h-3.5 w-3.5" aria-hidden />You pay the organizer directly. TIKKIT X never holds your money.</p>
    </CardBody></Card>
  )
}

function Status({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return <div className="flex items-start gap-3"><span className="mt-0.5">{icon}</span><div><p className="text-base font-semibold text-fg">{title}</p><p className="text-sm text-muted">{body}</p></div></div>
}
