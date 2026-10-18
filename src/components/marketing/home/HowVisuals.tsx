'use client'

import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Check, Copy, Crown, Flame, Lock, LockOpen, MapPin, Megaphone, Search, Upload } from 'lucide-react'
import { cn } from '@/lib/cn'

/** Small animated illustrations for each step. Each fills a stage card and uses only kit tokens. */
const Box = ({ children, className }: { children: React.ReactNode; className?: string }) => <div className={cn('w-full max-w-[300px] space-y-3', className)}>{children}</div>
const Row = ({ children, className }: { children: React.ReactNode; className?: string }) => <div className={cn('flex items-center gap-2.5 rounded-xl bg-raised px-3 py-2.5 text-sm shadow-card', className)}>{children}</div>

function useLoop(ms: number, n: number) {
  const [i, setI] = useState(0)
  useEffect(() => { const t = setInterval(() => setI(v => (v + 1) % n), ms); return () => clearInterval(t) }, [ms, n])
  return i
}

/* ── organizer ─────────────────────────────────────────────── */
export function CreateVisual() {
  const i = useLoop(1800, 4)
  return (
    <Box>
      <div className="rounded-xl bg-raised p-3 shadow-card"><p className="text-[11px] text-subtle">Event name</p><p className="mt-0.5 text-sm font-medium text-fg">Rooftop Sunset Session<span className="ml-0.5 inline-block h-4 w-px animate-pulse bg-accent align-middle" /></p></div>
      <div className="flex flex-wrap gap-2">
        {['Early bird PKR 1,800', 'General PKR 2,500', 'VIP PKR 6,000'].map((t, k) => <span key={t} className={cn('rounded-full px-3 py-1 text-xs font-medium ring-1 transition-all duration-500', k <= i ? 'k-pop-in bg-accent/12 text-accent ring-accent/40' : 'opacity-30 ring-line text-muted')}>{t}</span>)}
      </div>
      <Row><Lock className="h-4 w-4 text-violet" /><span className="flex-1 text-fg">Secret location</span><span className={cn('h-5 w-9 rounded-full p-0.5 transition-colors', i >= 3 ? 'bg-accent' : 'bg-line-strong')}><span className={cn('block h-4 w-4 rounded-full bg-white transition-transform', i >= 3 && 'translate-x-4')} /></span></Row>
    </Box>
  )
}

export function ShareVisual() {
  const i = useLoop(1400, 5)
  const rows = [['Zain R.', 'ZAIN10', 64], ['Areeba N.', 'AREEBA20', 41], ['Hassan K.', 'HK15', 27]] as const
  return (
    <Box>
      <Row className="font-mono text-xs"><span className="flex-1 truncate text-fg">tikkitx.com/events/rooftop-sunset</span><Copy className="h-3.5 w-3.5 text-subtle" /></Row>
      {rows.map(([n, c, v], k) => (
        <Row key={n}><span className="grid h-7 w-7 place-items-center rounded-full bg-magenta/14 text-[11px] font-semibold text-magenta">{n[0]}</span><span className="flex-1 text-fg">{n}</span><code className="rounded bg-magenta/12 px-1.5 py-0.5 font-mono text-[11px] text-magenta">{c}</code><span className="tnum w-8 text-right text-xs text-muted">{v + (k === i % 3 ? 1 : 0)}</span></Row>
      ))}
      <p className="text-center text-xs text-subtle">Every sale is tracked to a promoter</p>
    </Box>
  )
}

export function ApproveVisual() {
  const i = useLoop(1500, 4)
  return (
    <Box>
      {['Hamza S.', 'Mehreen Q.', 'Danish A.'].map((n, k) => {
        const done = k < i
        return (
          <Row key={n}><span className="flex-1 text-fg">{n}<span className="block text-[11px] text-muted">Receipt received · Trusted</span></span>
            <span className={cn('inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors duration-500', done ? 'bg-success/12 text-success' : 'bg-accent text-accent-fg')}>{done ? <><Check className="h-3.5 w-3.5" />Approved</> : 'Approve'}</span></Row>
        )
      })}
    </Box>
  )
}

export function AnnounceVisual() {
  const i = useLoop(2600, 2)
  return (
    <Box>
      <div className="rounded-xl bg-raised p-3 shadow-card"><div className="flex items-center justify-between text-[11px] text-muted"><span>Location</span><span className={cn('inline-flex items-center gap-1', i ? 'text-success' : 'text-violet')}>{i ? <LockOpen className="h-3 w-3" /> : <Lock className="h-3 w-3" />}{i ? 'Revealed' : 'Secret'}</span></div>
        <p className={cn('mt-1.5 flex items-center gap-1.5 text-sm font-medium text-fg transition-[filter] duration-700', i ? 'blur-0' : 'blur-[6px]')}><MapPin className="h-3.5 w-3.5 text-accent" />Plot 7, Phase 6, DHA</p></div>
      <div className="k-pop-in flex gap-2.5 rounded-xl bg-accent/12 p-3 text-sm text-fg"><Megaphone className="mt-0.5 h-4 w-4 shrink-0 text-accent" /><span>Doors open at 8 pm. Smart casual.<span className="mt-0.5 block text-[11px] text-muted">Sent to 212 guests</span></span></div>
    </Box>
  )
}

