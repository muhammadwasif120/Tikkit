'use client'

import { useState, useMemo } from 'react'
import { BarChart3, Crown, CheckCircle, RefreshCw, Star, Users, Mail, Download, X, Send, ChevronDown, TrendingUp, Clock, DollarSign } from 'lucide-react'
import clsx from 'clsx'
import FinanceTab from '@/components/analytics/FinanceTab'
import type { Database } from '@/lib/supabase/database.types'

type Guest = Database['public']['Tables']['guests']['Row']
type Event = { id: string; title: string; capacity: number; status: string; date_start: string; ticket_price: number; budget: number }
type ScanLog = { event_id: string; scan_type: string; scanned_at: string }
type Tab = 'overview' | 'audience' | 'finance'

type AudienceGuest = {
  email: string
  full_name: string
  eventsAttended: number
  isVip: boolean
  alwaysCheckedIn: boolean
  tier: string
}

type AudienceTier = {
  key: string
  label: string
  description: string
  icon: React.ElementType
  color: string
  bgColor: string
  borderColor: string
  guests: AudienceGuest[]
}

export default function AnalyticsClient({
  events,
  guests,
  scanLogs,
  discountCodes,
}: {
  events: Event[]
  guests: Guest[]
  scanLogs: ScanLog[]
  discountCodes: any[]
}) {
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [selectedEventId, setSelectedEventId] = useState<string>(events[0]?.id ?? '')
  const [emailModal, setEmailModal] = useState<{ tier: AudienceTier; guests: AudienceGuest[] } | null>(null)
  const [selectedGuests, setSelectedGuests] = useState<Set<string>>(new Set())
  const [emailSubject, setEmailSubject] = useState('')
  const [emailBody, setEmailBody] = useState('')
  const [selectedEventForEmail, setSelectedEventForEmail] = useState<string>('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)

  // --- OVERVIEW STATS ---
  const totalGuests = guests.length
  const totalCheckedIn = guests.filter(g => g.status === 'checked_in').length

  const eventStats = events.map(event => {
    const eg = guests.filter(g => g.event_id === event.id)
    const checkedIn = eg.filter(g => g.status === 'checked_in').length
    const showUpRate = eg.length > 0 ? Math.round((checkedIn / eg.length) * 100) : 0
    return { ...event, total: eg.length, checkedIn, showUpRate, fillRate: event.capacity > 0 ? Math.round((eg.length / event.capacity) * 100) : 0 }
  })

  // --- ARRIVAL HEATMAP for selected event ---
  const arrivalData = useMemo(() => {
    if (!selectedEventId) return []
    const entryScan = scanLogs.filter(s => s.event_id === selectedEventId && s.scan_type === 'entry')
    if (!entryScan.length) return []

    // Group by hour
    const byHour: Record<number, number> = {}
    entryScan.forEach(s => {
      const hour = new Date(s.scanned_at).getHours()
      byHour[hour] = (byHour[hour] ?? 0) + 1
    })

    // Find min and max hour with data
    const hours = Object.keys(byHour).map(Number)
    const minHour = Math.min(...hours)
    const maxHour = Math.max(...hours)
    const maxCount = Math.max(...Object.values(byHour))

    // Build array for all hours in range
    return Array.from({ length: maxHour - minHour + 1 }, (_, i) => {
      const hour = minHour + i
      const count = byHour[hour] ?? 0
      const pct = maxCount > 0 ? (count / maxCount) * 100 : 0
      return { hour, count, pct }
    })
  }, [selectedEventId, scanLogs])

  const selectedEventData = eventStats.find(e => e.id === selectedEventId)
  const peakHour = arrivalData.reduce((a, b) => (a.count > b.count ? a : b), { hour: 0, count: 0, pct: 0 })

  const formatHour = (h: number) => {
    if (h === 0) return '12am'
    if (h < 12) return `${h}am`
    if (h === 12) return '12pm'
    return `${h - 12}pm`
  }

  const getHeatColor = (pct: number) => {
    if (pct >= 80) return 'bg-[#1E5EFF]'
    if (pct >= 60) return 'bg-[#1E5EFF] opacity-80'
    if (pct >= 40) return 'bg-[#1E5EFF] opacity-60'
    if (pct >= 20) return 'bg-[#1E5EFF] opacity-40'
    return 'bg-[#1E5EFF] opacity-20'
  }

  // --- AUDIENCE TIERS ---
  const audienceGuests = useMemo((): AudienceGuest[] => {
    const byEmail: Record<string, Guest[]> = {}
    guests.forEach(g => {
      if (!g.email) return
      if (!byEmail[g.email]) byEmail[g.email] = []
      byEmail[g.email].push(g)
    })

    return Object.entries(byEmail).map(([email, guestList]) => {
      const eventsAttended = new Set(guestList.filter(g => g.status === 'checked_in').map(g => g.event_id)).size
      const isVip = guestList.some(g => g.is_vip)
      const eventIds = [...new Set(guestList.map(g => g.event_id))]
      const alwaysCheckedIn = eventIds.length > 0 && eventIds.every(eid => guestList.filter(g => g.event_id === eid).some(g => g.status === 'checked_in'))
      let tier = 'returning'
      if (isVip && alwaysCheckedIn && eventsAttended >= 2) tier = 'most_loyal'
      else if (isVip) tier = 'vip'
      else if (alwaysCheckedIn) tier = 'always_checked_in'
      return { email, full_name: guestList[0].full_name, eventsAttended, isVip, alwaysCheckedIn, tier }
    }).filter(g => g.eventsAttended >= 1)
  }, [guests])

  const tiers: AudienceTier[] = [
    { key: 'most_loyal', label: 'Most Loyal', description: 'VIP · Always checked in · 2+ events', icon: Crown, color: 'text-[#FFC745]', bgColor: 'bg-[#FFC74515]', borderColor: 'border-[#FFC74530]', guests: audienceGuests.filter(g => g.tier === 'most_loyal') },
    { key: 'vip', label: 'VIPs', description: 'Marked VIP on any event', icon: Star, color: 'text-purple-400', bgColor: 'bg-purple-500/10', borderColor: 'border-purple-500/20', guests: audienceGuests.filter(g => g.tier === 'vip') },
    { key: 'always_checked_in', label: 'Always Show Up', description: 'Never a no-show across all events', icon: CheckCircle, color: 'text-green-400', bgColor: 'bg-green-500/10', borderColor: 'border-green-500/20', guests: audienceGuests.filter(g => g.tier === 'always_checked_in') },
    { key: 'returning', label: 'Returning', description: 'Attended 2+ events', icon: RefreshCw, color: 'text-[#1E5EFF]', bgColor: 'bg-[#1E5EFF15]', borderColor: 'border-[#1E5EFF30]', guests: audienceGuests.filter(g => g.tier === 'returning' && g.eventsAttended >= 2) },
  ]

  const openEmailModal = (tier: AudienceTier) => {
    setEmailModal({ tier, guests: tier.guests })
    setSelectedGuests(new Set(tier.guests.map(g => g.email)))
    setEmailSubject(`You're invited — Early Access`)
    setEmailBody(`Hi {name},\n\nYou're one of our most valued guests and we wanted to give you early access to our upcoming event.\n\nStay tuned for details.\n\nSee you there,\nThe Tikkit Team`)
    setSent(false)
    setSendError(null)
  }

  const exportCSV = (tier: AudienceTier) => {
    const rows = ['full_name,email,events_attended,is_vip,always_checked_in']
    tier.guests.forEach(g => rows.push(`"${g.full_name}","${g.email}",${g.eventsAttended},${g.isVip},${g.alwaysCheckedIn}`))
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tikkit-${tier.key}-audience.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const sendEmails = async () => {
    setSending(true)
    setSendError(null)
    const recipients = emailModal!.guests.filter(g => selectedGuests.has(g.email))
    try {
      const res = await fetch('/api/send-audience-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipients, subject: emailSubject, body: emailBody, eventId: selectedEventForEmail || null }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send')
      setSent(true)
    } catch (err: unknown) {
      setSendError(err instanceof Error ? err.message : 'Failed to send emails')
    }
    setSending(false)
  }

  const upcomingEvents = events.filter(e => e.status === 'published' && new Date(e.date_start) > new Date())

  return (
    <div className="space-y-6 max-w-5xl" style={{ padding: '28px 24px' }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 4 }}>
        <div style={{
          width: 52, height: 52, borderRadius: 16, flexShrink: 0,
          background: 'linear-gradient(135deg, rgba(168,85,247,0.2), rgba(30,94,255,0.12))',
          border: '1px solid rgba(168,85,247,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(168,85,247,0.15)',
        }}>
          <BarChart3 size={22} color="#A855F7" />
        </div>
        <div>
          <h1 style={{ color: 'white', fontSize: 24, fontWeight: 900, margin: '0 0 4px', fontFamily: 'var(--font-display)', letterSpacing: '-0.4px' }}>
            Analytics
          </h1>
          <p style={{ color: '#6B7280', fontSize: 13, margin: 0, lineHeight: 1.5 }}>
            Performance metrics and audience intelligence
          </p>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { key: 'overview' as Tab, label: 'Overview', icon: BarChart3,   count: events.length },
          { key: 'audience' as Tab, label: 'Audience', icon: Users,       count: audienceGuests.length },
          { key: 'finance'  as Tab, label: 'Finance',  icon: DollarSign,  count: discountCodes.length },
        ].map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={clsx(
              'flex items-center justify-center sm:justify-between p-3 sm:p-3.5 rounded-xl border transition-all duration-200 cursor-pointer',
              activeTab === tab.key
                ? 'bg-[#1E5EFF15] border-[#1E5EFF40] text-white'
                : 'bg-brand-charcoal border-white/5 text-gray-400 hover:border-white/10 hover:text-gray-200'
            )}>
            <div className="flex items-center gap-2 min-w-0">
              <tab.icon className={clsx('w-4 h-4 sm:w-3.5 sm:h-3.5 shrink-0', activeTab === tab.key ? 'text-[#1E5EFF]' : 'text-gray-500')} />
              <span className="hidden sm:block text-sm font-medium truncate">{tab.label}</span>
            </div>
            <span className={clsx('hidden sm:inline-flex ml-2 shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full',
              activeTab === tab.key ? 'bg-[#1E5EFF25] text-[#4D82FF]' : 'bg-white/5 text-gray-500'
            )}>{tab.count}</span>
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-fade-in">

          {/* Summary stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Events', value: events.length },
              { label: 'Total Guests', value: totalGuests },
              { label: 'Total Check-Ins', value: totalCheckedIn },
              { label: 'Overall Show-Up Rate', value: totalGuests > 0 ? `${Math.round((totalCheckedIn / totalGuests) * 100)}%` : '—' },
            ].map((s) => (
              <div key={s.label} className="stat-card">
                <p className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.75px' }}>{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Arrival Heatmap */}
          <div className="card">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-semibold text-white text-sm" style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.3px' }}>
                  Arrival Heatmap
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">When did the crowd show up?</p>
              </div>
              <div className="relative">
                <select
                  className="input text-xs py-1.5 pr-8 appearance-none"
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                >
                  {events.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {arrivalData.length === 0 ? (
              <div className="text-center py-10">
                <Clock className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No scan data yet for this event</p>
                <p className="text-xs text-gray-600 mt-1">Data appears once guests are scanned in</p>
              </div>
            ) : (
              <>
                {/* Peak callout */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-[#1E5EFF10] border border-[#1E5EFF20] mb-5">
                  <TrendingUp className="w-4 h-4 text-[#1E5EFF] shrink-0" />
                  <p className="text-xs text-[#1E5EFF]">
                    Peak arrival at <span className="font-bold">{formatHour(peakHour.hour)}</span> — {peakHour.count} guests checked in during this hour
                  </p>
                </div>

                {/* Bar chart */}
                <div className="flex items-end gap-1.5 h-32">
                  {arrivalData.map(({ hour, count, pct }) => (
                    <div key={hour} className="flex-1 flex flex-col items-center gap-1 group">
                      <div className="relative w-full flex items-end justify-center" style={{ height: '96px' }}>
                        {/* Tooltip */}
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-brand-charcoal border border-white/10 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                          {count} guest{count !== 1 ? 's' : ''}
                        </div>
                        <div
                          className={clsx('w-full rounded-t-md transition-all', getHeatColor(pct))}
                          style={{ height: `${Math.max(pct, 4)}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-gray-500">{formatHour(hour)}</span>
                    </div>
                  ))}
                </div>

                {/* Legend */}
                <div className="flex items-center gap-3 mt-4 justify-end">
                  <span className="text-[10px] text-gray-500">Low</span>
                  {[20, 40, 60, 80, 100].map(v => (
                    <div key={v} className={clsx('w-4 h-3 rounded-sm bg-[#1E5EFF]')} style={{ opacity: v / 100 }} />
                  ))}
                  <span className="text-[10px] text-gray-500">High</span>
                </div>
              </>
            )}
          </div>

          {/* Show-up rate per event */}
          <div className="card">
            <h3 className="font-semibold text-white text-sm mb-4" style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.3px' }}>
              Event Performance
            </h3>
            {eventStats.length === 0 ? (
              <div className="text-center py-8">
                <BarChart3 className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No events to analyse yet</p>
              </div>
            ) : (
              <>
                {/* Mobile cards */}
                <div className="md:hidden space-y-2">
                  {eventStats.map((e) => (
                    <div key={e.id} className="p-3 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                      <div className="flex items-center justify-between mb-2.5">
                        <p className="text-sm font-semibold text-white truncate flex-1 mr-2">{e.title}</p>
                        <span className={clsx('badge shrink-0', e.status === 'published' ? 'badge-green' : e.status === 'completed' ? 'badge-blue' : e.status === 'cancelled' ? 'badge-red' : 'badge-gray')}>{e.status}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                        <div>
                          <p className="text-[10px] text-gray-600 uppercase tracking-wide mb-0.5">Guests</p>
                          <p className="text-sm font-semibold text-white">{e.total}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-600 uppercase tracking-wide mb-0.5">Check-ins</p>
                          <p className="text-sm font-semibold text-white">{e.checkedIn}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-600 uppercase tracking-wide mb-1">Show-up</p>
                          <div className="flex items-center gap-1.5">
                            <div className="flex-1 bg-brand-charcoal-light rounded-full h-1">
                              <div className={clsx('h-1 rounded-full', e.showUpRate >= 70 ? 'bg-green-500' : e.showUpRate >= 40 ? 'bg-[#FFC745]' : 'bg-red-500')} style={{ width: `${e.showUpRate}%` }} />
                            </div>
                            <span className="text-xs text-gray-400 shrink-0">{e.showUpRate}%</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-600 uppercase tracking-wide mb-1">Fill rate</p>
                          <div className="flex items-center gap-1.5">
                            <div className="flex-1 bg-brand-charcoal-light rounded-full h-1">
                              <div className="h-1 rounded-full bg-[#1E5EFF]" style={{ width: `${e.fillRate}%` }} />
                            </div>
                            <span className="text-xs text-gray-400 shrink-0">{e.fillRate}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto -mx-6 px-6">
                  <table className="w-full min-w-[560px]">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="table-header">Event</th>
                        <th className="table-header">Status</th>
                        <th className="table-header">Guests</th>
                        <th className="table-header">Checked In</th>
                        <th className="table-header">Show-Up Rate</th>
                        <th className="table-header">Fill Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {eventStats.map((e) => (
                        <tr key={e.id} className="border-b border-white/5">
                          <td className="table-cell font-medium text-white">{e.title}</td>
                          <td className="table-cell">
                            <span className={clsx('badge', e.status === 'published' ? 'badge-green' : e.status === 'completed' ? 'badge-blue' : e.status === 'cancelled' ? 'badge-red' : 'badge-gray')}>{e.status}</span>
                          </td>
                          <td className="table-cell">{e.total}</td>
                          <td className="table-cell">{e.checkedIn}</td>
                          <td className="table-cell">
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-brand-charcoal-light rounded-full h-1.5">
                                <div className={clsx('h-1.5 rounded-full transition-all', e.showUpRate >= 70 ? 'bg-green-500' : e.showUpRate >= 40 ? 'bg-[#FFC745]' : 'bg-red-500')} style={{ width: `${e.showUpRate}%` }} />
                              </div>
                              <span className="text-xs text-gray-400">{e.showUpRate}%</span>
                            </div>
                          </td>
                          <td className="table-cell">
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-brand-charcoal-light rounded-full h-1.5">
                                <div className="h-1.5 rounded-full bg-[#1E5EFF]" style={{ width: `${e.fillRate}%` }} />
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
        </div>
      )}

      {/* AUDIENCE TAB */}
      {activeTab === 'audience' && (
        <div className="space-y-5 animate-fade-in">
          <div className="card bg-[#1E5EFF08] border-[#1E5EFF20]">
            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-[#1E5EFF] shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-white">Audience Intelligence</p>
                <p className="text-xs text-gray-400 mt-0.5">Your guests ranked by loyalty. Send early access emails to your most valuable crowd before anyone else.</p>
              </div>
            </div>
          </div>

          {tiers.map((tier) => (
            <div key={tier.key} className={clsx('card border', tier.borderColor)}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className={clsx('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', tier.bgColor)}>
                    <tier.icon className={clsx('w-4 h-4', tier.color)} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-white text-sm" style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.3px' }}>{tier.label}</h3>
                      <span className={clsx('px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0', tier.bgColor, tier.color)}>{tier.guests.length}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{tier.description}</p>
                  </div>
                </div>
                {tier.guests.length > 0 && (
                  <div className="flex items-center gap-2 sm:shrink-0">
                    <button onClick={() => exportCSV(tier)} className="btn-secondary text-xs px-3 py-2">
                      <Download className="w-3 h-3" /> Export
                    </button>
                    <button onClick={() => openEmailModal(tier)} className="btn-primary text-xs px-3 py-2">
                      <Mail className="w-3 h-3" /> Email
                    </button>
                  </div>
                )}
              </div>

              {tier.guests.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-4">No guests in this tier yet. Keep running events!</p>
              ) : (
                <div className="space-y-1">
                  {tier.guests.slice(0, 5).map((guest) => (
                    <div key={guest.email} className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={clsx('w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0', tier.bgColor, tier.color)}>
                          {guest.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white truncate">{guest.full_name}</p>
                          <p className="text-xs text-gray-500 truncate">{guest.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {guest.isVip && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#FFC74520] text-[#FFC745] border border-[#FFC74533]">
                            <Crown className="w-2.5 h-2.5" /> VIP
                          </span>
                        )}
                        <span className="text-xs text-gray-500">{guest.eventsAttended} event{guest.eventsAttended !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  ))}
                  {tier.guests.length > 5 && (
                    <p className="text-xs text-gray-500 text-center pt-2">+{tier.guests.length - 5} more guests</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}


      {/* FINANCE TAB */}
      {activeTab === 'finance' && (
        <FinanceTab
          events={events}
          guests={guests as any}
          discountCodes={discountCodes}
        />
      )}

      {/* EMAIL MODAL */}
      {emailModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-semibold text-white" style={{ fontFamily: 'var(--font-display)' }}>Email — {emailModal.tier.label}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{selectedGuests.size} recipients selected</p>
              </div>
              <button onClick={() => setEmailModal(null)} className="text-gray-500 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
            </div>

            <div className="mb-4">
              <label className="label">Link to Upcoming Event (optional)</label>
              <div className="relative">
                <select className="input appearance-none pr-10" value={selectedEventForEmail} onChange={(e) => setSelectedEventForEmail(e.target.value)}>
                  <option value="">No specific event</option>
                  {upcomingEvents.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div className="mb-4">
              <label className="label">Subject</label>
              <input type="text" className="input" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} />
            </div>

            <div className="mb-4">
              <label className="label">Message</label>
              <textarea className="input min-h-36 resize-none font-mono text-xs" value={emailBody} onChange={(e) => setEmailBody(e.target.value)} />
              <p className="text-xs text-gray-600 mt-1">Use {'{name}'} to personalise with guest's first name</p>
            </div>

            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <label className="label mb-0">Recipients</label>
                <button onClick={() => setSelectedGuests(selectedGuests.size === emailModal.guests.length ? new Set() : new Set(emailModal.guests.map(g => g.email)))} className="text-xs text-[#1E5EFF] hover:text-[#4F82FF] transition-colors">
                  {selectedGuests.size === emailModal.guests.length ? 'Deselect all' : 'Select all'}
                </button>
              </div>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {emailModal.guests.map((guest) => (
                  <div key={guest.email} onClick={() => { const next = new Set(selectedGuests); if (next.has(guest.email)) next.delete(guest.email); else next.add(guest.email); setSelectedGuests(next) }}
                    className={clsx('flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors', selectedGuests.has(guest.email) ? 'bg-[#1E5EFF15] border border-[#1E5EFF30]' : 'hover:bg-white/5 border border-transparent')}>
                    <div className={clsx('w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors', selectedGuests.has(guest.email) ? 'bg-[#1E5EFF] border-[#1E5EFF]' : 'border-white/20')}>
                      {selectedGuests.has(guest.email) && <CheckCircle className="w-3 h-3 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{guest.full_name}</p>
                      <p className="text-xs text-gray-500 truncate">{guest.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {sendError && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 mb-4">{sendError}</div>}

            {sent ? (
              <div className="flex items-center gap-2 text-green-400 text-sm font-medium justify-center py-3">
                <CheckCircle className="w-4 h-4" /> Emails sent to {selectedGuests.size} guests!
              </div>
            ) : (
              <div className="flex gap-3 justify-end">
                <button onClick={() => setEmailModal(null)} className="btn-secondary">Cancel</button>
                <button onClick={sendEmails} disabled={sending || selectedGuests.size === 0 || !emailSubject || !emailBody} className="btn-primary">
                  <Send className="w-4 h-4" />
                  {sending ? 'Sending...' : `Send to ${selectedGuests.size} guests`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}