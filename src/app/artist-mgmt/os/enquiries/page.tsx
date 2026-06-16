import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import EnquiryInboxClient from '@/components/artist/os/EnquiryInboxClient'

type Props = { searchParams: Promise<{ artist?: string }> }

export default async function EnquiriesPage({ searchParams }: Props) {
  const { artist: artistFilter = null } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: mgmt } = await (supabase as any)
    .from('management_accounts')
    .select('id')
    .eq('user_id', user!.id)
    .maybeSingle()

  if (!mgmt) redirect('/artist-mgmt/onboarding')

  const { data: enquiries } = await (supabase as any)
    .from('artist_enquiries')
    .select(`
      id, artist_id, event_name, event_type, event_date, event_city, event_venue,
      estimated_attendance, performance_duration, set_type, additional_notes,
      status, viewed_at, responded_at, booked_at, declined_at,
      expires_at, created_at,
      artists(id, name, slug, category, profile_photo_url),
      profiles!organiser_id(id, full_name, company_name, email, phone_number)
    `)
    .eq('management_id', mgmt.id)
    .order('created_at', { ascending: false })

  return <EnquiryInboxClient enquiries={enquiries ?? []} artistFilter={artistFilter} />
}
