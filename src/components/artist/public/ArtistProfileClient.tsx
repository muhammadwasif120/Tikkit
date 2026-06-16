'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, MapPin, Calendar, Clock, Users, Music, Mic2, ChevronRight, ChevronLeft, ExternalLink, AlertCircle } from 'lucide-react'
import { submitEnquiry } from '@/app/actions/artistActions'

const C = {
  black:   '#050508',
  cyan:    '#00E5FF',
  magenta: '#CC00FF',
  surface: '#0D1117',
  card:    '#111820',
  border:  'rgba(0,229,255,0.08)',
  muted:   'rgba(255,255,255,0.4)',
  text:    '#FFFFFF',
}

const CAT_LABEL: Record<string, string> = { dj: 'DJ', musician: 'Musician / Band', comedian: 'Comedian' }
const AVAIL_COLORS: Record<string, string> = { accepting: C.cyan, limited: '#F6C90E', not_accepting: '#FC8181' }
const AVAIL_LABELS: Record<string, string> = { accepting: 'Accepting Bookings', limited: 'Limited Availability', not_accepting: 'Not Accepting Bookings' }

const EVENT_TYPES = ['Concert / Live Gig', 'Festival', 'Private Party', 'Corporate Event', 'Wedding', 'Restaurant / Bar Night', 'Club Night', 'Comedy Show', 'Other']
const ATTENDANCE_OPTS = ['< 50', '50–150', '150–500', '500–1000', '1000–3000', '3000+']
const DURATION_OPTS = ['30 min', '45 min', '1 hour', '1.5 hours', '2 hours', '2.5 hours', '3 hours', '3+ hours']

// ── Step indicators ───────────────────────────────────────────────────────────

function StepDot({ n, active, done }: { n: number; active: boolean; done: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div style={{ width: 32, height: 32, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, transition: 'all 0.2s', background: done ? `linear-gradient(135deg, ${C.cyan}, ${C.magenta})` : active ? `${C.cyan}18` : 'rgba(255,255,255,0.05)', border: `1.5px solid ${done || active ? C.cyan : 'rgba(255,255,255,0.1)'}`, color: done ? C.black : active ? C.cyan : C.muted }}>
        {done ? '✓' : n}
      </div>
      <div style={{ width: 1, height: 20, background: done ? `${C.cyan}40` : 'rgba(255,255,255,0.06)', display: n === 3 ? 'none' : 'block' }} />
    </div>
  )
}

// ── Field ──────────────────────────────────────────────────────────────────────

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.muted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {label}{required && <span style={{ color: C.magenta, marginLeft: 2 }}>*</span>}
      </label>
      {children}
    </div>
  )
}

