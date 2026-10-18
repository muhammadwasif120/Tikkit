'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, BarChart3, Building2, CalendarDays, Check, Copy, Crown, LayoutDashboard, Mountain, Play, QrCode, Receipt, ScanLine, Share2, ShieldCheck, Sparkles, Users, X } from 'lucide-react'
import { Badge, Button, ButtonLink } from '@/components/kit'
import { cn } from '@/lib/cn'

type Section = 'overview' | 'events' | 'guests' | 'door' | 'referrals' | 'analytics' | 'vendors' | 'classes' | 'spaces' | 'retreats' | 'team'

const NAV: { id: Section; label: string; icon: typeof Users; tag?: string }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'events', label: 'Events', icon: CalendarDays },
  { id: 'guests', label: 'Guests', icon: Users },
  { id: 'door', label: 'Event Day', icon: QrCode },
  { id: 'referrals', label: 'Referrals', icon: Share2 },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'vendors', label: 'Vendors', icon: Receipt },
  { id: 'classes', label: 'Classes', icon: Sparkles },
  { id: 'spaces', label: 'Spaces', icon: Building2 },
  { id: 'retreats', label: 'Retreats', icon: Mountain, tag: 'Pro' },
  { id: 'team', label: 'Team', icon: ShieldCheck },
]

type Step = { target: string | null; section?: Section; title: string; body: string; isNew?: boolean }
const STEPS: Step[] = [
  { target: null, title: 'Welcome to TIKKIT X', body: 'This is the workspace you get when you sign up. Take the one minute tour, then click around. Nothing here is real.' },
  { target: 'nav-overview', section: 'overview', title: 'Overview', body: 'Sales, pending requests and the next event, the moment you log in.' },
  { target: 'nav-events', section: 'events', title: 'Events', body: 'Create an event, set ticket types in PKR and choose open, approval only or invite only. Hide the venue until you want it known.' },
  { target: 'approve-row', section: 'guests', title: 'Approve guests', body: 'Every request lands here with the payment receipt and the guest score. Approve and the signed QR ticket is issued.' },
  { target: 'nav-door', section: 'door', title: 'Event Day', body: 'Give door staff a scanner link for their phone. Each scan shows who is admitted, who is VIP and who already came in.' },
  { target: 'nav-referrals', section: 'referrals', title: 'Promoters and referrals', body: 'Every promoter gets a link, a code and a QR. Sales and commission are tracked for you.' },
  { target: 'nav-analytics', section: 'analytics', title: 'Analytics', body: 'Sales over time, check-in curve and repeat guests after every event.' },
  { target: 'nav-vendors', section: 'vendors', title: 'Vendors and invoices', body: 'Keep every vendor, quote and payment for an event in one list.' },
  { target: 'nav-classes', section: 'classes', title: 'Classes and passes', body: 'Sell class series, drop-ins and multi-session passes. Scan a pass at the studio door and a session is used.', isNew: true },
  { target: 'nav-spaces', section: 'spaces', title: 'Spaces', body: 'Let people reserve your rooms, courts or studios by the hour, with a QR to get in.', isNew: true },
  { target: 'nav-retreats', section: 'retreats', title: 'Retreats', body: 'Multi-day itineraries, participants and private itinerary links for each guest.', isNew: true },
  { target: 'nav-team', section: 'team', title: 'Team managers', body: 'Invite a manager to run events with you, without giving them billing or your owner settings.', isNew: true },
  { target: null, title: 'That is the tour', body: 'Start a 14 day free trial. No card needed, and none of your ticket money passes through us.' },
]

const fmt = (n: number) => n.toLocaleString('en-PK')

/* ── mock screens ─────────────────────────────────────────── */
const Panel = ({ children, className }: { children: React.ReactNode; className?: string }) => <div className={cn('rounded-2xl bg-surface p-4 shadow-card ring-1 ring-line', className)}>{children}</div>
const H = ({ title, sub, action }: { title: string; sub: string; action?: React.ReactNode }) => (
  <div className="mb-5 flex items-start justify-between gap-3"><div><h3 className="text-xl font-semibold tracking-tight text-fg">{title}</h3><p className="text-sm text-muted">{sub}</p></div>{action}</div>
)
const Stat = ({ label, value, note }: { label: string; value: string; note?: string }) => (
  <Panel><p className="text-xs text-muted">{label}</p><p className="mt-1 text-2xl font-semibold tracking-tight tnum text-fg">{value}</p>{note && <p className="mt-1 text-xs text-success">{note}</p>}</Panel>
)

