'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Field, Input, Logo } from '@/components/kit'
import { createClient } from '@/lib/supabase/client'

export default function MasterLogin() {
  const router = useRouter(); const supabase = useMemo(() => createClient(), [])
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [busy, setBusy] = useState(false); const [err, setErr] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(null); setBusy(true)
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (error || !data.user) { setBusy(false); return setErr('Those details do not match.') }
    const { data: p } = await supabase.from('profiles').select('role').eq('id', data.user.id).maybeSingle()
    if (p?.role !== 'admin') { await supabase.auth.signOut(); setBusy(false); return setErr('This account does not have admin access.') }
    router.push('/master'); router.refresh()
  }
  return (
    <div className="kit grid min-h-screen place-items-center bg-canvas px-4 text-fg">
      <form onSubmit={submit} className="w-full max-w-sm space-y-5 rounded-2xl bg-surface p-8 shadow-card">
        <div className="flex items-center gap-2"><Logo compact /><span className="rounded-md bg-magenta/14 px-1.5 py-0.5 text-[10px] font-semibold text-magenta">ADMIN</span></div>
        <Field label="Email">{p => <Input {...p} type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="username" required />}</Field>
        <Field label="Password">{p => <Input {...p} type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" required />}</Field>
        {err && <p role="alert" className="text-sm text-danger">{err}</p>}
        <Button type="submit" className="w-full" loading={busy}>Sign in</Button>
      </form>
    </div>
  )
}
