'use client'

import { motion, useInView, useReducedMotion, animate } from 'motion/react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

/** Fades and lifts its children in when they scroll into view. Static for reduced motion. */
export function Reveal({ children, delay = 0, y = 24, className, as = 'div' }: { children: ReactNode; delay?: number; y?: number; className?: string; as?: 'div' | 'li' | 'section' }) {
  const reduce = useReducedMotion()
  const Tag = motion[as] as typeof motion.div
  if (reduce) return <div className={className}>{children}</div>
  return (
    <Tag initial={{ opacity: 0, y }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-10% 0px' }} transition={{ duration: 0.6, delay, ease: [0.2, 0.7, 0.2, 1] }} className={className}>
      {children}
    </Tag>
  )
}

/** Reveals a headline word by word. The text is in the DOM from the start for search engines. */
export function SplitWords({ text, className, wordClassName, delay = 0 }: { text: string; className?: string; wordClassName?: string; delay?: number }) {
  const reduce = useReducedMotion()
  const words = text.split(' ')
  return (
    <span className={className} aria-label={text}>
      {words.map((w, i) => (
        <span key={i} aria-hidden className="inline-block overflow-hidden pb-[0.12em] align-bottom">
          <motion.span className={cn("inline-block", wordClassName)} initial={reduce ? false : { y: '110%' }} animate={{ y: 0 }} transition={{ duration: 0.7, delay: delay + i * 0.09, ease: [0.2, 0.7, 0.2, 1] }}>
            {w}{i < words.length - 1 ? ' ' : ''}
          </motion.span>
        </span>
      ))}
    </span>
  )
}

/** Counts up to a number when it comes into view. */
export function CountUp({ to, className, suffix = '' }: { to: number; className?: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })
  const reduce = useReducedMotion()
  const [n, setN] = useState(reduce ? to : 0)
  useEffect(() => {
    if (!inView || reduce) return
    const c = animate(0, to, { duration: 1.4, ease: 'easeOut', onUpdate: v => setN(Math.round(v)) })
    return () => c.stop()
  }, [inView, to, reduce])
  return <span ref={ref} className={cn('tnum', className)}>{n}{suffix}</span>
}

/** Infinite, pausable ticker of short labels. */
export function Marquee({ items, className }: { items: string[]; className?: string }) {
  const row = (k: string) => items.map((t, i) => (
    <span key={`${k}${i}`} className="flex shrink-0 items-center gap-6 pr-6 text-lg font-medium tracking-tight sm:text-2xl">{t}<span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current opacity-40" /></span>
  ))
  return (
    <div className={cn('overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)]', className)} aria-label={items.join(', ')}>
      <div className="k-marquee" aria-hidden>{row('a')}{row('b')}</div>
    </div>
  )
}
