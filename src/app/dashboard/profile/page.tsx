'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  ImagePlus, X, Loader2, Check, Save, CalendarDays, Users,
  MapPin, TrendingUp, Edit3, UserCheck, Pencil,
} from 'lucide-react'
import { format } from 'date-fns'
import clsx from 'clsx'

/* ─── Types ──────────────────────────────────────────────────────── */
type OrgProfile = {
  id: string
  full_name: string
  email: string
  avatar_url: string | null
  phone_number: string | null
  company_name: string | null
  cover_image_url: string | null
  bio: string | null
}

type EventWithStats = {
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
function CoverUploader({ profileId, coverUrl, name, onUpdate }: {
  profileId: string; coverUrl: string | null; name: string; onUpdate: (url: string | null) => void
}) {
  const supabase = createClient()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const GRADIENTS_LOCAL = [
    'linear-gradient(135deg, #0F2027 0%, #2C5364 100%)',
    'linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)',
    'linear-gradient(135deg, #200122 0%, #6f0000 100%)',
  ]
  const fallbackGrad = GRADIENTS_LOCAL[profileId.charCodeAt(0) % GRADIENTS_LOCAL.length]

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

      await supabase.from('profiles').update({ cover_image_url: finalUrl } as any).eq('id', profileId)
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
    await supabase.from('profiles').update({ cover_image_url: null } as any).eq('id', profileId)
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

      {/* Controls */}
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
function BioEditor({ profileId, initial, onUpdate }: { profileId: string; initial: string | null; onUpdate: (bio: string | null) => void }) {
  const supabase = createClient()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(initial ?? '')
  const [bio, setBio] = useState(initial ?? '')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const save = async () => {
    setSaving(true); setErr(null)
    const { error } = await supabase.from('profiles').update({ bio: draft || null } as any).eq('id', profileId)
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

/* ─── Event Stat Card ────────────────────────────────────────────── */
function EventStatCard({ event }: { event: EventWithStats }) {
  const fillPct = event.capacity > 0 ? Math.min(100, (event.guest_count / event.capacity) * 100) : 0
  const checkinPct = event.guest_count > 0 ? Math.min(100, (event.checked_in_count / event.guest_count) * 100) : 0

  return (
    <div className="card-hover flex gap-4 items-start">
      {/* Cover thumbnail */}
      <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0" style={{ background: getGradient(event.id) }}>
        {event.cover_image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={event.cover_image_url} alt="" className="w-full h-full object-cover" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h4 className="text-sm font-semibold text-white leading-tight truncate">{event.title}</h4>
          <span className={clsx(statusBadge[event.status], 'shrink-0')}>{event.status}</span>
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

        {/* Fill bar */}
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
    </div>
  )
}

/* ─── Main Page ──────────────────────────────────────────────────── */
export default function OrganizerProfilePage() {
  const supabase = createClient()
  const [profile, setProfile] = useState<OrgProfile | null>(null)
  const [events, setEvents] = useState<EventWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [draftName, setDraftName] = useState('')
  const [showArchived, setShowArchived] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: prof } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url, phone_number, company_name, cover_image_url, bio')
        .eq('id', user.id)
        .single()
      if (prof) {
        setProfile(prof as OrgProfile)
        setDraftName(prof.full_name ?? '')
      }

      // Fetch events with guest counts
      const { data: eventsData } = await supabase
        .from('events')
        .select('id, title, date_start, cover_image_url, venue_name, capacity, status')
        .eq('organizer_id', user.id)
        .order('date_start', { ascending: false })

      if (eventsData) {
        const enriched: EventWithStats[] = await Promise.all(
          eventsData.map(async ev => {
            const [{ count: guestCount }, { count: checkedInCount }] = await Promise.all([
              supabase.from('guests').select('*', { count: 'exact', head: true }).eq('event_id', ev.id),
              supabase.from('guests').select('*', { count: 'exact', head: true }).eq('event_id', ev.id).eq('status', 'checked_in'),
            ])
            return { ...ev, guest_count: guestCount ?? 0, checked_in_count: checkedInCount ?? 0 }
          })
        )
        setEvents(enriched)
      }

      setLoading(false)
    }
    load()
  }, [])

  const saveName = async () => {
    if (!profile || !draftName.trim()) return
    setSaving(true)
    await supabase.from('profiles').update({ full_name: draftName.trim() }).eq('id', profile.id)
    setProfile(p => p ? { ...p, full_name: draftName.trim() } : p)
    setSaved(true)
    setSaving(false)
    setEditingName(false)
    setTimeout(() => setSaved(false), 3000)
  }

  if (loading) {
    return (
      <div className="max-w-3xl space-y-4 animate-pulse">
        <div className="h-40 bg-white/5 rounded-2xl" />
        <div className="h-24 bg-white/5 rounded-2xl" />
        <div className="h-48 bg-white/5 rounded-2xl" />
      </div>
    )
  }
  if (!profile) return null

  const activeEvents   = events.filter(e => e.status !== 'completed' && e.status !== 'cancelled')
  const archivedEvents = events.filter(e => e.status === 'completed' || e.status === 'cancelled')

  const totalGuests    = events.reduce((s, e) => s + e.guest_count, 0)
  const totalAttended  = events.reduce((s, e) => s + e.checked_in_count, 0)
  const totalEvents    = events.length
  const avgFill        = events.length > 0
    ? Math.round(events.reduce((s, e) => s + (e.capacity > 0 ? (e.guest_count / e.capacity) * 100 : 0), 0) / events.length)
    : 0

  const initials = (profile.full_name || 'O').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.5px' }}>
          Organizer Profile
        </h2>
        <p className="text-gray-400 text-sm mt-1">Your public identity and event portfolio</p>
      </div>

      {/* Profile Card */}
      <div className="card overflow-hidden p-0 space-y-0">
        {/* Cover */}
        <CoverUploader
          profileId={profile.id}
          coverUrl={profile.cover_image_url ?? null}
          name={profile.full_name}
          onUpdate={url => setProfile(p => p ? { ...p, cover_image_url: url } : p)}
        />

        {/* Identity row */}
        <div className="px-5 py-4 flex items-center gap-4">
          {/* Avatar initial */}
          <div className="w-14 h-14 rounded-xl bg-[#1E5EFF20] border-2 border-[#1E5EFF33] flex items-center justify-center shrink-0">
            <span className="text-xl font-black text-[#1E5EFF]" style={{ fontFamily: 'var(--font-display)' }}>
              {initials}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  className="input text-sm py-1.5 flex-1"
                  value={draftName}
                  onChange={e => setDraftName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveName() }}
                  autoFocus
                />
                <button onClick={saveName} disabled={saving || !draftName.trim()}
                  className="flex items-center gap-1 text-xs font-semibold text-white bg-[#1E5EFF] hover:bg-[#1448CC] disabled:opacity-50 rounded-lg px-3 py-1.5 transition-colors">
                  {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                </button>
                <button onClick={() => { setEditingName(false); setDraftName(profile.full_name ?? '') }}
                  className="p-1.5 text-gray-500 hover:text-white transition-colors">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
                  {profile.full_name || 'Organizer'}
                </h3>
                <button onClick={() => setEditingName(true)}
                  className="text-gray-600 hover:text-gray-400 transition-colors">
                  <Edit3 size={12} />
                </button>
              </div>
            )}
            <p className="text-xs text-gray-500 mt-0.5">{profile.email}</p>
            {profile.company_name && (
              <p className="text-xs text-gray-400 mt-0.5">{profile.company_name}</p>
            )}
          </div>
          {saved && (
            <span className="flex items-center gap-1 text-xs text-[#10B981]">
              <Check size={12} /> Saved
            </span>
          )}
        </div>

        {/* Bio */}
        <div className="border-t border-white/5">
          <BioEditor
            profileId={profile.id}
            initial={profile.bio ?? null}
            onUpdate={bio => setProfile(p => p ? { ...p, bio } : p)}
          />
        </div>
      </div>

      {/* Stats overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Events',    value: totalEvents,   color: '#1E5EFF', icon: <CalendarDays className="w-4 h-4" /> },
          { label: 'Total Registered', value: totalGuests,  color: '#A855F7', icon: <Users className="w-4 h-4" /> },
          { label: 'Total Attended',  value: totalAttended, color: '#10B981', icon: <UserCheck className="w-4 h-4" /> },
          { label: 'Avg Fill Rate',   value: `${avgFill}%`, color: '#FFC745', icon: <TrendingUp className="w-4 h-4" /> },
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
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-white" style={{ fontFamily: 'var(--font-display)' }}>
            Active Events
          </h3>
          <div className="grid gap-4">
            {activeEvents.map(ev => <EventStatCard key={ev.id} event={ev} />)}
          </div>
        </div>
      )}

      {/* Archived Events (collapsible) */}
      {archivedEvents.length > 0 && (
        <div className="space-y-4">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="flex items-center gap-3 w-full group"
          >
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Archived Events
            </p>
            <div className="flex-1 h-px bg-white/5" />
            <span className="text-xs text-gray-600">{archivedEvents.length}</span>
            <span className={clsx('text-xs text-gray-500 transition-transform inline-block', showArchived && 'rotate-180')}>▾</span>
          </button>

          {showArchived && (
            <div className="grid gap-4 opacity-70">
              {archivedEvents.map(ev => <EventStatCard key={ev.id} event={ev} />)}
            </div>
          )}
        </div>
      )}

      {events.length === 0 && (
        <div className="card text-center py-12">
          <CalendarDays className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">No events yet</p>
          <p className="text-gray-600 text-sm mt-1">Create your first event to see your portfolio here</p>
        </div>
      )}
    </div>
  )
}
