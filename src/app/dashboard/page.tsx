import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { CalendarDays, Users, ClipboardList, Receipt, ScanLine, Building2, LayoutDashboard } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import DashboardLoader from '@/components/layout/DashboardLoader'
import { sortEvents } from '@/lib/sortEvents'
import { syncEventStatuses } from '@/app/actions/eventStatusSync'
import { getEffectiveStatus } from '@/lib/eventStatus'

async function DashboardData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch event IDs first (needed for guest + registration queries)
  // Sync event statuses before reading (fire-and-forget)
  syncEventStatuses().catch(() => {})

  const { data: eventRows } = await supabase
    .from('events')
    .select('id, title, status, date_start, date_end, capacity')
    .eq('organizer_id', user!.id)
  const events = eventRows ?? []
  const eventIds = events.map(e => e.id)

  // Fetch vendor IDs (needed for invoice query)
  const { data: vendorRows } = await supabase
    .from('organiser_vendor_contacts')
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
          .from('organiser_vendor_invoices')
          .select('id', { count: 'exact', head: true })
          .in('vendor_id', vendorIds)
          .in('status', ['pending', 'overdue'])
      : Promise.resolve({ count: 0 }),
  ])

  const guests = (guestsRes as { data: { id: string; status: string }[] | null }).data ?? []
  const pendingApprovals = (pendingApprovalsRes as { count: number | null }).count ?? 0
  const pendingInvoices  = (pendingInvoicesRes  as { count: number | null }).count ?? 0

  const publishedEvents = events.filter(e => getEffectiveStatus(e) === 'published').length
  const checkedIn = guests.filter(g => g.status === 'checked_in').length
  const upcomingEvents = sortEvents(events).slice(0, 5)

  const stats = [
    {
      label: 'Total events',
      value: events.length,
      sub: `${publishedEvents} published`,
      icon: CalendarDays,
      color: 'var(--cyan-500)',
      href: '/dashboard/events',
    },
    {
      label: 'Total guests',
      value: guests.length,
      sub: `${checkedIn} checked in`,
      icon: Users,
      color: 'var(--mint-500)',
      href: '/dashboard/guests',
    },
    {
      label: 'Pending approvals',
      value: pendingApprovals,
      sub: pendingApprovals === 1 ? '1 awaiting review' : `${pendingApprovals} awaiting review`,
      icon: ClipboardList,
      color: 'var(--sky-500)',
      href: '/dashboard/approvals',
    },
    {
      label: 'Pending invoices',
      value: pendingInvoices,
      sub: pendingInvoices === 1 ? '1 unpaid' : `${pendingInvoices} unpaid`,
      icon: Receipt,
      color: 'var(--sky-500)',
      href: '/dashboard/vendors',
    },
  ]

  const quickActions = [
    { href: '/dashboard/events/new', label: 'Create a new event',  desc: 'Set up public or private event', Icon: CalendarDays, color: 'var(--cyan-500)', bg: 'rgba(0,229,255,0.1)',  border: 'rgba(0,229,255,0.15)'  },
    { href: '/dashboard/guests',    label: 'Manage guests',        desc: 'Invite guests and manage list',  Icon: Users,        color: 'var(--mint-500)', bg: 'rgba(61,214,140,0.1)', border: 'rgba(61,214,140,0.15)' },
    { href: '/dashboard/scan',      label: 'Open scanner',         desc: 'QR entry/exit scanning',         Icon: ScanLine,     color: 'var(--sky-500)',  bg: 'rgba(127,167,255,0.1)', border: 'rgba(127,167,255,0.15)' },
    { href: '/dashboard/vendors',   label: 'Add a vendor',         desc: 'Track vendors and invoices',     Icon: Building2,    color: 'var(--magenta-500)', bg: 'rgba(204,0,255,0.08)', border: 'rgba(204,0,255,0.15)'},
  ]

  return (
    <div className="space-y-5 max-w-5xl px-0 pt-2 pb-6 sm:px-6 sm:pt-7">
      {/* ── Hero panel — the one glass-strong panel on this screen ── */}
      <div className="glass-strong" style={{ padding: '28px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 16, flexShrink: 0,
            background: 'linear-gradient(135deg, rgba(var(--brand-blue-rgb),0.2), rgba(var(--brand-blue-rgb),0.08))',
            border: '1px solid rgba(var(--brand-blue-rgb),0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <LayoutDashboard size={22} color="var(--brand-blue)" />
          </div>
          <div>
            <h1 style={{ color: 'var(--text-primary)', fontSize: 'var(--fs-2xl)', fontWeight: 600, margin: '0 0 4px', fontFamily: 'var(--font-display)', letterSpacing: '-0.4px' }}>
              Dashboard
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-base)', margin: 0, lineHeight: 1.5, maxWidth: '65ch' }}>
              {"Here's what's happening across your events."}
            </p>
          </div>
        </div>

        {/* Signature element — a ticket stub tear-line, this product's one
            memorable domain flourish (thin, cyan at ~70% opacity, no illustration) */}
        <div style={{ position: 'relative', height: 1, margin: '24px 0 20px' }} aria-hidden="true">
          <div style={{ position: 'absolute', inset: 0, borderTop: '1px dashed rgba(0,229,255,0.7)' }} />
          <div style={{ position: 'absolute', left: -20, top: -7, width: 14, height: 14, borderRadius: '50%', background: 'rgba(6,11,34,0.9)', border: '1px solid rgba(255,255,255,0.08)' }} />
          <div style={{ position: 'absolute', right: -20, top: -7, width: 14, height: 14, borderRadius: '50%', background: 'rgba(6,11,34,0.9)', border: '1px solid rgba(255,255,255,0.08)' }} />
        </div>

        <p style={{ color: 'var(--mist-400)', fontSize: 13, margin: 0 }}>
          {events.length === 0
            ? 'Create your first event to start selling tickets.'
            : `${publishedEvents} of ${events.length} event${events.length === 1 ? '' : 's'} published · ${checkedIn} checked in so far.`}
        </p>
      </div>

      {/* ── Stat tile strip — one glass panel, tiles divided by rules not gaps ── */}
      <div className="glass" style={{ padding: 0 }}>
        <div className="grid grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, i) => {
            const inner = (
              <>
                <div className="flex items-center gap-1.5 mb-1">
                  <stat.icon style={{ width: 14, height: 14, color: stat.color }} />
                  <p className="text-xs truncate" style={{ color: 'var(--mist-400)' }}>{stat.label}</p>
                </div>
                <p className="figure text-xl font-semibold truncate" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                  {stat.value}
                </p>
                <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--mist-500)' }}>{stat.sub}</p>
              </>
            )
            const borderStyle: React.CSSProperties = {
              borderTop: i >= 2 ? '1px solid rgba(255,255,255,0.07)' : undefined,
              borderLeft: i % 2 === 1 ? '1px solid rgba(255,255,255,0.07)' : undefined,
            }
            return 'href' in stat && stat.href ? (
              <Link
                key={stat.label}
                href={stat.href}
                className="flex flex-col gap-0.5 p-4 sm:p-5 transition-colors hover:bg-[var(--overlay-1)]"
                style={{ ...borderStyle, textDecoration: 'none' }}
              >
                {inner}
              </Link>
            ) : (
              <div key={stat.label} className="flex flex-col gap-0.5 p-4 sm:p-5" style={borderStyle}>
                {inner}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Upcoming events (3) + Quick actions (2) ── */}
      <div className="grid lg:grid-cols-5 gap-5">
        <div className="card lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm" style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.3px', color: 'var(--text-primary)' }}>
              Upcoming events
            </h3>
            <Link href="/dashboard/events" className="text-xs transition-colors" style={{ color: 'var(--brand-blue)' }}>
              View all →
            </Link>
          </div>

          {upcomingEvents.length === 0 ? (
            <div className="text-center py-8">
              <CalendarDays className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--mist-500)' }} />
              <p className="text-sm" style={{ color: 'var(--mist-400)' }}>No upcoming events</p>
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
                  className="flex items-center justify-between p-3 rounded-xl transition-colors group hover:bg-[var(--overlay-2)]"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium transition-colors truncate" style={{ color: 'var(--text-primary)' }}>
                      {event.title}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--mist-500)' }}>
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
        <div className="card lg:col-span-2">
          <h3 className="font-semibold text-sm mb-4" style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.3px', color: 'var(--text-primary)' }}>
            Quick actions
          </h3>
          <div className="space-y-2">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--overlay-2)] border border-transparent hover:border-[var(--border-faint)] transition-colors group"
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: action.bg, border: `1px solid ${action.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <action.Icon style={{ width: 16, height: 16, color: action.color }} />
                </div>
                <div>
                  <p className="text-sm font-medium transition-colors" style={{ color: 'var(--text-primary)' }}>
                    {action.label}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--mist-500)' }}>{action.desc}</p>
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
