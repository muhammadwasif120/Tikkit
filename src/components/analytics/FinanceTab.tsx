'use client'

import { useState } from 'react'
import { DollarSign, TrendingUp, TrendingDown, Ticket, Tag, ChevronDown } from 'lucide-react'
import clsx from 'clsx'

type Event = {
  id: string
  title: string
  capacity: number
  status: string
  ticket_price: number
  budget: number
}

type Guest = {
  id: string
  event_id: string
  status: string
  ticket_price_paid: number
  discount_applied: boolean
  discount_amount: number
  is_vip: boolean
  waitlist: boolean
}

type DiscountCode = {
  id: string
  event_id: string
  code: string
  discount_type: string
  discount_value: number
  times_used: number
  max_uses: number | null
}

export default function FinanceTab({
  events,
  guests,
  discountCodes,
}: {
  events: Event[]
  guests: Guest[]
  discountCodes: DiscountCode[]
}) {
  const [selectedEventId, setSelectedEventId] = useState<string>('all')

  const filteredGuests = selectedEventId === 'all'
    ? guests
    : guests.filter(g => g.event_id === selectedEventId)

  const filteredEvents = selectedEventId === 'all'
    ? events
    : events.filter(e => e.id === selectedEventId)

  const filteredDiscounts = selectedEventId === 'all'
    ? discountCodes
    : discountCodes.filter(d => d.event_id === selectedEventId)

  // Revenue calculations
  const totalRevenue = filteredGuests.reduce((sum, g) => sum + (g.ticket_price_paid ?? 0), 0)
  const totalBudget = filteredEvents.reduce((sum, e) => sum + (e.budget ?? 0), 0)
  const totalCapacity = filteredEvents.reduce((sum, e) => sum + e.capacity, 0)
  const totalSold = filteredGuests.filter(g => !g.waitlist).length
  const maxRevenue = filteredEvents.reduce((sum, e) => sum + (e.capacity * (e.ticket_price ?? 0)), 0)
  const profit = totalRevenue - totalBudget
  const discountedGuests = filteredGuests.filter(g => g.discount_applied)
  const totalDiscountAmount = filteredGuests.reduce((sum, g) => sum + (g.discount_amount ?? 0), 0)
  const fillRate = totalCapacity > 0 ? Math.round((totalSold / totalCapacity) * 100) : 0
  const revenueRate = maxRevenue > 0 ? Math.round((totalRevenue / maxRevenue) * 100) : 0

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(amount)

  // Per event breakdown
  const eventBreakdown = filteredEvents.map(event => {
    const eg = guests.filter(g => g.event_id === event.id && !g.waitlist)
    const revenue = eg.reduce((sum, g) => sum + (g.ticket_price_paid ?? 0), 0)
    const discounted = eg.filter(g => g.discount_applied).length
    const discountLoss = eg.reduce((sum, g) => sum + (g.discount_amount ?? 0), 0)
    const maxRev = event.capacity * (event.ticket_price ?? 0)
    const profit = revenue - (event.budget ?? 0)
    return {
      ...event,
      sold: eg.length,
      revenue,
      discounted,
      discountLoss,
      maxRev,
      profit,
      fillRate: event.capacity > 0 ? Math.round((eg.length / event.capacity) * 100) : 0,
    }
  })

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Event filter */}
      <div className="relative w-fit">
        <select
          className="input pr-10 appearance-none min-w-56 font-medium"
          value={selectedEventId}
          onChange={e => setSelectedEventId(e.target.value)}
        >
          <option value="all">All Events</option>
          {events.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4 text-green-400" />
            <p className="text-xs text-gray-500">Total Revenue</p>
          </div>
          <p className="text-2xl font-bold text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
            {formatCurrency(totalRevenue)}
          </p>
          <p className="text-xs text-gray-600 mt-1">{revenueRate}% of max potential</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-2 mb-1">
            {profit >= 0
              ? <TrendingUp className="w-4 h-4 text-green-400" />
              : <TrendingDown className="w-4 h-4 text-red-400" />}
            <p className="text-xs text-gray-500">Profit / Loss</p>
          </div>
          <p className={clsx('text-2xl font-bold', profit >= 0 ? 'text-green-400' : 'text-red-400')} style={{ fontFamily: 'Poppins, sans-serif' }}>
            {formatCurrency(profit)}
          </p>
          <p className="text-xs text-gray-600 mt-1">Budget: {formatCurrency(totalBudget)}</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-2 mb-1">
            <Ticket className="w-4 h-4 text-[#1E5EFF]" />
            <p className="text-xs text-gray-500">Passes Sold</p>
          </div>
          <p className="text-2xl font-bold text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
            {totalSold} / {totalCapacity}
          </p>
          <div className="w-full bg-brand-charcoal-light rounded-full h-1.5 mt-2">
            <div className="h-1.5 rounded-full bg-[#1E5EFF]" style={{ width: `${fillRate}%` }} />
          </div>
          <p className="text-xs text-gray-600 mt-1">{fillRate}% fill rate</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-2 mb-1">
            <Tag className="w-4 h-4 text-[#FFC745]" />
            <p className="text-xs text-gray-500">Discount Impact</p>
          </div>
          <p className="text-2xl font-bold text-[#FFC745]" style={{ fontFamily: 'Poppins, sans-serif' }}>
            {formatCurrency(totalDiscountAmount)}
          </p>
          <p className="text-xs text-gray-600 mt-1">{discountedGuests.length} discounted passes</p>
        </div>
      </div>

      {/* Revenue vs Budget bar */}
      {totalBudget > 0 && (
        <div className="card space-y-4">
          <h3 className="font-semibold text-white text-sm" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Revenue vs Budget
          </h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Revenue</span>
                <span>{formatCurrency(totalRevenue)}</span>
              </div>
              <div className="w-full bg-brand-charcoal-light rounded-full h-3">
                <div className="h-3 rounded-full bg-green-500 transition-all" style={{ width: `${Math.min((totalRevenue / Math.max(totalBudget, totalRevenue)) * 100, 100)}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Budget</span>
                <span>{formatCurrency(totalBudget)}</span>
              </div>
              <div className="w-full bg-brand-charcoal-light rounded-full h-3">
                <div className="h-3 rounded-full bg-red-500/70 transition-all" style={{ width: `${Math.min((totalBudget / Math.max(totalBudget, totalRevenue)) * 100, 100)}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Max Potential Revenue</span>
                <span>{formatCurrency(maxRevenue)}</span>
              </div>
              <div className="w-full bg-brand-charcoal-light rounded-full h-3">
                <div className="h-3 rounded-full bg-[#1E5EFF]/40 transition-all w-full" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Per event breakdown */}
      <div className="card">
        <h3 className="font-semibold text-white text-sm mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
          Per Event Breakdown
        </h3>
        {eventBreakdown.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-6">No events yet</p>
        ) : (
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="table-header">Event</th>
                  <th className="table-header">Sold / Cap</th>
                  <th className="table-header">Revenue</th>
                  <th className="table-header">Budget</th>
                  <th className="table-header">Profit/Loss</th>
                  <th className="table-header">Discounts</th>
                  <th className="table-header">Fill</th>
                </tr>
              </thead>
              <tbody>
                {eventBreakdown.map(e => (
                  <tr key={e.id} className="border-b border-white/5">
                    <td className="table-cell font-medium text-white">{e.title}</td>
                    <td className="table-cell text-gray-400">{e.sold} / {e.capacity}</td>
                    <td className="table-cell text-green-400 font-medium">{formatCurrency(e.revenue)}</td>
                    <td className="table-cell text-gray-400">{formatCurrency(e.budget ?? 0)}</td>
                    <td className="table-cell">
                      <span className={clsx('font-medium', e.profit >= 0 ? 'text-green-400' : 'text-red-400')}>
                        {e.profit >= 0 ? '+' : ''}{formatCurrency(e.profit)}
                      </span>
                    </td>
                    <td className="table-cell">
                      {e.discounted > 0 ? (
                        <span className="text-[#FFC745] text-xs">{e.discounted} (-{formatCurrency(e.discountLoss)})</span>
                      ) : (
                        <span className="text-gray-600">—</span>
                      )}
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <div className="w-12 bg-brand-charcoal-light rounded-full h-1.5">
                          <div className={clsx('h-1.5 rounded-full', e.fillRate >= 70 ? 'bg-green-500' : e.fillRate >= 40 ? 'bg-[#FFC745]' : 'bg-red-500')} style={{ width: `${e.fillRate}%` }} />
                        </div>
                        <span className="text-xs text-gray-400">{e.fillRate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Discount codes */}
      {filteredDiscounts.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-white text-sm mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Discount Code Performance
          </h3>
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="table-header">Code</th>
                  <th className="table-header">Discount</th>
                  <th className="table-header">Used</th>
                  <th className="table-header">Max Uses</th>
                </tr>
              </thead>
              <tbody>
                {filteredDiscounts.map(d => (
                  <tr key={d.id} className="border-b border-white/5">
                    <td className="table-cell font-mono text-[#FFC745] text-sm">{d.code}</td>
                    <td className="table-cell text-gray-400">
                      {d.discount_type === 'percentage' ? `${d.discount_value}%` : formatCurrency(d.discount_value)}
                    </td>
                    <td className="table-cell text-white">{d.times_used}</td>
                    <td className="table-cell text-gray-400">{d.max_uses ?? '∞'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}