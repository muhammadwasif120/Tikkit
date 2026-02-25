import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PassesClient from '@/components/guest/PassesClient'

export default async function PassesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: passes } = await supabase
    .from('event_passes')
    .select('*')
    .eq('guest_id', user.id)
    .order('issued_at', { ascending: false })

  const { data: guestProfile } = await supabase
    .from('guest_profiles')
    .select('credit_score, total_attended')
    .eq('id', user.id)
    .single()

  return <PassesClient passes={passes ?? []} stats={guestProfile} />
}