function Overview() {
  const bars = [22, 30, 26, 44, 61, 90, 58]
  return (
    <>
      <H title="Good evening, Areeba" sub="Rooftop Sunset Session is on sale." />
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Revenue" value={`PKR ${fmt(468000)}`} note="+18% this week" /><Stat label="Tickets sold" value="216 / 300" /><Stat label="Waiting on you" value="4" />
      </div>
      <Panel className="mt-3"><div className="flex h-28 items-end gap-2">{bars.map((h, i) => <div key={i} className="flex-1 rounded-md" style={{ height: `${h}%`, background: i === 5 ? 'linear-gradient(180deg, rgb(var(--k-magenta)), rgb(var(--k-accent)))' : 'rgb(var(--k-accent) / 0.28)' }} />)}</div></Panel>
    </>
  )
}

function Events() {
  const rows = [['Rooftop Sunset Session', 'Sat 25 Oct', '216 / 300', 'On sale', 'success'], ['Brand Launch Lahore', 'Fri 7 Nov', '44 / 120', 'Approval only', 'violet'], ['Jazz Night Islamabad', 'Sun 16 Nov', 'Draft', 'Draft', 'neutral']] as const
  return (
    <>
      <H title="Events" sub="Everything you host." action={<Button size="sm">New event</Button>} />
      <div className="space-y-2.5">
        {rows.map(([t, d, s, b, tone]) => <Panel key={t} className="flex items-center gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent/12 text-accent"><CalendarDays className="h-5 w-5" /></span><div className="min-w-0 flex-1"><p className="truncate font-medium text-fg">{t}</p><p className="text-xs text-muted">{d} · {s}</p></div><Badge tone={tone}>{b}</Badge></Panel>)}
      </div>
    </>
  )
}

function Guests() {
  const [done, setDone] = useState<Record<string, boolean>>({})
  const rows = [['Zain Raza', 'Early bird', 92, 'Repeat guest'], ['Mehreen Q.', 'VIP', 98, 'ID verified'], ['Hassan Khan', 'General', 61, 'New guest']]
  return (
    <>
      <H title="Guests" sub="4 requests waiting." />
      <div className="space-y-2.5">
        {rows.map(([n, t, sc, tag], i) => (
          <Panel key={n as string} className="flex flex-wrap items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-magenta/14 text-sm font-semibold text-magenta">{(n as string)[0]}</span>
            <div className="min-w-0 flex-1"><p className="font-medium text-fg">{n} {t === 'VIP' && <Crown className="inline h-3.5 w-3.5 text-magenta" />}</p><p className="text-xs text-muted">{t} · receipt uploaded · {tag}</p></div>
            <span className="rounded-full bg-success/12 px-2 py-0.5 text-xs font-semibold tnum text-success">Score {sc}</span>
            {done[n as string] ? <Badge tone="success"><Check className="mr-1 h-3 w-3" />Ticket sent</Badge> : <Button size="sm" data-tour={i === 0 ? 'approve-row' : undefined} onClick={() => setDone(d => ({ ...d, [n as string]: true }))}>Approve</Button>}
          </Panel>
        ))}
      </div>
    </>
  )
}

function Door() {
  const people = [['Mehreen Q.', 'VIP admitted', 'magenta'], ['Zain Raza', 'Admitted', 'success'], ['Zain Raza', 'Already scanned', 'danger']] as const
  const [i, setI] = useState(0)
  const p = people[i % people.length]
  return (
    <>
      <H title="Event Day" sub="Live door for Rooftop Sunset Session." action={<Badge tone="success" dot>Live</Badge>} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Panel className="text-center"><p className="text-xs text-muted">Inside now</p><p className="mt-1 text-4xl font-semibold tnum text-fg">212<span className="text-lg text-muted"> / 340</span></p><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-line-strong"><div className="h-full w-[62%] rounded-full bg-accent" /></div></Panel>
        <Panel>
          <p className="text-xs text-muted">Last scan</p>
          <div key={i} className="k-pop-in mt-2 flex items-center gap-3"><ScanLine className="h-6 w-6 text-accent" /><div><p className="font-medium text-fg">{p[0]}</p><Badge tone={p[2]}>{p[1]}</Badge></div></div>
          <Button size="sm" variant="secondary" className="mt-3" onClick={() => setI(n => n + 1)}>Simulate a scan</Button>
        </Panel>
      </div>
      <Panel className="mt-3 flex items-center gap-3"><QrCode className="h-5 w-5 text-accent" /><p className="flex-1 text-sm text-fg">Gate staff link: <span className="font-mono text-xs text-muted">tikkitx.com/staff/…</span></p><Badge>2 of 2 active</Badge></Panel>
    </>
  )
}

