import { createClient } from '@/lib/supabase/server'
import { CalendarDays, Users, TicketIcon, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch stats
  const [eventsRes, guestsRes, vendorsRes] = await Promise.all([
    supabase.from('events').select('id, title, status, date_start, capacity').eq('organizer_id', user!.id),
    supabase.from('guests').select('id, status, event_id').in(
      'event_id',
      (await supabase.from('events').select('id').eq('organizer_id', user!.id)).data?.map(e => e.id) ?? []
    ),
    supabase.from('vendors').select('id').eq('organizer_id', user!.id),
  ])

  const events = eventsRes.data ?? []
  const guests = guestsRes.data ?? []
  const vendors = vendorsRes.data ?? []

  const publishedEvents = events.filter(e => e.status === 'published').length
  const checkedIn = guests.filter(g => g.status === 'checked_in').length
  const upcomingEvents = events
    .filter(e => e.status === 'published' && new Date(e.date_start) > new Date())
    .sort((a, b) => new Date(a.date_start).getTime() - new Date(b.date_start).getTime())
    .slice(0, 5)

  const stats = [
    {
      label: 'Total Events',
      value: events.length,
      sub: `${publishedEvents} published`,
      icon: CalendarDays,
      color: 'text-brand-blue',
      bg: 'bg-brand-blue/10',
    },
    {
      label: 'Total Guests',
      value: guests.length,
      sub: `${checkedIn} checked in`,
      icon: Users,
      color: 'text-green-400',
      bg: 'bg-green-500/10',
    },
    {
      label: 'Ticket Types',
      value: '—',
      sub: 'Across all events',
      icon: TicketIcon,
      color: 'text-brand-yellow',
      bg: 'bg-brand-yellow/10',
    },
    {
      label: 'Vendors',
      value: vendors.length,
      sub: 'Registered',
      icon: TrendingUp,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
    },
  ]

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Welcome */}
      <div>
        <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
          Overview
        </h2>
        <p className="text-gray-400 text-sm mt-1">Here&apos;s what&apos;s happening across your events.</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card animate-slide-up">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
              {stat.value}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
            <p className="text-xs text-gray-600 mt-1">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Upcoming events */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white text-sm" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Upcoming Events
            </h3>
            <Link href="/dashboard/events" className="text-xs text-brand-blue hover:text-brand-blue-light transition-colors">
              View all →
            </Link>
          </div>

          {upcomingEvents.length === 0 ? (
            <div className="text-center py-8">
              <CalendarDays className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No upcoming events</p>
              <Link href="/dashboard/events/new" className="btn-primary mt-4 text-xs justify-center">
                Create event
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingEvents.map((event) => (
                <Link
                  key={event.id}
                  href={`/dashboard/events/${event.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors group"
                >
                  <div>
                    <p className="text-sm font-medium text-white group-hover:text-brand-blue transition-colors">
                      {event.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {formatDistanceToNow(new Date(event.date_start), { addSuffix: true })}
                    </p>
                  </div>
                  <span className="badge-blue text-xs">{event.capacity} cap</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="card">
          <h3 className="font-semibold text-white text-sm mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Quick Actions
          </h3>
          <div className="space-y-2">
            {[
              { href: '/dashboard/events/new', label: 'Create a new event', desc: 'Set up public or private event', icon: '🎪' },
              { href: '/dashboard/guests', label: 'Add guests', desc: 'Invite guests and manage list', icon: '👥' },
              { href: '/dashboard/scan', label: 'Open scanner', desc: 'QR entry/exit scanning', icon: '📱' },
              { href: '/dashboard/vendors', label: 'Add a vendor', desc: 'Track vendors and invoices', icon: '🤝' },
            ].map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors group"
              >
                <span className="text-xl">{action.icon}</span>
                <div>
                  <p className="text-sm font-medium text-white group-hover:text-brand-blue transition-colors">
                    {action.label}
                  </p>
                  <p className="text-xs text-gray-500">{action.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}