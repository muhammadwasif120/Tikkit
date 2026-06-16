import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ManagementSettingsClient from '@/components/artist/os/ManagementSettingsClient'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?next=/artist-mgmt/os/settings')

  const { data: mgmt } = await (supabase as any)
    .from('management_accounts')
    .select('id, company_name, account_status, contact_email, contact_phone, website')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!mgmt) redirect('/artist-mgmt/onboarding')

  return <ManagementSettingsClient mgmt={mgmt} />
}
