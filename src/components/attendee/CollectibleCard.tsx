'use client'

import { useRef } from 'react'
import { MapPin } from 'lucide-react'
import { fmtDate } from '@/lib/format'
import { cn } from '@/lib/cn'

export type Collectible = {
  id: string; title: string; slug: string | null; startsAt: string; attendedAt: string | null; where: string
  cover: string | null; color: string | null; icon: string | null; organizer: string | null
  ticket: string | null; isVip: boolean; serial: number; total: number; paid: number | null
  rarity: 'Founding guest' | 'VIP' | 'Early bird' | 'Intimate night' | 'Attended'
}

const RARITY: Record<Collectible['rarity'], string> = {
  'Founding guest': 'bg-amber-300/90 text-amber-950', VIP: 'bg-magenta text-white', 'Early bird': 'bg-accent text-accent-fg',
  'Intimate night': 'bg-violet text-white', Attended: 'bg-white/85 text-slate-900',
}

/** A ticket that has been used. It replaces the QR once you have checked in, and only exists for nights you attended. */
export function CollectibleCard({ c, className, onClick }: { c: Collectible; className?: string; onClick?: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const tint = c.color ?? '#22d3ee'

  function move(e: React.PointerEvent<HTMLDivElement>) {
    const el = ref.current; if (!el) return
    const r = el.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height
    el.style.setProperty('--rx', `${(0.5 - y) * 12}deg`); el.style.setProperty('--ry', `${(x - 0.5) * 14}deg`)
    el.style.setProperty('--mx', `${x * 100}%`); el.style.setProperty('--my', `${y * 100}%`)
  }
  function leave() { const el = ref.current; if (!el) return; ;['--rx', '--ry'].forEach(k => el.style.setProperty(k, '0deg')) }

  return (
    <div className={cn('[perspective:900px]', className)}>
      <div ref={ref} onPointerMove={move} onPointerLeave={leave} onClick={onClick} role={onClick ? 'button' : undefined} tabIndex={onClick ? 0 : undefined}
        onKeyDown={onClick ? (e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() } }) : undefined}
        aria-label={`${c.title}, collectible ticket number ${c.serial} of ${c.total}`}
        className="group relative aspect-[3/4] w-full cursor-pointer select-none overflow-hidden rounded-3xl bg-[#0b0d16] text-white shadow-card ring-1 ring-white/10 transition-transform duration-150 ease-out [transform:rotateX(var(--rx,0deg))_rotateY(var(--ry,0deg))]">
        {/* art */}
        {c.cover
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={c.cover} alt="" className="absolute inset-0 h-full w-full object-cover" />
          : <div className="absolute inset-0" style={{ backgroundImage: `radial-gradient(120% 80% at 15% 0%, ${tint}cc, transparent 60%), radial-gradient(100% 70% at 100% 100%, ${tint}66, transparent 65%), linear-gradient(160deg, #141826, #0b0d16)` }}>
              <span className="absolute -right-4 top-10 text-[9rem] leading-none opacity-25" aria-hidden>{c.icon ?? '🎟️'}</span>
              <svg className="absolute inset-0 h-full w-full opacity-[0.12]" aria-hidden><defs><pattern id={`p-${c.id}`} width="22" height="22" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><line x1="0" y1="0" x2="0" y2="22" stroke="#fff" strokeWidth="1.2" /></pattern></defs><rect width="100%" height="100%" fill={`url(#p-${c.id})`} /></svg>
            </div>}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10" />
        {/* holographic sheen follows the pointer */}
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-0 mix-blend-color-dodge transition-opacity duration-200 group-hover:opacity-60"
          style={{ background: 'radial-gradient(circle at var(--mx,50%) var(--my,30%), rgba(255,255,255,.55), transparent 40%), conic-gradient(from 210deg at var(--mx,50%) var(--my,50%), #22d3ee, #d660ec, #fde68a, #22d3ee)' }} />
        <div aria-hidden className="pointer-events-none absolute inset-2 rounded-[1.25rem] ring-1 ring-white/20" />

        <div className="absolute inset-x-4 top-4 flex items-start justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/80">TIKKIT X · Collectible</span>
          <span className={cn('rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider', RARITY[c.rarity])}>{c.rarity}</span>
        </div>
        <div aria-hidden className="absolute right-4 top-14 -rotate-12 rounded-md border-2 border-white/70 px-2 py-0.5 text-[11px] font-black uppercase tracking-[0.2em] text-white/80">Attended</div>

        <div className="absolute inset-x-4 bottom-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-white/70">{fmtDate(c.startsAt)}</p>
          <h3 className="mt-1 line-clamp-2 text-xl font-semibold leading-tight tracking-tight">{c.title}</h3>
          <p className="mt-1.5 flex items-center gap-1.5 truncate text-xs text-white/75"><MapPin className="h-3 w-3 shrink-0" aria-hidden /><span className="truncate">{c.where}</span></p>
          <div className="mt-3 flex items-end justify-between border-t border-white/20 pt-2.5">
            <div><p className="text-[10px] uppercase tracking-wider text-white/60">{c.ticket ?? 'Ticket'}</p><p className="truncate text-xs text-white/80">{c.organizer}</p></div>
            <p className="tnum text-right text-sm font-semibold">No. {String(c.serial).padStart(3, '0')}<span className="text-white/60"> / {c.total}</span></p>
          </div>
        </div>
      </div>
    </div>
  )
}