const inputStyle = { width: '100%', background: 'rgba(255,255,255,0.04)', border: `1px solid rgba(255,255,255,0.1)`, borderRadius: 10, padding: '10px 14px', color: C.text, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' as const }
const selectStyle = { ...inputStyle, appearance: 'none' as const }

// ── Enquiry Form ──────────────────────────────────────────────────────────────

function EnquiryForm({ artistId, managementId, organiserProfile }: {
  artistId: string
  managementId: string
  organiserProfile: any
}) {
  const [step, setStep]       = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone]       = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [fd, setFd]           = useState({
    event_name: '', event_type: '', event_date: '', event_city: '',
    event_venue: '', estimated_attendance: '', performance_duration: '',
    set_type: '', additional_notes: '',
  })

  const set = (k: keyof typeof fd, v: string) => setFd(p => ({ ...p, [k]: v }))

  const step1Valid = fd.event_name && fd.event_type && fd.event_date && fd.event_city
  const step2Valid = fd.estimated_attendance && fd.performance_duration

  async function handleSubmit() {
    setSubmitting(true)
    setError(null)
    const form = new FormData()
    Object.entries(fd).forEach(([k, v]) => form.append(k, v))
    const res = await submitEnquiry(artistId, managementId, form)
    setSubmitting(false)
    if (res.error) { setError(res.error); return }
    setDone(true)
  }

  if (done) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 0' }}>
        <div style={{ width: 56, height: 56, borderRadius: 28, background: `${C.cyan}15`, border: `1px solid ${C.cyan}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <CheckCircle2 size={24} color={C.cyan} />
        </div>
        <p style={{ fontSize: 18, fontWeight: 800, margin: '0 0 8px' }}>Enquiry Sent</p>
        <p style={{ fontSize: 14, color: C.muted, margin: 0 }}>The management team will review your enquiry and respond within 7 days.</p>
      </div>
    )
  }

  return (
    <div>
      {/* Step indicators */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 28 }}>
        {[1, 2, 3].map((n, i) => (
          <div key={n} style={{ display: 'flex', alignItems: 'flex-start', flex: n < 3 ? '1' : 'none' }}>
            <StepDot n={n} active={step === n} done={step > n} />
            {n < 3 && <div style={{ flex: 1, height: 1.5, background: step > n ? `${C.cyan}40` : 'rgba(255,255,255,0.06)', marginTop: 15 }} />}
          </div>
        ))}
      </div>

      {/* Step 1 — Event details */}
      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700 }}>Event Details</p>
          <Field label="Event Name" required>
            <input value={fd.event_name} onChange={e => set('event_name', e.target.value)} placeholder="e.g. Summer Closing Party 2026" style={inputStyle} />
          </Field>
          <Field label="Event Type" required>
            <select value={fd.event_type} onChange={e => set('event_type', e.target.value)} style={selectStyle}>
              <option value="">Select type…</option>
              {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Event Date" required>
              <input type="date" value={fd.event_date} onChange={e => set('event_date', e.target.value)} style={inputStyle} min={new Date().toISOString().split('T')[0]} />
            </Field>
            <Field label="City" required>
              <input value={fd.event_city} onChange={e => set('event_city', e.target.value)} placeholder="e.g. Karachi" style={inputStyle} />
            </Field>
          </div>
          <Field label="Venue Name">
            <input value={fd.event_venue} onChange={e => set('event_venue', e.target.value)} placeholder="e.g. Colony Factory (optional)" style={inputStyle} />
          </Field>
          <button onClick={() => step1Valid && setStep(2)} disabled={!step1Valid} style={{ marginTop: 8, padding: '12px 0', borderRadius: 12, background: step1Valid ? `linear-gradient(135deg, ${C.cyan}20, ${C.magenta}20)` : 'rgba(255,255,255,0.04)', border: `1px solid ${step1Valid ? C.cyan + '40' : 'rgba(255,255,255,0.08)'}`, color: step1Valid ? C.cyan : C.muted, fontSize: 14, fontWeight: 700, cursor: step1Valid ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'inherit' }}>
            Next <ChevronRight size={15} />
          </button>
        </div>
      )}

      {/* Step 2 — Performance requirements */}
      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700 }}>Performance Requirements</p>
          <Field label="Estimated Attendance" required>
            <select value={fd.estimated_attendance} onChange={e => set('estimated_attendance', e.target.value)} style={selectStyle}>
              <option value="">Select range…</option>
              {ATTENDANCE_OPTS.map(o => <option key={o} value={o}>{o} people</option>)}
            </select>
          </Field>
          <Field label="Performance Duration" required>
            <select value={fd.performance_duration} onChange={e => set('performance_duration', e.target.value)} style={selectStyle}>
              <option value="">Select duration…</option>
              {DURATION_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </Field>
          <Field label="Set Type / Vibe">
            <input value={fd.set_type} onChange={e => set('set_type', e.target.value)} placeholder="e.g. House / Techno warm-up set" style={inputStyle} />
          </Field>
          <Field label="Additional Notes">
            <textarea value={fd.additional_notes} onChange={e => set('additional_notes', e.target.value)} placeholder="Technical requirements, rider notes, anything else…" rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
          </Field>
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button onClick={() => setStep(1)} style={{ flex: 1, padding: '12px 0', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: `1px solid rgba(255,255,255,0.08)`, color: C.muted, fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'inherit' }}>
              <ChevronLeft size={15} /> Back
            </button>
            <button onClick={() => step2Valid && setStep(3)} disabled={!step2Valid} style={{ flex: 2, padding: '12px 0', borderRadius: 12, background: step2Valid ? `linear-gradient(135deg, ${C.cyan}20, ${C.magenta}20)` : 'rgba(255,255,255,0.04)', border: `1px solid ${step2Valid ? C.cyan + '40' : 'rgba(255,255,255,0.08)'}`, color: step2Valid ? C.cyan : C.muted, fontSize: 14, fontWeight: 700, cursor: step2Valid ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'inherit' }}>
              Review & Submit <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Step 3 — Confirm */}
      {step === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700 }}>Confirm Enquiry</p>

          {/* Summary */}
          {[
            { label: 'Event', value: fd.event_name },
            { label: 'Type', value: fd.event_type },
            { label: 'Date', value: new Date(fd.event_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) },
            { label: 'Location', value: `${fd.event_city}${fd.event_venue ? ` · ${fd.event_venue}` : ''}` },
            { label: 'Attendance', value: fd.estimated_attendance + ' people' },
            { label: 'Duration', value: fd.performance_duration },
          ].map(row => (
            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid rgba(255,255,255,0.05)` }}>
              <span style={{ fontSize: 12, color: C.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{row.label}</span>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{row.value}</span>
            </div>
          ))}

          {organiserProfile && (
            <div style={{ padding: '12px 14px', borderRadius: 10, background: `${C.cyan}08`, border: `1px solid ${C.cyan}20`, marginTop: 4 }}>
              <p style={{ fontSize: 12, color: C.cyan, fontWeight: 700, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Submitting as</p>
              <p style={{ fontSize: 13, fontWeight: 700, margin: '0 0 2px' }}>{organiserProfile.full_name || organiserProfile.company_name}</p>
              <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>{organiserProfile.email}</p>
            </div>
          )}

          <p style={{ fontSize: 12, color: C.muted, margin: '4px 0 0', lineHeight: 1.6 }}>
            No fee is agreed at this stage. The management team will respond within 7 days. All financial arrangements are made directly off-platform.
          </p>

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10, background: 'rgba(252,129,129,0.08)', border: '1px solid rgba(252,129,129,0.2)' }}>
              <AlertCircle size={14} color="#FC8181" />
              <span style={{ fontSize: 13, color: '#FC8181' }}>{error}</span>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button onClick={() => setStep(2)} style={{ flex: 1, padding: '12px 0', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: `1px solid rgba(255,255,255,0.08)`, color: C.muted, fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'inherit' }}>
              <ChevronLeft size={15} /> Back
            </button>
            <button onClick={handleSubmit} disabled={submitting} style={{ flex: 2, padding: '12px 0', borderRadius: 12, background: `linear-gradient(135deg, ${C.cyan}, ${C.magenta})`, border: 'none', color: C.black, fontSize: 14, fontWeight: 800, cursor: submitting ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'inherit', opacity: submitting ? 0.7 : 1 }}>
              {submitting ? 'Sending…' : 'Send Enquiry'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function ArtistProfileClient({
  artist, management, pastEvents, viewerRole, organiserProfile, userId,
}: {
  artist: any
  management: any
  pastEvents: any[]
  viewerRole: 'anonymous' | 'non-organiser' | 'unverified' | 'verified'
  organiserProfile: any
  userId: string | null
}) {
  const [enquiryOpen, setEnquiryOpen] = useState(false)
  const [activeMedia, setActiveMedia] = useState<'youtube' | 'soundcloud' | 'spotify' | null>(null)
  const [photoIdx, setPhotoIdx]       = useState(0)

  const gallery: string[] = artist.gallery_urls ?? []
  const media             = artist.media_links ?? {}
  const social            = artist.social_links ?? {}
  const availColor        = AVAIL_COLORS[artist.availability_status] ?? C.muted
  const availLabel        = AVAIL_LABELS[artist.availability_status] ?? ''

  // Determine which media tabs exist
  const mediaTabs = [
    media.youtube    && { id: 'youtube',    label: 'YouTube'    },
    media.soundcloud && { id: 'soundcloud', label: 'SoundCloud' },
    media.spotify    && { id: 'spotify',    label: 'Spotify'    },
  ].filter(Boolean) as { id: 'youtube' | 'soundcloud' | 'spotify'; label: string }[]

  if (!activeMedia && mediaTabs.length > 0) {
    // lazy init without extra render
  }

  // Booking CTA state
  const bookingBlocked   = artist.availability_status === 'not_accepting'
  const canSeeEnquiryBtn = viewerRole === 'verified' && !bookingBlocked

  return (
    <div style={{ minHeight: '100vh', background: C.black, color: C.text, fontFamily: 'var(--font-body, "DM Sans", sans-serif)' }}>

      {/* ── Hero ── */}
      <div style={{ position: 'relative', height: 420, overflow: 'hidden', background: `linear-gradient(135deg, #050508, #0a0015)` }}>
        {artist.profile_photo_url ? (
          <img src={artist.profile_photo_url} alt={artist.name} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5 }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 160, fontWeight: 900, opacity: 0.04, letterSpacing: -8 }}>{artist.name}</span>
          </div>
        )}
        {/* Gradient overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 30%, rgba(5,5,8,0.9) 70%, #050508 100%)' }} />

        {/* Back nav */}
        <Link href="/artists" style={{ position: 'absolute', top: 20, left: 20, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(255,255,255,0.5)', textDecoration: 'none', background: 'rgba(0,0,0,0.4)', padding: '6px 12px', borderRadius: 20 }}>
          <ChevronLeft size={13} /> All Artists
        </Link>

        {/* Hero content */}
        <div style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 1100, padding: '0 24px', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: C.cyan, textTransform: 'uppercase', letterSpacing: '1px' }}>{CAT_LABEL[artist.category]}</span>
            {artist.based_in_city && (
              <>
                <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
                <span style={{ fontSize: 12, color: C.muted, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <MapPin size={11} /> {artist.based_in_city}
                </span>
              </>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: 48, fontWeight: 900, margin: 0, letterSpacing: '-2px', lineHeight: 1, flex: 1, minWidth: 0 }}>{artist.name}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 4 }}>
              {artist.verified && <CheckCircle2 size={20} color={C.cyan} />}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(5,5,8,0.75)', borderRadius: 20, padding: '5px 12px' }}>
                <div style={{ width: 7, height: 7, borderRadius: 4, background: availColor }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: availColor }}>{availLabel}</span>
              </div>
            </div>
          </div>
          {(artist.sub_tags ?? []).length > 0 && (
            <div style={{ display: 'flex', gap: 6, marginTop: 14, flexWrap: 'wrap' }}>
              {(artist.sub_tags as string[]).map(tag => (
                <span key={tag} style={{ padding: '4px 10px', borderRadius: 6, background: `${C.magenta}15`, border: `1px solid ${C.magenta}30`, fontSize: 12, color: `${C.magenta}dd` }}>{tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px 80px', display: 'grid', gridTemplateColumns: '1fr 360px', gap: 40, alignItems: 'start' }}>

        {/* ── LEFT COLUMN ── */}
        <div>
          {/* Bio */}
          {artist.bio && (
            <section style={{ marginBottom: 40 }}>
              <h2 style={{ fontSize: 14, fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 14px' }}>About</h2>
              <p style={{ fontSize: 15, lineHeight: 1.75, color: 'rgba(255,255,255,0.85)', margin: 0, whiteSpace: 'pre-wrap' }}>{artist.bio}</p>
            </section>
          )}

          {/* Media */}
          {mediaTabs.length > 0 && (
            <section style={{ marginBottom: 40 }}>
              <h2 style={{ fontSize: 14, fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 14px' }}>Listen / Watch</h2>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                {mediaTabs.map(tab => (
                  <button key={tab.id} onClick={() => setActiveMedia(tab.id)} style={{ padding: '7px 16px', borderRadius: 20, fontSize: 13, fontWeight: activeMedia === tab.id || (!activeMedia && tab === mediaTabs[0]) ? 700 : 500, background: (activeMedia ?? mediaTabs[0]?.id) === tab.id ? `${C.cyan}18` : 'rgba(255,255,255,0.04)', border: `1px solid ${(activeMedia ?? mediaTabs[0]?.id) === tab.id ? C.cyan + '40' : 'rgba(255,255,255,0.08)'}`, color: (activeMedia ?? mediaTabs[0]?.id) === tab.id ? C.cyan : C.muted, cursor: 'pointer', fontFamily: 'inherit' }}>{tab.label}</button>
                ))}
              </div>
              {(() => {
                const id = activeMedia ?? mediaTabs[0]?.id
                const url = media[id]
                if (!url) return null
                if (id === 'youtube') {
                  const ytId = url.match(/(?:v=|youtu\.be\/)([^&?/]+)/)?.[1]
                  if (ytId) return <div style={{ borderRadius: 12, overflow: 'hidden', aspectRatio: '16/9' }}><iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${ytId}`} frameBorder="0" allowFullScreen style={{ display: 'block' }} /></div>
                }
                if (id === 'soundcloud') {
                  return <div style={{ borderRadius: 12, overflow: 'hidden' }}><iframe width="100%" height="166" scrolling="no" frameBorder="no" allow="autoplay" src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%2300E5FF&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false`} /></div>
                }
                if (id === 'spotify') {
                  const spMatch = url.match(/spotify\.com\/(track|album|playlist|artist)\/([A-Za-z0-9]+)/)
                  if (spMatch) return <div style={{ borderRadius: 12, overflow: 'hidden' }}><iframe src={`https://open.spotify.com/embed/${spMatch[1]}/${spMatch[2]}`} width="100%" height="152" frameBorder="0" allowTransparency allow="encrypted-media" /></div>
                }
                return <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: C.cyan, fontSize: 14 }}>Open in {id} <ExternalLink size={12} /></a>
              })()}
            </section>
          )}

          {/* Gallery */}
          {gallery.length > 0 && (
            <section style={{ marginBottom: 40 }}>
              <h2 style={{ fontSize: 14, fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 14px' }}>Gallery</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
                {gallery.map((url: string, i: number) => (
                  <button key={i} onClick={() => setPhotoIdx(i)} style={{ border: `2px solid ${photoIdx === i ? C.cyan + '60' : 'transparent'}`, borderRadius: 10, overflow: 'hidden', padding: 0, cursor: 'pointer', display: 'block', aspectRatio: '4/3' }}>
                    <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Social links */}
          {Object.values(social).some(Boolean) && (
            <section style={{ marginBottom: 40 }}>
              <h2 style={{ fontSize: 14, fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 14px' }}>Socials</h2>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {social.instagram && <a href={social.instagram} target="_blank" rel="noopener noreferrer" style={{ padding: '7px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: C.muted, textDecoration: 'none', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>Instagram <ExternalLink size={11} /></a>}
                {social.facebook  && <a href={social.facebook}  target="_blank" rel="noopener noreferrer" style={{ padding: '7px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: C.muted, textDecoration: 'none', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>Facebook <ExternalLink size={11} /></a>}
                {social.youtube   && <a href={social.youtube}   target="_blank" rel="noopener noreferrer" style={{ padding: '7px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: C.muted, textDecoration: 'none', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>YouTube <ExternalLink size={11} /></a>}
              </div>
            </section>
          )}

          {/* Past events */}
          {pastEvents.length > 0 && (
            <section>
              <h2 style={{ fontSize: 14, fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 14px' }}>Past Performances</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {pastEvents.map((ev: any, i: number) => (
                  <div key={ev.id} style={{ display: 'flex', gap: 16, padding: '14px 0', borderBottom: i < pastEvents.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                    <div style={{ width: 3, borderRadius: 2, background: ev.is_platform_event ? `linear-gradient(${C.cyan}, ${C.magenta})` : 'rgba(255,255,255,0.1)', flexShrink: 0, alignSelf: 'stretch', minHeight: 40 }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: '0 0 3px', fontWeight: 700, fontSize: 14 }}>{ev.event_name}</p>
                      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 12, color: C.muted, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Calendar size={10} /> {new Date(ev.event_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        {(ev.venue_name || ev.city) && (
                          <span style={{ fontSize: 12, color: C.muted, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <MapPin size={10} /> {[ev.venue_name, ev.city].filter(Boolean).join(' · ')}
                          </span>
                        )}
                        {ev.is_platform_event && <span style={{ fontSize: 10, fontWeight: 700, color: C.cyan, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Tikkit</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* ── RIGHT COLUMN — Booking card ── */}
        <div style={{ position: 'sticky', top: 24 }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ padding: '20px 24px 0', borderBottom: `1px solid rgba(255,255,255,0.05)`, paddingBottom: 18 }}>
              <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '1px' }}>Book This Artist</p>
              <p style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>{artist.name}</p>
              {management?.company_name && (
                <p style={{ margin: '4px 0 0', fontSize: 12, color: C.muted }}>Represented by <span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>{management.company_name}</span></p>
              )}
            </div>

            <div style={{ padding: '20px 24px' }}>
              {/* Quick meta */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                {(artist.event_types_accepted ?? []).length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <Music size={13} color={C.muted} style={{ marginTop: 2 }} />
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>{(artist.event_types_accepted as string[]).join(', ')}</span>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 7, height: 7, borderRadius: 4, background: availColor }} />
                  <span style={{ fontSize: 13, color: availColor, fontWeight: 600 }}>{availLabel}</span>
                </div>
              </div>

              {/* CTA based on viewer role */}
              {viewerRole === 'anonymous' && (
                <>
                  <Link href={`/auth/login?next=/artists/${artist.slug}`} style={{ display: 'block', padding: '13px 0', borderRadius: 12, background: `linear-gradient(135deg, ${C.cyan}, ${C.magenta})`, color: C.black, fontSize: 14, fontWeight: 800, textAlign: 'center', textDecoration: 'none' }}>Log In to Enquire</Link>
                  <p style={{ margin: '10px 0 0', fontSize: 12, color: C.muted, textAlign: 'center' }}>Available to verified event organisers</p>
                </>
              )}

              {viewerRole === 'non-organiser' && (
                <div style={{ padding: '14px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', textAlign: 'center' }}>
                  <p style={{ fontSize: 13, color: C.muted, margin: 0, lineHeight: 1.6 }}>Artist bookings are available to verified event organisers. Switch to an Organiser account to enquire.</p>
                </div>
              )}

              {viewerRole === 'unverified' && (
                <div style={{ padding: '14px', borderRadius: 12, background: `${C.cyan}08`, border: `1px solid ${C.cyan}20`, textAlign: 'center' }}>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', margin: '0 0 10px', lineHeight: 1.6 }}>Your organiser account needs to be verified to send booking enquiries.</p>
                  <Link href="/dashboard/settings" style={{ fontSize: 13, color: C.cyan, fontWeight: 700, textDecoration: 'none' }}>Complete Verification →</Link>
                </div>
              )}

              {viewerRole === 'verified' && bookingBlocked && (
                <div style={{ padding: '14px', borderRadius: 12, background: 'rgba(252,129,129,0.06)', border: '1px solid rgba(252,129,129,0.15)', textAlign: 'center' }}>
                  <p style={{ fontSize: 13, color: '#FC8181', margin: 0 }}>This artist is not currently accepting bookings.</p>
                </div>
              )}

              {canSeeEnquiryBtn && !enquiryOpen && (
                <>
                  <button onClick={() => setEnquiryOpen(true)} style={{ width: '100%', padding: '13px 0', borderRadius: 12, background: `linear-gradient(135deg, ${C.cyan}, ${C.magenta})`, border: 'none', color: C.black, fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
                    Send Booking Enquiry
                  </button>
                  <p style={{ margin: '10px 0 0', fontSize: 12, color: C.muted, textAlign: 'center', lineHeight: 1.5 }}>No fee agreed at this stage. All arrangements are made directly with the management team.</p>
                </>
              )}

              {canSeeEnquiryBtn && enquiryOpen && (
                <div style={{ borderTop: `1px solid rgba(255,255,255,0.05)`, marginTop: 4, paddingTop: 20 }}>
                  <EnquiryForm artistId={artist.id} managementId={management?.id ?? ''} organiserProfile={organiserProfile} />
                </div>
              )}

              {/* Trust signals */}
              {viewerRole === 'verified' && (
                <div style={{ marginTop: 20, padding: '12px 0 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  {[
                    { icon: CheckCircle2, text: 'Artist verified by Tikkit X' },
                    { icon: Users,       text: 'Managed representation' },
                    { icon: Clock,       text: '7-day response guarantee' },
                  ].map(({ icon: Icon, text }) => (
                    <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <Icon size={13} color={C.cyan} />
                      <span style={{ fontSize: 12, color: C.muted }}>{text}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Tikkit X badge */}
          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <Link href="/" style={{ textDecoration: 'none' }}>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>Powered by </span>
              <span style={{ fontSize: 11, fontWeight: 800, background: `linear-gradient(90deg, ${C.cyan}, ${C.magenta})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Tikkit X</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Mobile bottom CTA ── */}
      <style>{`
        @media (max-width: 768px) {
          .am-profile-grid { grid-template-columns: 1fr !important; }
          .am-sticky-card { position: static !important; }
          .am-mobile-cta { display: flex !important; }
        }
      `}</style>
    </div>
  )
}
