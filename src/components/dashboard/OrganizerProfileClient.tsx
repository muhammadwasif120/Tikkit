'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import {
  Check, Edit3, X, Loader2, Camera,
  CalendarDays, Users, MapPin, TrendingUp, UserCheck, Settings, ExternalLink, UserCircle,
} from 'lucide-react'
import { format } from 'date-fns'
import clsx from 'clsx'
import Link from 'next/link'
import { getEffectiveStatus } from '@/lib/eventStatus'

/* ─── Types ──────────────────────────────────────────────────────── */
export type OrgProfile = {
  id: string
  full_name: string | null
  email: string
  avatar_url: string | null
  phone_number: string | null
  company_name: string | null
  cover_image_url: string | null
  logo_url: string | null
  username: string | null
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
const STATUS_CONFIG: Record<string, { bg: string; color: string; border: string; label: string }> = {
  published: { bg: 'rgba(34,197,94,0.1)',  color: '#22C55E', border: 'rgba(34,197,94,0.25)',  label: 'LIVE'     },
  completed: { bg: 'rgba(75,85,99,0.1)',   color: '#6B7280', border: 'rgba(75,85,99,0.2)',    label: 'ENDED'    },
  archived:  { bg: 'rgba(75,85,99,0.06)',  color: '#4B5563', border: 'rgba(75,85,99,0.12)',   label: 'ARCHIVED' },
  draft:     { bg: 'rgba(250,204,21,0.1)', color: '#FACC15', border: 'rgba(250,204,21,0.2)',  label: 'DRAFT'    },
  cancelled: { bg: 'rgba(239,68,68,0.1)',  color: '#EF4444', border: 'rgba(239,68,68,0.2)',   label: 'CANCELLED'},
}

function getGradient(id: string) { return `var(--event-gradient-${id.charCodeAt(0) % 8})` }
function getCardGradient(id: string) { return `var(--event-gradient-${id.charCodeAt(0) % 8})` }

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

/* ─── Inline Personal Name Editor ───────────────────────────────── */
function NameEditor({ profileId, initial }: { profileId: string; initial: string | null }) {
  const supabase = createClient()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft]     = useState(initial ?? '')
  const [name, setName]       = useState(initial ?? '')
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const [saveErr, setSaveErr] = useState('')

  const save = async () => {
    if (!draft.trim()) {
      setSaveErr('Please enter your name.')
      return
    }
    setSaveErr('')
    setSaving(true)
    const { error } = await supabase.from('profiles').update({ full_name: draft.trim() }).eq('id', profileId)
    setSaving(false)
    if (error) { setSaveErr('Something went wrong. Please try again.'); return }
    setName(draft.trim())
    setSaved(true); setEditing(false)
    setTimeout(() => setSaved(false), 3000)
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-1 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <input
            className="input text-sm py-1.5 flex-1 min-w-0"
            value={draft}
            onChange={e => { setDraft(e.target.value); setSaveErr('') }}
            onKeyDown={e => { if (e.key === 'Enter') save() }}
            autoFocus
          />
          <button onClick={save} disabled={saving}
            className="flex items-center gap-1 text-xs font-semibold text-white bg-[#1E5EFF] hover:bg-[#1448CC] disabled:opacity-50 rounded-lg px-3 py-1.5 transition-colors shrink-0">
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
          </button>
          <button onClick={() => { setEditing(false); setDraft(name); setSaveErr('') }}
            className="p-1.5 text-gray-500 hover:text-white transition-colors shrink-0">
            <X size={14} />
          </button>
        </div>
        {saveErr && <p className="text-xs text-orange-400">{saveErr}</p>}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-sm text-gray-400" style={{ fontFamily: 'var(--font-body)' }}>
        {name || 'Organizer'}
      </span>
      <button onClick={() => setEditing(true)} className="text-gray-600 hover:text-gray-400 transition-colors">
        <Edit3 size={12} />
      </button>
      {saved && <span className="flex items-center gap-1 text-xs text-[#10B981]"><Check size={11} /> Saved</span>}
    </div>
  )
}

