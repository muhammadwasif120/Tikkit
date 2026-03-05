import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProfileClient from '@/components/guest/ProfileClient'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [profileRes, guestProfileRes, txRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, email, phone_number, avatar_url')
      .eq('id', user.id)
      .single(),
    supabase
      .from('guest_profiles')
      .select('username, bio, instagram_handle, is_discoverable, credit_score, attendance_streak, total_attended, total_no_shows')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('credit_transactions')
      .select('*, event:events(title, date_start)')
      .eq('guest_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30),
  ])

  const p  = profileRes.data
  const gp = guestProfileRes.data

  const profile = {
    id:                user.id,
    full_name:         p?.full_name         ?? null,
    phone:             p?.phone_number      ?? null,
    avatar_url:        p?.avatar_url        ?? null,
    username:          gp?.username         ?? null,
    bio:               gp?.bio              ?? null,
    instagram_handle:  gp?.instagram_handle ?? null,
    is_discoverable:   gp?.is_discoverable  ?? true,
    credit_score:      gp?.credit_score     ?? 0,
    attendance_streak: gp?.attendance_streak ?? 0,
    total_attended:    gp?.total_attended   ?? 0,
    total_no_shows:    gp?.total_no_shows   ?? 0,
  }

  return (
    <ProfileClient
      profile={profile}
      email={p?.email ?? user.email ?? ''}
      transactions={txRes.data ?? []}
    />
  )
}
