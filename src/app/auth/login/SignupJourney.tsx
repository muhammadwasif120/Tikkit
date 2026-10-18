'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Building2, CalendarPlus, Check, Eye, EyeOff, Inbox, Mail, PartyPopper, QrCode, Share2, Ticket, User } from 'lucide-react'
import { Button, Field, Input, Select } from '@/components/kit'
import { AuthFrame, Divider, GoogleIcon } from '@/components/auth/AuthFrame'
import { CreateVisual, DoorVisual, FindVisual, ShareVisual, TicketVisual } from '@/components/marketing/home/HowVisuals'
import { PAKISTAN_CITIES } from '@/lib/pakistanCities'
import { cn } from '@/lib/cn'

type Role = 'attendee' | 'organizer'
type Form = { name: string; email: string; password: string; phone: string; city: string; company: string; gender: string; dob: string }
type StepId = 'role' | 'you' | 'brand' | 'about' | 'launch'

const STEPS: Record<Role, StepId[]> = { organizer: ['role', 'you', 'brand', 'launch'], attendee: ['role', 'you', 'about'] }

const COPY: Record<StepId, { label: string; title: (r: Role) => string; lead: (r: Role) => string }> = {
  role: { label: 'Welcome', title: () => 'Welcome to TIKKIT X', lead: () => 'Two minutes and you are in. What brings you here?' },
  you: { label: 'You', title: r => (r === 'organizer' ? 'First, who are you?' : 'Let us get you in'), lead: () => 'This is how you will log in.' },
  brand: { label: 'Your brand', title: () => 'Tell us about your events', lead: () => 'Guests see your name on every event page.' },
  about: { label: 'About you', title: () => 'A little about you', lead: () => 'Organizers use this to approve guests.' },
  launch: { label: 'Launch', title: () => 'Ready to launch', lead: () => 'Check your details, then start your 14 days.' },
}

const SCENES: Partial<Record<`${Role}:${StepId}`, { visual: React.ReactNode; title: string; body: string }>> = {
  'organizer:you': { visual: <CreateVisual />, title: 'Your event page, live in minutes', body: 'Name it, price it, hide the venue if you like. Done before your coffee cools.' },
  'organizer:brand': { visual: <ShareVisual />, title: 'Every promoter gets a link', body: 'Codes, QR and commissions are tracked per promoter, so you know who sold what.' },
  'organizer:launch': { visual: <DoorVisual />, title: 'Then the door runs itself', body: 'Signed QR tickets, scanned at the gate. A screenshot cannot get a second person in.' },
  'attendee:you': { visual: <FindVisual />, title: 'Find the night you want', body: 'Browse events, request a spot and pay the organizer directly.' },
  'attendee:about': { visual: <TicketVisual />, title: 'Your ticket, ready on your phone', body: 'A signed QR code that only works for you.' },
}

