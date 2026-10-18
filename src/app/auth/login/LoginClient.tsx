'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMemo, useState } from 'react'
import { Building2, Eye, EyeOff, Mail, User } from 'lucide-react'
import { Button, Field, Input, Segmented, Select } from '@/components/kit'
import { AuthFrame, Divider, GoogleIcon } from '@/components/auth/AuthFrame'
import { createClient } from '@/lib/supabase/client'
import { PAKISTAN_CITIES } from '@/lib/pakistanCities'
import { SignupJourney } from './SignupJourney'

type Mode = 'login' | 'signup'
type Role = 'attendee' | 'organizer'

/** Only same-site paths. Rejects //host, /\\host and control characters. */
const safeNext = (n: string | null) => (n && /^\/(?![\/\\])[^\u0000-\u001f\\]*$/.test(n) ? n : null)

function friendly(msg: string) {
  const m = msg.toLowerCase()
  if (m.includes('invalid login')) return 'That email and password do not match.'
  if (m.includes('already registered') || m.includes('already been registered')) return 'An account with this email already exists. Try logging in.'
  if (m.includes('email not confirmed')) return 'Confirm your email first. We sent you a link.'
  if (m.includes('rate limit')) return 'Too many attempts. Wait a minute and try again.'
  if (m.includes('password')) return msg
  return 'Something went wrong. Please try again.'
}

