import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PassesClient from '@/components/guest/PassesClient'

export default async function PassesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: passes } = await supabase
    .from('event_passes')
    .select('*, event:events(id, title, date_start, cover_image_url, tags)')
    .eq('guest_id', user.id)
    .order('issued_at', { ascending: false })

  // Passes issued in last 24h are "new" — trigger confetti
  const oneDayAgo = new Date(Date.now() - 86400000).toISOString()
  const newPassIds = (passes ?? [])
    .filter((p: any) => p.issued_at >= oneDayAgo)
    .map((p: any) => p.id)

  return <PassesClient passes={passes ?? []} newPassIds={newPassIds} />
}
