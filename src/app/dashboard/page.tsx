import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { CalendarDays, Users, ClipboardList, Receipt, ScanLine, Building2, LayoutDashboard } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import DashboardLoader from '@/components/layout/DashboardLoader'

async function DashboardData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch event IDs first (needed for guest + registration queries)
  const { data: eventRows } = await supabase
    .from('events')
    .select('id, title, status, date_start, capacity')
    .eq('organizer_id', user!.id)
  const events = eventRows ?? []
  const eventIds = events.map(e => e.id)

  // Fetch vendor IDs (needed for invoice query)
  const { data: vendorRows } = await supabase
    .from('vendors')
    .select('id')
    .eq('organizer_id', user!.id)
  const vendorIds = (vendorRows ?? []).map(v => v.id)

  // Parallel fetch: guests, pending approvals, pending/overdue invoices
  const [guestsRes, pendingApprovalsRes, pendingInvoicesRes] = await Promise.all([
    eventIds.length > 0
      ? supabase.from('guests').select('id, status').in('event_id', eventIds)
      : Promise.resolve({ data: [] }),
    eventIds.length > 0
      ? supabase
          .from('public_registrations')
          .select('id', { count: 'exact', head: true })
          .in('event_id', eventIds)
          .eq('status', 'pending')
      : Promise.resolve({ count: 0 }),
    vendorIds.length > 0
      ? supabase
          .from('vendor_invoices')
          .select('id', { count: 'exact', head: true })
          .in('vendor_id', vendorIds)
          .in('status', ['pending', 'overdue'])
      : Promise.resolve({ count: 0 }),
  ])

  const guests = (guestsRes as { data: { id: string; status: string }[] | null }).data ?? []
  const pendingApprovals = (pendingApprovalsRes as { count: number | null }).count ?? 0
  const pendingInvoices  = (pendingInvoicesRes  as { count: number | null }).count ?? 0

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
      color: '#1E5EFF',
      bg: 'rgba(30,94,255,0.1)',
      border: 'rgba(30,94,255,0.15)',
      href: '/dashboard/events',
    },
    {
      label: 'Total Guests',
      value: guests.length,
      sub: `${checkedIn} checked in`,
      icon: Users,
      color: '#22C55E',
      bg: 'rgba(34,197,94,0.1)',
      border: 'rgba(34,197,94,0.15)',
      href: '/dashboard/guests',
    },
    {
      label: 'Pending Approvals',
      value: pendingApprovals,
      sub: pendingApprovals === 1 ? '1 awaiting review' : `${pendingApprovals} awaiting review`,
      icon: ClipboardList,
      color: '#FFC745',
      bg: 'rgba(255,199,69,0.1)',
      border: pendingApprovals > 0 ? 'rgba(255,199,69,0.35)' : 'rgba(255,199,69,0.15)',
      href: '/dashboard/approvals',
    },
    {
      label: 'Pending Invoices',
      value: pendingInvoices,
      sub: pendingInvoices === 1 ? '1 unpaid' : `${pendingInvoices} unpaid`,
      icon: Receipt,
      color: '#A78BFA',
      bg: 'rgba(167,139,250,0.1)',
      border: pendingInvoices > 0 ? 'rgba(167,139,250,0.35)' : 'rgba(167,139,250,0.15)',
      href: '/dashboard/vendors',
    },
  ]

  const quickActions = [
    { href: '/dashboard/events/new', label: 'Create a new event',  desc: 'Set up public or private event', Icon: CalendarDays, color: '#1E5EFF',  bg: 'rgba(30,94,255,0.1)',   border: 'rgba(30,94,255,0.15)'  },
    { href: '/dashboard/guests',    label: 'Manage guests',        desc: 'Invite guests and manage list',  Icon: Users,        color: '#22C55E',  bg: 'rgba(34,197,94,0.1)',   border: 'rgba(34,197,94,0.15)'  },
    { href: '/dashboard/scan',      label: 'Open scanner',         desc: 'QR entry/exit scanning',         Icon: ScanLine,     color: '#FFC745',  bg: 'rgba(255,199,69,0.1)',  border: 'rgba(255,199,69,0.15)' },
    { href: '/dashboard/vendors',   label: 'Add a vendor',         desc: 'Track vendors and invoices',     Icon: Building2,    color: '#A78BFA',  bg: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.15)'},
  ]

  return (
    <div className="space-y-6 max-w-5xl px-0 pt-2 pb-6 sm:px-6 sm:pt-7">
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 4 }}>
        <div style={{
          width: 52, height: 52, borderRadius: 16, flexShrink: 0,
          background: 'linear-gradient(135deg, rgba(30,94,255,0.2), rgba(168,85,247,0.12))',
          border: '1px solid rgba(30,94,255,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(30,94,255,0.15)',
        }}>
          <LayoutDashboard size={22} color="#1E5EFF" />
        </div>
        <div>
          <h1 style={{ color: 'white', fontSize: 'var(--fs-2xl)', fontWeight: 900, margin: '0 0 4px', fontFamily: 'var(--font-display)', letterSpacing: '-0.4px' }}>
            Dashboard
          </h1>
          <p style={{ color: '#6B7280', fontSize: 'var(--fs-base)', margin: 0, lineHeight: 1.5 }}>
            {"Here's what's happening across your events."}
          </p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {stats.map((stat) => {
          const inner = (
            <>
              <div className="flex items-center gap-1.5 mb-0.5">
                <div style={{ width: 26, height: 26, borderRadius: 8, background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <stat.icon style={{ width: 14, height: 14, color: stat.color }} />
                </div>
                <p className="text-[10px] sm:text-xs text-gray-500 truncate">{stat.label}</p>
              </div>
              <p className="text-base sm:text-xl font-bold text-white truncate" style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.5px' }}>
                {stat.value}
              </p>
              <p className="text-[10px] text-gray-600 mt-0.5 truncate">{stat.sub}</p>
            </>
          )
          return 'href' in stat && stat.href ? (
            <Link
              key={stat.label}
              href={stat.href}
              className="bg-brand-charcoal rounded-xl border p-3 sm:p-5 flex flex-col gap-0.5 animate-slide-up hover:border-opacity-60 transition-all"
              style={{ border: `1px solid ${stat.border}`, textDecoration: 'none' }}
            >
              {inner}
            </Link>
          ) : (
            <div key={stat.label} className="bg-brand-charcoal rounded-xl border p-3 sm:p-5 flex flex-col gap-0.5 animate-slide-up" style={{ border: `1px solid ${stat.border}` }}>
              {inner}
            </div>
          )
        })}
      </div>

      {/* Upcoming events + Quick actions */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white text-sm" style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.3px' }}>
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
            <div className="space-y-1">
              {upcomingEvents.map((event) => (
                <Link
                  key={event.id}
                  href={`/dashboard/events/${event.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white group-hover:text-brand-blue transition-colors truncate">
                      {event.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {formatDistanceToNow(new Date(event.date_start), { addSuffix: true })}
                    </p>
                  </div>
                  <span className="badge-blue text-xs shrink-0">{event.capacity} cap</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="card">
          <h3 className="font-semibold text-white text-sm mb-4" style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.3px' }}>
            Quick Actions
          </h3>
          <div className="space-y-2">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.04] border border-transparent hover:border-white/[0.06] transition-all group"
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: action.bg, border: `1px solid ${action.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <action.Icon style={{ width: 16, height: 16, color: action.color }} />
                </div>
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

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardLoader variant="home" />}>
      <DashboardData />
    </Suspense>
  )
}
