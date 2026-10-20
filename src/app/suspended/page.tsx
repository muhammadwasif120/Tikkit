import type { Metadata } from 'next'
import { Ban } from 'lucide-react'
import { Logo } from '@/components/kit'
import { SignOutButton } from '@/components/auth/SignOutButton'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Account suspended', robots: { index: false, follow: false } }

export default async function SuspendedPage() {
  const supabase = (await createClient()) as unknown as SupabaseClient
  const { data: { user } } = await supabase.auth.getUser()
  const { data } = user ? await supabase.from('profiles').select('suspended_at, suspended_reason').eq('id', user.id).maybeSingle() : { data: null }
  const p = data as { suspended_at: string | null; suspended_reason: string | null } | null
  const wa = 'https://wa.me/13074434195'
  return (
    <main className="kit grid min-h-screen place-items-center bg-canvas px-4 text-fg">
      <div className="w-full max-w-md text-center">
        <div className="mb-8 flex justify-center"><Logo /></div>
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-danger/12 text-danger"><Ban className="h-6 w-6" aria-hidden /></span>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight">This account is suspended</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted">{p?.suspended_at ? 'A TIKKIT X admin suspended this account after a review.' : 'This account is not suspended.'} You cannot use the platform while the suspension is in place.</p>
        {p?.suspended_reason && <p className="mt-4 rounded-xl bg-raised p-4 text-left text-sm text-fg"><span className="block text-xs uppercase tracking-wider text-subtle">Reason</span>{p.suspended_reason}</p>}
        <p className="mt-5 text-sm text-muted">If you think this is a mistake, message us on <a href={wa} className="text-accent hover:underline" target="_blank" rel="noopener noreferrer">WhatsApp</a> and tell us the email you signed up with.</p>
        <div className="mx-auto mt-6 max-w-[200px]"><SignOutButton className="justify-center" /></div>
      </div>
    </main>
  )
}
