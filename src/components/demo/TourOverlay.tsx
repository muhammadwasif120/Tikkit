'use client'

import { useCallback, useEffect, useLayoutEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, X } from 'lucide-react'
import { Badge, Button, ButtonLink } from '@/components/kit'
import { cn } from '@/lib/cn'

export type TourStep = { target?: string; title: string; body: string; isNew?: boolean }
type Rect = { top: number; left: number; width: number; height: number }

const find = (sel?: string) => (sel ? [...document.querySelectorAll<HTMLElement>(sel)].find(e => e.getBoundingClientRect().width > 0) : undefined)

/** Spotlight tour card. Targets are CSS selectors, looked up for a few seconds so pages that are still loading are found. */
export function TourOverlay({ steps, step, onNext, onPrev, onClose, ctaHref, ctaLabel }: {
  steps: TourStep[]; step: number; onNext: () => void; onPrev: () => void; onClose: () => void; ctaHref: string; ctaLabel: string
}) {
  const s = steps[step]
  const [rect, setRect] = useState<Rect | null>(null)
  const [wide, setWide] = useState(true)

  const measure = useCallback(() => {
    setWide(window.innerWidth >= 1024)
    const el = find(s.target)
    if (!el) return false
    const r = el.getBoundingClientRect()
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
    return true
  }, [s.target])

  useLayoutEffect(() => {
    setRect(null)
    if (!s.target) return
    let tries = 0
    const t = setInterval(() => {
      if (find(s.target)) find(s.target)!.scrollIntoView({ block: 'center', behavior: 'instant' as ScrollBehavior })
      if (measure() || ++tries > 30) clearInterval(t)
    }, 150)
    const on = () => measure()
    window.addEventListener('resize', on); window.addEventListener('scroll', on, true)
    return () => { clearInterval(t); window.removeEventListener('resize', on); window.removeEventListener('scroll', on, true) }
  }, [step, s.target, measure])

  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); if (e.key === 'ArrowRight') onNext(); if (e.key === 'ArrowLeft') onPrev() }
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k)
  }, [onNext, onPrev, onClose])

  const last = step === steps.length - 1
  const W = 320
  let style: React.CSSProperties | undefined
  if (wide) {
    if (!rect) style = { left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: W }
    else {
      const right = rect.left + rect.width + 16 + W < window.innerWidth
      const below = rect.top + rect.height + 14 + 240 < window.innerHeight
      style = right ? { left: rect.left + rect.width + 16, top: Math.min(Math.max(12, rect.top), window.innerHeight - 260), width: W }
        : { left: Math.max(12, Math.min(rect.left, window.innerWidth - W - 12)), top: below ? rect.top + rect.height + 14 : Math.max(12, rect.top - 250), width: W }
    }
  }

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
        <div className="mt-4 flex items-center gap-1.5" aria-hidden>{steps.map((_, n) => <span key={n} className={cn('h-1.5 rounded-full transition-all', n === step ? 'w-5 bg-accent' : n < step ? 'w-1.5 bg-accent/60' : 'w-1.5 bg-line-strong')} />)}</div>
        <div className="mt-4 flex items-center gap-2">
          {step > 0 && <Button size="sm" variant="secondary" onClick={onPrev} leading={<ArrowLeft className="h-3.5 w-3.5" />}>Back</Button>}
          <span className="flex-1" />
          {last ? <ButtonLink href={ctaHref} size="sm" trailing={<ArrowRight className="h-3.5 w-3.5" />}>{ctaLabel}</ButtonLink>
                : <Button size="sm" onClick={onNext} trailing={<ArrowRight className="h-3.5 w-3.5" />}>{step === 0 ? 'Start tour' : 'Next'}</Button>}
        </div>
      </div>
    </div>
  )
}
