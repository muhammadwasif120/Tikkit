import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ArtistProfileEditorClient from '@/components/artist/os/ArtistProfileEditorClient'

type Props = { params: Promise<{ id: string }> }

export default async function EditArtistPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/auth/login?next=/artist-mgmt/os/roster/${id}/edit`)

  const { data: mgmt } = await (supabase as any)
    .from('management_accounts').select('id').eq('user_id', user.id).maybeSingle()
  if (!mgmt) redirect('/artist-mgmt/onboarding')

  const { data: artist } = await (supabase as any)
    .from('artists')
    .select('id, name, slug, category, sub_tags, based_in_city, bio, profile_photo_url, gallery_urls, press_kit_url, media_links, social_links, event_types_accepted, availability_status, profile_status, verified')
    .eq('id', id)
    .eq('management_id', mgmt.id)
    .maybeSingle()

  if (!artist) notFound()

  return <ArtistProfileEditorClient artist={artist} />
}
