// ─── Server component: src/app/guest/credits/page.tsx ────────────────────────
import { createClient } from '@/lib/supabase/server'
import CreditsClient from '@/components/guest/CreditsClient'
import { redirect } from 'next/navigation'

export default async function CreditsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/guest/login')

  const [profileRes, txRes] = await Promise.all([
    supabase.from('guest_profiles')
      .select('credit_score, total_attended, total_no_shows, total_vip_events, attendance_streak, longest_streak')
      .eq('id', user.id)
      .single(),
    supabase.from('credit_transactions')
      .select('*, event:events(title, date_start)')
      .eq('guest_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30),
  ])

  return (
    <CreditsClient
      profile={profileRes.data}
      transactions={txRes.data ?? []}
    />
  )
}