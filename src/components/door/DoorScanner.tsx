'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Camera, CameraOff, Check, Search, ShieldAlert, Users, X } from 'lucide-react'
import { Avatar, Badge, Button, Card, CardBody, CardHeader, Input, Progress } from '@/components/kit'
import { fmtTime } from '@/lib/format'
import { cn } from '@/lib/cn'

export type ScanOutcome = 'admitted' | 'duplicate' | 'not_approved' | 'wrong_day' | 'invalid'
export type ScanResult = { result: ScanOutcome; name?: string | null; ticket?: string | null; is_vip?: boolean; plus_one?: boolean; at: string }
export type LookupRow = { id: string; name: string; ticket: string | null; status: string; isVip: boolean; plusOne: boolean }
export type DoorApi = {
  scan(token: string): Promise<Omit<ScanResult, 'at'>>
  admit(registrationId: string): Promise<Omit<ScanResult, 'at'>>
  lookup(query: string): Promise<LookupRow[]>
  counts(): Promise<{ expected: number; admitted: number }>
}

const UI: Record<ScanOutcome, { title: string; tone: 'success' | 'warning' | 'danger'; hint: string }> = {
  admitted: { title: 'Admitted', tone: 'success', hint: 'Let them in' },
  duplicate: { title: 'Already checked in', tone: 'warning', hint: 'This ticket was used. Check ID and the time below.' },
  not_approved: { title: 'Not approved', tone: 'danger', hint: 'Payment or approval is still pending. Send them to the organizer.' },
  wrong_day: { title: 'Wrong day', tone: 'warning', hint: 'This ticket is not valid today.' },
  invalid: { title: 'Invalid code', tone: 'danger', hint: 'Not a ticket for this event.' },
}
const toneCls = {
  success: { bg: 'bg-success/10', ring: 'ring-success/40', text: 'text-success' },
  warning: { bg: 'bg-warning/10', ring: 'ring-warning/40', text: 'text-warning' },
  danger: { bg: 'bg-danger/10', ring: 'ring-danger/40', text: 'text-danger' },
}