function Referrals() {
  const [copied, setCopied] = useState(false)
  const rows = [['Zain R.', 'ZAIN10', 64, 12800], ['Areeba N.', 'AREEBA20', 41, 8200], ['Hassan K.', 'HK15', 27, 4050]] as const
  return (
    <>
      <H title="Referrals" sub="Promoters, codes and commission." action={<Button size="sm" variant="secondary" leading={copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} onClick={() => setCopied(true)}>{copied ? 'Copied' : 'Copy event link'}</Button>} />
      <div className="space-y-2.5">{rows.map(([n, c, s, m]) => <Panel key={n} className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-magenta/14 text-xs font-semibold text-magenta">{n[0]}</span><span className="flex-1 font-medium text-fg">{n}</span><code className="rounded bg-magenta/12 px-1.5 py-0.5 font-mono text-xs text-magenta">{c}</code><span className="w-14 text-right text-sm tnum text-muted">{s} sold</span><span className="hidden w-24 text-right text-sm tnum text-fg sm:block">PKR {fmt(m)}</span></Panel>)}</div>
    </>
  )
}

function Analytics() {
  const curve = [4, 12, 38, 71, 100, 82, 46, 20]
  return (
    <>
      <H title="Analytics" sub="How the night went." />
      <div className="grid gap-3 sm:grid-cols-3"><Stat label="Check-in rate" value="91%" /><Stat label="Repeat guests" value="38%" /><Stat label="Top promoter" value="Zain R." /></div>
      <Panel className="mt-3"><p className="text-xs text-muted">Check-ins by hour</p><div className="mt-3 flex h-24 items-end gap-2">{curve.map((h, i) => <div key={i} className="flex-1 rounded-md bg-accent/40" style={{ height: `${h}%` }} />)}</div><div className="mt-1 flex justify-between text-[11px] text-subtle"><span>8pm</span><span>12am</span></div></Panel>
    </>
  )
}

function Vendors() {
  const rows = [['SoundWorks PA', 'Sound', 85000, 'Paid', 'success'], ['Lumen Lights', 'Lighting', 60000, 'Due 20 Oct', 'warning'], ['Bites & Co', 'Catering', 120000, 'Quote', 'neutral']] as const
  return (
    <>
      <H title="Vendors and invoices" sub="Costs for Rooftop Sunset Session." />
      <div className="space-y-2.5">{rows.map(([n, t, a, s, tone]) => <Panel key={n} className="flex items-center gap-3"><div className="flex-1"><p className="font-medium text-fg">{n}</p><p className="text-xs text-muted">{t}</p></div><span className="text-sm tnum text-fg">PKR {fmt(a)}</span><Badge tone={tone}>{s}</Badge></Panel>)}</div>
    </>
  )
}

function Classes() {
  return (
    <>
      <H title="Classes and passes" sub="Series, drop-ins and passes." action={<Badge tone="magenta">New</Badge>} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Panel><p className="font-medium text-fg">Morning Vinyasa</p><p className="text-xs text-muted">Mon, Wed, Fri · 7:00am</p><div className="mt-3 flex gap-2"><Badge>Drop-in PKR 1,500</Badge><Badge tone="accent">12 seats</Badge></div></Panel>
        <Panel><p className="font-medium text-fg">10 class pass</p><p className="text-xs text-muted">Valid for 3 months</p><div className="mt-3 flex items-center gap-2"><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line-strong"><div className="h-full w-[60%] rounded-full bg-magenta" /></div><span className="text-xs tnum text-muted">6 left</span></div></Panel>
      </div>
    </>
  )
}

function Spaces() {
  const slots = ['9am', '10am', '11am', '12pm', '1pm', '2pm', '3pm', '4pm']
  const taken = [1, 2, 5]
  return (
    <>
      <H title="Spaces" sub="Studio A · PKR 3,500 an hour." action={<Badge tone="magenta">New</Badge>} />
      <Panel><div className="grid grid-cols-4 gap-2">{slots.map((s, i) => <span key={s} className={cn('rounded-lg px-2 py-2 text-center text-xs font-medium', taken.includes(i) ? 'bg-line-strong text-subtle line-through' : 'bg-accent/12 text-accent')}>{s}</span>)}</div></Panel>
    </>
  )
}

function Retreats() {
  const days = [['Day 1', 'Arrival, welcome circle'], ['Day 2', 'Sunrise hike, workshop'], ['Day 3', 'Free morning, closing dinner']]
  return (
    <>
      <H title="Retreats" sub="Hunza Reset · 12 to 15 Nov · 14 participants." action={<Badge tone="magenta">Pro</Badge>} />
      <Panel><ol className="space-y-3">{days.map(([d, t]) => <li key={d} className="flex gap-3"><span className="mt-0.5 grid h-6 w-6 place-items-center rounded-full bg-accent/14 text-[11px] font-semibold text-accent">{d.slice(-1)}</span><div><p className="text-sm font-medium text-fg">{d}</p><p className="text-sm text-muted">{t}</p></div></li>)}</ol></Panel>
    </>
  )
}

function Team() {
  return (
    <>
      <H title="Team" sub="People who run events with you." action={<Badge tone="magenta">New</Badge>} />
      <div className="space-y-2.5">
        <Panel className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-accent/14 text-xs font-semibold text-accent">A</span><span className="flex-1 font-medium text-fg">Areeba (you)</span><Badge tone="accent">Owner</Badge></Panel>
        <Panel className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-violet/14 text-xs font-semibold text-violet">B</span><div className="flex-1"><p className="font-medium text-fg">Bilal S.</p><p className="text-xs text-muted">Events, guests, door. No billing.</p></div><Badge>Manager</Badge></Panel>
      </div>
    </>
  )
}

const SCREENS: Record<Section, () => React.ReactNode> = { overview: Overview, events: Events, guests: Guests, door: Door, referrals: Referrals, analytics: Analytics, vendors: Vendors, classes: Classes, spaces: Spaces, retreats: Retreats, team: Team }

/* ── tour overlay ─────────────────────────────────────────── */
type Rect = { top: number; left: number; width: number; height: number }

function Tour({ step, onNext, onPrev, onClose }: { step: number; onNext: () => void; onPrev: () => void; onClose: () => void }) {
  const s = STEPS[step]
  const [rect, setRect] = useState<Rect | null>(null)
  const [wide, setWide] = useState(true)

  const measure = useCallback(() => {
    setWide(window.innerWidth >= 1024)
    if (!s.target) return setRect(null)
    const el = document.querySelector<HTMLElement>(`[data-tour="${s.target}"]`)
    if (!el) return setRect(null)
    const r = el.getBoundingClientRect()
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
  }, [s.target])

  useLayoutEffect(() => {
    if (s.target) document.querySelector<HTMLElement>(`[data-tour="${s.target}"]`)?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'instant' as ScrollBehavior })
    measure()
    const t = setTimeout(measure, 120)
    window.addEventListener('resize', measure); window.addEventListener('scroll', measure, true)
    return () => { clearTimeout(t); window.removeEventListener('resize', measure); window.removeEventListener('scroll', measure, true) }
  }, [step, measure, s.target])

  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); if (e.key === 'ArrowRight') onNext(); if (e.key === 'ArrowLeft') onPrev() }
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k)
  }, [onNext, onPrev, onClose])

  const last = step === STEPS.length - 1
  const W = 320
  let card: React.CSSProperties = {}
  if (wide && rect) {
    const toRight = rect.left + rect.width + 16 + W < window.innerWidth
    card = toRight
      ? { left: rect.left + rect.width + 16, top: Math.min(Math.max(12, rect.top), window.innerHeight - 260) }
      : { left: Math.max(12, Math.min(rect.left, window.innerWidth - W - 12)), top: Math.min(rect.top + rect.height + 14, window.innerHeight - 260) }
  } else if (wide) card = { left: '50%', top: '50%', transform: 'translate(-50%,-50%)' }

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="Product tour">
      <div className="absolute inset-0" onClick={onClose} />
      {rect ? (
        <div className="pointer-events-none absolute rounded-xl ring-2 ring-accent transition-all duration-300" style={{ top: rect.top - 6, left: rect.left - 6, width: rect.width + 12, height: rect.height + 12, boxShadow: '0 0 0 9999px rgb(3 5 10 / 0.72), 0 0 32px rgb(var(--k-accent) / 0.5)' }} />
      ) : <div className="pointer-events-none absolute inset-0 bg-[rgb(3_5_10/0.72)]" />}
      <div key={step} className={cn('k-pop-in absolute rounded-2xl bg-surface p-5 shadow-2xl ring-1 ring-line', !wide && 'inset-x-3 bottom-3')} style={wide ? { ...card, width: W } : undefined}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2"><p className="text-lg font-semibold text-fg">{s.title}</p>{s.isNew && <Badge tone="magenta">New</Badge>}</div>
          <button type="button" onClick={onClose} aria-label="Close tour" className="cursor-pointer text-subtle hover:text-fg"><X className="h-4 w-4" /></button>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
        <div className="mt-4 flex items-center gap-1.5" aria-hidden>{STEPS.map((_, n) => <span key={n} className={cn('h-1.5 rounded-full transition-all', n === step ? 'w-5 bg-accent' : n < step ? 'w-1.5 bg-accent/60' : 'w-1.5 bg-line-strong')} />)}</div>
        <div className="mt-4 flex items-center gap-2">
          {step > 0 && <Button size="sm" variant="secondary" onClick={onPrev} leading={<ArrowLeft className="h-3.5 w-3.5" />}>Back</Button>}
          <span className="flex-1" />
          {last ? <ButtonLink href="/auth/login?flow=organizer-signup" size="sm" trailing={<ArrowRight className="h-3.5 w-3.5" />}>Start free trial</ButtonLink> : <Button size="sm" onClick={onNext} trailing={<ArrowRight className="h-3.5 w-3.5" />}>{step === 0 ? 'Start tour' : 'Next'}</Button>}
        </div>
      </div>
    </div>
  )
}

