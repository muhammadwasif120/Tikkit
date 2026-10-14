import Link from 'next/link'
import type { ReactNode } from 'react'
import { Check } from 'lucide-react'
import { Logo } from '@/components/kit'

const points = [
  'QR tickets that cannot be shared',
  'One guest list for requests, payments and the door',
  'Promoter links and commissions, tracked for you',
]

/** Split screen frame for every auth page. The brand panel is hidden on small screens. */
export function AuthFrame({ children, title, lead }: { children: ReactNode; title: string; lead?: string }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
      <div className="flex flex-col px-4 py-6 sm:px-10">
        <Link href="/" aria-label="TIKKIT X home"><Logo /></Link>
        <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center py-10">
          <h1 className="text-3xl font-semibold tracking-tight text-fg">{title}</h1>
          {lead && <p className="mt-2 text-[15px] text-muted">{lead}</p>}
          <div className="mt-8">{children}</div>
        </div>
        <p className="text-center text-xs text-subtle">
          By continuing you agree to the <Link href="/terms" className="underline underline-offset-2 hover:text-fg">Terms</Link> and <Link href="/privacy" className="underline underline-offset-2 hover:text-fg">Privacy Policy</Link>.
        </p>
      </div>

      <aside aria-hidden className="relative hidden overflow-hidden border-l border-line bg-surface lg:block">
        <div className="absolute inset-0" style={{ backgroundImage: 'var(--k-glow)' }} />
        <div className="absolute -right-24 top-1/3 h-96 w-96 rounded-full opacity-40 blur-3xl" style={{ background: 'rgb(var(--k-magenta))' }} />
        <div className="relative flex h-full flex-col justify-center px-14 xl:px-20">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">Made for organizers in Pakistan</p>
          <p className="mt-4 max-w-md text-balance text-4xl font-semibold leading-tight tracking-tight text-fg">
            Sell tickets. Run the door. <span className="k-gradient-text">Know your crowd.</span>
          </p>
          <ul className="mt-10 space-y-4">
            {points.map(p => (
              <li key={p} className="flex items-center gap-3 text-[15px] text-muted">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-accent/12 text-accent"><Check className="h-3.5 w-3.5" /></span>{p}
              </li>
            ))}
          </ul>
        </div>
      </aside>
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
