import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import GuestShell from '@/components/guest/GuestShell'
import { getUnreadSupportMessageCount } from '@/app/actions/supportActions'

export default async function GuestLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role && profile.role !== 'guest') redirect('/dashboard')

  // Fetch actionable notification count for the bell:
  // Count upcoming registrations that need guest action (payment required)
  // or were recently reviewed (approved/rejected in last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString()
  const { count: notifCount } = await supabase
    .from('public_registrations')
    .select('*', { count: 'exact', head: true })
    .eq('email', user.email!)
    .or(`payment_status.eq.pending,and(reviewed_at.gte.${sevenDaysAgo},status.neq.pending)`)
    
  const unreadSupportCount = await getUnreadSupportMessageCount()

  return <GuestShell notifCount={notifCount ?? 0} unreadSupportCount={unreadSupportCount}>{children}</GuestShell>
}