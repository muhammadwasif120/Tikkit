import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MyTikkitClient from '@/components/guest/MyTikkitClient'

export default async function MyTikkitPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [profileRes, guestProfileRes, registrationsRes] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', user.id).single(),
    supabase.from('guest_profiles').select('credit_score').eq('id', user.id).single(),
    supabase
      .from('public_registrations')
      .select(`
        id, status, payment_screenshot_url, created_at,
        event:events(id, title, date_start, date_end, venue_name, secret_venue, venue_reveal_at, cover_image_url, ticket_price, registration_mode)
      `)
      .eq('email', user.email!)
      .order('created_at', { ascending: false }),
  ])

  // For each registration, check if a pass was earned
  const regIds = (registrationsRes.data ?? []).map((r: any) => r.event?.id).filter(Boolean)
  const { data: passes } = regIds.length
    ? await supabase
        .from('event_passes')
        .select('id, pass_type, issued_at, event_title, was_vip, event_id')
        .eq('guest_id', user.id)
        .in('event_id', regIds)
    : { data: [] }

  const passMap: Record<string, any> = {}
  for (const p of passes ?? []) passMap[p.event_id] = p

  const registrations = (registrationsRes.data ?? []).map((r: any) => ({
    ...r,
    pass: passMap[(r.event as any)?.id] ?? null,
  }))

  return (
    <MyTikkitClient
      registrations={registrations}
      guestName={profileRes.data?.full_name ?? user.email ?? 'Guest'}
      creditScore={guestProfileRes.data?.credit_score ?? 0}
    />
  )
}
