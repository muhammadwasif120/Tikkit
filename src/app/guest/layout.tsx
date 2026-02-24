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

  // Fetch unread notification count for the bell
  // We store guest notifications in public_registrations status changes
  // Count approved registrations the guest hasn't "seen" yet
  const { count: notifCount } = await supabase
    .from('public_registrations')
    .select('*', { count: 'exact', head: true })
    .eq('email', user.email!)
    .eq('status', 'approved')
    .is('reviewed_at', null)  // proxy for "unseen" — adjust if you add a seen_at column

  return <GuestShell notifCount={notifCount ?? 0}>{children}</GuestShell>
}