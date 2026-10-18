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
  { path: '/guest', title: 'Welcome to the attendee demo', body: 'You are Noor, a guest with tickets, a class pass and a retreat invite. This is her account. Click anything. Nothing is emailed.' },
  { path: '/guest', target: '[data-tour="next-up"]', title: 'Today', body: 'Your home screen leads with what is next: the countdown, the place, directions and your QR ticket.' },
  { path: '/guest', target: '[data-tour="attention"]', title: 'Needs your attention', body: 'Payments due, receipts under review and requests waiting on an organizer, so nothing slips.' },
  { path: '/guest', target: '[data-tour="wallet-card"]', title: 'Passes at a glance', body: 'Your class pass balance, your score tier and your schedule are one tap away.', isNew: true },
  { path: '/guest/tickets', target: nav('/guest/tickets'), title: 'My tickets', body: 'Live tickets, your collection, and the nights you missed.' },
  { path: '/guest/tickets', target: '[role="tablist"] button:nth-child(2)', title: 'Your collection', body: 'Check in and the QR is used up. It turns into a collectible card with a serial number. Only nights you attended get one. Missed or cancelled events stay greyed out under Past.', isNew: true },
  { path: '/guest/tickets', target: 'a[href^="/itinerary/"]', title: 'Passes, classes and itineraries', body: 'Class passes, reservations and retreat itineraries sit below your event tickets, each with its own QR.', isNew: true },
  { path: '/guest/explore', target: '[data-tour="interests"]', title: 'For you', body: 'A feed built from what you attend, book and save, plus interests you tick. It mixes events, classes and spaces.', isNew: true },
  { path: '/guest/explore', target: 'main a[href^="/events/"]', title: 'Why you see it', body: 'Every pick says why. A few come from outside your usual taste, so a painter can still stumble on a punk gig. Heart an event to save it, or follow an organizer.' },
  { pathFrom: 'main a[href^="/events/"]', target: 'main h1, h1', title: 'The event page', body: 'Ticket types, the organizer, and the venue. Secret venues show the area first and reveal the address before the night.' },
  { pathFrom: 'main a[href^="/events/"]', target: 'input[aria-label="Promo or referral code"]', title: 'Book and pay', body: 'Pick a ticket and pay the organizer by bank, JazzCash or EasyPaisa. Upload the receipt and wait for approval. A promoter code goes here.' },
  { path: '/guest/saved', target: '[data-tour="following"]', title: 'Saved and following', body: 'Events you saved and organizers you follow. Their events rank higher for you.', isNew: true },
  { path: '/guest/schedule', target: '[data-tour="ics"]', title: 'Schedule', body: 'Everything you are going to in date order, with one tap to add it all to your calendar.', isNew: true },
  { path: '/guest/wallet', target: '[data-tour="passes"]', title: 'Wallet', body: 'Pass balances and every payment you have made, with the organizer decision on each.', isNew: true },
  { path: '/guest/score', target: nav('/guest/score'), title: 'Your score', body: 'Showing up builds a tier that organizers see when you ask to join. No shows cost points.' },
  { path: '/guest/notifications', target: '[data-tour="alerts"]', title: 'Alerts', body: 'Approvals, announcements, location reveals and class reminders.' },
  { path: '/guest/profile', target: nav('/guest/profile'), title: 'Profile and preferences', body: 'Your details, ID verification for verified-only events, email preferences and the light or dark theme.' },
  { path: '/classes', target: 'main h1, h1', title: 'Classes and spaces', body: 'Book drop-in classes, buy a pass, or reserve a studio or court by the hour from the Classes and Spaces pages.', isNew: true },
  { path: '/guest', title: 'That is the tour', body: 'Want to host your own events? Start a 14 day free trial, or look at the organizer demo.' },
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
