import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import GuestNotificationsClient from '@/components/guest/GuestNotificationsClient'

export default async function GuestNotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Fetch all registrations as notification items
  const { data: registrations } = await supabase
    .from('public_registrations')
    .select('id, status, payment_status, reviewed_at, created_at, event:events(id, title, cover_image_url, date_start)')
    .eq('email', user.email!)
    .not('status', 'eq', 'pending')  // only show acted-upon ones
    .order('reviewed_at', { ascending: false })
    .limit(30)

  return <GuestNotificationsClient registrations={registrations ?? []} />
}