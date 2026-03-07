'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, CalendarDays, MapPin, Users, Edit2, Trash2, X, Check, ChevronDown } from 'lucide-react'
import { format } from 'date-fns'
import clsx from 'clsx'
import Link from 'next/link'

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
  ticket_price: number | null
  budget: number | null
  registration_mode: string | null
  cover_image_url: string | null
  male_ratio: number | null
  female_ratio: number | null
}

const statusBadge: Record<string, string> = {
  draft: 'badge-gray',
  published: 'badge-green',
  cancelled: 'badge-red',
  completed: 'badge-blue',
}

export default function EventsClient({ initialEvents }: { initialEvents: Event[] }) {
  const supabase = createClient()
  const [events, setEvents] = useState<Event[]>(initialEvents)
  const [editEvent, setEditEvent] = useState<Event | null>(null)
  const [editForm, setEditForm] = useState({
    title: '', description: '', venue_name: '', venue_address: '',
    date_start: '', date_end: '', capacity: '', status: 'draft',
    ticket_price: '', budget: '', is_private: false, secret_venue: false,
  })
  const [editSaving, setEditSaving] = useState(false)
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
      ticket_price: String(event.ticket_price ?? ''),
      budget: String(event.budget ?? ''),
      is_private: event.is_private ?? false,
      secret_venue: event.secret_venue ?? false,
    })
  }

  const saveEdit = async () => {
    if (!editEvent) return
    setEditSaving(true)
    const { data } = await supabase.from('events').update({
      title: editForm.title,
      description: editForm.description || null,
      venue_name: editForm.venue_name || null,
      venue_address: editForm.venue_address || null,
      date_start: editForm.date_start || null,
      date_end: editForm.date_end || null,
      capacity: parseInt(editForm.capacity) || 0,
      status: editForm.status,
      ticket_price: parseFloat(editForm.ticket_price) || 0,
      budget: parseFloat(editForm.budget) || 0,
      is_private: editForm.is_private,
      secret_venue: editForm.secret_venue,
    }).eq('id', editEvent.id).select().single()
    if (data) setEvents(prev => prev.map(e => e.id === data.id ? data : e))
    setEditSaving(false)
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
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.5px' }}>Events</h2>
          <p className="text-gray-400 text-sm mt-1">{events.length} total events</p>
        </div>
        <Link href="/dashboard/events/new" className="btn-primary">
          <Plus className="w-4 h-4" /> New Event
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="card text-center py-16">
          <CalendarDays className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">No events yet</p>
          <p className="text-gray-600 text-sm mt-1 mb-5">Create your first event to get started</p>
          <Link href="/dashboard/events/new" className="btn-primary justify-center">
            <Plus className="w-4 h-4" /> Create Event
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {events.map((event) => (
            <div key={event.id} className="card-hover flex items-start justify-between group">
              <Link href={`/dashboard/events/${event.id}`} className="flex gap-4 flex-1 min-w-0">
                {event.cover_image_url ? (
                  <img src={event.cover_image_url} alt={event.title} className="w-16 h-16 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-brand-charcoal-light border border-white/5 flex items-center justify-center shrink-0">
                    <CalendarDays className="w-5 h-5 text-gray-500" />
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-semibold text-white">{event.title}</h3>
                    <span className={clsx(statusBadge[event.status])}>{event.status}</span>
                    {event.is_private && <span className="badge-yellow">Private</span>}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                    {event.date_start && (
                      <span className="flex items-center gap-1">
                        <CalendarDays className="w-3 h-3" />
                        {format(new Date(event.date_start), 'MMM d, yyyy · h:mm a')}
                      </span>
                    )}
                    {event.venue_name && !event.secret_venue && (
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{event.venue_name}</span>
                    )}
                    {event.secret_venue && (
                      <span className="flex items-center gap-1 text-brand-yellow"><MapPin className="w-3 h-3" />Secret Venue</span>
                    )}
                  </div>
                </div>
              </Link>
              <div className="flex items-center gap-3 shrink-0 ml-4">
                <div className="flex items-center gap-1 text-gray-500 text-xs">
                  <Users className="w-3 h-3" />
                  <span>{event.capacity}</span>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={(e) => { e.preventDefault(); openEdit(event) }}
                    className="p-1.5 text-gray-500 hover:text-white transition-colors rounded-md hover:bg-white/5">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={(e) => { e.preventDefault(); setDeleteEvent(event) }}
                    className="p-1.5 text-gray-500 hover:text-red-400 transition-colors rounded-md hover:bg-red-500/5">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Ticket Price (PKR)</label>
                  <input type="number" className="input" value={editForm.ticket_price} onChange={e => setEditForm(p => ({ ...p, ticket_price: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Budget (PKR)</label>
                  <input type="number" className="input" value={editForm.budget} onChange={e => setEditForm(p => ({ ...p, budget: e.target.value }))} />
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center justify-between flex-1 p-3 rounded-lg bg-brand-charcoal-light border border-white/5">
                  <p className="text-sm text-white">Private</p>
                  <button type="button" onClick={() => setEditForm(p => ({ ...p, is_private: !p.is_private }))}
                    className={`relative w-10 h-5 rounded-full transition-colors ${editForm.is_private ? 'bg-[#1E5EFF]' : 'bg-white/10'}`}>
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${editForm.is_private ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
                <div className="flex items-center justify-between flex-1 p-3 rounded-lg bg-brand-charcoal-light border border-white/5">
                  <p className="text-sm text-white">Secret Venue</p>
                  <button type="button" onClick={() => setEditForm(p => ({ ...p, secret_venue: !p.secret_venue }))}
                    className={`relative w-10 h-5 rounded-full transition-colors ${editForm.secret_venue ? 'bg-[#1E5EFF]' : 'bg-white/10'}`}>
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${editForm.secret_venue ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-5">
              <button onClick={() => setEditEvent(null)} className="btn-secondary">Cancel</button>
              <button onClick={saveEdit} disabled={editSaving || !editForm.title} className="btn-primary">
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