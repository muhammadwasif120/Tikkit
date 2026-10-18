'use client'

import { useCallback, useEffect, useState, useTransition } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Play, RotateCcw } from 'lucide-react'
import { Badge, Button } from '@/components/kit'
import { createClient } from '@/lib/supabase/client'
import { resetDemo } from '@/app/actions/demoActions'
import { TourOverlay, type TourStep } from './TourOverlay'

type Step = TourStep & { path?: string; pathFrom?: string }

const nav = (href: string) => `header nav a[href="${href}"], nav[aria-label="Quick navigation"] a[href="${href}"], a[href="${href}"]`
const STEPS: Step[] = [
  { path: '/explore', title: 'Welcome to the attendee demo', body: 'You are Noor, a guest with tickets, a class pass and a retreat invite. Click anything. Nothing is emailed.' },
  { path: '/explore', target: 'input[name="q"]', title: 'Find something to go to', body: 'Search events by name, then narrow by when and category. City pages keep it local.' },
  { path: '/explore', target: '[aria-label="Category"]', title: 'Filter by category', body: 'Music, wellness, business, comedy and more. Everything here is a real event page.' },
  { path: '/explore', target: 'a[href^="/events/"]', title: 'Open an event', body: 'Each card shows the date, the area and the lowest price. Open one to see the details and book.' },
  { pathFrom: 'a[href^="/events/"]', target: 'main h1, h1', title: 'The event page', body: 'Ticket types, the organizer, and the venue. Secret venues show the area first and reveal the address before the night.' },
  { pathFrom: 'a[href^="/events/"]', target: 'input[aria-label="Promo or referral code"]', title: 'Book and pay', body: 'Pick a ticket and pay the organizer by bank, JazzCash or EasyPaisa. Upload the receipt and wait for approval. A promoter code goes here.' },
  { path: '/guest/tickets', target: nav('/guest/tickets'), title: 'My tickets', body: 'Every ticket in one place: tonight, requests waiting on approval, and past nights.' },
  { path: '/guest/tickets', target: 'main h2', title: 'Your QR ticket', body: 'Open a ticket to show its signed QR at the door. It works once and only for you, so a screenshot cannot get a friend in.' },
  { path: '/guest/tickets', target: 'a[href^="/itinerary/"]', title: 'Passes, classes and itineraries', body: 'Class passes, reservations and retreat itineraries sit below your event tickets, each with its own QR.', isNew: true },
  { path: '/guest/score', target: nav('/guest/score'), title: 'Your score', body: 'Showing up builds a tier that organizers see when you ask to join. No shows cost points.' },
  { path: '/guest/notifications', target: nav('/guest/notifications'), title: 'Alerts', body: 'Approvals, announcements, location reveals and class reminders.' },
  { path: '/guest/profile', target: nav('/guest/profile'), title: 'Profile and ID', body: 'Your details, ID verification for verified-only events, and the light or dark theme.' },
  { path: '/classes', target: 'main h1, h1', title: 'Classes and spaces', body: 'Book drop-in classes, buy a pass, or reserve a studio or court by the hour from the Classes and Spaces pages.', isNew: true },
  { path: '/explore', title: 'That is the tour', body: 'Want to host your own events? Start a 14 day free trial, or look at the organizer demo.' },
]

const KEY = 'tkx-att-tour'

/** Floating controls and spotlight tour for the attendee demo. Lives in the root layout so the tour survives page changes. */
export function AttendeeDemoHost() {
  const router = useRouter()
  const pathname = usePathname()
  const [on, setOn] = useState(false)
  const [step, setStep] = useState<number | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [pending, start] = useTransition()

  useEffect(() => {
    if (on) return
    let live = true
    createClient().auth.getSession().then(({ data }) => {
      const u = data.session?.user
      if (!live || !u || u.app_metadata?.demo !== true || u.user_metadata?.role !== 'attendee') return
      setOn(true)
      try {
        const saved = sessionStorage.getItem(KEY)
        if (saved === null) { sessionStorage.setItem(KEY, '0'); setTimeout(() => live && setStep(0), 900) }
        else if (saved !== 'off') setStep(Math.min(Number(saved) || 0, STEPS.length - 1))
      } catch {}
    })
    return () => { live = false }
  }, [pathname, on])

  const go = useCallback((i: number) => {
    const n = Math.max(0, Math.min(STEPS.length - 1, i))
    const st = STEPS[n]
    const from = st.pathFrom ? document.querySelector<HTMLAnchorElement>(st.pathFrom)?.getAttribute('href') : null
    const same = STEPS[n - 1]?.pathFrom === st.pathFrom && st.pathFrom
    const dest = same ? null : from ?? st.path
    try { sessionStorage.setItem(KEY, String(n)) } catch {}
    setStep(n)
    if (dest && dest !== window.location.pathname) router.push(dest)
  }, [router])

  const close = useCallback(() => { setStep(null); try { sessionStorage.setItem(KEY, 'off') } catch {} }, [])

  if (!on) return null
  return (
    <>
      <div className="fixed bottom-20 left-3 z-[9400] flex flex-wrap items-center gap-2 rounded-2xl bg-surface/95 p-2 pl-3 shadow-card ring-1 ring-line backdrop-blur sm:bottom-4">
        <Badge tone="accent" dot>Live demo</Badge>
        <Button size="sm" leading={<Play className="h-3.5 w-3.5" />} onClick={() => go(0)}>Tour</Button>
        <Button size="sm" variant="secondary" loading={pending} leading={<RotateCcw className="h-3.5 w-3.5" />}
          onClick={() => start(async () => { const r = await resetDemo(); setMsg(r.message); if (r.ok) router.refresh() })}>Reset</Button>
        {msg && <span className="pr-2 text-xs text-muted">{msg}</span>}
      </div>
      {step !== null && <TourOverlay steps={STEPS} step={step} onNext={() => go(step + 1)} onPrev={() => go(step - 1)} onClose={close} ctaHref="/auth/login?flow=organizer-signup" ctaLabel="Start free trial" />}
    </>
  )
}
