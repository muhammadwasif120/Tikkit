import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { signPaymentScreenshot } from '@/lib/paymentScreenshot'
import ApprovalsClient from '@/components/approvals/ApprovalsClient'
import DashboardLoader from '@/components/layout/DashboardLoader'

async function ApprovalsData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: events } = await supabase
    .from('events')
    .select('id, title, registration_mode, require_id_verification, require_reference_code, reference_code')
    .eq('organizer_id', user!.id)

  const eventIds = events?.map(e => e.id) ?? []

  const { data: registrations } = await supabase
    .from('public_registrations')
    .select('*')
    .in('event_id', eventIds.length > 0 ? eventIds : ['none'])
    .order('created_at', { ascending: false })

  const signedRegistrations = await Promise.all(
    (registrations ?? []).map(async (r: any) => ({
      ...r,
      id_document_url: r.id_document_url ?? null,
      reference_code_entered: r.reference_code_entered ?? null,
      // Private bucket (SEC-02) — sign for the owning organizer.
      payment_screenshot_url: await signPaymentScreenshot(r.payment_screenshot_url),
    }))
  )

  return (
    <ApprovalsClient
      registrations={signedRegistrations}
      events={(events ?? []).map((e: any) => ({
        ...e,
        registration_mode: e.registration_mode ?? 'approval'
      }))}
    />
  )
}

export default function ApprovalsPage() {
  return (
    <Suspense fallback={<DashboardLoader variant="list" />}>
      <ApprovalsData />
    </Suspense>
  )
}