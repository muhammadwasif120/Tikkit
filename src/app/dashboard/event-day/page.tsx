import Link from 'next/link'
import { QrCode } from 'lucide-react'
import { ButtonLink, Card, EmptyState, PageHeader } from '@/components/kit'
import OrganizerDoor from '@/components/door/OrganizerDoor'
import { requireOrganizer } from '@/lib/data/viewer'
import { fmtDateTime } from '@/lib/format'
import { cn } from '@/lib/cn'

export const metadata = { title: 'Event Day' }

export default async function EventDayPage({ searchParams }: { searchParams: Promise<{ event?: string }> }) {
  const { event: chosen } = await searchParams
  const { supabase, orgId } = await requireOrganizer()

  // events from a day ago onwards, soonest first
  const from = new Date(Date.now() - 36 * 3_600_000).toISOString()
  const { data: events } = await supabase.from('events').select('id, title, starts_at')
    .eq('organizer_id', orgId).eq('status', 'published').gte('starts_at', from).order('starts_at').limit(12)

  const list = events ?? []
  const current = list.find(e => e.id === chosen) ?? list[0]

  if (!current) {
    return (
      <div className="k-fade-up">
        <PageHeader title="Event Day" description="Scan tickets, watch the live count and look guests up." />
        <Card><EmptyState icon={<QrCode className="h-6 w-6" />} title="No event to run yet" description="Publish an event and it will show up here." action={<ButtonLink href="/dashboard/events/new">New event</ButtonLink>} /></Card>
      </div>
    )
  }

  return (
    <div className="k-fade-up">
      <PageHeader eyebrow={fmtDateTime(current.starts_at)} title={current.title} description="Scan tickets, watch the live count and look guests up."
        actions={<ButtonLink href={`/dashboard/events/${current.id}?tab=door`} variant="secondary">Door team links</ButtonLink>} />
      {list.length > 1 && (
        <nav aria-label="Choose event" className="mb-6 flex gap-2 overflow-x-auto">
          {list.map(e => (
            <Link key={e.id} href={`/dashboard/event-day?event=${e.id}`} aria-current={e.id === current.id ? 'page' : undefined}
              className={cn('whitespace-nowrap rounded-full px-4 py-1.5 text-[13px] font-medium ring-1 transition-colors', e.id === current.id ? 'bg-accent/12 text-accent ring-accent/40' : 'text-muted ring-line hover:text-fg')}>{e.title}</Link>
          ))}
        </nav>
      )}
      <OrganizerDoor key={current.id} eventId={current.id} title={current.title} />
    </div>
  )
}