/* ── workspace ────────────────────────────────────────────── */
export function DemoWorkspace() {
  const [section, setSection] = useState<Section>('overview')
  const [step, setStep] = useState<number | null>(null)
  const frame = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = window.location.hash.slice(1) as Section
    if (NAV.some(n => n.id === h)) setSection(h)
    else { const t = setTimeout(() => { frame.current?.scrollIntoView({ block: 'start', behavior: 'smooth' }); setStep(0) }, 900); return () => clearTimeout(t) }
  }, [])

  const go = useCallback((n: number) => {
    const i = Math.max(0, Math.min(STEPS.length - 1, n))
    const sec = STEPS[i].section
    if (sec) setSection(sec)
    setStep(i)
  }, [])
  const next = useCallback(() => setStep(s => { if (s === null) return s; const i = Math.min(STEPS.length - 1, s + 1); const sec = STEPS[i].section; if (sec) setSection(sec); return i }), [])
  const prev = useCallback(() => setStep(s => { if (s === null) return s; const i = Math.max(0, s - 1); const sec = STEPS[i].section; if (sec) setSection(sec); return i }), [])
  const Screen = SCREENS[section]

  return (
    <div ref={frame} className="scroll-mt-20">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">Click any section, or take the guided tour.</p>
        <Button size="sm" leading={<Play className="h-3.5 w-3.5" />} onClick={() => go(0)}>{step === null ? 'Start the tour' : 'Restart the tour'}</Button>
      </div>
      <div className="k-gradient-ring overflow-hidden rounded-3xl bg-canvas">
        <div className="flex items-center gap-2 border-b border-line bg-surface px-4 py-2.5" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full bg-danger/70" /><span className="h-2.5 w-2.5 rounded-full bg-warning/70" /><span className="h-2.5 w-2.5 rounded-full bg-success/70" />
          <span className="ml-3 rounded-md bg-raised px-3 py-1 text-xs text-muted">tikkitx.com/dashboard</span>
        </div>
        <div className="grid lg:grid-cols-[210px_1fr]">
          <nav aria-label="Demo sections" className="flex gap-1 overflow-x-auto border-b border-line bg-surface/60 p-2 lg:flex-col lg:overflow-visible lg:border-b-0 lg:border-r lg:p-3">
            {NAV.map(n => (
              <button key={n.id} type="button" data-tour={`nav-${n.id}`} onClick={() => { setSection(n.id); history.replaceState(null, '', `#${n.id}`) }}
                className={cn('flex shrink-0 cursor-pointer items-center gap-2.5 rounded-[10px] px-3 py-2 text-sm font-medium transition-colors', section === n.id ? 'bg-accent/10 text-fg' : 'text-muted hover:bg-raised hover:text-fg')}>
                <n.icon className={cn('h-[18px] w-[18px]', section === n.id && 'text-accent')} aria-hidden />{n.label}
                {n.tag && <Badge tone="magenta" className="ml-auto hidden lg:inline-flex">{n.tag}</Badge>}
              </button>
            ))}
          </nav>
          <div className="min-h-[420px] p-4 sm:p-6"><div key={section} className="k-fade-up"><Screen /></div></div>
        </div>
      </div>
      {step !== null && <Tour step={step} onNext={next} onPrev={prev} onClose={() => setStep(null)} />}
    </div>
  )
}
