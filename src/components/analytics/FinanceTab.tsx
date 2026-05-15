'use client'

import { useState, useMemo } from 'react'
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

  const filteredGuests = useMemo(() =>
    selectedEventId === 'all' ? guests : guests.filter(g => g.event_id === selectedEventId),
    [guests, selectedEventId])

  const filteredEvents = useMemo(() =>
    selectedEventId === 'all' ? events : events.filter(e => e.id === selectedEventId),
    [events, selectedEventId])

  const filteredDiscounts = useMemo(() =>
    selectedEventId === 'all' ? discountCodes : discountCodes.filter(d => d.event_id === selectedEventId),
    [discountCodes, selectedEventId])

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
  const eventBreakdown = useMemo(() => filteredEvents.map(event => {
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
  }), [filteredEvents, guests])

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Event filter */}
      <div className="relative">
        <select
          className="input w-full sm:w-auto sm:min-w-56 pr-10 appearance-none font-medium cursor-pointer"
          value={selectedEventId}
          onChange={e => setSelectedEventId(e.target.value)}
        >
          <option value="all">All Events</option>
          {events.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <div className="bg-brand-charcoal rounded-xl border border-white/5 p-3 sm:p-5 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 mb-0.5">
            <DollarSign className="w-3.5 h-3.5 text-green-400 shrink-0" />
            <p className="text-[10px] sm:text-xs text-gray-500 truncate">Total Revenue</p>
          </div>
          <p className="text-base sm:text-xl font-bold text-white truncate" style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.5px' }}>
            {formatCurrency(totalRevenue)}
          </p>
          <p className="text-[10px] text-gray-600 mt-0.5">{revenueRate}% of max</p>
        </div>

        <div className="bg-brand-charcoal rounded-xl border border-white/5 p-3 sm:p-5 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 mb-0.5">
            {profit >= 0
              ? <TrendingUp className="w-3.5 h-3.5 text-green-400 shrink-0" />
              : <TrendingDown className="w-3.5 h-3.5 text-red-400 shrink-0" />}
            <p className="text-[10px] sm:text-xs text-gray-500 truncate">Profit / Loss</p>
          </div>
          <p className={clsx('text-base sm:text-xl font-bold truncate', profit >= 0 ? 'text-green-400' : 'text-red-400')} style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.5px' }}>
            {formatCurrency(profit)}
          </p>
          <p className="text-[10px] text-gray-600 mt-0.5 truncate">Budget: {formatCurrency(totalBudget)}</p>
        </div>

        <div className="bg-brand-charcoal rounded-xl border border-white/5 p-3 sm:p-5 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Ticket className="w-3.5 h-3.5 text-[#1E5EFF] shrink-0" />
            <p className="text-[10px] sm:text-xs text-gray-500 truncate">Passes Sold</p>
          </div>
          <p className="text-base sm:text-xl font-bold text-white" style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.5px' }}>
            {totalSold} / {totalCapacity}
          </p>
          <div className="w-full bg-brand-charcoal-light rounded-full h-1 mt-1">
            <div className="h-1 rounded-full bg-[#1E5EFF]" style={{ width: `${fillRate}%` }} />
          </div>
          <p className="text-[10px] text-gray-600 mt-0.5">{fillRate}% fill rate</p>
        </div>

        <div className="bg-brand-charcoal rounded-xl border border-white/5 p-3 sm:p-5 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Tag className="w-3.5 h-3.5 text-[#FFC745] shrink-0" />
            <p className="text-[10px] sm:text-xs text-gray-500 truncate">Discount Impact</p>
          </div>
          <p className="text-base sm:text-xl font-bold text-[#FFC745] truncate" style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.5px' }}>
            {formatCurrency(totalDiscountAmount)}
          </p>
          <p className="text-[10px] text-gray-600 mt-0.5">{discountedGuests.length} discounted</p>
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
          <>
            {/* Mobile cards */}
            <div className="md:hidden space-y-2">
              {eventBreakdown.map(e => (
                <div key={e.id} className="p-3 rounded-xl border border-white/5">
                  <p className="text-sm font-semibold text-white truncate mb-2">{e.title}</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    <div>
                      <p className="text-[10px] text-gray-600 uppercase tracking-wide mb-0.5">Revenue</p>
                      <p className="text-sm font-semibold text-green-400">{formatCurrency(e.revenue)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-600 uppercase tracking-wide mb-0.5">Profit/Loss</p>
                      <p className={clsx('text-sm font-semibold', e.profit >= 0 ? 'text-green-400' : 'text-red-400')}>{e.profit >= 0 ? '+' : ''}{formatCurrency(e.profit)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-600 uppercase tracking-wide mb-0.5">Sold</p>
                      <p className="text-sm font-semibold text-white">{e.sold} / {e.capacity}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-600 uppercase tracking-wide mb-1">Fill</p>
                      <div className="flex items-center gap-1.5">
                        <div className="flex-1 bg-brand-charcoal-light rounded-full h-1">
                          <div className={clsx('h-1 rounded-full', e.fillRate >= 70 ? 'bg-green-500' : e.fillRate >= 40 ? 'bg-[#FFC745]' : 'bg-red-500')} style={{ width: `${e.fillRate}%` }} />
                        </div>
                        <span className="text-xs text-gray-400 shrink-0">{e.fillRate}%</span>
                      </div>
                    </div>
                  </div>
                  {e.discounted > 0 && (
                    <p className="text-[10px] text-[#FFC745] mt-2">{e.discounted} discounted (−{formatCurrency(e.discountLoss)})</p>
                  )}
                </div>
              ))}
            </div>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto -mx-6 px-6">
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
          </>
        )}
      </div>

      {/* Discount codes */}
      {filteredDiscounts.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-white text-sm mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Discount Code Performance
          </h3>
          {/* Mobile list */}
          <div className="md:hidden space-y-2">
            {filteredDiscounts.map(d => (
              <div key={d.id} className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-white/5">
                <div>
                  <p className="text-sm font-mono text-[#FFC745]">{d.code}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    {d.discount_type === 'percentage' ? `${d.discount_value}%` : formatCurrency(d.discount_value)} off
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-white">{d.times_used} used</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">max: {d.max_uses ?? '∞'}</p>
                </div>
              </div>
            ))}
          </div>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto -mx-6 px-6">
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