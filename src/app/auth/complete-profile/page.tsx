import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getViewer } from '@/lib/data/viewer'
import CompleteProfileClient from './CompleteProfileClient'

export const metadata: Metadata = { title: 'Finish your profile', robots: { index: false, follow: false } }

export default async function CompleteProfilePage() {
  const viewer = await getViewer()
  if (!viewer) redirect('/auth/login')
  if (viewer.profile.is_complete) redirect(viewer.profile.role === 'organizer' ? '/dashboard' : '/explore')

  const [{ data: priv }, { data: op }] = await Promise.all([
    viewer.supabase.from('profile_private').select('phone, date_of_birth, gender').eq('id', viewer.profile.id).maybeSingle(),
    viewer.supabase.from('organizer_profiles').select('company_name').eq('id', viewer.profile.id).maybeSingle(),
  ])

  return (
    <CompleteProfileClient
      role={viewer.profile.role === 'organizer' ? 'organizer' : 'attendee'}
      initial={{
        name: viewer.profile.full_name ?? '', phone: priv?.phone ?? '', city: viewer.profile.city ?? '',
        gender: priv?.gender ?? '', dob: priv?.date_of_birth ?? '', company: op?.company_name ?? '',
      }}
    />
  )
}
