import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { signPaymentScreenshot } from '@/lib/paymentScreenshot'
import { redirect } from 'next/navigation'
import MyEventsClient from '@/components/guest/MyEventsClient'
import GuestLoader from '@/components/guest/GuestLoader'

async function MyEventsData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: registrations } = await supabase
    .from('public_registrations')
    .select('id, status, payment_status, created_at, payment_screenshot_url, event:events(id, title, date_start, date_end, venue_name, secret_venue, cover_image_url, ticket_price, registration_mode)')
    .eq('email', user.email!)
    .order('created_at', { ascending: false })

  const signed = await Promise.all(
    (registrations ?? []).map(async (r: any) => ({
      ...r,
      status: r.status ?? 'pending',
      payment_status: r.payment_status ?? 'not_required',
      // Private bucket (SEC-02) — sign for the owning guest.
      payment_screenshot_url: await signPaymentScreenshot(r.payment_screenshot_url),
    }))
  )

  return <MyEventsClient registrations={signed} />
}

export default function MyEventsPage() {
  return (
    <Suspense fallback={<GuestLoader />}>
      <MyEventsData />
    </Suspense>
  )
}
