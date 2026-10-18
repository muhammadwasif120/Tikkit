'use client'

import { useCallback, useEffect, useLayoutEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Play, RotateCcw, X } from 'lucide-react'
import { Badge, Button, ButtonLink } from '@/components/kit'
import { resetDemo } from '@/app/actions/demoActions'
import { cn } from '@/lib/cn'

type Step = { href?: string; target?: string; title: string; body: string; isNew?: boolean }

/** Targets are the real sidebar links, so the tour points at the actual product. */
const link = (href: string) => `aside a[href="${href}"], nav[aria-label="Main"] a[href="${href}"]`
const STEPS: Step[] = [
  { title: 'Welcome to the live demo', body: 'This is the real TIKKIT X organizer workspace with sample data. Click anything. Use Reset in the top bar to restore the data.' },
  { href: '/dashboard', target: link('/dashboard'), title: 'Overview', body: 'Sales, requests waiting on you and the next event, as soon as you log in.' },
  { href: '/dashboard/events', target: link('/dashboard/events'), title: 'Events', body: 'Create events, set ticket types in PKR, choose open or approval only, and hide the venue until you want it known.' },
  { href: '/dashboard/guests', target: link('/dashboard/guests'), title: 'Guests', body: 'Every request with its payment receipt and guest score. Approve and the signed QR ticket is issued. Try it.' },
  { href: '/dashboard/event-day', target: link('/dashboard/event-day'), title: 'Event Day', body: 'The live door. Scan tickets, check guests in and share a scanner link with gate staff.' },
  { href: '/dashboard/referrals', target: link('/dashboard/referrals'), title: 'Referrals', body: 'Promoters get a link, a code and a QR. Sales and commission are tracked for you.' },
  { href: '/dashboard/analytics', target: link('/dashboard/analytics'), title: 'Analytics', body: 'Sales over time, check-in curve and repeat guests.' },
  { href: '/dashboard/vendors', target: link('/dashboard/vendors'), title: 'Vendors and invoices', body: 'Every vendor, quote and payment for your events in one list.' },
  { href: '/dashboard/classes', target: link('/dashboard/classes'), title: 'Classes and passes', body: 'Sell class series, drop-ins and multi-session passes. Scan a pass at the studio door.', isNew: true },
  { href: '/dashboard/spaces', target: link('/dashboard/spaces'), title: 'Spaces', body: 'Let people reserve rooms, courts or studios by the hour, with approval if you want it.', isNew: true },
  { href: '/dashboard/retreats', target: link('/dashboard/retreats'), title: 'Retreats', body: 'Multi day itineraries, participants, budget and private itinerary links.', isNew: true },
  { href: '/dashboard/settings/team', target: link('/dashboard/settings'), title: 'Settings and team managers', body: 'Payment accounts, your public profile and team managers who can run events without seeing billing.', isNew: true },
  { title: 'That is the tour', body: 'Ready for your own? Start a 14 day free trial. No card needed.' },
]

type Rect = { top: number; left: number; width: number; height: number }

