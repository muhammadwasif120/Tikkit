'use client'

import { useInView, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Check, Crown, Lock, LockOpen, MapPin, ShieldCheck } from 'lucide-react'
import { Marquee, Reveal, CountUp } from './motion'

function Tile({ eyebrow, title, body, children, delay = 0 }: { eyebrow: string; title: string; body: string; children: React.ReactNode; delay?: number }) {
  return (
    <Reveal delay={delay} className="flex flex-col overflow-hidden rounded-3xl bg-surface shadow-card ring-1 ring-line">
      <div className="grid min-h-[250px] place-items-center bg-gradient-to-b from-overlay/40 to-transparent p-6">{children}</div>
      <div className="p-6 pt-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">{eyebrow}</p>
        <h3 className="mt-2 text-xl font-semibold tracking-tight text-fg">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
      </div>
    </Reveal>
  )
}

function SecretReveal() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { amount: 0.5 })
  const reduce = useReducedMotion()
  const [open, setOpen] = useState(!!reduce)
  useEffect(() => {
    if (reduce || !inView) return
    setOpen(false)
    const a = setTimeout(() => setOpen(true), 1400)
    const loop = setInterval(() => { setOpen(false); setTimeout(() => setOpen(true), 1400) }, 6200)
    return () => { clearTimeout(a); clearInterval(loop) }
  }, [inView, reduce])
  return (
    <div ref={ref} className="w-full max-w-[270px] rounded-2xl bg-raised p-4 shadow-card ring-1 ring-line">
      <div className="flex items-center justify-between text-xs text-muted"><span>Location</span><span className={`inline-flex items-center gap-1 font-medium ${open ? 'text-success' : 'text-violet'}`}>{open ? <LockOpen className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}{open ? 'Revealed' : 'Secret'}</span></div>
      <div className="mt-3 flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
        <p className={`text-sm font-medium text-fg transition-[filter] duration-700 ${open ? 'blur-0' : 'blur-[7px]'}`}>Plot 7, Khayaban-e-Shahbaz, Phase 6, DHA</p></div>
      <p className="mt-3 text-xs text-subtle">{open ? 'Sent to 212 confirmed guests' : 'Reveals to confirmed guests at 5:00 pm'}</p>
    </div>
  )
}

const SCANS = [
  { name: 'Mehreen Q.', label: 'VIP admitted', tone: 'magenta' }, { name: 'Hamza S.', label: 'Admitted', tone: 'success' },
  { name: 'Hamza S.', label: 'Already inside', tone: 'warning' }, { name: 'Areeba N.', label: 'Admitted', tone: 'success' },
] as const
function DoorScan() {
  const [i, setI] = useState(0)
  const reduce = useReducedMotion()
  useEffect(() => { if (reduce) return; const t = setInterval(() => setI(v => (v + 1) % SCANS.length), 2600); return () => clearInterval(t) }, [reduce])
  const s = SCANS[i]
  const color = s.tone === 'magenta' ? 'text-magenta bg-magenta/12' : s.tone === 'warning' ? 'text-warning bg-warning/12' : 'text-success bg-success/12'
  return (
    <div className="w-full max-w-[270px]">
      <div className="relative mx-auto w-44 overflow-hidden rounded-2xl bg-white p-3 shadow-card"><QRCodeSVG value="tikkit-x-scan" size={140} />
        <span aria-hidden className="k-scanline absolute inset-x-2 h-0.5 rounded-full bg-accent shadow-[0_0_14px_3px_rgb(var(--k-accent)/0.8)]" /></div>
      <div key={i} className={`k-pop-in mx-auto mt-4 flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium ${color}`}>
        {s.tone === 'magenta' ? <Crown className="h-4 w-4" /> : <Check className="h-4 w-4" />}<span className="flex-1">{s.name}</span><span className="text-xs">{s.label}</span></div>
    </div>
  )
}

function GuestScore() {
  const rows = [['Hamza Siddiqui', 'Trusted', 142, 'text-magenta bg-magenta/14'], ['Mehreen Qureshi', 'Regular', 78, 'text-violet bg-violet/14'], ['Danish Ali', 'New', 4, 'text-info bg-info/12']] as const
  return (
    <ul className="w-full max-w-[290px] space-y-2">
      {rows.map(([n, t, v, c]) => (
        <li key={n} className="flex items-center gap-3 rounded-xl bg-raised px-3 py-2.5 shadow-card ring-1 ring-line">
          <ShieldCheck className="h-4 w-4 text-success" aria-hidden /><span className="flex-1 truncate text-sm text-fg">{n}</span>
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${c}`}>{t}</span><CountUp to={v} className="w-9 text-right text-sm font-semibold text-fg" />
        </li>
      ))}
    </ul>
  )
}

export function NightSection() {
  return (
    <section id="after-dark" className="k-night relative overflow-hidden pb-24 pt-8 sm:pb-32" aria-labelledby="night-title">
      <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Marquee items={['Rooftop parties', 'Concerts', 'DJ nights', 'Private dinners', 'Launch nights', 'Pop-ups', 'Brand activations']} className="text-fg/70" />
        <div className="mx-auto mt-16 max-w-2xl text-center">
          <Reveal><p className="text-xs font-semibold uppercase tracking-[0.16em] text-magenta">After dark</p></Reveal>
          <Reveal delay={0.08}><h2 id="night-title" className="mt-3 text-balance text-4xl font-semibold tracking-tight text-fg sm:text-5xl">The night belongs to whoever controls the door.</h2></Reveal>
          <Reveal delay={0.16}><p className="mt-4 text-lg text-muted">Approval lists, secret locations and a scanner that tells you the truth in a second.</p></Reveal>
        </div>
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          <Tile eyebrow="Secret locations" title="Hide it until it matters" body="Show only the area. Confirmed guests get the address at the minute you choose." delay={0}><SecretReveal /></Tile>
          <Tile eyebrow="The door" title="Scan, admit, next" body="Door staff open a link on their phone. VIPs and repeat entries show up instantly." delay={0.1}><DoorScan /></Tile>
          <Tile eyebrow="Your crowd" title="Know who you are letting in" body="Guest score shows attendance history and verified IDs before you approve." delay={0.2}><GuestScore /></Tile>
        </div>
      </div>
    </section>
  )
}
