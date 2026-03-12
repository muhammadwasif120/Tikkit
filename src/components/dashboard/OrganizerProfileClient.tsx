'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Check, Edit3, X, Loader2,
  CalendarDays, Users, MapPin, TrendingUp, UserCheck, Settings,
} from 'lucide-react'
import { format } from 'date-fns'
import clsx from 'clsx'
import Link from 'next/link'

/* ─── Types ──────────────────────────────────────────────────────── */
export type OrgProfile = {
  id: string
  full_name: string | null
  email: string
  avatar_url: string | null
  phone_number: string | null
  company_name: string | null
}

export type EventWithStats = {
  id: string
  title: string
  date_start: string
  cover_image_url: string | null
  venue_name: string | null
  capacity: number
  status: string
  guest_count: number
  checked_in_count: number
}

/* ─── Helpers ─────────────────────────────────────────────────────── */
const statusBadge: Record<string, string> = {
  draft:     'badge-gray',
  published: 'badge-green',
  cancelled: 'badge-red',
  completed: 'badge-blue',
}

const COVER_GRADIENTS = [
  'linear-gradient(135deg, #0a0f2e 0%, #1a2a6c 50%, #1E5EFF 100%)',
  'linear-gradient(135deg, #0d001a 0%, #2d0050 50%, #7c3aed 100%)',
  'linear-gradient(135deg, #001233 0%, #023e8a 50%, #0077b6 100%)',
  'linear-gradient(135deg, #0f2027 0%, #2c5364 50%, #203a43 100%)',
  'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
]
function getGradient(id: string) { return COVER_GRADIENTS[id.charCodeAt(0) % COVER_GRADIENTS.length] }

function getCardGradient(id: string) {
  const CARD_GRADIENTS = [
    'linear-gradient(135deg, #0F2027 0%, #203A43 50%, #2C5364 100%)',
    'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    'linear-gradient(135deg, #200122 0%, #6f0000 100%)',
    'linear-gradient(135deg, #1f0033 0%, #2d0050 100%)',
    'linear-gradient(135deg, #001233 0%, #023e8a 100%)',
  ]
  return CARD_GRADIENTS[id.charCodeAt(0) % CARD_GRADIENTS.length]
}

/* ─── Inline Name Editor ─────────────────────────────────────────── */
function NameEditor({ profileId, initial }: { profileId: string; initial: string | null }) {
  const supabase = createClient()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft]     = useState(initial ?? '')
  const [name, setName]       = useState(initial ?? '')
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)

  const save = async () => {
    if (!draft.trim()) return
    setSaving(true)
    await supabase.from('profiles').update({ full_name: draft.trim() }).eq('id', profileId)
    setName(draft.trim())
    setSaved(true); setSaving(false); setEditing(false)
    setTimeout(() => setSaved(false), 3000)
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <input
          className="input text-sm py-1.5 flex-1"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') save() }}
          autoFocus
        />
        <button onClick={save} disabled={saving || !draft.trim()}
          className="flex items-center gap-1 text-xs font-semibold text-white bg-[#1E5EFF] hover:bg-[#1448CC] disabled:opacity-50 rounded-lg px-3 py-1.5 transition-colors shrink-0">
          {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
        </button>
        <button onClick={() => { setEditing(false); setDraft(name) }}
          className="p-1.5 text-gray-500 hover:text-white transition-colors shrink-0">
          <X size={14} />
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
        {name || 'Organizer'}
      </h3>
      <button onClick={() => setEditing(true)} className="text-gray-600 hover:text-gray-400 transition-colors">
        <Edit3 size={13} />
      </button>
      {saved && <span className="flex items-center gap-1 text-xs text-[#10B981]"><Check size={11} /> Saved</span>}
    </div>
  )
}

