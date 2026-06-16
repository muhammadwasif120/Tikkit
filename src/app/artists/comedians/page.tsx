import { createClient } from '@/lib/supabase/server'
import ArtistDirectoryClient from '@/components/artist/public/ArtistDirectoryClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Comedians — Book for Events · Tikkit X',
  description: 'Book verified stand-up comedians and comedy acts for your event through Tikkit X.',
}

export default async function ComediansPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: artists } = await (supabase as any)
    .from('artists')
    .select('id, name, slug, category, sub_tags, based_in_city, profile_photo_url, availability_status, management_id')
    .eq('profile_status', 'published')
    .eq('category', 'comedian')
    .order('name')

  let isVerifiedOrganiser = false
  if (user) {
    const { data: v } = await (supabase as any)
      .from('verifications').select('status')
      .eq('entity_id', user.id).eq('entity_type', 'organizer').maybeSingle()
    isVerifiedOrganiser = v?.status === 'verified'
  }

  return <ArtistDirectoryClient artists={artists ?? []} userId={user?.id ?? null} isVerifiedOrganiser={isVerifiedOrganiser} category="comedian" />
}