function Aside({ role, step, index, total }: { role: Role; step: StepId; index: number; total: number }) {
  const keys = (STEPS[role].map(s => `${role}:${s}`)) as `${Role}:${StepId}`[]
  const key = `${role}:${step}` as const
  const fallback = !SCENES[key]
  return (
    <div className="w-full text-center">
      <div className="relative grid h-[300px] place-items-center overflow-hidden rounded-3xl bg-surface/80 shadow-card ring-1 ring-line backdrop-blur" style={{ backgroundImage: 'radial-gradient(70% 55% at 50% 0%, rgb(34 211 238 / 0.16), transparent 70%)' }}>
        {fallback && (
          <div className="k-fade-up px-8">
            <PartyPopper className="mx-auto h-10 w-10 text-accent" aria-hidden />
            <p className="mt-4 text-2xl font-semibold tracking-tight text-fg">Sell tickets. Run the door. <span className="k-gradient-text">Know your crowd.</span></p>
          </div>
        )}
        {keys.map(k => SCENES[k] && (
          <div key={k} className={cn('absolute inset-0 grid place-items-center p-6 text-left transition-all duration-500', k === key ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0')} aria-hidden={k !== key}>
            {k === key && SCENES[k]!.visual}
          </div>
        ))}
      </div>
      <div className="mt-6 min-h-[84px]">
        {!fallback && <div key={key} className="k-fade-up"><p className="text-lg font-semibold text-fg">{SCENES[key]!.title}</p><p className="mt-1.5 text-sm text-muted">{SCENES[key]!.body}</p></div>}
      </div>
      <div className="mt-2 flex justify-center gap-1.5" aria-hidden>
        {Array.from({ length: total }).map((_, n) => <span key={n} className={cn('h-1.5 rounded-full transition-all duration-500', n === index ? 'w-6 bg-accent' : n < index ? 'w-1.5 bg-accent/60' : 'w-1.5 bg-line-strong')} />)}
      </div>
    </div>
  )
}

function Done({ role, onLogin }: { role: Role; onLogin: () => void }) {
  const items = role === 'organizer'
    ? [[Check, 'Account created', 'Your 14 day trial is waiting.'], [Inbox, 'Confirm your email', 'We sent you a link. Open it to continue.'], [CalendarPlus, 'Create your first event', 'Takes about ten minutes.'], [Share2, 'Share your link', 'WhatsApp, Instagram, promoters.'], [QrCode, 'Scan at the door', 'Signed QR tickets, one entry each.']] as const
    : [[Check, 'Account created', 'Welcome aboard.'], [Inbox, 'Confirm your email', 'We sent you a link. Open it to continue.'], [Ticket, 'Find an event', 'Request a spot and get your ticket.']] as const
  return (
    <div>
      <ol className="space-y-3">
        {items.map(([Icon, t, d], n) => (
          <li key={t} className="k-fade-up flex items-start gap-3 rounded-xl bg-surface p-4 shadow-card ring-1 ring-line" style={{ animationDelay: `${n * 0.35}s` }}>
            <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-full', n === 0 ? 'bg-success/14 text-success' : n === 1 ? 'bg-accent/14 text-accent' : 'bg-raised text-muted')}><Icon className="h-4 w-4" aria-hidden /></span>
            <div><p className="text-sm font-semibold text-fg">{t}</p><p className="text-sm text-muted">{d}</p></div>
          </li>
        ))}
      </ol>
      <Button size="lg" className="mt-6 w-full" onClick={onLogin}>I have confirmed, log me in</Button>
    </div>
  )
}

export function SignupJourney(p: {
  f: Form; set: (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void
  role: Role; setRole: (r: Role) => void; busy: boolean; error: string | null; setError: (e: string | null) => void; notice: string | null
  showPw: boolean; setShowPw: (fn: (s: boolean) => boolean) => void
  onSubmit: (e: React.FormEvent) => void; onGoogle: () => void; onLogin: () => void; startAtYou: boolean
}) {
  const { f, set, role, error } = p
  const [at, setAt] = useState(p.startAtYou ? 1 : 0)
  const steps = STEPS[role]
  const step = steps[Math.min(at, steps.length - 1)]
  const last = at >= steps.length - 1
  const top = useRef<HTMLDivElement>(null)
  useEffect(() => { top.current?.scrollIntoView({ block: 'nearest' }) }, [at])

  function check(): string | null {
    if (step === 'you') {
      if (f.name.trim().length < 2) return 'Add your full name.'
      if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) return 'Enter a valid email address.'
      if (f.password.length < 8) return 'Use a password with at least 8 characters.'
    }
    if (step === 'brand') {
      if (!f.company.trim()) return 'Add your company or brand name.'
      if (!f.city) return 'Pick your city.'
      if (!/^(\+92|0)?3\d{9}$/.test(f.phone.replace(/[\s-]/g, ''))) return 'Enter a Pakistani mobile number, like 0300 1234567.'
    }
    if (step === 'about') {
      if (!f.city) return 'Pick your city.'
      if (!/^(\+92|0)?3\d{9}$/.test(f.phone.replace(/[\s-]/g, ''))) return 'Enter a Pakistani mobile number, like 0300 1234567.'
      if (!f.gender || !f.dob) return 'Add your gender and date of birth.'
    }
    return null
  }
  const go = (n: number) => { p.setError(null); setAt(Math.max(0, n)) }
  function onForm(e: React.FormEvent) {
    e.preventDefault()
    const msg = check()
    if (msg) return p.setError(msg)
    if (last) return p.onSubmit(e)
    go(at + 1)
  }
  const c = COPY[step]
  const done = !!p.notice

  return (
    <AuthFrame title={done ? 'Check your inbox' : c.title(role)} lead={done ? `We sent a link to ${f.email.trim()}.` : c.lead(role)} aside={<Aside role={role} step={done ? 'launch' : step} index={done ? steps.length - 1 : at} total={steps.length} />}>
      <div ref={top} />
      {done ? <Done role={role} onLogin={p.onLogin} /> : (
        <>
          <div className="mb-7 flex items-center gap-3" role="progressbar" aria-valuemin={1} aria-valuemax={steps.length} aria-valuenow={at + 1} aria-label={`Step ${at + 1} of ${steps.length}`}>
            <div className="flex flex-1 gap-1.5">
              {steps.map((s, n) => <span key={s} className="h-1 flex-1 overflow-hidden rounded-full bg-line-strong"><span className={cn('block h-full rounded-full bg-accent transition-all duration-500', n <= at ? 'w-full' : 'w-0')} /></span>)}
            </div>
            <span className="text-xs text-subtle tnum">{at + 1}/{steps.length}</span>
          </div>

          <form onSubmit={onForm} noValidate>
            <div key={step} className="k-fade-up space-y-4">
              {step === 'role' && (
                <>
                  <div className="grid gap-3">
                    {([['organizer', 'I run events', 'Sell tickets, approve guests, run the door.', CalendarPlus], ['attendee', 'I go to events', 'Find events and get your ticket.', Ticket]] as const).map(([id, t, d, Icon]) => (
                      <button key={id} type="button" onClick={() => { p.setRole(id); go(1) }}
                        className={cn('group flex cursor-pointer items-center gap-4 rounded-2xl bg-surface p-4 text-left shadow-card ring-1 transition hover:-translate-y-0.5 hover:ring-accent/50', role === id ? 'ring-accent/60' : 'ring-line')}>
                        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent/12 text-accent"><Icon className="h-5 w-5" aria-hidden /></span>
                        <span className="flex-1"><span className="block font-semibold text-fg">{t}</span><span className="block text-sm text-muted">{d}</span></span>
                        <ArrowRight className="h-4 w-4 text-subtle transition group-hover:translate-x-0.5 group-hover:text-accent" aria-hidden />
                      </button>
                    ))}
                  </div>
                </>
              )}

              {step === 'you' && (
                <>
                  {role === 'attendee' && (<><Button variant="secondary" size="lg" className="w-full" leading={<GoogleIcon />} onClick={p.onGoogle} type="button">Continue with Google</Button><Divider>or</Divider></>)}
                  <Field label="Full name">{q => <Input {...q} value={f.name} onChange={set('name')} autoComplete="name" autoFocus leading={<User className="h-4 w-4" />} />}</Field>
                  <Field label="Email">{q => <Input {...q} type="email" value={f.email} onChange={set('email')} autoComplete="email" leading={<Mail className="h-4 w-4" />} />}</Field>
                  <Field label="Password" hint="At least 8 characters.">
                    {q => (
                      <div className="relative">
                        <Input {...q} type={p.showPw ? 'text' : 'password'} value={f.password} onChange={set('password')} autoComplete="new-password" className="pr-11" />
                        <button type="button" onClick={() => p.setShowPw(s => !s)} aria-label={p.showPw ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-subtle hover:text-fg">{p.showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                      </div>
                    )}
                  </Field>
                </>
              )}

              {(step === 'brand' || step === 'about') && (
                <>
                  {step === 'brand' && <Field label="Company or brand">{q => <Input {...q} value={f.company} onChange={set('company')} autoComplete="organization" autoFocus leading={<Building2 className="h-4 w-4" />} />}</Field>}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Mobile number">{q => <Input {...q} type="tel" inputMode="tel" placeholder="0300 1234567" value={f.phone} onChange={set('phone')} autoComplete="tel" />}</Field>
                    <Field label="City">{q => <Select {...q} value={f.city} onChange={set('city')}><option value="" disabled>Select</option>{PAKISTAN_CITIES.map(x => <option key={x} value={x}>{x}</option>)}</Select>}</Field>
                  </div>
                  {step === 'about' && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Gender">{q => <Select {...q} value={f.gender} onChange={set('gender')}><option value="" disabled>Select</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></Select>}</Field>
                      <Field label="Date of birth">{q => <Input {...q} type="date" value={f.dob} onChange={set('dob')} autoComplete="bday" />}</Field>
                    </div>
                  )}
                </>
              )}

              {step === 'launch' && (
                <>
                  <dl className="divide-y divide-line rounded-2xl bg-surface text-sm shadow-card ring-1 ring-line">
                    {[['Name', f.name], ['Email', f.email], ['Brand', f.company], ['City', f.city], ['Mobile', f.phone]].map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-4 px-4 py-3"><dt className="text-muted">{k}</dt><dd className="truncate font-medium text-fg">{v}</dd></div>
                    ))}
                  </dl>
                  <ul className="space-y-2 pt-1">
                    {['14 days free, no card needed', 'No cut of your ticket sales', 'Cancel any time'].map(t => <li key={t} className="flex items-center gap-2.5 text-sm text-fg"><span className="grid h-5 w-5 place-items-center rounded-full bg-accent/14 text-accent"><Check className="h-3 w-3" aria-hidden /></span>{t}</li>)}
                  </ul>
                </>
              )}

              {error && <p role="alert" className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>}

              {step !== 'role' && (
                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="secondary" size="lg" onClick={() => go(at - 1)} aria-label="Back" leading={<ArrowLeft className="h-4 w-4" />}>Back</Button>
                  <Button type="submit" size="lg" className="flex-1" loading={p.busy} trailing={last ? undefined : <ArrowRight className="h-4 w-4" />}>
                    {last ? (role === 'organizer' ? 'Start free trial' : 'Create account') : 'Continue'}
                  </Button>
                </div>
              )}
            </div>
          </form>

          <p className="mt-8 text-center text-sm text-muted">Already have an account? <button type="button" onClick={p.onLogin} className="cursor-pointer text-accent hover:underline">Log in</button></p>
        </>
      )}
    </AuthFrame>
  )
}