/* ─── Event Stat Card ────────────────────────────────────────────── */
function EventStatCard({ event }: { event: EventWithStats }) {
  const fillPct    = event.capacity > 0 ? Math.min(100, (event.guest_count      / event.capacity)   * 100) : 0
  const checkinPct = event.guest_count > 0 ? Math.min(100, (event.checked_in_count / event.guest_count) * 100) : 0

  return (
    <Link href={`/dashboard/events/${event.id}`} className="card-hover flex gap-4 items-start group">
      {/* Thumbnail */}
      <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0" style={{ background: getCardGradient(event.id) }}>
        {event.cover_image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={event.cover_image_url} alt="" className="w-full h-full object-cover" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h4 className="text-sm font-semibold text-white group-hover:text-[#1E5EFF] transition-colors leading-tight truncate">
            {event.title}
          </h4>
          <span className={clsx(statusBadge[event.status] ?? 'badge-gray', 'shrink-0')}>{event.status}</span>
        </div>

        <div className="flex items-center gap-4 text-xs text-gray-500 mb-3 flex-wrap">
          <span className="flex items-center gap-1">
            <CalendarDays className="w-3 h-3" />
            {format(new Date(event.date_start), 'MMM d, yyyy')}
          </span>
          {event.venue_name && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {event.venue_name}
            </span>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-2">
          <div className="text-center">
            <p className="text-base font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>{event.guest_count}</p>
            <p className="text-[10px] text-gray-500">Registered</p>
          </div>
          <div className="text-center">
            <p className="text-base font-bold text-[#10B981]" style={{ fontFamily: 'var(--font-display)' }}>{event.checked_in_count}</p>
            <p className="text-[10px] text-gray-500">Attended</p>
          </div>
          <div className="text-center">
            <p className="text-base font-bold text-[#FFC745]" style={{ fontFamily: 'var(--font-display)' }}>{event.capacity}</p>
            <p className="text-[10px] text-gray-500">Capacity</p>
          </div>
        </div>

        {/* Fill bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-gray-600">
            <span>Capacity fill</span>
            <span>{Math.round(fillPct)}%</span>
          </div>
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-[#1E5EFF] rounded-full" style={{ width: `${fillPct}%` }} />
          </div>
          {event.status === 'completed' && event.guest_count > 0 && (
            <>
              <div className="flex justify-between text-[10px] text-gray-600">
                <span>Check-in rate</span>
                <span className="text-[#10B981]">{Math.round(checkinPct)}%</span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-[#10B981] rounded-full" style={{ width: `${checkinPct}%` }} />
              </div>
            </>
          )}
        </div>
      </div>
    </Link>
  )
}

/* ─── Main Component ─────────────────────────────────────────────── */
export default function OrganizerProfileClient({
  profile,
  events,
}: {
  profile: OrgProfile
  events: EventWithStats[]
}) {
  const [showArchived, setShowArchived] = useState(false)

  const activeEvents   = events.filter(e => e.status !== 'completed' && e.status !== 'cancelled')
  const archivedEvents = events.filter(e => e.status === 'completed'  || e.status === 'cancelled')

  const totalGuests   = events.reduce((s, e) => s + e.guest_count, 0)
  const totalAttended = events.reduce((s, e) => s + e.checked_in_count, 0)
  const avgFill = events.length > 0
    ? Math.round(events.reduce((s, e) => s + (e.capacity > 0 ? (e.guest_count / e.capacity) * 100 : 0), 0) / events.length)
    : 0

  const initials = (profile.full_name || 'O').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="max-w-3xl space-y-6">

      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.5px' }}>
            Organizer Profile
          </h2>
          <p className="text-gray-400 text-sm mt-1">Your public identity and event portfolio</p>
        </div>
        <Link href="/dashboard/settings"
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white border border-white/10 hover:border-white/25 rounded-lg px-3 py-1.5 transition-all">
          <Settings size={13} /> Edit Details
        </Link>
      </div>

      {/* Profile hero card */}
      <div className="card overflow-hidden p-0">
        {/* Gradient banner */}
        <div
          className="relative w-full"
          style={{ height: 100, background: getGradient(profile.id) }}
        >
          {/* Subtle grid overlay */}
          <div className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />
          {/* Bottom fade */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#111420] to-transparent" />
        </div>

        {/* Identity row — avatar overlapping banner */}
        <div className="px-5 pb-5" style={{ marginTop: -28 }}>
          <div className="flex items-end gap-4 mb-3">
            {/* Avatar */}
            <div
              className="w-14 h-14 rounded-xl border-2 border-[#111420] flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg, rgba(30,94,255,0.3), rgba(30,94,255,0.1))' }}
            >
              <span className="text-xl font-black text-[#1E5EFF]" style={{ fontFamily: 'var(--font-display)' }}>
                {initials}
              </span>
            </div>
          </div>

          <NameEditor profileId={profile.id} initial={profile.full_name} />

          <div className="mt-1 space-y-0.5">
            <p className="text-xs text-gray-500">{profile.email}</p>
            {profile.company_name && (
              <p className="text-xs text-gray-400">{profile.company_name}</p>
            )}
            {profile.phone_number && (
              <p className="text-xs text-gray-600">{profile.phone_number}</p>
            )}
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Events',     value: events.length,  color: '#1E5EFF', icon: <CalendarDays className="w-4 h-4" /> },
          { label: 'Total Registered', value: totalGuests,    color: '#A855F7', icon: <Users className="w-4 h-4" /> },
          { label: 'Total Attended',   value: totalAttended,  color: '#10B981', icon: <UserCheck className="w-4 h-4" /> },
          { label: 'Avg Fill Rate',    value: `${avgFill}%`,  color: '#FFC745', icon: <TrendingUp className="w-4 h-4" /> },
        ].map(s => (
          <div key={s.label} className="card text-center py-4">
            <div className="flex items-center justify-center mb-1" style={{ color: s.color }}>{s.icon}</div>
            <p className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Active Events */}
      {activeEvents.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-white" style={{ fontFamily: 'var(--font-display)' }}>
            Active Events
          </h3>
          <div className="grid gap-3">
            {activeEvents.map(ev => <EventStatCard key={ev.id} event={ev} />)}
          </div>
        </div>
      )}

      {/* Archived Events (collapsible) */}
      {archivedEvents.length > 0 && (
        <div className="space-y-3">
          <button
            onClick={() => setShowArchived(v => !v)}
            className="flex items-center gap-3 w-full"
          >
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Archived Events</p>
            <div className="flex-1 h-px bg-white/5" />
            <span className="text-xs text-gray-600">{archivedEvents.length}</span>
            <span className={clsx('text-xs text-gray-500 transition-transform inline-block', showArchived && 'rotate-180')}>▾</span>
          </button>

          {showArchived && (
            <div className="grid gap-3 opacity-70">
              {archivedEvents.map(ev => <EventStatCard key={ev.id} event={ev} />)}
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {events.length === 0 && (
        <div className="card text-center py-12">
          <CalendarDays className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">No events yet</p>
          <p className="text-gray-600 text-sm mt-1">Create your first event to build your portfolio</p>
          <Link href="/dashboard/events/new" className="btn-primary mt-4 inline-flex mx-auto">
            Create Event
          </Link>
        </div>
      )}

    </div>
  )
}
