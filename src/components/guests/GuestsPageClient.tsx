'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { QrCode, Search, Users, Clock, Crown, Plus, ChevronDown, Edit2, Trash2, X, Check } from 'lucide-react'
import Link from 'next/link'
import type { Database } from '@/lib/supabase/database.types'
import QrModal from '@/components/guests/QrModal'

type Guest = Database['public']['Tables']['guests']['Row']
type Event = { id: string; title: string; status: string }
type Tab = 'all' | 'vip' | 'regular' | 'waitlist'

const STATUS_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  invited:     { bg: 'rgba(107,114,128,0.1)', color: 'var(--text-muted)', border: 'rgba(107,114,128,0.2)' },
  registered:  { bg: 'rgba(var(--brand-blue-rgb),0.1)',   color: '#4D82FF', border: 'rgba(var(--brand-blue-rgb),0.2)'   },
  confirmed:   { bg: 'rgba(var(--brand-blue-rgb),0.1)',   color: '#4D82FF', border: 'rgba(var(--brand-blue-rgb),0.2)'   },
  checked_in:  { bg: 'rgba(34,197,94,0.1)',   color: '#22C55E', border: 'rgba(34,197,94,0.2)'   },
  checked_out: { bg: 'rgba(107,114,128,0.1)', color: 'var(--text-muted)', border: 'rgba(107,114,128,0.2)' },
  cancelled:   { bg: 'rgba(239,68,68,0.1)',   color: '#EF4444', border: 'rgba(239,68,68,0.2)'   },
}

function StatusPill({ status }: { status: string }) {
  const c = STATUS_COLORS[status] ?? STATUS_COLORS.invited
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 9px', borderRadius: 20, fontSize: 'var(--fs-2xs)', fontWeight: 700, letterSpacing: '0.04em', background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>
      {status.replace('_', ' ')}
    </span>
  )
}

