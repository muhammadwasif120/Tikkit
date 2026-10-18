'use client'

import { useState } from 'react'
import { ArrowLeft, BadgeCheck, CalendarDays, Clock, Heart, Lock, Share2, Tag, Users } from 'lucide-react'
import { Avatar, Badge, Button, Card, Input, Logo, ThemeToggle } from '@/components/kit'
import { cn } from '@/lib/cn'

const TICKETS = [
  { id: 'eb', name: 'Early bird', price: 1800, note: 'Ends in 1d 14h', left: 11, tone: 'warning' as const },
  { id: 'ga', name: 'General', price: 2500, note: 'Entry and one welcome drink', left: 92, tone: 'neutral' as const },
  { id: 'vip', name: 'VIP', price: 6000, note: 'Priority entry, reserved lounge, 2 drinks', left: 6, tone: 'magenta' as const },
]

export default function AttendeeEventPrototype() {
  const [sel, setSel] = useState('ga')
  const ticket = TICKETS.find(t => t.id === sel)!
  const [code, setCode] = useState('ZAIN10')
  const discount = code.toUpperCase() === 'ZAIN10' ? 250 : 0

  return (
    <div className="kit min-h-screen pb-32">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-canvas/80 px-4 backdrop-blur-xl">
        <Button variant="ghost" size="icon" aria-label="Back"><ArrowLeft className="h-5 w-5" /></Button>
        <Logo compact />
        <div className="flex"><ThemeToggle /><Button variant="ghost" size="icon" aria-label="Share"><Share2 className="h-[18px] w-[18px]" /></Button></div>
      </header>

      <div className="mx-auto max-w-xl">
        {/* Cover */}
        <div className="relative mx-4 mt-4 aspect-[16/10] overflow-hidden rounded-3xl" style={{ background: 'linear-gradient(135deg, #0e7490 0%, #4c1d95 55%, #be185d 100%)' }}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.25),transparent_55%)]" aria-hidden />
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-black/70 to-transparent p-4">
            <Badge tone="neutral" className="bg-black/40 text-white backdrop-blur">Music</Badge>
            <Button size="icon-sm" variant="secondary" aria-label="Save event" className="bg-black/40 text-white backdrop-blur"><Heart className="h-4 w-4" /></Button>
          </div>
        </div>

        <div className="space-y-6 px-4 pt-5">
          <div>
            <h1 className="text-[28px] font-semibold leading-tight tracking-tight text-fg">Rooftop Sunset Session</h1>
            <a href="#" className="mt-2 inline-flex items-center gap-2 text-sm text-muted hover:text-fg">
              <Avatar name="Nightshift Karachi" size={22} />
              <span>Nightshift Karachi</span>
              <BadgeCheck className="h-4 w-4 text-accent" aria-label="Verified organizer" />
            </a>
          </div>

          <Card className="divide-y divide-line">
            <div className="flex items-center gap-3 p-4"><CalendarDays className="h-5 w-5 shrink-0 text-accent" aria-hidden /><div><p className="text-sm font-medium text-fg">Friday, 17 October</p><p className="text-[13px] text-muted">7:30 pm to 11:30 pm</p></div></div>
            <div className="flex items-start gap-3 p-4">
              <Lock className="mt-0.5 h-5 w-5 shrink-0 text-violet" aria-hidden />
              <div className="flex-1">
                <p className="text-sm font-medium text-fg">DHA, Karachi</p>
                <p className="text-[13px] text-muted">Exact location unlocks for confirmed guests</p>
                <div className="mt-2.5 inline-flex items-center gap-2 rounded-lg bg-violet/12 px-2.5 py-1.5 text-xs font-medium text-violet"><Clock className="h-3.5 w-3.5" aria-hidden /> Reveals Fri 5:00 pm</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4"><Users className="h-5 w-5 shrink-0 text-accent" aria-hidden /><div><p className="text-sm font-medium text-fg"><span className="tnum">212</span> going</p><p className="text-[13px] text-muted">88 spots left</p></div></div>
          </Card>

          <section aria-labelledby="tix">
            <h2 id="tix" className="mb-3 text-[15px] font-semibold text-fg">Choose your ticket</h2>
            <div className="space-y-2.5" role="radiogroup" aria-label="Ticket type">
              {TICKETS.map(t => (
                <button
                  key={t.id} role="radio" aria-checked={sel === t.id} type="button" onClick={() => setSel(t.id)}
                  className={cn(
                    'flex w-full cursor-pointer items-center gap-4 rounded-2xl p-4 text-left transition-[box-shadow,background-color]',
                    sel === t.id ? (t.id === 'vip' ? 'bg-magenta/8 shadow-[inset_0_0_0_1.5px_rgb(var(--k-magenta))]' : 'bg-accent/8 shadow-[inset_0_0_0_1.5px_rgb(var(--k-accent))]') : 'bg-surface shadow-card hover:bg-raised',
                  )}
                >
                  <span className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2', sel === t.id ? (t.id === 'vip' ? 'border-magenta' : 'border-accent') : 'border-line-strong')}>
                    {sel === t.id && <span className={cn('h-2.5 w-2.5 rounded-full', t.id === 'vip' ? 'bg-magenta' : 'bg-accent')} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 text-sm font-semibold text-fg">{t.name}{t.id === 'eb' && <Badge tone="warning">{t.note}</Badge>}{t.id === 'vip' && <Badge tone="magenta">{t.left} left</Badge>}</span>
                    <span className="mt-0.5 block text-[13px] text-muted">{t.id === 'eb' ? `${t.left} left at this price` : t.note}</span>
                  </span>
                  <span className="tnum text-base font-semibold text-fg">PKR {t.price.toLocaleString()}</span>
                </button>
              ))}
            </div>
          </section>

          <section aria-labelledby="code">
            <h2 id="code" className="mb-3 flex items-center gap-2 text-[15px] font-semibold text-fg"><Tag className="h-4 w-4 text-subtle" aria-hidden /> Have a code?</h2>
            <div className="flex gap-2">
              <div className="flex-1"><Input aria-label="Referral or discount code" value={code} onChange={e => setCode(e.target.value)} placeholder="Enter code" /></div>
              <Button variant="secondary">Apply</Button>
            </div>
            {discount > 0 && <p className="mt-2 text-[13px] text-success">Code applied. You save PKR {discount}.</p>}
          </section>

          <section>
            <h2 className="mb-2 text-[15px] font-semibold text-fg">About</h2>
            <p className="text-sm leading-relaxed text-muted">Golden hour, a live set from three Karachi DJs, and a skyline you will not forget. Smart casual. No re-entry once you leave. Tickets are QR based and checked at the door.</p>
          </section>
        </div>
      </div>

      {/* Sticky checkout bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/90 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-xl items-center gap-4">
          <div className="min-w-0">
            <p className="tnum text-lg font-semibold leading-tight text-fg">PKR {(ticket.price - discount).toLocaleString()}</p>
            <p className="truncate text-xs text-muted">{ticket.name}{discount > 0 && <span className="text-success"> · code applied</span>}</p>
          </div>
          <Button size="lg" className="flex-1">Register</Button>
        </div>
      </div>
    </div>
  )
}