/** QR payloads are the token itself, or a link ending in the token. */
const tokenFrom = (text: string) => text.trim().split(/[/?#]/).filter(Boolean).pop() ?? text.trim()

export default function DoorScanner({ api, title }: { api: DoorApi; title?: string }) {
  const [cam, setCam] = useState<'idle' | 'starting' | 'on' | 'error'>('idle')
  const [last, setLast] = useState<ScanResult | null>(null)
  const [recent, setRecent] = useState<ScanResult[]>([])
  const [counts, setCounts] = useState<{ expected: number; admitted: number } | null>(null)
  const [query, setQuery] = useState('')
  const [rows, setRows] = useState<LookupRow[]>([])
  const [manual, setManual] = useState('')
  const [busy, setBusy] = useState(false)
  const [offline, setOffline] = useState(false)
  const scanner = useRef<{ stop: () => Promise<void>; clear: () => void } | null>(null)
  const lastText = useRef<{ text: string; at: number }>({ text: '', at: 0 })

  const record = useCallback((r: Omit<ScanResult, 'at'>) => {
    const full = { ...r, at: new Date().toISOString() }
    setLast(full)
    setRecent(p => [full, ...p].slice(0, 12))
    if (navigator.vibrate) navigator.vibrate(r.result === 'admitted' ? 60 : [80, 60, 80])
    api.counts().then(setCounts).catch(() => {})
  }, [api])

  const guarded = useCallback(async (fn: () => Promise<Omit<ScanResult, 'at'>>) => {
    setBusy(true)
    try { record(await fn()); setOffline(false) }
    catch { setOffline(true) }
    finally { setBusy(false) }
  }, [record])

  const onText = useCallback((text: string) => {
    const now = Date.now()
    if (lastText.current.text === text && now - lastText.current.at < 3000) return
    lastText.current = { text, at: now }
    guarded(() => api.scan(tokenFrom(text)))
  }, [api, guarded])

  async function startCamera() {
    setCam('starting')
    try {
      const { Html5Qrcode } = await import('html5-qrcode')
      const q = new Html5Qrcode('door-reader')
      scanner.current = q
      await q.start({ facingMode: 'environment' }, { fps: 10, qrbox: { width: 240, height: 240 } }, onText, () => {})
      setCam('on')
    } catch {
      setCam('error')
    }
  }
  async function stopCamera() {
    try { await scanner.current?.stop(); scanner.current?.clear() } catch { /* already stopped */ }
    scanner.current = null; setCam('idle')
  }
  useEffect(() => () => { scanner.current?.stop().catch(() => {}) }, [])

  useEffect(() => {
    api.counts().then(setCounts).catch(() => {})
    const t = setInterval(() => api.counts().then(setCounts).catch(() => {}), 10000)
    return () => clearInterval(t)
  }, [api])

  useEffect(() => {
    if (query.trim().length < 2) { setRows([]); return }
    const t = setTimeout(() => api.lookup(query.trim()).then(setRows).catch(() => setRows([])), 250)
    return () => clearTimeout(t)
  }, [query, api])

  const pct = counts && counts.expected ? Math.round((counts.admitted / counts.expected) * 100) : 0
  const ui = last ? UI[last.result] : null

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[1.15fr_1fr]">
      <div className="space-y-6">
        <Card>
          <CardHeader title={title ?? 'Scanner'} description="Point the camera at the guest's QR ticket"
            action={cam === 'on'
              ? <Button size="sm" variant="secondary" leading={<CameraOff className="h-4 w-4" />} onClick={stopCamera}>Stop</Button>
              : <Button size="sm" leading={<Camera className="h-4 w-4" />} onClick={startCamera} loading={cam === 'starting'}>Start camera</Button>} />
          <CardBody>
            <div className="relative overflow-hidden rounded-2xl bg-canvas">
              <div id="door-reader" className="min-h-[260px] w-full [&_video]:w-full" />
              {cam !== 'on' && (
                <div className="absolute inset-0 grid place-items-center text-center text-sm text-muted">
                  <div className="px-6">
                    <Camera className="mx-auto mb-3 h-7 w-7 text-subtle" aria-hidden />
                    {cam === 'error' ? 'We could not open the camera. Allow camera access in your browser, or type the code below.' : 'Camera is off.'}
                  </div>
                </div>
              )}
            </div>
            {offline && <p role="alert" className="mt-3 flex items-center gap-2 rounded-xl bg-warning/10 px-3 py-2 text-sm text-warning"><ShieldAlert className="h-4 w-4" /> No connection. Hold the guest and scan again when it returns.</p>}
            <form className="mt-4 flex gap-2" onSubmit={e => { e.preventDefault(); if (manual.trim()) { const t = manual; setManual(''); guarded(() => api.scan(tokenFrom(t))) } }}>
              <Input aria-label="Ticket code" placeholder="Or type the ticket code" value={manual} onChange={e => setManual(e.target.value)} />
              <Button type="submit" variant="secondary" loading={busy}>Check</Button>
            </form>
          </CardBody>
        </Card>

        {last && ui && (
          <div role="status" aria-live="assertive" className={cn('k-pop flex items-center gap-4 rounded-2xl p-5 ring-1', last.is_vip && last.result === 'admitted' ? 'bg-magenta/10 ring-magenta/40' : [toneCls[ui.tone].bg, toneCls[ui.tone].ring])}>
            <span className={cn('grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-canvas/60', last.is_vip && last.result === 'admitted' ? 'text-magenta' : toneCls[ui.tone].text)}>
              {last.result === 'admitted' ? <Check className="h-7 w-7" /> : <X className="h-7 w-7" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className={cn('text-lg font-semibold', last.is_vip && last.result === 'admitted' ? 'text-magenta' : toneCls[ui.tone].text)}>{ui.title}</p>
              {last.name && <p className="flex flex-wrap items-center gap-2 text-base font-medium text-fg">{last.name}{last.is_vip && <Badge tone="magenta">VIP</Badge>}{last.plus_one && <Badge tone="info">+1</Badge>}</p>}
              <p className="text-sm text-muted">{last.ticket ? `${last.ticket} · ` : ''}{ui.hint}</p>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader title="At the door" action={<Users className="h-5 w-5 text-subtle" aria-hidden />} />
          <CardBody>
            <div className="flex items-baseline justify-between">
              <span className="tnum text-4xl font-semibold tracking-tight text-fg">{counts?.admitted ?? '—'}</span>
              <span className="tnum text-sm text-muted">of {counts?.expected ?? '—'} expected</span>
            </div>
            <div className="mt-3"><Progress value={pct} /></div>
            <p className="mt-2 text-xs text-subtle">{pct}% checked in</p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Find a guest" description="When the QR will not scan" />
          <CardBody className="space-y-3">
            <Input leading={<Search className="h-4 w-4" />} placeholder="Name or phone" aria-label="Search guests" value={query} onChange={e => setQuery(e.target.value)} />
            <ul className="space-y-1">
              {rows.map(r => (
                <li key={r.id} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-raised">
                  <Avatar name={r.name} size={32} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-fg">{r.name}{r.isVip && <Badge tone="magenta" className="ml-2 px-1.5 py-0 text-[10px]">VIP</Badge>}</p>
                    <p className="truncate text-xs text-muted">{r.ticket ?? 'Ticket'}{r.plusOne ? ' · +1' : ''}</p>
                  </div>
                  {r.status === 'checked_in'
                    ? <Badge tone="accent">Inside</Badge>
                    : <Button size="sm" onClick={() => guarded(() => api.admit(r.id))}>Admit</Button>}
                </li>
              ))}
              {query.trim().length >= 2 && rows.length === 0 && <li className="px-2 py-3 text-sm text-muted">No confirmed guest matches.</li>}
            </ul>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Recent scans" />
          <CardBody>
            {recent.length === 0 ? <p className="text-sm text-muted">Scans appear here.</p> : (
              <ul className="divide-y divide-line">
                {recent.map((r, i) => (
                  <li key={i} className="flex items-center gap-3 py-2.5 text-sm">
                    <span className={cn('h-2 w-2 rounded-full', r.result === 'admitted' ? 'bg-success' : r.result === 'duplicate' || r.result === 'wrong_day' ? 'bg-warning' : 'bg-danger')} aria-hidden />
                    <span className="min-w-0 flex-1 truncate text-fg">{r.name ?? 'Unknown code'}</span>
                    <span className="text-xs text-muted">{UI[r.result].title}</span>
                    <span className="tnum text-xs text-subtle">{fmtTime(r.at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
