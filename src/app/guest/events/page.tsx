import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MyEventsClient from '@/components/guest/MyEventsClient'

export default async function MyEventsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: registrations } = await supabase
    .from('public_registrations')
    .select('id, status, created_at, payment_screenshot_url, event:events(id, title, date_start, date_end, venue_name, secret_venue, cover_image_url, ticket_price, registration_mode)')
    .eq('email', user.email!)
    .order('created_at', { ascending: false })

  return <MyEventsClient registrations={registrations ?? []} />
}
