import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ArtistProfileClient from '@/components/artist/public/ArtistProfileClient'
import type { Metadata } from 'next'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data: artist } = await (supabase as any)
    .from('artists').select('name, category, based_in_city').eq('slug', slug).maybeSingle()
  if (!artist) return { title: 'Artist Not Found · Tikkit X' }
  const cat = artist.category === 'dj' ? 'DJ' : artist.category === 'musician' ? 'Musician' : 'Comedian'
  return {
    title: `${artist.name} — Book for Events · Tikkit X`,
    description: `${artist.name} is a ${cat} based in ${artist.based_in_city ?? 'Pakistan'}. Available for bookings via Tikkit X.`,
    openGraph: { title: `${artist.name} · Tikkit X`, description: `Book ${artist.name} for your next event.` },
  }
}

export default async function ArtistProfilePage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: artist } = await (supabase as any)
    .from('artists')
    .select(`
      id, name, slug, category, sub_tags, based_in_city, bio,
      profile_photo_url, gallery_urls, press_kit_url,
      media_links, social_links, event_types_accepted,
      availability_status, verified,
      management_accounts!management_id(id, company_name)
    `)
    .eq('slug', slug)
    .eq('profile_status', 'published')
    .maybeSingle()

  if (!artist) notFound()

  const { data: pastEvents } = await (supabase as any)
    .from('artist_past_events')
    .select('id, event_name, event_date, venue_name, city, is_platform_event')
    .eq('artist_id', artist.id)
    .order('event_date', { ascending: false })
    .limit(20)

  // Viewer state
  let viewerRole: 'anonymous' | 'non-organiser' | 'unverified' | 'verified' = 'anonymous'
  if (user) {
    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'organizer') {
      viewerRole = 'non-organiser'
    } else {
      const { data: v } = await (supabase as any)
        .from('verifications').select('status')
        .eq('entity_id', user.id).eq('entity_type', 'organizer').maybeSingle()
      viewerRole = v?.status === 'verified' ? 'verified' : 'unverified'
    }
  }

  // Organiser profile for pre-fill (step 3 of enquiry)
  let organiserProfile: any = null
  if (viewerRole === 'verified') {
    const { data: p } = await supabase
      .from('profiles').select('full_name, company_name, email, phone_number')
      .eq('id', user!.id).single()
    organiserProfile = p
  }

  return (
    <ArtistProfileClient
      artist={artist}
      management={artist.management_accounts}
      pastEvents={pastEvents ?? []}
      viewerRole={viewerRole}
      organiserProfile={organiserProfile}
      userId={user?.id ?? null}
    />
  )
}
