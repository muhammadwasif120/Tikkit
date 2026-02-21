'use client'

import { useState } from 'react'
import { QrCode, Search, Users, Clock, Crown, Plus, ChevronDown } from 'lucide-react'
import clsx from 'clsx'
import Link from 'next/link'
import type { Database } from '@/lib/supabase/database.types'
import QrModal from '@/components/guests/QrModal'

type Guest = Database['public']['Tables']['guests']['Row']
type Event = { id: string; title: string; status: string }
type Tab = 'all' | 'vip' | 'regular' | 'waitlist'

const statusBadge: Record<string, string> = {
  invited: 'badge-gray',
  confirmed: 'badge-blue',
  checked_in: 'badge-green',
  checked_out: 'badge-gray',
  cancelled: 'badge-red',
}

export default function GuestsPageClient({
  events,
  initialGuests,
}: {
  events: Event[]
  initialGuests: Guest[]
}) {
  const [selectedEventId, setSelectedEventId] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [activeTab, setActiveTab] = useState<Tab>('all')
  const [selectedQR, setSelectedQR] = useState<Guest | null>(null)

  const guests = selectedEventId === 'all'
    ? initialGuests
    : initialGuests.filter(g => g.event_id === selectedEventId)

  const vipCount = guests.filter(g => g.is_vip && !g.waitlist).length
  const regularCount = guests.filter(g => !g.is_vip && !g.waitlist).length
  const waitlistCount = guests.filter(g => g.waitlist).length

  const tabs = [
    { key: 'all' as Tab, label: 'All', count: guests.length, icon: Users },
    { key: 'vip' as Tab, label: 'VIP', count: vipCount, icon: Crown },
    { key: 'regular' as Tab, label: 'Regular', count: regularCount, icon: Users },
    { key: 'waitlist' as Tab, label: 'Waitlist', count: waitlistCount, icon: Clock },
  ]

  const sortGuests = (list: Guest[]) =>
    [...list].sort((a, b) => {
      if (a.is_vip && !b.is_vip) return -1
      if (!a.is_vip && b.is_vip) return 1
      return a.full_name.localeCompare(b.full_name)
    })

  const filtered = sortGuests(
    guests.filter((g) => {
      const matchSearch =
        !search ||
        g.full_name.toLowerCase().includes(search.toLowerCase()) ||
        g.email?.toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === 'all' || g.status === statusFilter
      const matchTab =
        activeTab === 'all' ||
        (activeTab === 'vip' && g.is_vip && !g.waitlist) ||
        (activeTab === 'regular' && !g.is_vip && !g.waitlist) ||
        (activeTab === 'waitlist' && g.waitlist)
      return matchSearch && matchStatus && matchTab
    })
  )

  const selectedEvent = events.find(e => e.id === selectedEventId)

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Guests
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            {filtered.length} guest{filtered.length !== 1 ? 's' : ''}
            {selectedEventId !== 'all' && selectedEvent ? ` · ${selectedEvent.title}` : ' · All events'}
          </p>
        </div>
        {selectedEventId !== 'all' && (
          <Link href={`/dashboard/events/${selectedEventId}/guests/add`} className="btn-primary">
            <Plus className="w-4 h-4" />
            Add Guest
          </Link>
        )}
      </div>

      {/* Event filter dropdown */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative">
          <select
            className="input pr-10 appearance-none min-w-56 font-medium"
            value={selectedEventId}
            onChange={(e) => {
              setSelectedEventId(e.target.value)
              setActiveTab('all')
              setSearch('')
              setStatusFilter('all')
            }}
          >
            <option value="all">All Events</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.title}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>

        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            className="input pl-9"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="input w-auto"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All statuses</option>
          <option value="invited">Invited</option>
          <option value="confirmed">Confirmed</option>
          <option value="checked_in">Checked In</option>
          <option value="checked_out">Checked Out</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-brand-charcoal-light rounded-lg p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={clsx(
              'flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
              activeTab === tab.key
                ? tab.key === 'vip'
                  ? 'bg-[#FFC74520] text-[#FFC745] border border-[#FFC74533]'
                  : 'bg-[#1E5EFF] text-white'
                : 'text-gray-400 hover:text-white'
            )}
          >
            <tab.icon className="w-3 h-3" />
            {tab.label}
            <span className={clsx(
              'px-1.5 py-0.5 rounded-full text-[10px] font-semibold',
              activeTab === tab.key
                ? tab.key === 'vip' ? 'bg-[#FFC74530] text-[#FFC745]' : 'bg-white/20 text-white'
                : 'bg-white/5 text-gray-500'
            )}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* VIP banner */}
      {activeTab === 'vip' && vipCount > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-[#FFC74510] border border-[#FFC74525]">
          <Crown className="w-4 h-4 text-[#FFC745] shrink-0" />
          <p className="text-xs text-[#FFC745]">
            VIP guests have priority access and should be checked in before regular guests.
          </p>
        </div>
      )}

      {/* Guest table */}
      <div className="card">
        {guests.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 font-medium text-sm">No guests yet</p>
            <p className="text-gray-600 text-xs mt-1">
              {selectedEventId === 'all'
                ? 'Select an event and add guests to get started'
                : 'Add your first guest to this event'}
            </p>
            {selectedEventId !== 'all' && (
              <Link href={`/dashboard/events/${selectedEventId}/guests/add`} className="btn-primary mt-4 justify-center">
                <Plus className="w-4 h-4" /> Add Guest
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="table-header">Name</th>
                  {selectedEventId === 'all' && <th className="table-header">Event</th>}
                  <th className="table-header">Email</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Access</th>
                  <th className="table-header">QR</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((guest) => {
                  const event = events.find(e => e.id === guest.event_id)
                  return (
                    <tr
                      key={guest.id}
                      className={clsx(
                        'border-b border-white/5 hover:bg-white/[0.02] transition-colors',
                        guest.is_vip && 'bg-[#FFC74504]'
                      )}
                    >
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          {guest.is_vip && <Crown className="w-3 h-3 text-[#FFC745] shrink-0" />}
                          <div>
                            <p className="font-medium text-white">{guest.full_name}</p>
                            {guest.plus_one && (
                              <p className="text-xs text-gray-500">+1: {guest.plus_one_name || 'Guest'}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      {selectedEventId === 'all' && (
                        <td className="table-cell">
                          <Link
                            href={`/dashboard/events/${guest.event_id}`}
                            className="text-xs text-gray-400 hover:text-[#1E5EFF] transition-colors"
                          >
                            {event?.title ?? '—'}
                          </Link>
                        </td>
                      )}
                      <td className="table-cell text-gray-400">{guest.email || '—'}</td>
                      <td className="table-cell">
                        <span className={clsx(statusBadge[guest.status])}>
                          {guest.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="table-cell">
                        {guest.is_vip ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FFC74520] text-[#FFC745] border border-[#FFC74533]">
                            <Crown className="w-3 h-3" /> VIP
                          </span>
                        ) : guest.waitlist ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/5 text-gray-400 border border-white/10">
                            <Clock className="w-3 h-3" /> Waitlist
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#1E5EFF20] text-[#1E5EFF] border border-[#1E5EFF33]">
                            <Users className="w-3 h-3" /> Regular
                          </span>
                        )}
                      </td>
                      <td className="table-cell">
                        <button
                          onClick={() => setSelectedQR(guest)}
                          className="p-1.5 text-gray-400 hover:text-[#1E5EFF] transition-colors"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {filtered.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm">No guests match your filters.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {selectedQR && (
        <QrModal guest={selectedQR} onClose={() => setSelectedQR(null)} />
      )}
    </div>
  )
}