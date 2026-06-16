import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ArtistMgmtShell from '@/components/artist/ArtistMgmtShell'

export default async function ArtistMgmtLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?next=/artist-mgmt/os')

  const { data: mgmt } = await (supabase as any)
    .from('management_accounts')
    .select('id, company_name, account_status')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!mgmt) redirect('/artist-mgmt/onboarding')
  if (mgmt.account_status === 'suspended') redirect('/artist-mgmt/suspended')

  const { count: unreadCount } = await (supabase as any)
    .from('management_notifications')
    .select('id', { count: 'exact', head: true })
    .eq('management_id', mgmt.id)
    .eq('read', false)

  return (
    <ArtistMgmtShell companyName={mgmt.company_name} unreadCount={unreadCount ?? 0}>
      {children}
    </ArtistMgmtShell>
  )
}
