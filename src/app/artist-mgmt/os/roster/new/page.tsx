import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AddArtistClient from '@/components/artist/os/AddArtistClient'

export default async function AddArtistPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?next=/artist-mgmt/os/roster/new')

  const { data: mgmt } = await (supabase as any)
    .from('management_accounts').select('id').eq('user_id', user.id).maybeSingle()
  if (!mgmt) redirect('/artist-mgmt/onboarding')

  return <AddArtistClient mgmtId={mgmt.id} />
}
