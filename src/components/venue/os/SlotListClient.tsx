'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Clock3, CheckCircle, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { deleteResource, confirmSlotBooking } from '@/app/actions/venueActions'

const C = { emerald: '#00D4AA', violet: '#7C3AED', surface: '#0A0F14', border: 'rgba(0,212,170,0.12)', muted: 'rgba(255,255,255,0.4)' }

const STATUS_CFG: Record<string, { label: string; color: string }> = {
  pending:   { label: 'Pending',   color: '#F6C90E'  },
  confirmed: { label: 'Confirmed', color: '#00D4AA'  },
  cancelled: { label: 'Cancelled', color: '#FC8181'  },
  completed: { label: 'Completed', color: 'rgba(255,255,255,0.35)' },
  no_show:   { label: 'No-Show',   color: '#CC00FF'  },
}

const DAYS_SHORT = ['','Mon','Tue','Wed','Thu','Fri','Sat','Sun']

type Resource = {
  id: string; name: string; resource_type: string; description: string | null;
  duration_unit_mins: number; price_per_slot: number; open_time: string; close_time: string;
  active_days: number[]; capacity: number; active: boolean
}
type Booking = {
  id: string; resource_id: string; date: string; start_time: string; end_time: string;
  status: string; total_price: number; guest_count: number; notes: string | null
}

