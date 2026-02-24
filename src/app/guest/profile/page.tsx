import { createClient } from '@/lib/supabase/server'
import GuestProfileClient from '@/components/guest/GuestProfileClient'
import { redirect } from 'next/navigation'

export default async function GuestProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/guest/login')

  const [profileRes, guestRes, passCountRes] = await Promise.all([
    supabase.from('profiles').select('full_name, email').eq('id', user.id).single(),
    supabase.from('guest_profiles').select('*').eq('id', user.id).single(),
    supabase.from('event_passes').select('id', { count: 'exact', head: true }).eq('guest_id', user.id),
  ])

  return (
    <GuestProfileClient
      userId={user.id}
      profile={profileRes.data}
      guestProfile={guestRes.data}
      passCount={passCountRes.count ?? 0}
    />
  )
}