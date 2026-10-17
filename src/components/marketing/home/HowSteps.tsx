'use client'

import { AnimatePresence, motion, useInView, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Bell, CalendarPlus, CheckCircle2, CreditCard, QrCode, ScanLine, Search, Share2, Star, Upload, type LucideIcon } from 'lucide-react'
import { ORGANIZER_STEPS, GUEST_STEPS } from '@/lib/howSteps'
import { AnnounceVisual, ApproveVisual, CreateVisual, DoorVisual, FindVisual, PayVisual, ScoreVisual, ShareVisual, TicketVisual, UploadVisual } from './HowVisuals'
import { cn } from '@/lib/cn'

type Who = 'organizer' | 'guest'
const ICONS: Record<Who, LucideIcon[]> = { organizer: [CalendarPlus, Share2, CheckCircle2, Bell, ScanLine], guest: [Search, CreditCard, Upload, QrCode, Star] }
const VISUALS: Record<Who, ReactNode[]> = {
  organizer: [<CreateVisual key="a" />, <ShareVisual key="b" />, <ApproveVisual key="c" />, <AnnounceVisual key="d" />, <DoorVisual key="e" />],
  guest: [<FindVisual key="a" />, <PayVisual key="b" />, <UploadVisual key="c" />, <TicketVisual key="d" />, <ScoreVisual key="e" />],
}

/** The stage: the illustration for the active step, with a soft glow in the track colour (cyan for organizers, magenta for guests). */
function Stage({ who, active }: { who: Who; active: number }) {
  const glow = who === 'organizer' ? '34 211 238' : '214 96 236'
  return (
    <div className="relative grid h-[440px] place-items-center overflow-hidden rounded-3xl bg-surface shadow-card ring-1 ring-line" style={{ backgroundImage: `radial-gradient(70% 55% at 50% 0%, rgb(${glow} / 0.16), transparent 70%)` }}>
      <AnimatePresence mode="wait">
        <motion.div key={`${who}-${active}`} initial={{ opacity: 0, y: 14, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.98 }} transition={{ duration: 0.35 }} className="relative z-10 flex w-full justify-center px-6">
          {VISUALS[who][active]}
        </motion.div>
      </AnimatePresence>
      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">{VISUALS[who].map((_, i) => <span key={i} className={cn('h-1.5 rounded-full transition-all', i === active ? 'w-6 bg-accent' : 'w-1.5 bg-subtle/50')} />)}</div>
    </div>
  )
}

function StepCard({ index, who, title, body, onActive, active }: { index: number; who: Who; title: string; body: string; onActive: (i: number) => void; active: boolean }) {
  const ref = useRef<HTMLLIElement>(null)
  const Icon = ICONS[who][index]
  const inView = useInView(ref, { margin: '-40% 0px -40% 0px' })
  useEffect(() => { if (inView) onActive(index) }, [inView, index, onActive])
  const tone = who === 'guest' ? 'bg-magenta/14 text-magenta' : 'bg-accent/14 text-accent'
  return (
    <li ref={ref} className="relative min-h-[20vh] scroll-mt-32 lg:min-h-[34vh]">
      <span className={cn('absolute -left-14 top-0 grid h-11 w-11 place-items-center rounded-2xl ring-4 ring-canvas transition-all duration-500 sm:-left-16', tone, active && 'scale-110 shadow-[0_0_24px_-4px_currentColor]')}><Icon className="h-5 w-5" aria-hidden /></span>
      <div className={cn('rounded-2xl bg-surface p-5 shadow-card transition-all duration-500', active ? 'ring-1 ring-accent/40' : 'lg:opacity-55')}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-subtle">Step {index + 1}</p>
        <h3 className="mt-1 text-lg font-semibold tracking-tight text-fg">{title}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-muted">{body}</p>
      </div>
      <div className="mt-4 lg:hidden"><MobileVisual who={who} index={index} /></div>
    </li>
  )
}

function MobileVisual({ who, index }: { who: Who; index: number }) {
  const glow = who === 'organizer' ? '34 211 238' : '214 96 236'
  return <div className="grid place-items-center overflow-hidden rounded-3xl bg-surface py-8 shadow-card ring-1 ring-line" style={{ backgroundImage: `radial-gradient(70% 60% at 50% 0%, rgb(${glow} / 0.14), transparent 70%)` }}>{VISUALS[who][index]}</div>
}

function Steps({ who }: { who: Who }) {
  const steps = who === 'organizer' ? ORGANIZER_STEPS : GUEST_STEPS
  const [active, setActive] = useState(0)
  const ref = useRef<HTMLOListElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 60%', 'end 70%'] })
  const fill = useTransform(scrollYProgress, [0, 1], ['0%', '100%'])
  const color = who === 'guest' ? 'rgb(var(--k-magenta))' : 'rgb(var(--k-accent))'
  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_400px] lg:gap-16">
      <ol ref={ref} className="relative space-y-6 pl-14 sm:pl-16 lg:space-y-0">
        <span aria-hidden className="absolute bottom-3 left-[22px] top-3 w-px bg-line sm:left-[26px]" />
        <motion.span aria-hidden className="absolute left-[22px] top-3 w-px sm:left-[26px]" style={{ height: reduce ? '100%' : fill, background: color, boxShadow: `0 0 12px ${color}` }} />
        {steps.map((s, i) => <StepCard key={s.title} index={i} who={who} title={s.title} body={s.body} active={active === i} onActive={setActive} />)}
      </ol>
      <div className="hidden lg:block"><div className="sticky top-28"><Stage who={who} active={active} /></div></div>
    </div>
  )
}

/** Organizer and guest walkthroughs. A sticky stage on the right changes with the step you are reading. */
export function HowSteps() {
  const [who, setWho] = useState<Who>('organizer')
  return (
    <div>
      <div role="tablist" aria-label="Who is this for" className="mx-auto mb-14 flex w-fit rounded-2xl bg-surface p-1.5 shadow-card">
        {([['organizer', 'I run events'], ['guest', 'I go to events']] as const).map(([id, label]) => (
          <button key={id} role="tab" aria-selected={who === id} onClick={() => setWho(id)} className={cn('rounded-xl px-5 py-2.5 text-sm font-medium transition-colors', who === id ? (id === 'guest' ? 'bg-magenta text-white' : 'bg-accent text-accent-fg') : 'text-muted hover:text-fg')}>{label}</button>
        ))}
      </div>
      <Steps key={who} who={who} />
    </div>
  )
}
