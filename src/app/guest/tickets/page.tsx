import { PageHeader } from '@/components/kit'
import TicketsClient, { type TicketRow } from '@/components/attendee/TicketsClient'
import { requireAttendee } from '@/lib/data/viewer'

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

  return (
    <div className="k-fade-up">
      <PageHeader title="My tickets" description="Events, passes and reservations in one place." />
      <TicketsClient upcoming={upcoming} past={past} />
    </div>
  )
}
