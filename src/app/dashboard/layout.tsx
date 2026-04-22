import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardShell from '@/components/layout/DashboardShell'

import { getUnreadSupportMessageCount } from '@/app/actions/supportActions'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const unreadSupportCount = await getUnreadSupportMessageCount()

  return (
    <DashboardShell profile={profile} unreadSupportCount={unreadSupportCount}>
      {children}
    </DashboardShell>
  )
}