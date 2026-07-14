'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard, CalendarDays, Users, ScanLine, ClipboardCheck,
  ChevronRight, UserCheck, Clock, CheckCircle, AlertCircle, Calendar,
} from 'lucide-react'
import StaffScanner from './StaffScanner'
import clsx from 'clsx'

type Invite = { token: string; label: string; role: string; organizer_id: string }
type Event = { id: string; title: string; date_start: string; status: string }
type Guest = {
  id: string; full_name: string; email: string; status: string
  is_vip: boolean; event_id: string; created_at: string
}

type Tab = 'overview' | 'events' | 'guests' | 'scanner' | 'approvals'

const eventStatusColor: Record<string, string> = {
  draft:     'text-gray-400 bg-white/5 border-white/10',
  published: 'text-green-400 bg-green-500/10 border-green-500/20',
  cancelled: 'text-red-400 bg-red-500/10 border-red-500/20',
  completed: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
}

const guestStatusColor: Record<string, string> = {
  registered:  'text-blue-400 bg-blue-500/10 border-blue-500/20',
  checked_in:  'text-green-400 bg-green-500/10 border-green-500/20',
  checked_out: 'text-gray-400 bg-white/5 border-white/10',
  cancelled:   'text-red-400 bg-red-500/10 border-red-500/20',
}

const navItems: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: 'overview',  label: 'Overview',  icon: LayoutDashboard },
  { key: 'events',    label: 'Events',    icon: CalendarDays },
  { key: 'guests',    label: 'Guests',    icon: Users },
  { key: 'scanner',   label: 'Scanner',   icon: ScanLine },
  { key: 'approvals', label: 'Approvals', icon: ClipboardCheck },
]

