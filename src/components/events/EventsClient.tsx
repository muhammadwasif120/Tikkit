'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, CalendarDays, MapPin, Users, Edit2, Trash2, X, Check, ChevronDown, Lock, Eye, ChevronRight } from 'lucide-react'
import { getEffectiveStatus } from '@/lib/eventStatus'
import { format } from 'date-fns'
import Link from 'next/link'

const getGrad = (id: string) => `var(--event-gradient-${id.charCodeAt(0) % 8})`

const STATUS_CONFIG: Record<string, { bg: string; color: string; border: string; label: string }> = {
  published: { bg: 'rgba(34,197,94,0.1)',   color: '#22C55E', border: 'rgba(34,197,94,0.25)',  label: 'LIVE'     },
  completed: { bg: 'rgba(75,85,99,0.1)',    color: 'var(--text-muted)', border: 'rgba(75,85,99,0.2)',    label: 'ENDED'    },
  archived:  { bg: 'rgba(75,85,99,0.06)',   color: 'var(--text-muted)', border: 'rgba(75,85,99,0.12)',   label: 'ARCHIVED' },
  draft:     { bg: 'rgba(250,204,21,0.1)',  color: '#FACC15', border: 'rgba(250,204,21,0.2)',  label: 'DRAFT'    },
  cancelled: { bg: 'rgba(239,68,68,0.1)',   color: '#EF4444', border: 'rgba(239,68,68,0.2)',   label: 'CANCELLED'},
}

/* ─── Toggle ─── */
function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle}
      style={{ background: on ? 'var(--brand-blue)' : 'var(--guest-surface-2)', border: '1px solid var(--guest-border)' }}
      className="relative w-10 h-5 rounded-full transition-colors shrink-0">
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-5' : ''}`} />
    </button>
  )
}

type Event = {
  id: string
  title: string
  description: string | null
  status: string
  date_start: string | null
  date_end: string | null
  venue_name: string | null
  venue_address: string | null
  capacity: number
  is_private: boolean | null
  secret_venue: boolean | null
  budget: number | null
  registration_mode: string | null
  cover_image_url: string | null
  male_ratio: number | null
  female_ratio: number | null
}


