import Link from 'next/link'
import { CalendarPlus, Download } from 'lucide-react'
import { Badge, Card, EmptyState, PageHeader } from '@/components/kit'
import { buildAgenda, googleCalendarUrl, loadBookings, loadTickets } from '@/lib/attendee'
import { requireAttendee } from '@/lib/data/viewer'
import { fmtDate, fmtTime } from '@/lib/format'

export const metadata = { title: 'Schedule' }

const KIND = { event: 'Event', class: 'Class', space: 'Space', retreat: 'Retreat' } as const
const TONE = { event: 'accent', class: 'violet', space: 'magenta', retreat: 'magenta' } as const

export default async function SchedulePage() {
  const { supabase, profile } = await requireAttendee()
  const [t, b] = await Promise.all([loadTickets(supabase, profile.id), loadBookings(supabase, profile.id)])
  const agenda = buildAgenda(t, b)
  const days = new Map<string, typeof agenda>()
  for (const a of agenda) { const k = fmtDate(a.start, { weekday: 'long', day: 'numeric', month: 'long' }); days.set(k, [...(days.get(k) ?? []), a]) }
  return (
    <div className="k-fade-up space-y-6">
      <PageHeader title="Schedule" description="Everything you are going to, in order." actions={agenda.length ? <a href="/guest/schedule/calendar" className="inline-flex h-10 items-center gap-2 rounded-[10px] bg-accent px-4 text-sm font-medium text-accent-fg" data-tour="ics"><Download className="h-4 w-4" aria-hidden />Add all to calendar</a> : undefined} />
      {agenda.length === 0 ? <Card><EmptyState icon={<CalendarPlus className="h-6 w-6" />} title="Nothing on yet" description="Book an event, class or space and it lands here." action={<Link href="/guest/explore" className="text-sm font-medium text-accent hover:underline">Find something</Link>} /></Card> : (
        <div className="space-y-6">
          {[...days].map(([day, items]) => (
            <section key={day} aria-label={day}>
              <h2 className="mb-2 text-sm font-semibold text-muted">{day}</h2>
              <ul className="divide-y divide-line overflow-hidden rounded-2xl bg-surface shadow-card ring-1 ring-line">
                {items.map(a => (
                  <li key={a.key} className="flex flex-wrap items-center gap-3 p-4">
                    <p className="w-16 shrink-0 text-sm font-semibold tnum text-fg">{a.allDay ? 'All day' : fmtTime(a.start)}</p>
                    <div className="min-w-0 flex-1"><Link href={a.href} className="block truncate text-sm font-medium text-fg hover:underline">{a.title}</Link><p className="truncate text-xs text-muted">{a.secret ? 'Secret location' : a.where}</p></div>
                    <Badge tone={TONE[a.kind]}>{KIND[a.kind]}</Badge>
                    {a.status !== 'confirmed' && <Badge tone="warning">{a.status.replace('_', ' ')}</Badge>}
                    <a href={googleCalendarUrl(a)} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-accent hover:underline">Google Calendar</a>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