/* ─── Event Stat Card ────────────────────────────────────────────── */
function EventStatCard({ event }: { event: EventWithStats }) {
  const fillPct    = event.capacity > 0 ? Math.min(100, (event.guest_count      / event.capacity)   * 100) : 0
  const checkinPct = event.guest_count > 0 ? Math.min(100, (event.checked_in_count / event.guest_count) * 100) : 0
  const effStatus  = getEffectiveStatus(event)
  const st         = STATUS_CONFIG[effStatus] ?? STATUS_CONFIG.draft

  return (
    <Link href={`/dashboard/events/${event.id}`} className="card-hover flex gap-4 items-start group">
      <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 relative" style={{ background: getCardGradient(event.id) }}>
        {event.cover_image_url && (
          <Image src={event.cover_image_url} alt={`${event.title} cover`} fill style={{ objectFit: 'cover' }} sizes="56px" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h4 className="text-sm font-semibold text-white group-hover:text-[#1E5EFF] transition-colors leading-tight truncate">
            {event.title}
          </h4>
          <span style={{
            padding: '2px 8px', borderRadius: 100, fontSize: 11, fontWeight: 800,
            letterSpacing: '0.07em', flexShrink: 0,
            background: st.bg, color: st.color, border: `1px solid ${st.border}`,
            display: 'inline-flex', alignItems: 'center', gap: 4,
          }}>
            {effStatus === 'published' && (
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#22C55E', display: 'inline-block' }} />
            )}
            {st.label}
          </span>
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
  profile: initialProfile,
  events,
}: {
  profile: OrgProfile
  events: EventWithStats[]
}) {
  const supabase = createClient()
  const coverInputRef = useRef<HTMLInputElement>(null)
  const logoInputRef  = useRef<HTMLInputElement>(null)

  const [profile, setProfile] = useState(initialProfile)
  const [coverUploading, setCoverUploading] = useState(false)
  const [logoUploading,  setLogoUploading]  = useState(false)
  const [uploadError,    setUploadError]    = useState<string | null>(null)
  const [showPast, setShowPast] = useState(false)

  const activeEvents = events.filter(e => {
    const s = getEffectiveStatus(e)
    return s === 'published' || s === 'draft'
  })
  const pastEvents = events.filter(e => {
    const s = getEffectiveStatus(e)
    return s === 'completed' || s === 'archived' || s === 'cancelled'
  })

  const totalGuests   = events.reduce((s, e) => s + e.guest_count, 0)
  const totalAttended = events.reduce((s, e) => s + e.checked_in_count, 0)
  const avgFill = events.length > 0
    ? Math.round(events.reduce((s, e) => s + (e.capacity > 0 ? (e.guest_count / e.capacity) * 100 : 0), 0) / events.length)
    : 0

  const initials = (profile.full_name || profile.company_name || 'O')
    .split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()

  /* ── Cover upload ─────────────────────────────────────────────── */
  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > MAX_FILE_SIZE) { setUploadError('Cover image must be under 10 MB'); return }
    setUploadError(null)
    setCoverUploading(true)
    const ext  = file.name.split('.').pop() ?? 'jpg'
    const path = `profile-covers/${profile.id}/cover.${ext}`
    await supabase.storage.from('tikkit-uploads').upload(path, file, { upsert: true, contentType: file.type })
    const { data: { publicUrl } } = supabase.storage.from('tikkit-uploads').getPublicUrl(path)
    const url = `${publicUrl}?t=${Date.now()}`
    await supabase.from('profiles').update({ cover_image_url: url }).eq('id', profile.id)
    setProfile(p => ({ ...p, cover_image_url: url }))
    setCoverUploading(false)
    if (coverInputRef.current) coverInputRef.current.value = ''
  }

  const removeCover = async () => {
    await supabase.from('profiles').update({ cover_image_url: null }).eq('id', profile.id)
    setProfile(p => ({ ...p, cover_image_url: null }))
  }

  /* ── Logo upload ──────────────────────────────────────────────── */
  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > MAX_FILE_SIZE) { setUploadError('Logo must be under 10 MB'); return }
    setUploadError(null)
    setLogoUploading(true)
    const ext  = file.name.split('.').pop() ?? 'jpg'
    const path = `profile-logos/${profile.id}/logo.${ext}`
    await supabase.storage.from('tikkit-uploads').upload(path, file, { upsert: true, contentType: file.type })
    const { data: { publicUrl } } = supabase.storage.from('tikkit-uploads').getPublicUrl(path)
    const url = `${publicUrl}?t=${Date.now()}`
    await supabase.from('profiles').update({ logo_url: url }).eq('id', profile.id)
    setProfile(p => ({ ...p, logo_url: url }))
    setLogoUploading(false)
    if (logoInputRef.current) logoInputRef.current.value = ''
  }

  /* Geometry */
  const BANNER_H  = 120
  const AVATAR_H  = 64
  const avatarTop = BANNER_H - AVATAR_H / 2  // 88px — half overlaps banner

  return (
    <div className="max-w-5xl space-y-6 px-0 pt-0 pb-6 sm:px-6 sm:pt-4" style={{ overflowX: 'hidden' }}>

      {/* Hidden file inputs — wrapped with HTML hidden attr so space-y-* skips them */}
      <div hidden>
        <input ref={coverInputRef} type="file" accept="image/*" onChange={handleCoverChange} />
        <input ref={logoInputRef}  type="file" accept="image/*" onChange={handleLogoChange}  />
      </div>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 14, flexShrink: 0,
          background: 'linear-gradient(135deg, rgba(30,94,255,0.2), rgba(34,197,94,0.1))',
          border: '1px solid rgba(30,94,255,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(30,94,255,0.15)',
        }}>
          <UserCircle size={22} color="#1E5EFF" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h1 style={{ color: 'white', fontSize: 'var(--fs-2xl)', fontWeight: 900, margin: 0, fontFamily: 'var(--font-display)', letterSpacing: '-0.4px' }}>
              Profile
            </h1>
            {profile.username && (
              <Link
                href={`/organizer/${profile.username}`}
                target="_blank"
                className="flex items-center gap-1.5 text-xs text-[#1E5EFF] hover:text-white border border-[#1E5EFF]/30 hover:border-white/25 rounded-lg px-2.5 py-1 transition-all"
              >
                <ExternalLink size={12} /> <span className="hidden sm:inline">View Public Profile</span>
              </Link>
            )}
            <Link href="/dashboard/settings"
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white border border-white/10 hover:border-white/25 rounded-lg px-2.5 py-1 transition-all">
              <Settings size={13} /> <span className="hidden sm:inline">Edit Details</span>
            </Link>
          </div>
          <p style={{ color: '#6B7280', fontSize: 'var(--fs-base)', margin: 0, lineHeight: 1.5, whiteSpace: 'nowrap' }}>
            Public identity and event portfolio
          </p>
        </div>
      </div>

      {uploadError && (
        <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5">
          {uploadError}
        </div>
      )}

      {/* Profile hero card */}
      <div className="card overflow-hidden p-0 relative">

        {/* Gradient banner + optional cover image */}
        <div
          className="relative w-full overflow-hidden"
          style={{ height: BANNER_H, background: getGradient(profile.id) }}
        >
          {profile.cover_image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.cover_image_url}
              alt="Cover"
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
          {/* Grid overlay (only shown on gradient) */}
          {!profile.cover_image_url && (
            <div className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                backgroundSize: '24px 24px',
              }}
            />
          )}
          {/* Bottom fade */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#0D0F18] to-transparent" />

          {/* Cover edit controls — bottom right */}
          <div className="absolute bottom-3 right-3 flex items-center gap-1.5">
            {profile.cover_image_url && (
              <button
                onClick={removeCover}
                className="flex items-center gap-1 text-xs text-gray-300 hover:text-white bg-black/50 hover:bg-black/70 rounded-lg px-2 py-1 transition-all backdrop-blur-sm"
              >
                <X size={11} /> Remove
              </button>
            )}
            <button
              onClick={() => coverInputRef.current?.click()}
              disabled={coverUploading}
              className="flex items-center gap-1.5 text-xs text-white bg-black/50 hover:bg-black/70 disabled:opacity-60 rounded-lg px-2.5 py-1 transition-all backdrop-blur-sm"
            >
              {coverUploading
                ? <Loader2 size={12} className="animate-spin" />
                : <Camera size={12} />
              }
              {profile.cover_image_url ? 'Change Cover' : 'Add Cover'}
            </button>
          </div>
        </div>

        {/* Logo badge — absolute, half-overlapping banner */}
        <div className="absolute" style={{ top: avatarTop, left: 20 }}>
          <div className="relative group">
            <div
              className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center"
              style={{
                background: profile.logo_url ? 'transparent' : 'linear-gradient(135deg, rgba(30,94,255,0.3), rgba(30,94,255,0.1))',
                border: '3px solid #0D0F18',
                boxShadow: '0 0 0 1px rgba(30,94,255,0.25)',
              }}
            >
              {profile.logo_url ? (
                <Image src={profile.logo_url} alt={`${profile.company_name || profile.full_name || 'Organizer'} logo`} width={80} height={80} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
              ) : (
                <span className="text-2xl font-black text-[#1E5EFF]" style={{ fontFamily: 'var(--font-display)' }}>
                  {initials}
                </span>
              )}
            </div>
            {/* Camera button overlay on logo */}
            <button
              onClick={() => logoInputRef.current?.click()}
              disabled={logoUploading}
              className="absolute inset-0 rounded-2xl bg-black/0 group-hover:bg-black/50 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
              title="Change logo"
            >
              {logoUploading
                ? <Loader2 size={16} className="text-white animate-spin" />
                : <Camera size={16} className="text-white" />
              }
            </button>
          </div>
        </div>

        {/* Identity content */}
        <div className="px-5 pb-6" style={{ paddingTop: AVATAR_H / 2 + 16 }}>
          {/* Organisation name — primary bold */}
          {profile.company_name ? (
            <h3 className="text-lg font-bold text-white leading-tight" style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.3px' }}>
              {profile.company_name}
            </h3>
          ) : (
            <p className="text-sm text-gray-600 italic">No organisation name set</p>
          )}

          {/* Personal name — secondary, inline-editable */}
          <div className="mt-0.5">
            <NameEditor profileId={profile.id} initial={profile.full_name} />
          </div>

          {/* Contact */}
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-0.5">
            <p className="text-xs text-gray-500">{profile.email}</p>
            {profile.phone_number && (
              <p className="text-xs text-gray-600">{profile.phone_number}</p>
            )}
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {[
          { label: 'Total Events',     value: events.length,  color: '#1E5EFF', bg: 'rgba(30,94,255,0.1)',   border: 'rgba(30,94,255,0.15)',  icon: <CalendarDays className="w-3.5 h-3.5" /> },
          { label: 'Total Registered', value: totalGuests,    color: '#A855F7', bg: 'rgba(168,85,247,0.1)',  border: 'rgba(168,85,247,0.15)', icon: <Users className="w-3.5 h-3.5" /> },
          { label: 'Total Attended',   value: totalAttended,  color: '#10B981', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.15)', icon: <UserCheck className="w-3.5 h-3.5" /> },
          { label: 'Avg Fill Rate',    value: `${avgFill}%`,  color: '#FFC745', bg: 'rgba(255,199,69,0.1)',  border: 'rgba(255,199,69,0.15)', icon: <TrendingUp className="w-3.5 h-3.5" /> },
        ].map(s => (
          <div key={s.label} className="bg-brand-charcoal rounded-xl border p-3 sm:p-5 flex flex-col gap-1" style={{ borderColor: s.border }}>
            <div className="flex items-center gap-1.5 mb-0.5">
              <div style={{ width: 26, height: 26, borderRadius: 8, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ color: s.color }}>{s.icon}</span>
              </div>
              <p className="text-[10px] sm:text-xs text-gray-500 truncate">{s.label}</p>
            </div>
            <p className="text-base sm:text-xl font-bold text-white truncate" style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.5px' }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Active Events */}
      {activeEvents.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-white" style={{ fontFamily: 'var(--font-display)' }}>
            Active Events
          </h3>
          <div className="grid md:grid-cols-2 gap-3">
            {activeEvents.map(ev => <EventStatCard key={ev.id} event={ev} />)}
          </div>
        </div>
      )}

      {/* Past Events (collapsible) */}
      {pastEvents.length > 0 && (
        <div className="space-y-3">
          <button
            onClick={() => setShowPast(v => !v)}
            className="flex items-center gap-3 w-full"
          >
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Past Events</p>
            <div className="flex-1 h-px bg-white/5" />
            <span className="text-xs text-gray-600">{pastEvents.length}</span>
            <span className={clsx('text-xs text-gray-500 transition-transform inline-block', showPast && 'rotate-180')}>▾</span>
          </button>

          {showPast && (
            <div className="grid md:grid-cols-2 gap-3 opacity-70">
              {pastEvents.map(ev => <EventStatCard key={ev.id} event={ev} />)}
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
