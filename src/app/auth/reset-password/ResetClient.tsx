'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Field, Input } from '@/components/kit'
import { AuthFrame } from '@/components/auth/AuthFrame'
import { createClient } from '@/lib/supabase/client'

/** Two steps in one page: ask for a link, then (after the emailed link signs you in) choose a new password. */
export default function ResetClient() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [ready, setReady] = useState(false)
  const [signedIn, setSignedIn] = useState(false)
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => { setSignedIn(!!data.user); setReady(true) })
  }, [supabase])

  async function request(e: React.FormEvent) {
    e.preventDefault(); setError(null); setBusy(true)
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${location.origin}/auth/callback?next=/auth/reset-password`,
    })
    setBusy(false)
    if (err) return setError('We could not send the email. Check the address and try again.')
    setDone('If that email has an account, a reset link is on its way.')
  }

  async function change(e: React.FormEvent) {
    e.preventDefault(); setError(null)
    if (pw.length < 8) return setError('Use at least 8 characters.')
    if (pw !== pw2) return setError('The two passwords do not match.')
    setBusy(true)
    const { error: err } = await supabase.auth.updateUser({ password: pw })
    setBusy(false)
    if (err) return setError(err.message)
    setDone('Password updated. Taking you in.')
    setTimeout(() => { router.push('/auth/login'); router.refresh() }, 1500)
  }

  if (!ready) return <AuthFrame title="Reset password"><div className="h-40" /></AuthFrame>

  return signedIn ? (
    <AuthFrame title="Choose a new password">
      <form onSubmit={change} className="space-y-4" noValidate>
        <Field label="New password" hint="At least 8 characters.">{p => <Input {...p} type="password" value={pw} onChange={e => setPw(e.target.value)} autoComplete="new-password" required />}</Field>
        <Field label="Confirm password">{p => <Input {...p} type="password" value={pw2} onChange={e => setPw2(e.target.value)} autoComplete="new-password" required />}</Field>
        {error && <p role="alert" className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>}
        {done && <p role="status" className="rounded-xl bg-success/10 px-4 py-3 text-sm text-success">{done}</p>}
        <Button type="submit" size="lg" className="w-full" loading={busy}>Update password</Button>
      </form>
    </AuthFrame>
  ) : (
    <AuthFrame title="Reset your password" lead="Enter your email and we will send you a link.">
      <form onSubmit={request} className="space-y-4" noValidate>
        <Field label="Email">{p => <Input {...p} type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" required />}</Field>
        {error && <p role="alert" className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>}
        {done && <p role="status" className="rounded-xl bg-success/10 px-4 py-3 text-sm text-success">{done}</p>}
        <Button type="submit" size="lg" className="w-full" loading={busy}>Send reset link</Button>
        <p className="text-center text-sm text-muted"><Link href="/auth/login" className="text-accent hover:underline">Back to log in</Link></p>
      </form>
    </AuthFrame>
  )
}
