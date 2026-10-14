import { PageHeader } from '@/components/kit'
import TicketsClient, { type TicketRow } from '@/components/attendee/TicketsClient'
import ModuleBookings, { type ModRow, type RetreatLink } from '@/components/attendee/ModuleBookings'
import { requireAttendee } from '@/lib/data/viewer'
import { fromLoose, rpcLoose } from '@/lib/rpc'

export const metadata = { title: 'My tickets' }

export default async function TicketsPage() {
  const { supabase, profile } = await requireAttendee()
  const { data } = await supabase.from('registrations')
    .select('id, status, qr_token, is_vip, plus_one, price_due_pkr, ticket_types(name), events(title, slug, starts_at, ends_at, cover_image_url, venue_name, area_label, city, is_secret_venue)')
    .eq('attendee_id', profile.id).order('created_at', { ascending: false })

  const rows: (TicketRow & { endsAt: string })[] = (data ?? []).filter(r => r.events).map(r => ({
    id: r.id, status: r.status, token: r.qr_token, isVip: r.is_vip, plusOne: r.plus_one, ticket: r.ticket_types?.name ?? null, due: r.price_due_pkr,
    endsAt: r.events!.ends_at ?? r.events!.starts_at,
    event: { title: r.events!.title, slug: r.events!.slug, startsAt: r.events!.starts_at, cover: r.events!.cover_image_url, secret: r.events!.is_secret_venue,
      where: r.events!.is_secret_venue ? `Secret location · ${r.events!.area_label ?? r.events!.city ?? ''}` : [r.events!.venue_name, r.events!.area_label ?? r.events!.city].filter(Boolean).join(', ') },
  }))
  const now = Date.now()
  const isPast = (r: { endsAt: string; status: string }) => new Date(r.endsAt).getTime() < now || ['cancelled', 'rejected'].includes(r.status)
  const upcoming = rows.filter(r => !isPast(r)).sort((a, b) => +new Date(a.event.startsAt) - +new Date(b.event.startsAt))
  const past = rows.filter(isPast)

  // classes, passes, reservations and retreats. Empty until the modules migration is applied.
  const loose = (t: string) => fromLoose(supabase as never, t)
  const [cb, sb, pp, rt] = await Promise.all([
    loose('class_bookings').select('id, status, qr_token, price_due_pkr, organizer_id, class_sessions(starts_at), class_series(title)').eq('attendee_id', profile.id).not('status', 'in', '(cancelled,rejected)').order('created_at', { ascending: false }).limit(30),
    loose('space_bookings').select('id, status, qr_token, price_due_pkr, organizer_id, starts_at, spaces(name)').eq('attendee_id', profile.id).not('status', 'in', '(cancelled,rejected)').order('starts_at', { ascending: false }).limit(30),
    loose('pass_purchases').select('id, status, qr_token, price_due_pkr, organizer_id, sessions_total, sessions_used, pass_products(name)').eq('attendee_id', profile.id).in('status', ['awaiting_payment', 'payment_submitted', 'active']).limit(20),
    rpcLoose(supabase as never, 'my_retreats'),
  ])
  type A = Record<string, unknown>
  const moduleRows: ModRow[] = [
    ...((cb.data ?? []) as A[]).map(r => ({ id: r.id as string, kind: 'class_booking' as const, title: ((r.class_series as A | null)?.title as string) ?? 'Class', when: ((r.class_sessions as A | null)?.starts_at as string) ?? null, status: r.status as string, token: r.qr_token as string, due: r.price_due_pkr as number, organizerId: r.organizer_id as string })),
    ...((sb.data ?? []) as A[]).map(r => ({ id: r.id as string, kind: 'space_booking' as const, title: ((r.spaces as A | null)?.name as string) ?? 'Space', when: r.starts_at as string, status: r.status as string, token: r.qr_token as string, due: r.price_due_pkr as number, organizerId: r.organizer_id as string })),
    ...((pp.data ?? []) as A[]).map(r => ({ id: r.id as string, kind: 'pass_purchase' as const, title: ((r.pass_products as A | null)?.name as string) ?? 'Pass', when: null, status: r.status as string, token: r.qr_token as string, due: r.price_due_pkr as number, organizerId: r.organizer_id as string, note: r.sessions_total === null ? 'Unlimited sessions' : `${(r.sessions_total as number) - (r.sessions_used as number)} sessions left` })),
  ]

  return (
    <div className="k-fade-up">
      <PageHeader title="My tickets" description="Events, passes and reservations in one place." />
      <TicketsClient upcoming={upcoming} past={past} />
      <ModuleBookings rows={moduleRows} retreats={((rt.data ?? []) as { retreat_id: string; title: string; destination: string | null; starts_on: string; ends_on: string; qr_token: string }[]).map(r => ({ id: r.retreat_id, title: r.title, destination: r.destination, starts_on: r.starts_on, ends_on: r.ends_on, qr_token: r.qr_token })) satisfies RetreatLink[]} />
    </div>
  )
}