export default function LoginClient() {
  const router = useRouter()
  const params = useSearchParams()
  const supabase = useMemo(() => createClient(), [])
  const next = safeNext(params.get('next'))

  const [mode, setMode] = useState<Mode>(params.get('flow') === 'organizer-signup' ? 'signup' : 'login')
  const [role, setRole] = useState<Role>(params.get('flow') === 'organizer-signup' ? 'organizer' : 'attendee')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(params.get('error') ? 'Sign in did not complete. Please try again.' : null)
  const [notice, setNotice] = useState<string | null>(null)
  const [showPw, setShowPw] = useState(false)

  const [f, setF] = useState({ name: '', email: '', password: '', phone: '', city: '', company: '', gender: '', dob: '' })
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF(p => ({ ...p, [k]: e.target.value }))

  const dest = (r: string | undefined) => next ?? (r === 'organizer' ? '/dashboard' : r === 'admin' ? '/master' : '/explore')

  async function landing() {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: p } = user ? await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle() : { data: null }
    let role: string | undefined = p?.role
    if (role === 'attendee') {
      // accept any team invites sent to this email, then send managers to the dashboard
      await supabase.rpc('claim_team_invites')
      await supabase.rpc('claim_registrations')
      const { data: team } = await supabase.from('organizer_team_members').select('id').eq('status', 'active').limit(1).maybeSingle()
      if (team) role = 'organizer'
    }
    router.push(dest(role))
    router.refresh()
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null); setNotice(null)

    if (mode === 'signup') {
      if (f.password.length < 8) return setError('Use a password with at least 8 characters.')
      if (!/^(\+92|0)?3\d{9}$/.test(f.phone.replace(/[\s-]/g, ''))) return setError('Enter a Pakistani mobile number, like 0300 1234567.')
      if (role === 'attendee' && (!f.gender || !f.dob)) return setError('Add your gender and date of birth.')
      if (role === 'attendee' && new Date(f.dob) > new Date(Date.now() - 16 * 365.25 * 86_400_000)) return setError('You must be at least 16 to sign up.')
      if (role === 'organizer' && !f.company.trim()) return setError('Add your company or brand name.')
    }

    setBusy(true)
    if (mode === 'login') {
      const { error: err } = await supabase.auth.signInWithPassword({ email: f.email.trim(), password: f.password })
      if (err) { setBusy(false); return setError(friendly(err.message)) }
      return landing()
    }

    const { data, error: err } = await supabase.auth.signUp({
      email: f.email.trim(),
      password: f.password,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback${next ? `?next=${encodeURIComponent(next)}` : ''}`,
        data: {
          role,
          full_name: f.name.trim(),
          phone: f.phone.replace(/[\s-]/g, ''),
          city: f.city,
          ...(role === 'attendee' ? { gender: f.gender, date_of_birth: f.dob } : { company_name: f.company.trim() }),
        },
      },
    })
    if (err) { setBusy(false); return setError(friendly(err.message)) }
    if (data.session) return landing()
    setBusy(false)
    setNotice('Check your inbox. We sent a link to confirm your email, then you can log in.')
  }

  async function google() {
    setError(null)
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/auth/callback${next ? `?next=${encodeURIComponent(next)}` : ''}` },
    })
    if (err) setError(friendly(err.message))
  }

  const isSignup = mode === 'signup'

  if (isSignup) {
    return (
      <SignupJourney f={f} set={set} role={role} setRole={setRole} busy={busy} error={error} setError={setError} notice={notice}
        showPw={showPw} setShowPw={setShowPw} onSubmit={submit} onGoogle={google}
        onLogin={() => { setMode('login'); setError(null); setNotice(null) }} startAtYou={params.get('flow') === 'organizer-signup'} />
    )
  }

  return (
    <AuthFrame
      title={isSignup ? (role === 'organizer' ? 'Start your free trial' : 'Create your account') : 'Welcome back'}
      lead={isSignup ? (role === 'organizer' ? '14 days free. No card needed.' : 'Register for events in a few taps.') : 'Log in to manage your events or your tickets.'}
    >
      <Segmented
        label="Log in or sign up"
        value={mode}
        onChange={m => { setMode(m); setError(null); setNotice(null) }}
        items={[{ id: 'login', label: 'Log in' }, { id: 'signup', label: 'Create account' }]}
        className="mb-6 w-full [&>button]:flex-1 [&>button]:justify-center"
      />

      {isSignup && (
        <Segmented
          label="Account type"
          value={role}
          onChange={setRole}
          items={[{ id: 'attendee', label: 'I go to events' }, { id: 'organizer', label: 'I run events' }]}
          className="mb-6 w-full [&>button]:flex-1 [&>button]:justify-center"
        />
      )}

      {!(isSignup && role === 'organizer') && (
        <>
          <Button variant="secondary" size="lg" className="w-full" leading={<GoogleIcon />} onClick={google} type="button">
            Continue with Google
          </Button>
          <Divider>or</Divider>
        </>
      )}

      <form onSubmit={submit} className="space-y-4" noValidate>
        {isSignup && (
          <Field label="Full name">{p => <Input {...p} value={f.name} onChange={set('name')} autoComplete="name" required leading={<User className="h-4 w-4" />} />}</Field>
        )}
        <Field label="Email">{p => <Input {...p} type="email" value={f.email} onChange={set('email')} autoComplete="email" required leading={<Mail className="h-4 w-4" />} />}</Field>

        <Field label="Password" hint={isSignup ? 'At least 8 characters.' : undefined}>
          {p => (
            <div className="relative">
              <Input {...p} type={showPw ? 'text' : 'password'} value={f.password} onChange={set('password')} autoComplete={isSignup ? 'new-password' : 'current-password'} required className="pr-11" />
              <button type="button" onClick={() => setShowPw(s => !s)} aria-label={showPw ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-subtle hover:text-fg">
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          )}
        </Field>

        {isSignup && (
          <>
            {role === 'organizer' && (
              <Field label="Company or brand">{p => <Input {...p} value={f.company} onChange={set('company')} autoComplete="organization" required leading={<Building2 className="h-4 w-4" />} />}</Field>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Mobile number">{p => <Input {...p} type="tel" inputMode="tel" placeholder="0300 1234567" value={f.phone} onChange={set('phone')} autoComplete="tel" required />}</Field>
              <Field label="City">
                {p => (
                  <Select {...p} value={f.city} onChange={set('city')} required>
                    <option value="" disabled>Select</option>
                    {PAKISTAN_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </Select>
                )}
              </Field>
            </div>
            {role === 'attendee' && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Gender">
                  {p => (
                    <Select {...p} value={f.gender} onChange={set('gender')} required>
                      <option value="" disabled>Select</option>
                      <option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
                    </Select>
                  )}
                </Field>
                <Field label="Date of birth">{p => <Input {...p} type="date" value={f.dob} onChange={set('dob')} autoComplete="bday" required />}</Field>
              </div>
            )}
          </>
        )}

        {!isSignup && (
          <div className="text-right"><Link href="/auth/reset-password" className="text-[13px] text-accent hover:underline">Forgot password?</Link></div>
        )}

        {error && <p role="alert" className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>}
        {notice && <p role="status" className="rounded-xl bg-success/10 px-4 py-3 text-sm text-success">{notice}</p>}

        <Button type="submit" size="lg" className="w-full" loading={busy}>
          {isSignup ? (role === 'organizer' ? 'Start free trial' : 'Create account') : 'Log in'}
        </Button>
      </form>
    </AuthFrame>
  )
}