export default function SlotListClient({
  resources: initial, upcomingBookings: initialBookings,
}: {
  resources: Resource[]
  upcomingBookings: Booking[]
}) {
  const [resources, setResources]   = useState(initial)
  const [bookings, setBookings]     = useState(initialBookings)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [activeTab, setActiveTab]   = useState<'resources' | 'bookings'>('resources')

  const handleDelete = async (id: string) => {
    await deleteResource(id)
    setResources(prev => prev.filter(r => r.id !== id))
    setConfirmDelete(null)
  }

  const handleConfirmBooking = async (id: string) => {
    await confirmSlotBooking(id)
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'confirmed' } : b))
  }

  const resourceMap = Object.fromEntries(resources.map(r => [r.id, r]))

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, margin: '0 0 4px', letterSpacing: '-0.5px' }}>Slot Booking</h1>
          <p style={{ color: C.muted, fontSize: 13, margin: 0 }}>
            {resources.filter(r => r.active).length} active resources · {bookings.filter(b => b.status === 'pending').length} pending bookings
          </p>
        </div>
        <Link href="/venue/os/slots/new" style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 16px', borderRadius: 12, background: C.emerald, color: '#050508', fontSize: 13, fontWeight: 800, textDecoration: 'none' }}>
          <Plus size={15} /> Add Resource
        </Link>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
        {(['resources', 'bookings'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '7px 16px', borderRadius: 20, fontSize: 13, fontWeight: activeTab === tab ? 700 : 500, background: activeTab === tab ? 'rgba(0,212,170,0.1)' : 'transparent', border: `1px solid ${activeTab === tab ? 'rgba(0,212,170,0.3)' : 'rgba(255,255,255,0.08)'}`, color: activeTab === tab ? C.emerald : C.muted, cursor: 'pointer', fontFamily: 'inherit', textTransform: 'capitalize' }}>
            {tab === 'resources' ? `Resources (${resources.length})` : `Upcoming Bookings (${bookings.length})`}
          </button>
        ))}
      </div>

      {activeTab === 'resources' && (
        <div>
          {resources.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <Clock3 size={40} color="rgba(255,255,255,0.1)" style={{ marginBottom: 16 }} />
              <p style={{ color: C.muted, fontSize: 14, margin: '0 0 20px' }}>No bookable resources yet. Add a court, studio, or space.</p>
              <Link href="/venue/os/slots/new" style={{ display: 'inline-block', padding: '10px 22px', borderRadius: 12, background: C.emerald, color: '#050508', fontSize: 13, fontWeight: 800, textDecoration: 'none' }}>
                + Add First Resource
              </Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
              {resources.map(r => (
                <div key={r.id} style={{ background: C.surface, border: `1px solid ${r.active ? C.border : 'rgba(255,255,255,0.06)'}`, borderRadius: 16, padding: 20, opacity: r.active ? 1 : 0.6, position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                      <p style={{ fontSize: 15, fontWeight: 800, margin: '0 0 4px', color: '#fff' }}>{r.name}</p>
                      <span style={{ fontSize: 11, color: C.violet, background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 20, padding: '1px 8px', fontWeight: 600 }}>
                        {r.resource_type}
                      </span>
                    </div>
                    <button
                      onClick={() => setConfirmDelete(r.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(252,129,129,0.5)', padding: 4 }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12, color: C.muted }}>Rate</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: C.emerald }}>PKR {r.price_per_slot.toLocaleString('en-PK')} / {r.duration_unit_mins}min</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12, color: C.muted }}>Hours</span>
                      <span style={{ fontSize: 12, color: '#fff' }}>{r.open_time.slice(0,5)} – {r.close_time.slice(0,5)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12, color: C.muted }}>Capacity</span>
                      <span style={{ fontSize: 12, color: '#fff' }}>{r.capacity} pax</span>
                    </div>
                    <div style={{ marginTop: 4 }}>
                      <span style={{ fontSize: 11, color: C.muted }}>
                        {r.active_days.sort().map(d => DAYS_SHORT[d]).join(' · ')}
                      </span>
                    </div>
                  </div>

                  {/* Delete confirmation overlay */}
                  {confirmDelete === r.id && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,15,20,0.95)', borderRadius: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 20 }}>
                      <p style={{ color: '#fff', fontSize: 13, fontWeight: 600, textAlign: 'center' }}>Deactivate "{r.name}"?</p>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => setConfirmDelete(null)} style={{ padding: '7px 16px', borderRadius: 8, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', color: C.muted, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                        <button onClick={() => handleDelete(r.id)} style={{ padding: '7px 16px', borderRadius: 8, background: 'rgba(252,129,129,0.15)', border: '1px solid rgba(252,129,129,0.3)', color: '#FC8181', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Deactivate</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'bookings' && (
        <div>
          {bookings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <CheckCircle size={40} color="rgba(255,255,255,0.1)" style={{ marginBottom: 16 }} />
              <p style={{ color: C.muted, fontSize: 14 }}>No upcoming bookings.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {bookings.map(b => {
                const sc = STATUS_CFG[b.status] ?? STATUS_CFG.pending
                const resource = resourceMap[b.resource_id]
                return (
                  <div key={b.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: '16px 20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 700, margin: '0 0 4px', color: '#fff' }}>
                          {resource?.name ?? 'Resource'}
                        </p>
                        <p style={{ fontSize: 12, color: C.muted, margin: '0 0 6px' }}>
                          {format(new Date(b.date), 'EEEE, MMM d')} · {b.start_time.slice(0,5)} – {b.end_time.slice(0,5)} · {b.guest_count} guest{b.guest_count !== 1 ? 's' : ''}
                        </p>
                        {b.notes && <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', margin: 0, fontStyle: 'italic' }}>{b.notes}</p>}
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <p style={{ fontSize: 15, fontWeight: 800, margin: '0 0 6px', color: '#fff' }}>PKR {b.total_price.toLocaleString('en-PK')}</p>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: sc.color, background: `${sc.color}15`, border: `1px solid ${sc.color}30`, borderRadius: 20, padding: '2px 8px' }}>{sc.label}</span>
                          {b.status === 'pending' && (
                            <button onClick={() => handleConfirmBooking(b.id)} style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 8, background: 'rgba(0,212,170,0.1)', border: '1px solid rgba(0,212,170,0.25)', color: C.emerald, cursor: 'pointer', fontFamily: 'inherit' }}>
                              Confirm
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
