import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import RosterClient from '@/components/artist/os/RosterClient'

export default async function RosterPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: mgmt } = await (supabase as any)
    .from('management_accounts')
    .select('id, company_name')
    .eq('user_id', user!.id)
    .maybeSingle()

  if (!mgmt) redirect('/artist-mgmt/onboarding')

  const { data: artists } = await (supabase as any)
    .from('artists')
    .select('id, name, slug, category, sub_tags, based_in_city, profile_photo_url, availability_status, profile_status, verified')
    .eq('management_id', mgmt.id)
    .order('name')

  // Open enquiry counts per artist
  const { data: enquiryCounts } = await (supabase as any)
    .from('artist_enquiries')
    .select('artist_id, status')
    .eq('management_id', mgmt.id)
    .in('status', ['submitted', 'viewed'])

  const countMap: Record<string, number> = {}
  for (const e of enquiryCounts ?? []) {
    countMap[e.artist_id] = (countMap[e.artist_id] ?? 0) + 1
  }

  return (
    <RosterClient
      artists={artists ?? []}
      enquiryCounts={countMap}
    />
  )
}