export default function EventsClient({
  initialEvents,
  pendingCounts = {},
}: {
  initialEvents: Event[]
  pendingCounts?: Record<string, number>
}) {
  const supabase = createClient()
  const [events, setEvents] = useState<Event[]>(initialEvents)
  const [editEvent, setEditEvent] = useState<Event | null>(null)
  const [editForm, setEditForm] = useState({
    title: '', description: '', venue_name: '', venue_address: '',
    date_start: '', date_end: '', capacity: '', status: 'draft',
    budget: '', is_private: false, secret_venue: false,
  })
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState('')
  const [deleteEvent, setDeleteEvent] = useState<Event | null>(null)
  const [deleting, setDeleting] = useState(false)

  const openEdit = (event: Event) => {
    setEditEvent(event)
    setEditForm({
      title: event.title,
      description: event.description ?? '',
      venue_name: event.venue_name ?? '',
      venue_address: event.venue_address ?? '',
      date_start: event.date_start ? event.date_start.slice(0, 16) : '',
      date_end: event.date_end ? event.date_end.slice(0, 16) : '',
      capacity: String(event.capacity),
      status: event.status,
      budget: String(event.budget ?? ''),
      is_private: event.is_private ?? false,
      secret_venue: event.secret_venue ?? false,
    })
  }

  const saveEdit = async () => {
    if (!editEvent) return
    if (!editForm.title.trim()) {
      setEditError('Please fill in the event title. You can add more details later.')
      return
    }
    setEditError('')
    setEditSaving(true)
    const { data, error } = await supabase.from('events').update({
      title: editForm.title,
      description: editForm.description || null,
      venue_name: editForm.venue_name || null,
      venue_address: editForm.venue_address || null,
      date_start: editForm.date_start || undefined,
      date_end: editForm.date_end || undefined,
      capacity: parseInt(editForm.capacity) || 0,
      status: editForm.status,
      budget: parseFloat(editForm.budget) || 0,
      is_private: editForm.is_private,
      secret_venue: editForm.secret_venue,
    }).eq('id', editEvent.id).select().single()
    setEditSaving(false)
    if (error || !data) {
      setEditError('Something went wrong. Please try again.')
      return
    }
    setEvents(prev => prev.map(e => e.id === data.id ? data : e))
    setEditEvent(null)
  }

  const confirmDelete = async () => {
    if (!deleteEvent) return
    setDeleting(true)
    await supabase.from('events').delete().eq('id', deleteEvent.id)
    setEvents(prev => prev.filter(e => e.id !== deleteEvent.id))
    setDeleting(false)
    setDeleteEvent(null)
  }

  return (
    <div className="space-y-5 max-w-5xl">

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 14, flexShrink: 0,
            background: 'rgba(30,94,255,0.12)', border: '1px solid rgba(30,94,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <CalendarDays size={20} color="#1E5EFF" />
          </div>
          <div>
            <h1 style={{ color: 'var(--text-primary)', fontSize: 'var(--fs-2xl)', fontWeight: 800, margin: '0 0 2px', fontFamily: 'var(--font-display)', letterSpacing: '-0.5px' }}>
              Events
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-sm)', margin: 0 }}>
              {events.length} total event{events.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <Link href="/dashboard/events/new" className="btn-primary shrink-0">
          <Plus className="w-4 h-4" /> <span className="hidden sm:inline">New </span>Event
        </Link>
      </div>

      {events.length === 0 ? (
        <div style={{ background: 'var(--surface-card)', border: '1px solid var(--guest-border)', borderRadius: 18, padding: '64px 24px', textAlign: 'center' }}>
          <CalendarDays size={40} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--text-primary)', fontWeight: 600, margin: '0 0 4px', fontFamily: 'var(--font-display)' }}>No events yet</p>
          <p style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-sm)', margin: '0 0 20px' }}>Create your first event to get started</p>
          <Link href="/dashboard/events/new" className="btn-primary" style={{ display: 'inline-flex' }}>
            <Plus className="w-4 h-4" /> Create Event
          </Link>
        </div>
      ) : (() => {
        const activeEvents   = events.filter(e => { const s = getEffectiveStatus(e as any); return s !== 'completed' && s !== 'archived' && s !== 'cancelled' })
        const archivedEvents = events.filter(e => { const s = getEffectiveStatus(e as any); return s === 'completed' || s === 'archived' || s === 'cancelled' })

        const renderCard = (event: Event, isArchived: boolean) => {
          const effStatus = getEffectiveStatus(event as any)
          const st = STATUS_CONFIG[effStatus] ?? STATUS_CONFIG.draft
          const isLive = effStatus === 'published'
          const pending = pendingCounts[event.id] ?? 0

          return (
            <div key={event.id} className="group" style={{ opacity: isArchived ? 0.65 : 1 }}>
              <Link href={`/dashboard/events/${event.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                <div style={{
                  background: 'var(--surface-card)',
                  border: `1px solid ${isLive ? 'rgba(34,197,94,0.2)' : 'var(--guest-border)'}`,
                  borderRadius: 18, overflow: 'hidden',
                  boxShadow: isLive ? '0 4px 24px rgba(34,197,94,0.06)' : 'none',
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px' }}>

                    {/* Thumbnail */}
                    <div style={{
                      width: 72, height: 72, borderRadius: 12, flexShrink: 0, overflow: 'hidden',
                      background: event.cover_image_url ? `url(${event.cover_image_url}) center/cover` : getGrad(event.id),
                      position: 'relative',
                    }}>
                      {isLive && (
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(34,197,94,0.25), transparent)' }} />
                      )}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        color: 'var(--text-primary)', fontSize: 'var(--fs-md)', fontWeight: 800, margin: '0 0 6px',
                        fontFamily: 'var(--font-display)', letterSpacing: '-0.2px',
                      }}>
                        {event.title}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        {/* Status pill */}
                        <span style={{
                          padding: '2px 8px', borderRadius: 100, fontSize: 'var(--fs-2xs)', fontWeight: 800,
                          letterSpacing: '0.07em', flexShrink: 0,
                          background: st.bg, color: st.color, border: `1px solid ${st.border}`,
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                        }}>
                          {isLive && <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#22C55E', animation: 'pulse 2s infinite', display: 'inline-block' }} />}
                          {st.label}
                        </span>
                        {/* Private badge */}
                        {event.is_private && (
                          <span style={{ padding: '2px 8px', borderRadius: 100, fontSize: 'var(--fs-2xs)', fontWeight: 700, background: 'rgba(255,199,69,0.1)', color: '#FFC745', border: '1px solid rgba(255,199,69,0.2)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <Lock size={9} /> Private
                          </span>
                        )}
                        {/* Pending badge */}
                        {pending > 0 && (
                          <span style={{ padding: '2px 8px', borderRadius: 100, fontSize: 'var(--fs-2xs)', fontWeight: 700, background: 'rgba(249,115,22,0.1)', color: '#F97316', border: '1px solid rgba(249,115,22,0.2)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#F97316', animation: 'pulse 2s infinite', display: 'inline-block' }} />
                            {pending} pending
                          </span>
                        )}
                        {/* Date */}
                        {event.date_start && (
                          <span style={{ display: 'flex', alignItems: 'flex-start', gap: 4, color: 'var(--text-muted)', fontSize: 'var(--fs-xs)', fontWeight: 600 }}>
                            <CalendarDays size={10} color="#4B5563" style={{ marginTop: 2, flexShrink: 0 }} />
                            <span>
                              {format(new Date(event.date_start), 'MMM d, yyyy')}<br />
                              {format(new Date(event.date_start), 'h:mm a')}
                            </span>
                          </span>
                        )}
                        {/* Venue */}
                        {event.venue_name && !event.secret_venue && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)', fontSize: 'var(--fs-xs)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>
                            <MapPin size={10} color="#4B5563" />{event.venue_name}
                          </span>
                        )}
                        {event.secret_venue && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#FFC745', fontSize: 'var(--fs-xs)', fontWeight: 600 }}>
                            <MapPin size={10} color="#FFC745" />Secret Venue
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right side — capacity + edit/delete + arrow */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      {/* Capacity */}
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)', fontSize: 'var(--fs-xs)', fontWeight: 600 }}>
                        <Users size={11} color="#4B5563" />{event.capacity}
                      </span>
                      {/* Edit / Delete (hidden on mobile, hover on desktop) */}
                      {!isArchived && (
                        <div className="sm:opacity-0 sm:group-hover:opacity-100 transition-opacity" style={{ display: 'flex', gap: 4 }}>
                          <button
                            onClick={(e) => { e.preventDefault(); openEdit(event) }}
                            style={{ background: 'var(--guest-surface-2)', border: '1px solid var(--guest-border)', color: 'var(--text-muted)', cursor: 'pointer', width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            onClick={(e) => { e.preventDefault(); setDeleteEvent(event) }}
                            style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', color: '#EF4444', cursor: 'pointer', width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )}
                      {/* Arrow */}
                      <div style={{
                        width: 30, height: 30, borderRadius: 10,
                        background: 'rgba(30,94,255,0.08)', border: '1px solid rgba(30,94,255,0.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <ChevronRight size={15} color="#1E5EFF" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          )
        }

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {activeEvents.map(e => renderCard(e, false))}

            {archivedEvents.length > 0 && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '8px 0 2px' }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-xs)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0, fontFamily: 'var(--font-display)', whiteSpace: 'nowrap' }}>Archived</p>
                  <div style={{ flex: 1, height: 1, background: 'var(--guest-border)' }} />
                  <span style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-xs)' }}>{archivedEvents.length}</span>
                </div>
                {archivedEvents.map(e => renderCard(e, true))}
              </>
            )}
          </div>
        )
      })()}

      {/* EDIT MODAL */}
      {editEvent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-white" style={{ fontFamily: 'var(--font-display)' }}>Edit Event</h3>
              <button onClick={() => setEditEvent(null)} className="text-gray-500 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="label">Title *</label>
                <input type="text" className="input" value={editForm.title} onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))} />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea className="input resize-none min-h-16" value={editForm.description} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Start Date & Time</label>
                  <input type="datetime-local" className="input" value={editForm.date_start} onChange={e => setEditForm(p => ({ ...p, date_start: e.target.value }))} />
                </div>
                <div>
                  <label className="label">End Date & Time</label>
                  <input type="datetime-local" className="input" value={editForm.date_end} onChange={e => setEditForm(p => ({ ...p, date_end: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="label">Venue Name</label>
                <input type="text" className="input" value={editForm.venue_name} onChange={e => setEditForm(p => ({ ...p, venue_name: e.target.value }))} />
              </div>
              <div>
                <label className="label">Venue Address</label>
                <input type="text" className="input" value={editForm.venue_address} onChange={e => setEditForm(p => ({ ...p, venue_address: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Capacity</label>
                  <input type="number" className="input" value={editForm.capacity} onChange={e => setEditForm(p => ({ ...p, capacity: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Status</label>
                  <div className="relative">
                    <select className="input appearance-none pr-10" value={editForm.status} onChange={e => setEditForm(p => ({ ...p, status: e.target.value }))}>
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>
              <div>
                <label className="label">Budget (PKR)</label>
                <input type="number" className="input" value={editForm.budget} onChange={e => setEditForm(p => ({ ...p, budget: e.target.value }))} />
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#FFC745]/5 border border-[#FFC745]/15 text-xs text-gray-400">
                <span className="text-[#FFC745]">🎫</span>
                Ticket tiers are managed in the event detail page
              </div>

              <div className="space-y-2">
                <div className="flex flex-col p-3 rounded-lg bg-brand-charcoal-light border border-white/5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white flex items-center gap-2">
                        <Lock className="w-3.5 h-3.5 text-gray-400" /> Private Event
                      </p>
                      <p className="text-xs text-gray-500">Only invited guests can see this event</p>
                    </div>
                    <Toggle
                      on={editForm.is_private}
                      onToggle={() => setEditForm(p => ({ ...p, is_private: !p.is_private }))}
                    />
                  </div>
                  {editForm.is_private && (
                    <div className="text-[11px] text-[#FFC745] bg-[#FFC745]/10 px-2.5 py-1.5 rounded border border-[#FFC745]/20 mt-3 leading-relaxed">
                      Attendees must have a Tikkit X account to receive their private QR pass. Nothing is shared off-platform to protect your privacy.
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-brand-charcoal-light border border-white/5">
                  <div>
                    <p className="text-sm font-medium text-white flex items-center gap-2">
                      <Eye className="w-3.5 h-3.5 text-gray-400" /> Secret Venue
                    </p>
                    <p className="text-xs text-gray-500">Hide address until guests are confirmed</p>
                  </div>
                  <Toggle
                    on={editForm.secret_venue}
                    onToggle={() => setEditForm(p => ({ ...p, secret_venue: !p.secret_venue }))}
                  />
                </div>
              </div>
            </div>

            {editError && (
              <p style={{ color: '#F97316', fontSize: 'var(--fs-sm)', marginTop: 10, marginBottom: 0, padding: '8px 12px', background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)', borderRadius: 8 }}>
                {editError}
              </p>
            )}
            <div className="flex gap-3 justify-end mt-5">
              <button onClick={() => { setEditEvent(null); setEditError('') }} className="btn-secondary">Cancel</button>
              <button onClick={saveEdit} disabled={editSaving} className="btn-primary">
                {editSaving ? 'Saving...' : <><Check className="w-4 h-4" /> Save Changes</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM */}
      {deleteEvent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="card w-full max-w-sm animate-slide-up text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-5 h-5 text-red-400" />
            </div>
            <h3 className="font-semibold text-white mb-1" style={{ fontFamily: 'var(--font-display)' }}>Delete Event</h3>
            <p className="text-gray-400 text-sm mb-5">
              Are you sure you want to delete <span className="text-white font-medium">{deleteEvent.title}</span>? All guests and data will be permanently removed.
            </p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setDeleteEvent(null)} className="btn-secondary">Cancel</button>
              <button onClick={confirmDelete} disabled={deleting}
                className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 text-sm font-medium flex items-center gap-2 transition-all">
                <Trash2 className="w-4 h-4" />{deleting ? 'Deleting...' : 'Delete Event'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}