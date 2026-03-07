import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MyTikkitClient from '@/components/guest/MyTikkitClient'
import SkeletonTikkit from '@/components/guest/SkeletonTikkit'

async function TikkitData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [profileRes, guestProfileRes, registrationsRes] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', user.id).single(),
    supabase.from('guest_profiles').select('credit_score').eq('id', user.id).maybeSingle(),
    supabase
      .from('public_registrations')
      .select(`
        id, status, payment_status, created_at,
        event:events(id, title, date_start, date_end, venue_name, secret_venue, venue_reveal_at, cover_image_url, ticket_price, registration_mode)
      `)
      .eq('email', user.email!)
      .not('status', 'eq', 'rejected')
      .order('created_at', { ascending: false }),
  ])

  const registrations = registrationsRes.data ?? []

  // Fetch payment accounts for each event via junction table
  const eventIds = registrations.map((r: any) => r.event?.id).filter(Boolean)

  const { data: eventPaymentLinks } = eventIds.length
    ? await supabase
        .from('event_payment_accounts')
        .select('event_id, payment_account:payment_accounts(id, label, account_type, bank_name, account_title, account_number, instructions)')
        .in('event_id', eventIds)
    : { data: [] }

  // Build map of event_id -> payment accounts
  const paymentAccountMap: Record<string, any[]> = {}
  for (const link of eventPaymentLinks ?? []) {
    const l = link as any
    if (!paymentAccountMap[l.event_id]) paymentAccountMap[l.event_id] = []
    if (l.payment_account) paymentAccountMap[l.event_id].push(l.payment_account)
  }

  // Fetch passes
  const { data: passes } = eventIds.length
    ? await supabase
        .from('event_passes')
        .select('id, pass_type, issued_at, event_title, was_vip, event_id')
        .eq('guest_id', user.id)
        .in('event_id', eventIds)
    : { data: [] }

  const passMap: Record<string, any> = {}
  for (const p of passes ?? []) passMap[(p as any).event_id] = p

  const enrichedRegistrations = registrations.map((r: any) => ({
    ...r,
    pass: passMap[r.event?.id] ?? null,
    payment_accounts: paymentAccountMap[r.event?.id] ?? [],
  }))

  return (
    <MyTikkitClient
      registrations={enrichedRegistrations}
      guestName={profileRes.data?.full_name ?? user.email ?? 'Guest'}
      creditScore={guestProfileRes.data?.credit_score ?? 0}
    />
  )
}

export default function MyTikkitPage() {
  return (
    <Suspense fallback={<SkeletonTikkit />}>
      <TikkitData />
    </Suspense>
  )
}
