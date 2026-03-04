import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProfileClient from '@/components/guest/ProfileClient'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [guestProfileRes, txRes] = await Promise.all([
    supabase
      .from('guest_profiles')
      .select('*, profile:profiles!guest_profiles_id_fkey(full_name, email, phone_number, username, avatar_url, instagram_handle, bio, is_discoverable)')
      .eq('id', user.id)
      .single(),
    supabase
      .from('credit_transactions')
      .select('*, event:events(title, date_start)')
      .eq('guest_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30),
  ])

  const gp = guestProfileRes.data
  const profile = {
    id:                user.id,
    full_name:         gp?.profile?.full_name   ?? user.email ?? 'Guest',
    username:          gp?.profile?.username    ?? null,
    phone:             gp?.profile?.phone_number ?? null,
    avatar_url:        gp?.profile?.avatar_url  ?? null,
    instagram_handle:  gp?.profile?.instagram_handle ?? null,
    bio:               gp?.profile?.bio         ?? null,
    is_discoverable:   gp?.profile?.is_discoverable ?? true,
    credit_score:      gp?.credit_score         ?? 0,
    attendance_streak: gp?.attendance_streak    ?? 0,
    total_attended:    gp?.total_attended       ?? 0,
    total_no_shows:    gp?.total_no_shows       ?? 0,
  }

  return <ProfileClient profile={profile} transactions={txRes.data ?? []} />
}
