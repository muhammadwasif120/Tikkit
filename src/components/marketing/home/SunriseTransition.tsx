'use client'

import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { useRef } from 'react'
import { Hills, Stars, Sun } from './scenes'

/** Scroll-linked dawn. The page background runs from midnight to the daylight cream the next section starts with. */
export function SunriseTransition() {
  const ref = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start start', 'end end'] })

  const bg = useTransform(p, [0, 0.28, 0.5, 0.72, 0.9, 1], ['#070911', '#1b1038', '#6d2c63', '#f08a6b', '#ffd9a0', '#fffaf1'])
  const starsOpacity = useTransform(p, [0, 0.35], [1, 0])
  const sunY = useTransform(p, [0.15, 0.85], ['120%', '8%'])
  const sunScale = useTransform(p, [0.15, 0.85], [0.7, 1.15])
  const textOpacity = useTransform(p, [0.3, 0.45, 0.7, 0.85], [0, 1, 1, 0])
  const textY = useTransform(p, [0.3, 0.45], [24, 0])
  const textColor = useTransform(p, [0.3, 0.7, 0.85], ['#f4f0ff', '#fff7ec', '#3b2a1a'])
  const hillsOpacity = useTransform(p, [0.2, 0.6], [0, 1])

  if (reduce) {
    return (
      <section aria-labelledby="sunrise-title" className="relative px-4 py-24 text-center" style={{ background: 'linear-gradient(#070911, #6d2c63 40%, #f6c98d 80%, #fffaf1)' }}>
        <h2 id="sunrise-title" className="text-4xl font-semibold tracking-tight text-white sm:text-6xl">Then the sun comes up.</h2>
        <p className="mt-3 text-white/80">Not every great event happens after dark.</p>
      </section>
    )
  }

  return (
    <section ref={ref} aria-labelledby="sunrise-title" className="relative h-[190vh]">
      <motion.div style={{ backgroundColor: bg }} className="sticky top-0 h-screen overflow-hidden">
        <motion.div style={{ opacity: starsOpacity }} className="absolute inset-0"><Stars count={60} className="absolute inset-0" /></motion.div>
        <motion.div style={{ y: sunY, scale: sunScale }} className="absolute left-1/2 top-0 h-[70vmin] w-[70vmin] -translate-x-1/2">
          <Sun className="h-full w-full" />
        </motion.div>
        <motion.div style={{ opacity: hillsOpacity }} className="absolute inset-x-0 bottom-0 h-[38vh]"><Hills className="h-full w-full" /></motion.div>
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
