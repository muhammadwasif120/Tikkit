import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, CalendarDays, MapPin, Users } from 'lucide-react'
import { format } from 'date-fns'
import clsx from 'clsx'

const statusBadge: Record<string, string> = {
  draft: 'badge-gray',
  published: 'badge-green',
  cancelled: 'badge-red',
  completed: 'badge-blue',
}

export default async function EventsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: events } = await supabase
    .from('events')
    .select('*, ticket_types(count), guests(count)')
    .eq('organizer_id', user!.id)
    .order('date_start', { ascending: false })

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Events
          </h2>
          <p className="text-gray-400 text-sm mt-1">{events?.length ?? 0} total events</p>
        </div>
        <Link href="/dashboard/events/new" className="btn-primary">
          <Plus className="w-4 h-4" />
          New Event
        </Link>
      </div>

      {!events?.length ? (
        <div className="card text-center py-16">
          <CalendarDays className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">No events yet</p>
          <p className="text-gray-600 text-sm mt-1 mb-5">Create your first event to get started</p>
          <Link href="/dashboard/events/new" className="btn-primary justify-center">
            <Plus className="w-4 h-4" />
            Create Event
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {events.map((event) => (
            <Link
              key={event.id}
              href={`/dashboard/events/${event.id}`}
              className="card-hover flex items-start justify-between"
            >
              <div className="flex gap-4">
                {event.cover_image_url ? (
                  <img
                    src={event.cover_image_url}
                    alt={event.title}
                    className="w-16 h-16 rounded-lg object-cover shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-brand-charcoal-light border border-white/5 flex items-center justify-center shrink-0">
                    <CalendarDays className="w-5 h-5 text-gray-500" />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-white">{event.title}</h3>
                    <span className={clsx(statusBadge[event.status])}>{event.status}</span>
                    {!event.is_public && <span className="badge-yellow">Private</span>}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="w-3 h-3" />
                      {format(new Date(event.date_start), 'MMM d, yyyy · h:mm a')}
                    </span>
                    {event.venue_name && !event.venue_secret && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {event.venue_name}
                      </span>
                    )}
                    {event.venue_secret && (
                      <span className="flex items-center gap-1 text-brand-yellow">
                        <MapPin className="w-3 h-3" />
                        Secret Venue
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 text-gray-500 text-xs shrink-0">
                <Users className="w-3 h-3" />
                <span>{event.capacity} capacity</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}