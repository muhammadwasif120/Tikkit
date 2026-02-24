import { createClient } from '@/lib/supabase/server'
import PassesClient from '@/components/guest/PassesClient'
import { redirect } from 'next/navigation'

export default async function PassesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/guest/login')

  const { data: passes } = await supabase
    .from('event_passes')
    .select('*')
    .eq('guest_id', user.id)
    .order('issued_at', { ascending: false })

  return <PassesClient passes={passes ?? []} />
}