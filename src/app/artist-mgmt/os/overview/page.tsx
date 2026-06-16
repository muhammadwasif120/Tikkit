import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import OverviewClient from '@/components/artist/os/OverviewClient'

export default async function OverviewPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?next=/artist-mgmt/os/overview')

  const { data: mgmt } = await (supabase as any)
    .from('management_accounts').select('id').eq('user_id', user.id).maybeSingle()
  if (!mgmt) redirect('/artist-mgmt/onboarding')

  // Fetch all enquiries for stats
  const { data: enquiries } = await (supabase as any)
    .from('artist_enquiries')
    .select('id, status, event_name, event_date, artists(id, name), created_at')
    .eq('management_id', mgmt.id)
    .order('created_at', { ascending: false })

  const all = enquiries ?? []
  const stats = {
    totalArtists:       0,
    publishedArtists:   0,
    openEnquiries:      all.filter((e: any) => ['submitted', 'viewed'].includes(e.status)).length,
    respondedEnquiries: all.filter((e: any) => ['responded', 'negotiating'].includes(e.status)).length,
    bookedEnquiries:    all.filter((e: any) => e.status === 'booked').length,
    totalEnquiries:     all.length,
  }

  // Artist counts
  const { data: artists } = await (supabase as any)
    .from('artists')
    .select('id, name, slug, category, based_in_city, profile_photo_url, profile_status')
    .eq('management_id', mgmt.id)
    .order('name')

  stats.totalArtists     = (artists ?? []).length
  stats.publishedArtists = (artists ?? []).filter((a: any) => a.profile_status === 'published').length

  const recentEnquiries = all.slice(0, 5)

  return <OverviewClient stats={stats} recentEnquiries={recentEnquiries} artists={artists ?? []} />
}
