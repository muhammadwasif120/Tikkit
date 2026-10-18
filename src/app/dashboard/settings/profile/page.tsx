import { headers } from 'next/headers'
import ProfileForm from '@/components/settings/ProfileForm'
import { requireOwner } from '@/lib/data/viewer'

export const metadata = { title: 'Profile settings' }

export default async function ProfileSettings() {
  const { supabase, profile } = await requireOwner()
  const { data: op } = await supabase.from('organizer_profiles').select('*').eq('id', profile.id).maybeSingle()
  const h = await headers()
  const origin = `${h.get('x-forwarded-proto') ?? 'http'}://${h.get('host')}`
  return (
    <ProfileForm
      publicUrl={profile.username ? `${origin}/organizer/${profile.username}` : null}
      initial={{
        fullName: profile.full_name ?? '', username: profile.username ?? '', city: profile.city ?? '', company: op?.company_name ?? '', bio: op?.bio ?? '',
        logoUrl: op?.logo_url ?? '', coverUrl: op?.cover_url ?? '', whatsapp: op?.whatsapp ?? '', contactEmail: op?.contact_email ?? '',
        instagram: op?.instagram ?? '', website: op?.website ?? '', publicContact: op?.public_contact ?? true,
      }}
    />
  )
}
