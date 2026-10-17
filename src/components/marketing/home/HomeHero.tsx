'use client'

import Link from 'next/link'
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react'
import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { ArrowRight, Check, Crown } from 'lucide-react'
import { ButtonLink } from '@/components/kit'
import { SplitWords } from './motion'
import { Skyline, Stars } from './scenes'

const FEED = [
  { name: 'Mehreen Q.', note: 'VIP', tone: 'magenta' },
  { name: 'Hamza S.', note: 'General', tone: 'success' },
  { name: 'Areeba N.', note: 'Early bird', tone: 'success' },
  { name: 'Danish A.', note: 'VIP', tone: 'magenta' },
  { name: 'Sana F.', note: 'General', tone: 'success' },
] as const

function Stage() {
  const reduce = useReducedMotion()
  const mx = useMotionValue(0), my = useMotionValue(0)
  const rx = useSpring(useTransform(my, [-1, 1], [7, -7]), { stiffness: 80, damping: 18 })
  const ry = useSpring(useTransform(mx, [-1, 1], [-10, 10]), { stiffness: 80, damping: 18 })
  const [i, setI] = useState(0)
  const [admitted, setAdmitted] = useState(212)

  useEffect(() => {
    if (reduce) return
    const t = setInterval(() => { setI(v => (v + 1) % FEED.length); setAdmitted(a => a + 1) }, 2300)
    return () => clearInterval(t)
  }, [reduce])
  const feed = [0, 1, 2].map(k => FEED[(i + FEED.length - k) % FEED.length])

  return (
    <div
      className="relative mx-auto mt-14 w-full max-w-4xl [perspective:1200px]"
      onMouseMove={e => { const r = e.currentTarget.getBoundingClientRect(); mx.set(((e.clientX - r.left) / r.width) * 2 - 1); my.set(((e.clientY - r.top) / r.height) * 2 - 1) }}
      onMouseLeave={() => { mx.set(0); my.set(0) }}
    >
      <motion.div style={reduce ? undefined : { rotateX: rx, rotateY: ry, transformStyle: 'preserve-3d' }} className="grid gap-4 sm:grid-cols-[1fr_1.15fr_1fr] sm:items-center">
        {/* ticket */}
        <div className="k-floaty rounded-3xl bg-surface p-5 shadow-card ring-1 ring-line" style={{ ['--d' as string]: '8s', transform: 'translateZ(40px)' }}>
          <div className="flex items-center justify-between"><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">Ticket</p><span className="inline-flex items-center gap-1 rounded-full bg-magenta/14 px-2 py-0.5 text-[11px] font-medium text-magenta"><Crown className="h-3 w-3" />VIP</span></div>
          <p className="mt-2 text-base font-semibold text-fg">Rooftop Sunset Session</p>
          <p className="text-xs text-muted">Fri, 17 Oct · 7:30 pm · DHA, Karachi</p>
          <div className="mx-auto mt-4 w-fit rounded-xl bg-white p-2.5"><QRCodeSVG value="tikkit-x-demo" size={104} /></div>
        </div>

        {/* live feed */}
        <div className="rounded-3xl bg-surface p-5 shadow-card ring-1 ring-line sm:-translate-y-3" style={{ transform: 'translateZ(70px)' }}>
          <div className="flex items-center justify-between"><p className="text-xs text-muted">At the door</p><span className="inline-flex items-center gap-1.5 text-[11px] text-success"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />Live</span></div>
          <p className="mt-1 text-4xl font-semibold tracking-tight text-fg tnum">{admitted}<span className="text-base font-normal text-muted"> / 340</span></p>
          <div className="mt-3 h-1.5 rounded-full bg-overlay"><div className="h-full rounded-full bg-accent transition-[width] duration-700" style={{ width: `${Math.min(100, (admitted / 340) * 100)}%` }} /></div>
          <ul className="mt-4 space-y-2">
            {feed.map((f, k) => (
              <li key={`${f.name}-${i}-${k}`} className={`flex items-center gap-2 rounded-xl bg-raised px-3 py-2 text-sm ${k === 0 ? 'k-pop-in' : 'opacity-60'}`}>
                <Check className={`h-4 w-4 ${f.tone === 'magenta' ? 'text-magenta' : 'text-success'}`} /><span className="flex-1 text-fg">{f.name}</span><span className={`text-xs ${f.tone === 'magenta' ? 'text-magenta' : 'text-muted'}`}>{f.note}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* revenue */}
        <div className="k-floaty rounded-3xl bg-surface p-5 shadow-card ring-1 ring-line" style={{ ['--d' as string]: '9s', ['--delay' as string]: '1.2s', transform: 'translateZ(40px)' }}>
          <p className="text-xs text-muted">Tonight</p>
          <p className="mt-1 text-3xl font-semibold tracking-tight text-fg tnum">PKR 468k</p>
          <div className="mt-4 flex h-16 items-end gap-1.5">
            {[26, 40, 33, 58, 72, 100, 64].map((h, k) => <div key={k} className="flex-1 rounded-md" style={{ height: `${h}%`, background: k === 5 ? 'linear-gradient(180deg, rgb(var(--k-magenta)), rgb(var(--k-accent)))' : 'rgb(var(--k-accent) / 0.28)' }} />)}
          </div>
          <p className="mt-3 text-xs text-muted">144 sold by promoters</p>
        </div>
      </motion.div>
    </div>
  )
}

export function HomeHero() {
  return (
    <section className="k-night relative isolate overflow-hidden pb-32 pt-16 sm:pb-44 sm:pt-24" aria-labelledby="hero-title">
      {/* sky */}
      <div aria-hidden className="absolute inset-0 -z-10" style={{ background: 'radial-gradient(120% 80% at 50% 0%, #1a1245 0%, #0b0c1c 45%, #070911 80%)' }} />
      <div aria-hidden className="k-aurora absolute -left-[15%] top-[-15%] -z-10 h-[75vh] w-[85vw]" style={{ background: 'radial-gradient(closest-side, rgb(34 211 238 / 0.30), transparent)' }} />
      <div aria-hidden className="k-aurora absolute -right-[15%] top-[0%] -z-10 h-[70vh] w-[75vw]" style={{ animationDelay: '-5s', background: 'radial-gradient(closest-side, rgb(214 96 236 / 0.30), transparent)' }} />
      <div aria-hidden className="k-aurora absolute left-[20%] top-[25%] -z-10 h-[55vh] w-[60vw]" style={{ animationDelay: '-9s', background: 'radial-gradient(closest-side, rgb(139 92 246 / 0.26), transparent)' }} />
      <Stars className="absolute inset-0 -z-10" />
      <div aria-hidden className="absolute inset-x-0 bottom-0 -z-10 h-[70%] overflow-hidden">
        {[['-28deg', '-14deg', '#22d3ee', '0s'], ['-10deg', '6deg', '#d660ec', '-2s'], ['8deg', '22deg', '#8b5cf6', '-4s'], ['20deg', '34deg', '#22d3ee', '-1s']].map(([a, b, c, d], k) => (
          <div key={k} className="k-beam absolute bottom-[-10%] left-1/2 h-[120%] w-28 -translate-x-1/2 [mask-image:linear-gradient(90deg,transparent,#000_50%,transparent)]" style={{ ['--r0' as string]: a, ['--r1' as string]: b, ['--d' as string]: `${6 + k}s`, ['--delay' as string]: d, background: `linear-gradient(to top, ${c}aa, transparent 75%)` }} />
        ))}
      </div>
      <Skyline className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-32 w-full sm:h-48" />

      <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mx-auto inline-flex items-center gap-2 rounded-full bg-surface/70 px-4 py-1.5 text-[13px] font-medium text-accent ring-1 ring-line backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />Built for organizers in Pakistan
        </motion.p>
        <h1 id="hero-title" className="mt-7 text-balance text-5xl font-semibold leading-[1.02] tracking-tight text-fg sm:text-7xl lg:text-8xl">
          <SplitWords text="Sell the night." delay={0.1} />
          <br />
          <SplitWords text="Run the day." wordClassName="k-gradient-text" delay={0.45} />
        </h1>
        <motion.p initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.9 }} className="mx-auto mt-7 max-w-2xl text-pretty text-lg leading-relaxed text-muted sm:text-xl">
          Tickets, guest lists and the door, in one place. From rooftop parties after dark to corporate offsites and venue bookings in daylight.
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 1.05 }} className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <ButtonLink href="/auth/login?flow=organizer-signup" size="lg" trailing={<ArrowRight className="h-4 w-4" />}>Start 14 day free trial</ButtonLink>
          <ButtonLink href="/how-it-works" size="lg" variant="secondary">See how it works</ButtonLink>
        </motion.div>
        <p className="mt-4 text-sm text-subtle">No card needed. Cancel any time.</p>
        <Stage />
      </div>
      <Link href="#after-dark" aria-label="Scroll to the next section" className="sr-only">Next</Link>
    </section>
  )
}