export default function OrganizerView({ invite, events }: { invite: Invite; events: Event[] }) {
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [guests, setGuests] = useState<Guest[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [registrations, setRegistrations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const eventIds = events.map(e => e.id)
      if (eventIds.length > 0) {
        const [{ data: g }, { data: inv }, { data: reg }] = await Promise.all([
          supabase.from('guests').select('*').in('event_id', eventIds).order('created_at', { ascending: false }),
          supabase.from('organiser_vendor_invoices').select('*').in('event_id', eventIds),
          supabase.from('public_registrations').select('*').in('event_id', eventIds).eq('status', 'pending').order('created_at', { ascending: false }),
        ])
        setGuests((g ?? []) as any)
        setInvoices(inv ?? [])
        setRegistrations(reg ?? [])
      }
      setLoading(false)
    }
    load()
  }, [events, supabase])

  const checkedIn        = guests.filter(g => g.status === 'checked_in').length
  const pendingApprovals = registrations.length
  const pendingInvoices  = invoices.filter(i => i.status === 'pending' || i.status === 'overdue').length

  return (
    <div className="flex-1 flex flex-col overflow-hidden">

      {/* Tab bar */}
      <div className="border-b border-white/5 bg-brand-charcoal px-6 shrink-0">
        <div className="flex items-center gap-1 max-w-2xl mx-auto">
          {navItems.map(item => (
            <button key={item.key} onClick={() => setActiveTab(item.key)}
              className={clsx(
                'flex items-center gap-2 px-3 py-3.5 text-sm font-medium border-b-2 transition-all',
                activeTab === item.key
                  ? 'border-[#1E5EFF] text-white'
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              )}>
              <item.icon className="w-4 h-4" />
              {item.label}
              {item.key === 'approvals' && pendingApprovals > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#FFC745] text-black text-[9px] font-bold flex items-center justify-center">
                  {pendingApprovals > 9 ? '9+' : pendingApprovals}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Scanner bypasses the centered wrapper — StaffScanner owns its own layout */}
      {activeTab === 'scanner' && (
        <StaffScanner invite={invite} events={events} />
      )}

      {/* All other tabs use centered max-w-2xl layout */}
      {activeTab !== 'scanner' && (
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto space-y-6">

            {loading ? (
              <div className="flex items-center justify-center h-40">
                <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
              </div>
            ) : (
              <>
                {/* OVERVIEW */}
                {activeTab === 'overview' && (
                  <>
                    <div>
                      <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>Overview</h2>
                      <p className="text-gray-400 text-sm mt-1">{invite.label}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { label: 'Total Events', value: events.length,    sub: `${events.filter(e => e.status === 'published').length} published`, icon: Calendar,  color: 'text-blue-400',   bg: 'bg-blue-500/10' },
                        { label: 'Total Guests', value: guests.length,    sub: `${checkedIn} checked in`,                                          icon: Users,     color: 'text-green-400',  bg: 'bg-green-500/10' },
                        { label: 'Checked In',   value: checkedIn,        sub: 'across all events',                                                icon: UserCheck, color: 'text-purple-400', bg: 'bg-purple-500/10' },
                        { label: 'Pending',      value: pendingApprovals, sub: 'awaiting approval',                                                icon: Clock,     color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
                      ].map(s => (
                        <div key={s.label} className="card flex items-center gap-4">
                          <div className={clsx('w-10 h-10 rounded-lg flex items-center justify-center shrink-0', s.bg)}>
                            <s.icon className={clsx('w-5 h-5', s.color)} />
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>{s.value}</p>
                            <p className="text-sm text-gray-400">{s.label}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {pendingApprovals > 0 && (
                      <div className="card border-[#FFC745]/20 bg-[#FFC74508]">
                        <div className="flex items-center gap-3">
                          <AlertCircle className="w-5 h-5 text-[#FFC745] shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-white">{pendingApprovals} pending approval{pendingApprovals !== 1 ? 's' : ''}</p>
                            <p className="text-xs text-gray-400 mt-0.5">Guests waiting for review</p>
                          </div>
                          <button onClick={() => setActiveTab('approvals')} className="text-xs text-[#FFC745] hover:text-white transition-colors flex items-center gap-1 shrink-0">
                            View <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )}

                    {pendingInvoices > 0 && (
                      <div className="card border-red-500/20 bg-red-500/5">
                        <div className="flex items-center gap-3">
                          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                          <div>
                            <p className="text-sm font-semibold text-white">{pendingInvoices} unpaid invoice{pendingInvoices !== 1 ? 's' : ''}</p>
                            <p className="text-xs text-gray-400 mt-0.5">Vendor payments outstanding</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="card space-y-3">
                      <h3 className="font-semibold text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>Your Events</h3>
                      {events.length === 0 ? (
                        <p className="text-sm text-gray-500">No events yet.</p>
                      ) : events.slice(0, 5).map(e => (
                        <div key={e.id} className="flex items-center justify-between p-3 rounded-lg bg-brand-charcoal-light border border-white/5">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-white truncate">{e.title}</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {new Date(e.date_start).toLocaleDateString('en-PK', { dateStyle: 'medium' })}
                            </p>
                          </div>
                          <span className={clsx('text-[10px] font-medium px-2 py-0.5 rounded-full border capitalize shrink-0 ml-2', eventStatusColor[e.status])}>
                            {e.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* EVENTS */}
                {activeTab === 'events' && (
                  <>
                    <div>
                      <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>Events</h2>
                      <p className="text-gray-400 text-sm mt-1">{events.length} event{events.length !== 1 ? 's' : ''} total</p>
                    </div>
                    {events.length === 0 ? (
                      <div className="card text-center py-16">
                        <CalendarDays className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-400">No events found</p>
                      </div>
                    ) : events.map(e => {
                      const eventGuests    = guests.filter(g => g.event_id === e.id)
                      const checkedInCount = eventGuests.filter(g => g.status === 'checked_in').length
                      return (
                        <div key={e.id} className="card space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>{e.title}</h3>
                                <span className={clsx('text-[10px] font-medium px-2 py-0.5 rounded-full border capitalize', eventStatusColor[e.status])}>
                                  {e.status}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(e.date_start).toLocaleDateString('en-PK', { dateStyle: 'long' })}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-4 text-sm text-gray-400">
                            <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />{eventGuests.length} guests</span>
                            <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-green-400" />{checkedInCount} checked in</span>
                          </div>
                        </div>
                      )
                    })}
                  </>
                )}

                {/* GUESTS */}
                {activeTab === 'guests' && (
                  <>
                    <div>
                      <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>Guests</h2>
                      <p className="text-gray-400 text-sm mt-1">{guests.length} guest{guests.length !== 1 ? 's' : ''} across all events</p>
                    </div>
                    <div className="card divide-y divide-white/5 p-0 overflow-hidden">
                      {guests.length === 0 ? (
                        <div className="py-16 text-center">
                          <Users className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                          <p className="text-gray-400">No guests yet</p>
                        </div>
                      ) : guests.map(g => {
                        const event = events.find(e => e.id === g.event_id)
                        return (
                          <div key={g.id} className="flex items-center justify-between px-5 py-3.5">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-8 h-8 rounded-full bg-[#1E5EFF15] border border-[#1E5EFF20] flex items-center justify-center shrink-0">
                                <span className="text-xs font-bold text-[#1E5EFF]">{g.full_name.charAt(0).toUpperCase()}</span>
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <p className="text-sm font-medium text-white truncate">{g.full_name}</p>
                                  {g.is_vip && <span className="text-[9px] font-bold text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-1.5 rounded-full shrink-0">VIP</span>}
                                </div>
                                <p className="text-xs text-gray-500 truncate">{g.email} · {event?.title}</p>
                              </div>
                            </div>
                            <span className={clsx('text-[10px] font-medium px-2 py-0.5 rounded-full border capitalize shrink-0 ml-3', guestStatusColor[g.status] ?? 'text-gray-400 bg-white/5 border-white/10')}>
                              {g.status.replace('_', ' ')}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </>
                )}

                {/* APPROVALS */}
                {activeTab === 'approvals' && (
                  <>
                    <div>
                      <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>Approvals</h2>
                      <p className="text-gray-400 text-sm mt-1">Actions must be taken from the main dashboard.</p>
                    </div>
                    {registrations.length === 0 ? (
                      <div className="card text-center py-16">
                        <ClipboardCheck className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-400">No pending approvals</p>
                      </div>
                    ) : registrations.map((reg: any) => {
                      const event = events.find(e => e.id === reg.event_id)
                      return (
                        <div key={reg.id} className="card flex items-center gap-4">
                          <div className="w-9 h-9 rounded-full bg-[#FFC74515] border border-[#FFC74530] flex items-center justify-center shrink-0">
                            <span className="text-sm font-bold text-[#FFC745]">{reg.full_name.charAt(0).toUpperCase()}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white">{reg.full_name}</p>
                            <p className="text-xs text-gray-500 truncate">{reg.email} · {event?.title}</p>
                          </div>
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#FFC74515] border border-[#FFC74530] text-[#FFC745] shrink-0">Pending</span>
                        </div>
                      )
                    })}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}