const SCANS = [['Mehreen Q.', 'VIP admitted', 'magenta'], ['Hamza S.', 'Admitted', 'success'], ['Hamza S.', 'Already inside', 'warning']] as const
export function DoorVisual() {
  const i = useLoop(2400, SCANS.length)
  const s = SCANS[i]
  const c = s[2] === 'magenta' ? 'bg-magenta/14 text-magenta' : s[2] === 'warning' ? 'bg-warning/14 text-warning' : 'bg-success/12 text-success'
  return (
    <Box className="text-center">
      <div className="relative mx-auto w-36 overflow-hidden rounded-2xl bg-white p-2.5"><QRCodeSVG value="how-it-works" size={116} /><span aria-hidden className="k-scanline absolute inset-x-1.5 h-0.5 rounded-full bg-accent shadow-[0_0_14px_3px_rgb(var(--k-accent)/0.8)]" /></div>
      <div key={i} className={cn('k-pop-in flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium', c)}>{s[2] === 'magenta' ? <Crown className="h-4 w-4" /> : <Check className="h-4 w-4" />}{s[0]} · {s[1]}</div>
      <p className="tnum text-xs text-muted">212 / 340 inside</p>
    </Box>
  )
}

/* ── guest ─────────────────────────────────────────────────── */
export function FindVisual() {
  const i = useLoop(1800, 3)
  return (
    <Box>
      <Row><Search className="h-4 w-4 text-subtle" /><span className="flex-1 text-muted">Karachi · this weekend</span></Row>
      {[['Rooftop Sunset Session', 'Fri 7:30 pm', 'From PKR 1,800'], ['Jazz Under the Stars', 'Sat 9:00 pm', 'From PKR 2,500'], ['Sunday Run Club', 'Sun 7:00 am', 'Free']].map(([t, w, p], k) => (
        <div key={t} className={cn('rounded-xl bg-raised p-3 shadow-card transition-all duration-500', k === i && 'ring-1 ring-accent/50 -translate-y-0.5')}><p className="text-sm font-medium text-fg">{t}</p><p className="mt-0.5 flex justify-between text-xs text-muted"><span>{w}</span><span className="text-fg">{p}</span></p></div>
      ))}
    </Box>
  )
}

export function PayVisual() {
  const i = useLoop(2000, 3)
  return (
    <Box>
      {[['JazzCash', '0300 123 4567'], ['Meezan Bank', 'PK36 MEZN 0001 4488'], ['EasyPaisa', '0345 987 6543']].map(([n, v], k) => (
        <Row key={n} className={cn('transition-all duration-500', k === i && 'ring-1 ring-accent/50')}><div className="flex-1"><p className="text-sm font-medium text-fg">{n}</p><p className="tnum text-xs text-muted">{v}</p></div>{k === i ? <span className="k-pop-in inline-flex items-center gap-1 text-[11px] text-success"><Check className="h-3 w-3" />Copied</span> : <Copy className="h-3.5 w-3.5 text-subtle" />}</Row>
      ))}
      <p className="text-center text-xs text-subtle">You pay the organizer directly</p>
    </Box>
  )
}

export function UploadVisual() {
  const i = useLoop(1100, 5)
  return (
    <Box>
      <div className="grid h-28 place-items-center rounded-2xl border border-dashed border-line-strong bg-raised text-center">
        {i < 4 ? <div><Upload className="mx-auto h-5 w-5 text-accent" /><p className="mt-1 text-sm text-fg">receipt.png</p><div className="mx-auto mt-2 h-1.5 w-32 rounded-full bg-overlay"><div className="h-full rounded-full bg-accent transition-[width] duration-700" style={{ width: `${(i + 1) * 25}%` }} /></div></div>
          : <p className="k-pop-in inline-flex items-center gap-1.5 text-sm font-medium text-success"><Check className="h-4 w-4" />Sent to the organizer</p>}
      </div>
      <Row><span className={cn('h-2 w-2 rounded-full', i === 4 ? 'bg-warning' : 'bg-line-strong')} /><span className="flex-1 text-fg">{i === 4 ? 'Waiting for approval' : 'Uploading'}</span></Row>
    </Box>
  )
}

export function TicketVisual() {
  return (
    <Box>
      <div className="k-floaty rounded-3xl bg-surface p-4 shadow-card" style={{ ['--d' as string]: '6s' }}>
        <div className="flex items-center justify-between"><span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">Ticket</span><span className="inline-flex items-center gap-1 rounded-full bg-magenta/14 px-2 py-0.5 text-[11px] font-medium text-magenta"><Crown className="h-3 w-3" />VIP</span></div>
        <p className="mt-1.5 text-sm font-semibold text-fg">Rooftop Sunset Session</p><p className="text-xs text-muted">Fri 17 Oct · 7:30 pm</p>
        <div className="mx-auto mt-3 w-fit rounded-xl bg-white p-2.5"><QRCodeSVG value="how-it-works-ticket" size={112} /></div>
      </div>
      <p className="text-center text-xs text-subtle">Signed and single use</p>
    </Box>
  )
}

export function ScoreVisual() {
  const i = useLoop(1600, 4)
  const pct = [35, 52, 71, 88][i]
  return (
    <Box>
      <div className="rounded-2xl bg-raised p-4 shadow-card">
        <div className="flex items-center justify-between"><span className="text-xs text-muted">Your tier</span><span className="rounded-full bg-magenta/14 px-2 py-0.5 text-[11px] font-medium text-magenta">{pct > 80 ? 'Trusted' : pct > 50 ? 'Regular' : 'Reliable'}</span></div>
        <p className="tnum mt-1 text-3xl font-semibold text-fg">{Math.round(pct * 1.4)}<span className="text-sm font-normal text-muted"> pts</span></p>
        <div className="mt-3 h-2 rounded-full bg-overlay"><div className="h-full rounded-full bg-gradient-to-r from-accent to-magenta transition-[width] duration-700" style={{ width: `${pct}%` }} /></div>
      </div>
      <Row><Flame className="h-4 w-4 text-warning" /><span className="flex-1 text-fg">{i + 2} events in a row</span><Check className="h-4 w-4 text-success" /></Row>
    </Box>
  )
}