export default function GuestsPageClient({
  events,
  initialGuests,
}: {
  events: Event[]
  initialGuests: Guest[]
}) {
  const supabase = createClient()
  const [guests, setGuests]                 = useState<Guest[]>(initialGuests)
  const [selectedEventId, setSelectedEventId] = useState<string>('all')
  const [search, setSearch]                 = useState('')
  const [statusFilter, setStatusFilter]     = useState('all')
  const [activeTab, setActiveTab]           = useState<Tab>('all')
  const [selectedQR, setSelectedQR]         = useState<Guest | null>(null)
  const [editGuest, setEditGuest]           = useState<Guest | null>(null)
  const [editForm, setEditForm]             = useState({ full_name: '', email: '', phone: '', gender: '', is_vip: false, waitlist: false })
  const [editSaving, setEditSaving]         = useState(false)
  const [editError, setEditError]           = useState('')
  const [deleteGuest, setDeleteGuest]       = useState<Guest | null>(null)
  const [deleting, setDeleting]             = useState(false)
  const [expandedGuestId, setExpandedGuestId] = useState<string | null>(null)

  const openEdit = (guest: Guest) => {
    setEditGuest(guest)
    setEditForm({ full_name: guest.full_name, email: guest.email ?? '', phone: guest.phone ?? '', gender: guest.gender ?? '', is_vip: guest.is_vip ?? false, waitlist: guest.waitlist ?? false })
  }

  const saveEdit = async () => {
    if (!editGuest) return
    if (!editForm.full_name.trim()) {
      setEditError('Please enter the guest\'s name. You can add more details later.')
      return
    }
    setEditError('')
    setEditSaving(true)
    const { data, error } = await supabase.from('guests').update({ full_name: editForm.full_name, email: editForm.email || null, phone: editForm.phone || null, gender: editForm.gender || null, is_vip: editForm.is_vip, waitlist: editForm.waitlist }).eq('id', editGuest.id).select().single()
    setEditSaving(false)
    if (error || !data) {
      setEditError('Something went wrong. Please try again.')
      return
    }
    setGuests(prev => prev.map(g => g.id === data.id ? data : g))
    setEditGuest(null)
  }

  const confirmDelete = async () => {
    if (!deleteGuest) return
    setDeleting(true)
    await supabase.from('guests').delete().eq('id', deleteGuest.id)
    setGuests(prev => prev.filter(g => g.id !== deleteGuest.id))
    setDeleting(false)
    setDeleteGuest(null)
  }

  const visibleGuests  = selectedEventId === 'all' ? guests : guests.filter(g => g.event_id === selectedEventId)
  const vipCount       = visibleGuests.filter(g => g.is_vip && !g.waitlist).length
  const regularCount   = visibleGuests.filter(g => !g.is_vip && !g.waitlist).length
  const waitlistCount  = visibleGuests.filter(g => g.waitlist).length

  const tabs: { key: Tab; label: string; count: number; color: string; activeColor: string }[] = [
    { key: 'all',      label: 'All',      count: visibleGuests.length, color: 'rgba(var(--brand-blue-rgb),0.1)',  activeColor: 'rgba(var(--brand-blue-rgb),0.15)'  },
    { key: 'vip',      label: 'VIP',      count: vipCount,             color: 'rgba(255,199,69,0.1)', activeColor: 'rgba(255,199,69,0.15)' },
    { key: 'regular',  label: 'Regular',  count: regularCount,         color: 'rgba(var(--brand-blue-rgb),0.1)',  activeColor: 'rgba(var(--brand-blue-rgb),0.15)'  },
    { key: 'waitlist', label: 'Waitlist', count: waitlistCount,        color: 'rgba(107,114,128,0.1)',activeColor: 'rgba(107,114,128,0.15)'},
  ]

  const filtered = [...visibleGuests]
    .filter(g => {
      if (!search) return true
      const s = search.toLowerCase()
      return g.full_name.toLowerCase().includes(s) || g.email?.toLowerCase().includes(s)
    })
    .filter(g => statusFilter === 'all' || g.status === statusFilter)
    .filter(g => {
      if (activeTab === 'vip')      return g.is_vip && !g.waitlist
      if (activeTab === 'regular')  return !g.is_vip && !g.waitlist
      if (activeTab === 'waitlist') return g.waitlist
      return true
    })
    .sort((a, b) => {
      if (a.is_vip && !b.is_vip) return -1
      if (!a.is_vip && b.is_vip) return 1
      return a.full_name.localeCompare(b.full_name)
    })

  const selectedEvent = events.find(e => e.id === selectedEventId)

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px',
    background: 'var(--guest-surface-2)', border: '1px solid var(--guest-border)',
    borderRadius: 12, color: 'var(--text-primary)', fontSize: 'var(--fs-base)',
    outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
  }

  return (
    <div className="max-w-5xl px-0 pt-2 pb-6 sm:px-6 sm:pt-7">

      {/* ── Header ──────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 16, flexShrink: 0,
            background: 'linear-gradient(135deg, rgba(34,197,94,0.2), rgba(var(--brand-blue-rgb),0.12))',
            border: '1px solid rgba(34,197,94,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(34,197,94,0.12)',
          }}>
            <Users size={22} color="#22C55E" />
          </div>
          <div>
            <h1 style={{ color: 'var(--text-primary)', fontSize: 'var(--fs-2xl)', fontWeight: 900, margin: '0 0 4px', fontFamily: 'var(--font-display)', letterSpacing: '-0.4px' }}>
              Guests
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-base)', margin: 0, lineHeight: 1.5 }}>
              {visibleGuests.length} guest{visibleGuests.length !== 1 ? 's' : ''}
              {selectedEventId !== 'all' && selectedEvent ? ` · ${selectedEvent.title}` : ' · All events'}
            </p>
          </div>
        </div>
        {selectedEventId !== 'all' && (
          <Link href={`/dashboard/events/${selectedEventId}/guests/add`} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'var(--brand-blue)', color: '#FFFFFF', textDecoration: 'none',
            padding: '10px 18px', borderRadius: 12, fontSize: 'var(--fs-base)', fontWeight: 700, flexShrink: 0,
            boxShadow: '0 6px 20px rgba(var(--brand-blue-rgb),0.25)',
          }}>
            <Plus size={14} /> Add Guest
          </Link>
        )}
      </div>

      {/* ── Filters ──────────────────────────────────────────── */}
      <div style={{ background: 'var(--surface-card)', border: '1px solid var(--guest-border)', borderRadius: 16, padding: '16px', marginBottom: 10 }}>
        <div style={{ position: 'relative', marginBottom: 10 }}>
          <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Search guests by name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '10px 12px 10px 36px',
              background: 'var(--guest-surface-2)', border: '1px solid var(--guest-border)',
              borderRadius: 12, color: 'var(--text-primary)', fontSize: 'var(--fs-base)', outline: 'none',
              fontFamily: 'inherit', boxSizing: 'border-box',
            }}
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Event selector */}
          <div style={{ position: 'relative', flex: 1 }}>
            <select
              value={selectedEventId}
              onChange={e => { setSelectedEventId(e.target.value); setActiveTab('all'); setSearch(''); setStatusFilter('all') }}
              style={{ width: '100%', padding: '10px 32px 10px 12px', appearance: 'none', background: 'var(--guest-surface-2)', border: '1px solid var(--guest-border)', borderRadius: 12, color: 'var(--text-primary)', fontSize: 'var(--fs-base)', cursor: 'pointer', fontFamily: 'inherit', outline: 'none' }}
            >
              <option value="all">All Events</option>
              {events.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
            </select>
            <ChevronDown size={14} color="var(--text-muted)" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          </div>
          {/* Status selector */}
          <div style={{ position: 'relative', flex: 1 }}>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{ width: '100%', padding: '10px 32px 10px 12px', appearance: 'none', background: 'var(--guest-surface-2)', border: '1px solid var(--guest-border)', borderRadius: 12, color: 'var(--text-primary)', fontSize: 'var(--fs-base)', cursor: 'pointer', fontFamily: 'inherit', outline: 'none' }}
            >
              <option value="all">All Statuses</option>
              <option value="invited">Invited</option>
              <option value="registered">Registered</option>
              <option value="confirmed">Confirmed</option>
              <option value="checked_in">Checked In</option>
              <option value="checked_out">Checked Out</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <ChevronDown size={14} color="var(--text-muted)" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          </div>
        </div>
      </div>

      {/* ── Tabs ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2" style={{ marginBottom: 20 }}>
        {tabs.map(tab => {
          const isActive = activeTab === tab.key
          const isVip    = tab.key === 'vip'
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 14px', borderRadius: 14, cursor: 'pointer', transition: 'all 0.15s',
                background: isActive ? tab.activeColor : 'var(--surface-card)',
                border: isActive
                  ? isVip ? '1px solid rgba(255,199,69,0.3)' : '1px solid rgba(var(--brand-blue-rgb),0.3)'
                  : '1px solid var(--guest-border)',
              }}
            >
              <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: isActive ? (isVip ? '#FFC745' : 'var(--brand-blue)') : 'var(--text-muted)' }}>{tab.label}</span>
              <span style={{
                marginLeft: 8, fontSize: 'var(--fs-xs)', fontWeight: 800, padding: '2px 7px', borderRadius: 20, flexShrink: 0,
                background: isActive ? (isVip ? 'rgba(255,199,69,0.2)' : 'rgba(var(--brand-blue-rgb),0.2)') : 'var(--guest-surface-2)',
                color: isActive ? (isVip ? '#FFC745' : 'var(--brand-blue)') : 'var(--text-muted)',
              }}>{tab.count}</span>
            </button>
          )
        })}
      </div>

      {/* VIP banner */}
      {activeTab === 'vip' && vipCount > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 18px', marginBottom: 12,
          background: 'rgba(255,199,69,0.06)', border: '1px solid rgba(255,199,69,0.2)',
          borderRadius: 14,
        }}>
          <Crown size={14} color="#FFC745" style={{ flexShrink: 0 }} />
          <p style={{ color: '#FFC745', fontSize: 'var(--fs-sm)', margin: 0, fontWeight: 600 }}>
            VIP guests have priority access and should be checked in before regular guests.
          </p>
        </div>
      )}

      {/* ── Count label ──────────────────────────────────────── */}
      <p style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-xs)', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', margin: '0 0 12px' }}>
        {filtered.length} {filtered.length === 1 ? 'guest' : 'guests'}
      </p>

      {/* ── Guest list ───────────────────────────────────────── */}
      <div style={{ background: 'var(--surface-card)', border: '1px solid var(--guest-border)', borderRadius: 18, overflow: 'hidden' }}>
        {visibleGuests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '72px 24px' }}>
            <div style={{
              width: 56, height: 56, borderRadius: 18, margin: '0 auto 16px',
              background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Users size={24} color="#22C55E" />
            </div>
            <p style={{ color: 'var(--text-primary)', fontSize: 'var(--fs-md)', fontWeight: 800, margin: '0 0 6px', fontFamily: 'var(--font-display)' }}>
              No guests yet
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-base)', margin: '0 0 20px', lineHeight: 1.6 }}>
              {selectedEventId === 'all' ? 'Select an event and add guests to get started' : 'Add your first guest to this event'}
            </p>
            {selectedEventId !== 'all' && (
              <Link href={`/dashboard/events/${selectedEventId}/guests/add`} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'var(--brand-blue)', color: '#FFFFFF', textDecoration: 'none',
                padding: '11px 24px', borderRadius: 12, fontSize: 'var(--fs-base)', fontWeight: 700,
                boxShadow: '0 8px 24px rgba(var(--brand-blue-rgb),0.25)',
              }}>
                <Plus size={14} /> Add Guest
              </Link>
            )}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-base)', margin: 0 }}>No guests match your filters.</p>
          </div>
        ) : (
          <>
            {/* Mobile list */}
            <div className="md:hidden">
              {filtered.map(guest => {
                const event = events.find(e => e.id === guest.event_id)
                const isExpanded = expandedGuestId === guest.id
                return (
                  <div key={guest.id} style={{ borderBottom: '1px solid var(--guest-border)', background: guest.is_vip ? 'rgba(255,199,69,0.02)' : 'transparent' }}>
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', cursor: 'pointer' }}
                      onClick={() => setExpandedGuestId(isExpanded ? null : guest.id)}
                    >
                      <div style={{
                        width: 36, height: 36, borderRadius: 12, flexShrink: 0,
                        background: guest.is_vip ? 'rgba(255,199,69,0.12)' : 'var(--guest-surface-2)',
                        border: `1px solid ${guest.is_vip ? 'rgba(255,199,69,0.25)' : 'var(--guest-border)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {guest.is_vip
                          ? <Crown size={15} color="#FFC745" />
                          : <span style={{ fontSize: 'var(--fs-base)', fontWeight: 700, color: '#4D82FF', fontFamily: 'var(--font-display)' }}>{guest.full_name.charAt(0).toUpperCase()}</span>
                        }
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ color: 'var(--text-primary)', fontSize: 'var(--fs-base)', fontWeight: 700, margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{guest.full_name}</p>
                        <StatusPill status={guest.status} />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                        <button onClick={() => setSelectedQR(guest)} style={{ padding: 8, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                          <QrCode size={15} />
                        </button>
                        <button onClick={() => openEdit(guest)} style={{ padding: 8, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                          <Edit2 size={13} />
                        </button>
                        <button onClick={() => setDeleteGuest(guest)} style={{ padding: 8, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                    {isExpanded && (
                      <div style={{ padding: '0 14px 12px 60px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {guest.email && <p style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-sm)', margin: 0 }}>{guest.email}</p>}
                        {selectedEventId === 'all' && event && <p style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-sm)', margin: 0 }}>{event.title}</p>}
                        {guest.waitlist && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 20, fontSize: 'var(--fs-2xs)', fontWeight: 700, background: 'rgba(107,114,128,0.1)', color: 'var(--text-muted)', border: '1px solid rgba(107,114,128,0.2)', width: 'fit-content' }}>
                            <Clock size={9} /> Waitlist{guest.waitlist_position ? ` #${guest.waitlist_position}` : ''}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table style={{ width: '100%', minWidth: 680, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--guest-border)' }}>
                    {['Name', ...(selectedEventId === 'all' ? ['Event'] : []), 'Email', 'Status', 'Access', 'QR', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '12px 20px', textAlign: 'left', color: 'var(--text-muted)', fontSize: 'var(--fs-xs)', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(guest => {
                    const event = events.find(e => e.id === guest.event_id)
                    return (
                      <tr key={guest.id} className="guest-row" style={{ borderBottom: '1px solid var(--guest-border)', background: guest.is_vip ? 'rgba(255,199,69,0.02)' : 'transparent' }}>
                        <td style={{ padding: '14px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {guest.is_vip && <Crown size={12} color="#FFC745" />}
                            <div>
                              <p style={{ color: 'var(--text-primary)', fontSize: 'var(--fs-base)', fontWeight: 700, margin: 0 }}>{guest.full_name}</p>
                              {guest.plus_one && <p style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-xs)', margin: '2px 0 0' }}>+1: {guest.plus_one_name || 'Guest'}</p>}
                            </div>
                          </div>
                        </td>
                        {selectedEventId === 'all' && (
                          <td style={{ padding: '14px 20px' }}>
                            <Link href={`/dashboard/events/${guest.event_id}`} style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-sm)', textDecoration: 'none' }}>{event?.title ?? '—'}</Link>
                          </td>
                        )}
                        <td style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: 'var(--fs-base)' }}>{guest.email || '—'}</td>
                        <td style={{ padding: '14px 20px' }}><StatusPill status={guest.status} /></td>
                        <td style={{ padding: '14px 20px' }}>
                          {guest.is_vip ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 20, fontSize: 'var(--fs-2xs)', fontWeight: 700, background: 'rgba(255,199,69,0.12)', color: '#FFC745', border: '1px solid rgba(255,199,69,0.25)' }}><Crown size={9} /> VIP</span>
                          ) : guest.waitlist ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 20, fontSize: 'var(--fs-2xs)', fontWeight: 700, background: 'rgba(107,114,128,0.1)', color: 'var(--text-muted)', border: '1px solid rgba(107,114,128,0.2)' }}><Clock size={9} /> Waitlist</span>
                          ) : (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 20, fontSize: 'var(--fs-2xs)', fontWeight: 700, background: 'rgba(var(--brand-blue-rgb),0.1)', color: '#4D82FF', border: '1px solid rgba(var(--brand-blue-rgb),0.2)' }}><Users size={9} /> Regular</span>
                          )}
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          <button onClick={() => setSelectedQR(guest)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}>
                            <QrCode size={15} />
                          </button>
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          <div className="guest-actions" style={{ display: 'flex', alignItems: 'center', gap: 4, opacity: 0, transition: 'opacity 0.15s' }}>
                            <button onClick={() => openEdit(guest)} style={{ padding: 6, background: 'var(--guest-surface-2)', border: '1px solid var(--guest-border)', borderRadius: 8, color: 'var(--text-muted)', cursor: 'pointer' }}>
                              <Edit2 size={12} />
                            </button>
                            <button onClick={() => setDeleteGuest(guest)} style={{ padding: 6, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.12)', borderRadius: 8, color: '#EF4444', cursor: 'pointer' }}>
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {selectedQR && <QrModal guest={selectedQR} onClose={() => setSelectedQR(null)} />}

      {/* Edit Modal */}
      {editGuest && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
          <div style={{ background: 'var(--surface-card)', border: '1px solid var(--guest-border)', borderRadius: 20, padding: '24px', width: '100%', maxWidth: 440 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ color: 'var(--text-primary)', fontSize: 'var(--fs-lg)', fontWeight: 800, margin: 0, fontFamily: 'var(--font-display)' }}>Edit Guest</h3>
              <button onClick={() => setEditGuest(null)} style={{ background: 'var(--guest-surface-2)', border: '1px solid var(--guest-border)', color: 'var(--text-muted)', cursor: 'pointer', width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={14} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Full Name *', key: 'full_name', type: 'text' },
                { label: 'Email', key: 'email', type: 'email' },
                { label: 'Phone', key: 'phone', type: 'tel' },
              ].map(({ label, key, type }) => (
                <div key={key}>
                  <label style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-xs)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>{label}</label>
                  <input
                    type={type}
                    value={(editForm as any)[key]}
                    onChange={e => setEditForm(p => ({ ...p, [key]: e.target.value }))}
                    style={inputStyle}
                  />
                </div>
              ))}
              <div>
                <label style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-xs)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Gender</label>
                <select
                  value={editForm.gender}
                  onChange={e => setEditForm(p => ({ ...p, gender: e.target.value }))}
                  style={inputStyle}
                >
                  <option value="">Not specified</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                {[
                  { label: 'VIP', key: 'is_vip', color: '#FFC745' },
                  { label: 'Waitlist', key: 'waitlist', color: 'var(--brand-blue)' },
                ].map(({ label, key, color }) => (
                  <div key={key} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'var(--guest-surface-2)', border: '1px solid var(--guest-border)', borderRadius: 12 }}>
                    <span style={{ color: 'var(--text-primary)', fontSize: 'var(--fs-base)', fontWeight: 600 }}>{label}</span>
                    <button
                      type="button"
                      onClick={() => setEditForm(p => ({ ...p, [key]: !(p as any)[key] }))}
                      style={{ position: 'relative', width: 40, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer', background: (editForm as any)[key] ? color : 'var(--guest-border)', transition: 'background 0.2s' }}
                    >
                      <span style={{ position: 'absolute', top: 3, left: 3, width: 16, height: 16, borderRadius: '50%', background: 'white', transition: 'transform 0.2s', transform: (editForm as any)[key] ? 'translateX(18px)' : 'none', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            {editError && (
              <p style={{ color: '#F97316', fontSize: 'var(--fs-sm)', marginTop: 8, marginBottom: 0, padding: '8px 12px', background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)', borderRadius: 8 }}>
                {editError}
              </p>
            )}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button onClick={() => { setEditGuest(null); setEditError('') }} style={{ padding: '10px 18px', background: 'var(--guest-surface-2)', border: '1px solid var(--guest-border)', borderRadius: 12, color: 'var(--text-muted)', fontSize: 'var(--fs-base)', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={saveEdit} disabled={editSaving} style={{ padding: '10px 18px', background: 'var(--brand-blue)', border: 'none', borderRadius: 12, color: '#FFFFFF', fontSize: 'var(--fs-base)', fontWeight: 700, cursor: editSaving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, opacity: editSaving ? 0.6 : 1 }}>
                {editSaving ? 'Saving…' : <><Check size={14} /> Save Changes</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteGuest && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
          <div style={{ background: 'var(--surface-card)', border: '1px solid var(--guest-border)', borderRadius: 20, padding: '28px 24px', width: '100%', maxWidth: 380, textAlign: 'center' }}>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Trash2 size={22} color="#EF4444" />
            </div>
            <h3 style={{ color: 'var(--text-primary)', fontSize: 'var(--fs-lg)', fontWeight: 800, margin: '0 0 8px', fontFamily: 'var(--font-display)' }}>Delete Guest</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-base)', margin: '0 0 24px', lineHeight: 1.6 }}>
              Remove <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{deleteGuest.full_name}</span>? This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setDeleteGuest(null)} style={{ padding: '10px 20px', background: 'var(--guest-surface-2)', border: '1px solid var(--guest-border)', borderRadius: 12, color: 'var(--text-muted)', fontSize: 'var(--fs-base)', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={confirmDelete} disabled={deleting} style={{ padding: '10px 20px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 12, color: '#EF4444', fontSize: 'var(--fs-base)', fontWeight: 700, cursor: deleting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, opacity: deleting ? 0.6 : 1 }}>
                <Trash2 size={13} />{deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .guest-row:hover { background: var(--guest-surface-2) !important; }
        .guest-row:hover .guest-actions { opacity: 1 !important; }
      `}</style>
    </div>
  )
}
