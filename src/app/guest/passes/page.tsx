import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PassesClient from '@/components/guest/PassesClient'
import CyberLoader from '@/components/guest/CyberLoader'

async function PassesData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: passes } = await supabase
    .from('event_passes')
    .select('*, event:events(id, title, date_start, cover_image_url, tags)')
    .eq('guest_id', user.id)
    .order('issued_at', { ascending: false })

  const oneDayAgo = new Date(Date.now() - 86400000).toISOString()
  const newPassIds = (passes ?? [])
    .filter((p: any) => p.issued_at >= oneDayAgo)
    .map((p: any) => p.id)

  return <PassesClient passes={passes ?? []} newPassIds={newPassIds} />
}

export default function PassesPage() {
  return (
    <Suspense fallback={<CyberLoader />}>
      <PassesData />
    </Suspense>
  )
}