function Tour({ step, onNext, onPrev, onClose }: { step: number; onNext: () => void; onPrev: () => void; onClose: () => void }) {
  const s = STEPS[step]
  const [rect, setRect] = useState<Rect | null>(null)
  const [wide, setWide] = useState(true)

  const measure = useCallback(() => {
    setWide(window.innerWidth >= 1024)
    const el = s.target ? [...document.querySelectorAll<HTMLElement>(s.target)].find(e => e.getBoundingClientRect().width > 0) : null
    if (!el) return setRect(null)
    const r = el.getBoundingClientRect()
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
  }, [s.target])

  useLayoutEffect(() => {
    measure()
    const t = setTimeout(measure, 350)
    window.addEventListener('resize', measure); window.addEventListener('scroll', measure, true)
    return () => { clearTimeout(t); window.removeEventListener('resize', measure); window.removeEventListener('scroll', measure, true) }
  }, [step, measure])

  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); if (e.key === 'ArrowRight') onNext(); if (e.key === 'ArrowLeft') onPrev() }
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k)
  }, [onNext, onPrev, onClose])

  const last = step === STEPS.length - 1
  const W = 320
  const style: React.CSSProperties | undefined = wide
    ? rect ? { left: rect.left + rect.width + 16, top: Math.min(Math.max(12, rect.top), window.innerHeight - 260), width: W }
           : { left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: W }
    : undefined

  return (
    <div className="fixed inset-0 z-[9500]" role="dialog" aria-modal="true" aria-label="Product tour">
      <div className="absolute inset-0" onClick={onClose} />
      {rect ? <div className="pointer-events-none absolute rounded-xl ring-2 ring-accent transition-all duration-300" style={{ top: rect.top - 4, left: rect.left - 4, width: rect.width + 8, height: rect.height + 8, boxShadow: '0 0 0 9999px rgb(3 5 10 / 0.7), 0 0 28px rgb(var(--k-accent) / 0.5)' }} />
            : <div className="pointer-events-none absolute inset-0 bg-[rgb(3_5_10/0.7)]" />}
      <div key={step} className={cn('k-pop-in absolute rounded-2xl bg-surface p-5 shadow-2xl ring-1 ring-line', !wide && 'inset-x-3 bottom-3')} style={style}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2"><p className="text-lg font-semibold text-fg">{s.title}</p>{s.isNew && <Badge tone="magenta">New</Badge>}</div>
          <button type="button" onClick={onClose} aria-label="Close tour" className="cursor-pointer text-subtle hover:text-fg"><X className="h-4 w-4" /></button>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
        <div className="mt-4 flex items-center gap-1.5" aria-hidden>{STEPS.map((_, n) => <span key={n} className={cn('h-1.5 rounded-full transition-all', n === step ? 'w-5 bg-accent' : n < step ? 'w-1.5 bg-accent/60' : 'w-1.5 bg-line-strong')} />)}</div>
        <div className="mt-4 flex items-center gap-2">
          {step > 0 && <Button size="sm" variant="secondary" onClick={onPrev} leading={<ArrowLeft className="h-3.5 w-3.5" />}>Back</Button>}
          <span className="flex-1" />
          {last ? <ButtonLink href="/auth/login?flow=organizer-signup" size="sm" trailing={<ArrowRight className="h-3.5 w-3.5" />}>Start free trial</ButtonLink>
                : <Button size="sm" onClick={onNext} trailing={<ArrowRight className="h-3.5 w-3.5" />}>{step === 0 ? 'Start tour' : 'Next'}</Button>}
        </div>
      </div>
    </div>
  )
}

/** Banner shown to demo sessions only. Offers the tour and a reset. */
export function DemoBar() {
  const router = useRouter()
  const [step, setStep] = useState<number | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [pending, start] = useTransition()

  useEffect(() => {
    try { if (!sessionStorage.getItem('tkx-demo-tour')) { sessionStorage.setItem('tkx-demo-tour', '1'); const t = setTimeout(() => setStep(0), 900); return () => clearTimeout(t) } } catch {}
  }, [])

  const go = useCallback((i: number) => {
    const n = Math.max(0, Math.min(STEPS.length - 1, i))
    const href = STEPS[n].href
    if (href) router.push(href)
    setStep(n)
  }, [router])

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl bg-accent/10 px-4 py-3 text-sm ring-1 ring-accent/30">
        <Badge tone="accent" dot>Live demo</Badge>
        <p className="min-w-0 flex-1 text-fg">You are in a sample workspace. Everything works, and nothing is emailed.{msg && <span className="ml-2 text-muted">{msg}</span>}</p>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" leading={<Play className="h-3.5 w-3.5" />} onClick={() => go(0)}>Take the tour</Button>
          <Button size="sm" variant="secondary" loading={pending} leading={<RotateCcw className="h-3.5 w-3.5" />}
            onClick={() => start(async () => { const r = await resetDemo(); setMsg(r.message); if (r.ok) router.refresh() })}>Reset data</Button>
          <ButtonLink href="/auth/login?flow=organizer-signup" size="sm" variant="secondary">Start free trial</ButtonLink>
        </div>
      </div>
      {step !== null && <Tour step={step} onNext={() => go(step + 1)} onPrev={() => go(step - 1)} onClose={() => setStep(null)} />}
    </>
  )
}
