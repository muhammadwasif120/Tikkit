'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  ImagePlus, X, Loader2, Check, Edit3, Pencil,
  CalendarDays, Users, MapPin, TrendingUp, UserCheck,
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
  cover_image_url: string | null
  bio: string | null
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

const GRADIENTS = [
  'linear-gradient(135deg, #0F2027 0%, #203A43 50%, #2C5364 100%)',
  'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
  'linear-gradient(135deg, #200122 0%, #6f0000 100%)',
  'linear-gradient(135deg, #1f0033 0%, #0d001a 50%, #2d0050 100%)',
  'linear-gradient(135deg, #001233 0%, #001845 50%, #023e8a 100%)',
]
function getGradient(id: string) { return GRADIENTS[id.charCodeAt(0) % GRADIENTS.length] }

/* ─── Cover Image Uploader ───────────────────────────────────────── */
function CoverUploader({ profileId, coverUrl, onUpdate }: {
  profileId: string
  coverUrl: string | null
  onUpdate: (url: string | null) => void
}) {
  const supabase = createClient()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const fallbackGrad = GRADIENTS[profileId.charCodeAt(0) % GRADIENTS.length]

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    if (file.size > 10 * 1024 * 1024) { setError('Image must be under 10 MB'); return }

    setUploading(true)
    try {
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `organizer-covers/${profileId}/cover.${ext}`
      const { error: uploadErr } = await supabase.storage
        .from('tikkit-uploads')
        .upload(path, file, { upsert: true, contentType: file.type })
      if (uploadErr) throw new Error(uploadErr.message)

      const { data: { publicUrl } } = supabase.storage.from('tikkit-uploads').getPublicUrl(path)
      const finalUrl = `${publicUrl}?t=${Date.now()}`
      await supabase.from('profiles').update({ cover_image_url: finalUrl } as never).eq('id', profileId)
      onUpdate(finalUrl)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const removeCover = async () => {
    setUploading(true)
    await supabase.from('profiles').update({ cover_image_url: null } as never).eq('id', profileId)
    onUpdate(null)
    setUploading(false)
  }

  return (
    <div className="relative w-full overflow-hidden rounded-t-2xl" style={{ aspectRatio: '16/5', minHeight: 120 }}>
      {coverUrl
        ? <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={coverUrl} alt="cover" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          </>
        : <div className="absolute inset-0" style={{ background: fallbackGrad }} />
      }

      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      <div className="absolute bottom-3 right-3 flex gap-2">
        {uploading
          ? <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-black/50 border border-white/20 backdrop-blur-sm">
              <Loader2 size={12} className="animate-spin" /> Uploading…
            </div>
          : <>
              <button onClick={() => inputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-black/50 border border-white/20 backdrop-blur-sm hover:bg-black/70 transition-all">
                <ImagePlus size={13} /> {coverUrl ? 'Change Cover' : 'Add Cover'}
              </button>
              {coverUrl && (
                <button onClick={removeCover}
                  className="flex items-center justify-center w-7 h-7 rounded-lg bg-black/50 border border-white/20 text-gray-300 hover:text-red-400 transition-colors backdrop-blur-sm">
                  <X size={13} />
                </button>
              )}
            </>
        }
      </div>
      {error && (
        <div className="absolute top-3 left-3 right-3 text-xs text-red-300 bg-red-900/60 border border-red-500/30 rounded-lg px-3 py-2 backdrop-blur-sm">
          {error}
        </div>
      )}
    </div>
  )
}

/* ─── Bio Editor ─────────────────────────────────────────────────── */
function BioEditor({ profileId, initial, onUpdate }: {
  profileId: string
  initial: string | null
  onUpdate: (bio: string | null) => void
}) {
  const supabase = createClient()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(initial ?? '')
  const [bio, setBio] = useState(initial ?? '')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const save = async () => {
    setSaving(true); setErr(null)
    const { error } = await supabase.from('profiles').update({ bio: draft || null } as never).eq('id', profileId)
    if (error) { setErr(error.message) }
    else { setBio(draft); onUpdate(draft || null); setEditing(false) }
    setSaving(false)
  }

  return (
    <div className="px-5 py-4 space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Bio</h3>
        {!editing && (
          <button onClick={() => { setDraft(bio); setEditing(true) }}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors">
            <Pencil size={12} /> {bio ? 'Edit' : 'Add bio'}
          </button>
        )}
      </div>
      {editing ? (
        <div className="space-y-2">
          <textarea
            className="input min-h-[80px] resize-none w-full text-sm"
            placeholder="Tell guests about yourself, your event style, what to expect…"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            autoFocus
          />
          {err && <p className="text-xs text-red-400">{err}</p>}
          <div className="flex justify-end gap-2">
            <button onClick={() => setEditing(false)} className="flex items-center gap-1 text-xs text-gray-400 hover:text-white px-3 py-1.5">
              <X size={12} /> Cancel
            </button>
            <button onClick={save} disabled={saving}
              className="flex items-center gap-1.5 text-xs font-semibold text-white bg-[#1E5EFF] hover:bg-[#1448CC] disabled:opacity-50 rounded-lg px-3 py-1.5 transition-colors">
              {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      ) : bio ? (
        <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{bio}</p>
      ) : (
        <button onClick={() => { setDraft(''); setEditing(true) }}
          className="w-full py-3 rounded-xl border border-dashed border-white/10 hover:border-white/20 transition-all text-sm text-gray-500 hover:text-gray-400">
          + Add a bio
        </button>
      )}
    </div>
  )
}

/* ─── Name Editor ────────────────────────────────────────────────── */
function NameEditor({ profileId, initial }: { profileId: string; initial: string | null }) {
  const supabase = createClient()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(initial ?? '')
  const [name, setName] = useState(initial ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const save = async () => {
    if (!draft.trim()) return
    setSaving(true)
    await supabase.from('profiles').update({ full_name: draft.trim() }).eq('id', profileId)
    setName(draft.trim())
    setSaved(true)
    setSaving(false)
    setEditing(false)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="flex items-center gap-2 flex-1 min-w-0">
      {editing ? (
        <>
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
        </>
      ) : (
        <>
          <h3 className="text-lg font-bold text-white truncate" style={{ fontFamily: 'var(--font-display)' }}>
            {name || 'Organizer'}
          </h3>
          <button onClick={() => setEditing(true)} className="text-gray-600 hover:text-gray-400 transition-colors shrink-0">
            <Edit3 size={12} />
          </button>
          {saved && <span className="flex items-center gap-1 text-xs text-[#10B981] shrink-0"><Check size={12} /> Saved</span>}
        </>
      )}
    </div>
  )
}

/* ─── Event Stat Card ────────────────────────────────────────────── */
function EventStatCard({ event }: { event: EventWithStats }) {
  const fillPct = event.capacity > 0 ? Math.min(100, (event.guest_count / event.capacity) * 100) : 0
  const checkinPct = event.guest_count > 0 ? Math.min(100, (event.checked_in_count / event.guest_count) * 100) : 0

  return (
    <Link href={`/dashboard/events/${event.id}`} className="card-hover flex gap-4 items-start group">
      <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0" style={{ background: getGradient(event.id) }}>
        {event.cover_image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={event.cover_image_url} alt="" className="w-full h-full object-cover" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h4 className="text-sm font-semibold text-white group-hover:text-[#1E5EFF] transition-colors leading-tight truncate">{event.title}</h4>
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

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
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

        {/* Fill bars */}
        <div className="mt-2 space-y-1">
          <div className="flex justify-between text-[10px] text-gray-600">
            <span>Capacity fill</span>
            <span>{Math.round(fillPct)}%</span>
          </div>
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-[#1E5EFF] rounded-full transition-all" style={{ width: `${fillPct}%` }} />
          </div>
          {event.status === 'completed' && event.guest_count > 0 && (
            <>
              <div className="flex justify-between text-[10px] text-gray-600 mt-1">
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

/* ─── Main Client Component ──────────────────────────────────────── */
export default function OrganizerProfileClient({
  profile,
  events,
}: {
  profile: OrgProfile
  events: EventWithStats[]
}) {
  const [coverUrl, setCoverUrl] = useState(profile.cover_image_url)
  const [showArchived, setShowArchived] = useState(false)

  const activeEvents   = events.filter(e => e.status !== 'completed' && e.status !== 'cancelled')
  const archivedEvents = events.filter(e => e.status === 'completed' || e.status === 'cancelled')

  const totalGuests   = events.reduce((s, e) => s + e.guest_count, 0)
  const totalAttended = events.reduce((s, e) => s + e.checked_in_count, 0)
  const avgFill = events.length > 0
    ? Math.round(events.reduce((s, e) => s + (e.capacity > 0 ? (e.guest_count / e.capacity) * 100 : 0), 0) / events.length)
    : 0

  const initials = (profile.full_name || 'O').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.5px' }}>
            Organizer Profile
          </h2>
          <p className="text-gray-400 text-sm mt-1">Your public identity and event portfolio</p>
        </div>
        <Link href="/dashboard/settings"
          className="text-xs text-gray-500 hover:text-white border border-white/10 hover:border-white/20 rounded-lg px-3 py-1.5 transition-all">
          Edit Details
        </Link>
      </div>

      {/* Profile Card */}
      <div className="card overflow-hidden p-0">
        {/* Cover */}
        <CoverUploader
          profileId={profile.id}
          coverUrl={coverUrl}
          onUpdate={setCoverUrl}
        />

        {/* Identity row */}
        <div className="px-5 py-4 flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-[#1E5EFF20] border-2 border-[#1E5EFF33] flex items-center justify-center shrink-0">
            <span className="text-xl font-black text-[#1E5EFF]" style={{ fontFamily: 'var(--font-display)' }}>
              {initials}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <NameEditor profileId={profile.id} initial={profile.full_name} />
            <p className="text-xs text-gray-500 mt-0.5">{profile.email}</p>
            {profile.company_name && (
              <p className="text-xs text-gray-400 mt-0.5">{profile.company_name}</p>
            )}
            {profile.phone_number && (
              <p className="text-xs text-gray-600 mt-0.5">{profile.phone_number}</p>
            )}
          </div>
        </div>

        {/* Bio */}
        <div className="border-t border-white/5">
          <BioEditor
            profileId={profile.id}
            initial={profile.bio}
            onUpdate={() => {}}
          />
        </div>
      </div>

      {/* Stats overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Events',     value: events.length, color: '#1E5EFF', icon: <CalendarDays className="w-4 h-4" /> },
          { label: 'Total Registered', value: totalGuests,   color: '#A855F7', icon: <Users className="w-4 h-4" /> },
          { label: 'Total Attended',   value: totalAttended, color: '#10B981', icon: <UserCheck className="w-4 h-4" /> },
          { label: 'Avg Fill Rate',    value: `${avgFill}%`, color: '#FFC745', icon: <TrendingUp className="w-4 h-4" /> },
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
            onClick={() => setShowArchived(!showArchived)}
            className="flex items-center gap-3 w-full"
          >
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Archived Events
            </p>
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
