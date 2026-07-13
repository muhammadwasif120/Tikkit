import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ForceNoir from '@/components/master/ForceNoir'

export default async function MasterLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/master/login')

  // profiles.role is the single source of truth for admin access. It is
  // protected by the protect_profile_role trigger, so authenticated/anon
  // callers cannot elevate it. We must NOT fall back to user_metadata.role
  // here: it is user-writable (supabase.auth.updateUser), and the previous
  // fallback additionally persisted that forged value into profiles.role via
  // the service role — a full privilege-escalation path. Admin is granted only
  // by setting profiles.role directly (SQL / service role by a human).
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    redirect('/master/login')
  }

  return (
    <>
      <ForceNoir />
      {children}
    </>
  )
}
