'use client'

import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { useRef, useState } from 'react'
import { Bell, CalendarPlus, CheckCircle2, CreditCard, QrCode, ScanLine, Search, Share2, Star, Upload, type LucideIcon } from 'lucide-react'
import { ORGANIZER_STEPS, GUEST_STEPS, type HowStep } from '@/lib/howSteps'
import { Reveal } from './motion'
import { cn } from '@/lib/cn'

const ORG_ICONS: LucideIcon[] = [CalendarPlus, Share2, CheckCircle2, Bell, ScanLine]
const GUEST_ICONS: LucideIcon[] = [Search, CreditCard, Upload, QrCode, Star]

function Timeline({ steps, icons, tone }: { steps: HowStep[]; icons: LucideIcon[]; tone: 'accent' | 'magenta' }) {
  const ref = useRef<HTMLOListElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 70%', 'end 60%'] })
  const fill = useTransform(scrollYProgress, [0, 1], ['0%', '100%'])
  const color = tone === 'magenta' ? 'rgb(var(--k-magenta))' : 'rgb(var(--k-accent))'
  return (
    <ol ref={ref} className="relative mx-auto max-w-2xl space-y-8 pl-14 sm:pl-16">
      <span aria-hidden className="absolute bottom-3 left-[22px] top-3 w-px bg-line sm:left-[26px]" />
      <motion.span aria-hidden className="absolute left-[22px] top-3 w-px sm:left-[26px]" style={{ height: reduce ? '100%' : fill, background: color, boxShadow: `0 0 12px ${color}` }} />
      {steps.map((s, i) => {
        const Icon = icons[i]
        return (
          <Reveal as="li" key={s.title} delay={0.04} className="relative">
            <span className={cn('absolute -left-14 top-0 grid h-11 w-11 place-items-center rounded-2xl ring-4 ring-canvas sm:-left-16', tone === 'magenta' ? 'bg-magenta/14 text-magenta' : 'bg-accent/14 text-accent')}><Icon className="h-5 w-5" aria-hidden /></span>
            <div className="rounded-2xl bg-surface p-5 shadow-card">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-subtle">Step {i + 1}</p>
              <h3 className="mt-1 text-lg font-semibold tracking-tight text-fg">{s.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{s.body}</p>
            </div>
          </Reveal>
        )
      })}
    </ol>
  )
}

/** Organizer and guest walkthroughs with a progress line that fills as you scroll. */
export function HowSteps() {
  const [who, setWho] = useState<'organizer' | 'guest'>('organizer')
  return (
    <div>
      <div role="tablist" aria-label="Who is this for" className="mx-auto mb-12 flex w-fit rounded-2xl bg-surface p-1.5 shadow-card">
        {([['organizer', 'I run events'], ['guest', 'I go to events']] as const).map(([id, label]) => (
          <button key={id} role="tab" aria-selected={who === id} onClick={() => setWho(id)} className={cn('rounded-xl px-5 py-2.5 text-sm font-medium transition-colors', who === id ? (id === 'guest' ? 'bg-magenta text-white' : 'bg-accent text-accent-fg') : 'text-muted hover:text-fg')}>{label}</button>
        ))}
      </div>
      <div key={who}>
        {who === 'organizer' ? <Timeline steps={ORGANIZER_STEPS} icons={ORG_ICONS} tone="accent" /> : <Timeline steps={GUEST_STEPS} icons={GUEST_ICONS} tone="magenta" />}
      </div>
    </div>
  )
}
