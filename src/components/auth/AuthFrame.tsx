import Link from 'next/link'
import type { ReactNode } from 'react'
import { Check } from 'lucide-react'
import { Logo } from '@/components/kit'

/** Small floating proof chips that drift around the card on wide screens. Purely decorative. */
const CHIPS: { text: string; sub: string; tone: string; pos: string; d: number; delay: number }[] = [
  { text: 'VIP admitted', sub: 'Mehreen Q. at the door', tone: 'bg-magenta/14 text-magenta', pos: 'left-[5%] top-[16%]', d: 7, delay: 0 },
  { text: 'PKR 1,800', sub: 'Early bird sold', tone: 'bg-accent/14 text-accent', pos: 'left-[9%] top-[62%]', d: 8, delay: -2 },
  { text: 'ZAIN10', sub: '64 sales from this promoter', tone: 'bg-violet/14 text-violet', pos: 'right-[5%] top-[12%]', d: 9, delay: -4 },
  { text: 'Receipt approved', sub: 'QR ticket sent', tone: 'bg-success/14 text-success', pos: 'right-[7%] top-[70%]', d: 7.5, delay: -1 },
]

function Floaters({ hasAside }: { hasAside: boolean }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 hidden lg:block">
      {CHIPS.map(c => (
        <div key={c.text} className={`k-floaty absolute ${c.pos} ${hasAside && c.pos.includes('right') ? 'xl:hidden' : ''}`} style={{ ['--d' as string]: `${c.d}s`, ['--delay' as string]: `${c.delay}s` }}>
          <div className="flex items-center gap-3 rounded-2xl bg-surface/80 px-4 py-3 shadow-card ring-1 ring-line backdrop-blur">
            <span className={`grid h-9 w-9 place-items-center rounded-full ${c.tone}`}><Check className="h-4 w-4" /></span>
            <div><p className="text-sm font-semibold text-fg">{c.text}</p><p className="text-xs text-muted">{c.sub}</p></div>
          </div>
        </div>
      ))}
    </div>
  )
}

/** Centered frame for every auth page. On wide screens the card floats over a glowing backdrop with
 *  drifting chips around it; `aside` (the journey's tour scene) sits to the right from xl up. */
export function AuthFrame({ children, title, lead, aside }: { children: ReactNode; title: string; lead?: string; aside?: ReactNode }) {
  return (
    <div className="relative isolate flex min-h-screen flex-col overflow-hidden">
      <div aria-hidden className="absolute inset-0 -z-20 hidden lg:block" style={{ backgroundImage: 'var(--k-glow)' }} />
      <div aria-hidden className="k-aurora absolute -left-[10%] top-[-15%] -z-10 hidden h-[60vh] w-[55vw] lg:block" style={{ background: 'radial-gradient(closest-side, rgb(34 211 238 / 0.16), transparent)' }} />
      <div aria-hidden className="k-aurora absolute -right-[10%] bottom-[-15%] -z-10 hidden h-[60vh] w-[55vw] lg:block" style={{ animationDelay: '-6s', background: 'radial-gradient(closest-side, rgb(214 96 236 / 0.16), transparent)' }} />
      <Floaters hasAside={!!aside} />
      {aside && <div className="absolute right-[3%] top-1/2 z-0 hidden w-[300px] -translate-y-1/2 xl:block">{aside}</div>}

      <header className="px-4 py-6 sm:px-10 lg:flex lg:justify-center"><Link href="/" aria-label="TIKKIT X home"><Logo className="lg:h-8" /></Link></header>
      <div className="flex flex-1 items-center justify-center px-4 pb-6 sm:px-10">
        <div className="w-full max-w-[440px] lg:rounded-3xl lg:bg-surface/85 lg:p-10 lg:shadow-card lg:ring-1 lg:ring-line lg:backdrop-blur-xl">
          <h1 className="text-3xl font-semibold tracking-tight text-fg">{title}</h1>
          {lead && <p className="mt-2 text-[15px] text-muted">{lead}</p>}
          <div className="mt-8">{children}</div>
        </div>
      </div>
      <p className="px-4 pb-6 text-center text-xs text-subtle">
        By continuing you agree to the <Link href="/terms" className="underline underline-offset-2 hover:text-fg">Terms</Link> and <Link href="/privacy" className="underline underline-offset-2 hover:text-fg">Privacy Policy</Link>.
      </p>
    </div>
  )
}

export function Divider({ children }: { children: ReactNode }) {
  return (
    <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wider text-subtle" role="separator">
      <span className="h-px flex-1 bg-line" />{children}<span className="h-px flex-1 bg-line" />
    </div>
  )
}

export function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.4-1.7 4.1-5.5 4.1a6.2 6.2 0 0 1 0-12.4c2 0 3.3.9 4.1 1.6l2.8-2.7A10 10 0 0 0 12 2a10 10 0 1 0 0 20c5.8 0 9.6-4 9.6-9.8 0-.7-.1-1.2-.2-1.8H12Z" />
    </svg>
  )
}
