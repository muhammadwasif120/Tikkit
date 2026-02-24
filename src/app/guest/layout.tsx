import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import GuestShell from '@/components/guest/GuestShell'

export default async function GuestLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/guest-login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role && profile.role !== 'guest') redirect('/dashboard')

  return <GuestShell>{children}</GuestShell>
}