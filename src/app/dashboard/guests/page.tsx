import { PageHeader } from '@/components/kit'
import GuestsClient, { type GuestRow } from '@/components/guests/GuestsClient'
import { requireOrganizer } from '@/lib/data/viewer'

export const metadata = { title: 'Guests' }

export default async function GuestsPage({ searchParams }: { searchParams: Promise<{ event?: string; status?: string }> }) {
  const { event = '', status = 'all' } = await searchParams
  const { supabase, profile } = await requireOrganizer()

  const [{ data: events }, { data: tickets }, { data: regs }] = await Promise.all([
    supabase.from('events').select('id, title').eq('organizer_id', profile.id).neq('status', 'archived').order('starts_at', { ascending: false }),
    supabase.from('ticket_types').select('id, name, event_id').order('sort'),
    supabase.from('registrations')
      .select('id, event_id, full_name, phone, email, status, is_vip, plus_one, price_due_pkr, price_paid_pkr, created_at, ticket_types(name), events(title), payment_submissions(id, screenshot_path, reference, amount_pkr, status)')
      .order('created_at', { ascending: false }).limit(1000),
  ])

  // trust signals per event (plan aware: tier only on Starter, full detail on Growth and Pro)
  const eventIds = [...new Set((regs ?? []).map(r => r.event_id))].slice(0, 8)
  const scores = new Map<string, { tier: string; verified: boolean }>()
  await Promise.all(eventIds.map(async id => {
    const { data } = await supabase.rpc('get_registrant_scores', { p_event: id })
    for (const s of data ?? []) scores.set(s.registration_id, { tier: s.tier, verified: s.id_verified })
  }))

  const rows: GuestRow[] = (regs ?? []).map(r => {
    const sub = (r.payment_submissions ?? []).filter(s => s.status === 'submitted').sort((a, b) => 0)[0]
    const sc = scores.get(r.id)
    return {
      id: r.id, eventId: r.event_id, eventTitle: r.events?.title ?? 'Event', name: r.full_name, phone: r.phone, email: r.email,
      status: r.status, isVip: r.is_vip, ticket: r.ticket_types?.name ?? null, due: r.price_due_pkr, paid: r.price_paid_pkr,
      createdAt: r.created_at, plusOne: r.plus_one, tier: sc?.tier ?? null, idVerified: sc?.verified ?? false,
      submission: sub ? { id: sub.id, path: sub.screenshot_path, reference: sub.reference, amount: sub.amount_pkr } : null,
    }
  })

  return (
    <div className="k-fade-up">
      <PageHeader title="Guests" description="Requests, payments, approvals and check-ins for every event, in one list." />
      <GuestsClient
        rows={rows}
        events={(events ?? []).map(e => ({ id: e.id, title: e.title, tickets: (tickets ?? []).filter(t => t.event_id === e.id).map(t => ({ id: t.id, name: t.name })) }))}
        initialEvent={event}
        initialFilter={status}
      />
    </div>
  )
}
