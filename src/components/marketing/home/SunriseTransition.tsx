'use client'

import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from 'motion/react'
import { useRef } from 'react'
import { CheckCircle2, Crown, DoorOpen, Users, Wallet, type LucideIcon } from 'lucide-react'
import { Hills, Stars, Sun } from './scenes'

const NIGHT: { time: string; title: string; body: string; icon: LucideIcon; tone: string }[] = [
  { time: '6:00 pm', title: 'Doors prep', body: 'Door team links sent. Scanner tested.', icon: DoorOpen, tone: 'text-accent bg-accent/14' },
  { time: '8:00 pm', title: 'Requests roll in', body: '7 guests waiting. Approve each in one tap.', icon: CheckCircle2, tone: 'text-info bg-info/12' },
  { time: '9:30 pm', title: 'VIPs arrive', body: 'Scan, flag VIP, no queue at the gate.', icon: Crown, tone: 'text-magenta bg-magenta/14' },
  { time: '11:00 pm', title: 'Packed house', body: '212 of 340 inside, counted live.', icon: Users, tone: 'text-success bg-success/12' },
  { time: 'Next day', title: 'Settle up', body: 'Promoter commissions and sales, ready to export.', icon: Wallet, tone: 'text-warning bg-warning/14' },
]

function NightStep({ p, i, step }: { p: MotionValue<number>; i: number; step: (typeof NIGHT)[number] }) {
  const start = 0.04 + i * 0.045
  const opacity = useTransform(p, [start, start + 0.05], [0.18, 1])
  const y = useTransform(p, [start, start + 0.05], [18, 0])
  const Icon = step.icon
  return (
    <motion.li style={{ opacity, y }} className="flex items-center gap-3 rounded-2xl bg-surface/80 p-3 text-left ring-1 ring-line backdrop-blur lg:block lg:p-4">
      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${step.tone}`}><Icon className="h-[18px] w-[18px]" aria-hidden /></span>
      <div className="min-w-0 lg:mt-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-subtle">{step.time}</p>
        <h3 className="text-base font-semibold text-fg lg:mt-1">{step.title}</h3>
        <p className="text-[13px] leading-snug text-muted lg:mt-1 lg:leading-relaxed">{step.body}</p>
      </div>
    </motion.li>
  )
}

function StaticNight() {
  return (
    <ul className="mx-auto mt-10 grid max-w-5xl gap-2 px-4 lg:grid-cols-5 lg:gap-3">
      {NIGHT.map(step => { const Icon = step.icon; return (
        <li key={step.title} className="flex items-center gap-3 rounded-2xl bg-surface/80 p-3 text-left ring-1 ring-line lg:block lg:p-4">
          <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${step.tone}`}><Icon className="h-[18px] w-[18px]" aria-hidden /></span>
          <div className="min-w-0 lg:mt-3"><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-subtle">{step.time}</p>
          <h3 className="text-base font-semibold text-fg lg:mt-1">{step.title}</h3><p className="text-[13px] leading-snug text-muted lg:mt-1">{step.body}</p></div>
        </li>) })}
    </ul>
  )
}

/** Scroll-linked dawn. The page background runs from midnight to the daylight cream the next section starts with. */
export function SunriseTransition() {
  const ref = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start start', 'end end'] })

  // 0 to 0.3: a night timeline lights up on the dark sky. From 0.3 the headline and the dawn take over and stay.
  const bg = useTransform(p, [0, 0.32, 0.5, 0.68, 0.84, 0.94, 1], ['#070911', '#0d0b22', '#6d2c63', '#f08a6b', '#ffd9a0', '#fff1d8', '#fffaf1'])
  const starsOpacity = useTransform(p, [0.28, 0.5], [1, 0])
  const sunY = useTransform(p, [0.36, 0.92], ['120%', '8%'])
  const sunScale = useTransform(p, [0.36, 0.92], [0.7, 1.15])
  const hillsOpacity = useTransform(p, [0.42, 0.7], [0, 1])
  // The headline takes over from the timeline with no empty stretch, and stays until the section scrolls away.
  const textOpacity = useTransform(p, [0.29, 0.38], [0, 1])
  const textY = useTransform(p, [0.29, 0.38], [24, 0])
  const textColor = useTransform(p, [0.29, 0.6, 0.72], ['#f4f0ff', '#fff7ec', '#3b2a1a'])
  const timelineOpacity = useTransform(p, [0, 0.04, 0.25, 0.31], [0, 1, 1, 0])
  const timelineY = useTransform(p, [0.25, 0.31], [0, -30])

  if (reduce) {
    return (
      <section aria-labelledby="sunrise-title" className="k-night relative px-4 py-24 text-center" style={{ background: 'linear-gradient(#070911, #1b1038 25%, #6d2c63 50%, #f6c98d 85%, #fffaf1)' }}>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">One night, start to finish</p>
        <StaticNight />
        <h2 id="sunrise-title" className="mt-24 text-4xl font-semibold tracking-tight text-white sm:text-6xl">Then the sun comes up.</h2>
        <p className="mt-3 text-white/80">Not every great event happens after dark.</p>
      </section>
    )
  }

  return (
    <section ref={ref} aria-labelledby="sunrise-title" className="relative h-[260vh]">
      <motion.div style={{ backgroundColor: bg }} className="sticky top-0 h-screen overflow-hidden">
        <motion.div style={{ opacity: starsOpacity }} className="absolute inset-0"><Stars count={60} className="absolute inset-0" /></motion.div>
        <motion.div style={{ y: sunY, scale: sunScale }} className="absolute left-1/2 top-0 h-[70vmin] w-[70vmin] -translate-x-1/2">
          <Sun className="h-full w-full" />
        </motion.div>
        <motion.div style={{ opacity: hillsOpacity }} className="absolute inset-x-0 bottom-0 h-[38vh]"><Hills className="h-full w-full" /></motion.div>

        <motion.div style={{ opacity: timelineOpacity, y: timelineY }} className="k-night absolute inset-0 grid place-items-center bg-transparent px-4">
          <div className="w-full max-w-6xl">
            <p className="text-center text-xs font-semibold uppercase tracking-[0.16em] text-accent">One night, start to finish</p>
            <h2 className="mx-auto mt-3 max-w-2xl text-balance text-center text-3xl font-semibold tracking-tight text-fg sm:text-5xl">Everything between doors and daylight.</h2>
            <ol className="mx-auto mt-6 grid max-w-xl gap-2 sm:mt-10 lg:max-w-none lg:grid-cols-5 lg:gap-3">
              {NIGHT.map((step, i) => <NightStep key={step.title} p={p} i={i} step={step} />)}
            </ol>
          </div>
        </motion.div>

        <motion.div style={{ opacity: textOpacity, y: textY, color: textColor }} className="absolute inset-0 grid place-items-center px-4 text-center">
          <div>
            <h2 id="sunrise-title" className="text-balance text-5xl font-semibold tracking-tight sm:text-7xl">Then the sun comes up.</h2>
            <p className="mt-4 text-lg opacity-80 sm:text-xl">Not every great event happens after dark.</p>
          </div>
        </motion.div>
      </motion.div>
    </section>
  )
}
