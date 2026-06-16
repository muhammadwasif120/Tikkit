'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Upload, X, Check, ExternalLink, FileText, Image, Trash2 } from 'lucide-react'
import {
  updateArtistSelfService,
  uploadArtistPhoto,
  uploadGalleryImage,
  removeGalleryImage,
  uploadPressKit,
  getPressKitSignedUrl,
} from '@/app/actions/artistActions'

const C = {
  black: '#050508', cyan: '#00E5FF', magenta: '#CC00FF',
  surface: '#0D1117', card: '#111820',
  border: 'rgba(0,229,255,0.08)', muted: 'rgba(255,255,255,0.4)', text: '#FFFFFF',
}

const EVENT_TYPES = ['Concert / Live Gig', 'Festival', 'Private Party', 'Corporate Event', 'Wedding', 'Restaurant / Bar Night', 'Club Night', 'Comedy Show']
const AVAIL_OPTS  = [
  { value: 'accepting',     label: 'Accepting Bookings', color: C.cyan    },
  { value: 'limited',       label: 'Limited Availability', color: '#F6C90E' },
  { value: 'not_accepting', label: 'Not Accepting',      color: '#FC8181' },
]

const inputStyle = {
  width: '100%', background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
  padding: '11px 14px', color: C.text, fontSize: 14,
  fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' as const,
}

function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div style={{ borderBottom: `1px solid ${C.border}`, paddingBottom: 14, marginBottom: 20 }}>
      <p style={{ fontSize: 16, fontWeight: 800, margin: '0 0 2px' }}>{title}</p>
      {sub && <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>{sub}</p>}
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</label>
      {children}
      {hint && <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', margin: '5px 0 0' }}>{hint}</p>}
    </div>
  )
}

function SaveBanner({ saved }: { saved: boolean }) {
  if (!saved) return null
  return (
    <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 100, display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 12, background: `${C.cyan}15`, border: `1px solid ${C.cyan}30`, backdropFilter: 'blur(8px)' }}>
      <Check size={14} color={C.cyan} />
      <span style={{ fontSize: 13, fontWeight: 700, color: C.cyan }}>Saved</span>
    </div>
  )
}

export default function ArtistProfileEditorClient({ artist }: { artist: any }) {
  const router = useRouter()

  // Self-service fields
  const [bio, setBio]           = useState(artist.bio ?? '')
  const [avail, setAvail]       = useState(artist.availability_status ?? 'not_accepting')
  const [eventTypes, setEventTypes] = useState<string[]>(artist.event_types_accepted ?? [])
  const [youtube, setYoutube]   = useState(artist.media_links?.youtube    ?? '')
  const [soundcloud, setSoundcloud] = useState(artist.media_links?.soundcloud ?? '')
  const [spotify, setSpotify]   = useState(artist.media_links?.spotify    ?? '')
  const [instagram, setInstagram] = useState(artist.social_links?.instagram ?? '')
  const [facebook, setFacebook] = useState(artist.social_links?.facebook  ?? '')
  const [socialYt, setSocialYt] = useState(artist.social_links?.youtube   ?? '')

  // Gallery state
  const [gallery, setGallery]   = useState<string[]>(artist.gallery_urls ?? [])
  const [profilePhoto, setProfilePhoto] = useState<string | null>(artist.profile_photo_url ?? null)
  const [pressKitPath, setPressKitPath] = useState<string | null>(artist.press_kit_url ?? null)

  // UI state
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [uploadingGallery, setUploadingGallery] = useState(false)
  const [uploadingKit, setUploadingKit]   = useState(false)
  const [fieldError, setFieldError] = useState<string | null>(null)

  const photoRef   = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)
  const kitRef     = useRef<HTMLInputElement>(null)

  function toggleEventType(t: string) {
    setEventTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])
  }

  async function handleSave() {
    setSaving(true)
    setFieldError(null)
    const fd = new FormData()
    fd.append('bio',                  bio)
    fd.append('availability_status',  avail)
    eventTypes.forEach(t => fd.append('event_types_accepted', t))
    fd.append('youtube',    youtube)
    fd.append('soundcloud', soundcloud)
    fd.append('spotify',    spotify)
    fd.append('instagram',  instagram)
    fd.append('facebook',   facebook)
    fd.append('social_youtube', socialYt)
    const res = await updateArtistSelfService(artist.id, fd)
    setSaving(false)
    if (res.error) { setFieldError(res.error); return }
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingPhoto(true)
    const fd = new FormData()
    fd.append('file', file)
    const res = await uploadArtistPhoto(artist.id, fd)
    setUploadingPhoto(false)
    if (res.error) { setFieldError(res.error); return }
    setProfilePhoto(res.url ?? null)
  }

  async function handleGalleryUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setUploadingGallery(true)
    for (const file of files) {
      const fd = new FormData()
      fd.append('file', file)
      const res = await uploadGalleryImage(artist.id, fd)
      if (res.error) { setFieldError(res.error); break }
      if (res.url) setGallery(prev => [...prev, res.url!])
    }
    setUploadingGallery(false)
  }

  async function handleRemoveGallery(url: string) {
    const res = await removeGalleryImage(artist.id, url)
    if (!res.error) setGallery(prev => prev.filter(u => u !== url))
  }

  async function handlePressKitUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingKit(true)
    const fd = new FormData()
    fd.append('file', file)
    const res = await uploadPressKit(artist.id, fd)
    setUploadingKit(false)
    if (res.error) { setFieldError(res.error); return }
    setPressKitPath(res.path ?? null)
  }

  async function handleViewPressKit() {
    const res = await getPressKitSignedUrl(artist.id)
    if (res.url) window.open(res.url, '_blank')
  }

  const STATUS_BADGE: Record<string, string> = { draft: '#F6C90E', published: C.cyan, suspended: '#FC8181' }

  return (
    <div style={{ padding: '24px', maxWidth: 680 }}>
      <SaveBanner saved={saved} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <button onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: C.muted, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>
          <ChevronLeft size={14} /> Roster
        </button>
        <span style={{ color: 'rgba(255,255,255,0.15)' }}>/</span>
        <span style={{ fontSize: 13, fontWeight: 700 }}>{artist.name}</span>
        <span style={{ padding: '2px 8px', borderRadius: 5, background: `${STATUS_BADGE[artist.profile_status]}15`, fontSize: 10, fontWeight: 800, color: STATUS_BADGE[artist.profile_status], textTransform: 'uppercase', letterSpacing: '0.4px' }}>{artist.profile_status}</span>
        <a href={`/artists/${artist.slug}`} target="_blank" rel="noopener noreferrer" style={{ marginLeft: 'auto', fontSize: 12, color: C.muted, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
          Public Profile <ExternalLink size={11} />
        </a>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>

        {/* ── Profile photo ── */}
        <section style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24 }}>
          <SectionHeader title="Profile Photo" sub="Square image recommended. Shown on artist cards and the public profile hero." />
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
            <div style={{ width: 100, height: 100, borderRadius: 14, overflow: 'hidden', background: `linear-gradient(135deg, #0D1117, #1a0a2e)`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {profilePhoto
                ? <img src={profilePhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: 32, fontWeight: 900, opacity: 0.1 }}>{artist.name[0]}</span>
              }
            </div>
            <div>
              <input ref={photoRef} type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
              <button onClick={() => photoRef.current?.click()} disabled={uploadingPhoto} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 10, background: `${C.cyan}10`, border: `1px solid ${C.cyan}25`, color: C.cyan, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: uploadingPhoto ? 0.6 : 1 }}>
                <Upload size={13} /> {uploadingPhoto ? 'Uploading…' : profilePhoto ? 'Replace Photo' : 'Upload Photo'}
              </button>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', margin: '8px 0 0' }}>JPG, PNG or WEBP · Max 10 MB</p>
            </div>
          </div>
        </section>

        {/* ── Bio & availability ── */}
        <section style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24 }}>
          <SectionHeader title="Bio & Availability" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <Field label="Artist Bio">
              <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell organisers about this artist — background, style, achievements…" rows={5} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.65 }} />
            </Field>

            <Field label="Booking Availability">
              <div style={{ display: 'flex', gap: 8 }}>
                {AVAIL_OPTS.map(opt => (
                  <button key={opt.value} type="button" onClick={() => setAvail(opt.value)} style={{ flex: 1, padding: '9px 0', borderRadius: 10, fontSize: 12, fontWeight: avail === opt.value ? 700 : 500, background: avail === opt.value ? `${opt.color}12` : 'rgba(255,255,255,0.03)', border: `1px solid ${avail === opt.value ? opt.color + '40' : 'rgba(255,255,255,0.07)'}`, color: avail === opt.value ? opt.color : C.muted, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Event Types Accepted">
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {EVENT_TYPES.map(t => {
                  const active = eventTypes.includes(t)
                  return (
                    <button key={t} type="button" onClick={() => toggleEventType(t)} style={{ padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: active ? 700 : 500, background: active ? `${C.magenta}12` : 'rgba(255,255,255,0.03)', border: `1px solid ${active ? C.magenta + '35' : 'rgba(255,255,255,0.07)'}`, color: active ? C.magenta : C.muted, cursor: 'pointer', fontFamily: 'inherit' }}>
                      {t}
                    </button>
                  )
                })}
              </div>
            </Field>
          </div>
        </section>

        {/* ── Media links ── */}
        <section style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24 }}>
          <SectionHeader title="Media Links" sub="Paste full URLs — YouTube video or channel, SoundCloud track or profile, Spotify artist or track." />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { label: 'YouTube URL',    value: youtube,    set: setYoutube,    placeholder: 'https://youtube.com/watch?v=…' },
              { label: 'SoundCloud URL', value: soundcloud, set: setSoundcloud, placeholder: 'https://soundcloud.com/artist/track' },
              { label: 'Spotify URL',    value: spotify,    set: setSpotify,    placeholder: 'https://open.spotify.com/artist/…' },
            ].map(f => (
              <Field key={f.label} label={f.label}>
                <input value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.placeholder} style={inputStyle} type="url" />
              </Field>
            ))}
          </div>
        </section>

        {/* ── Social links ── */}
        <section style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24 }}>
          <SectionHeader title="Social Links" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { label: 'Instagram',      value: instagram,  set: setInstagram,  placeholder: 'https://instagram.com/artistname' },
              { label: 'Facebook',       value: facebook,   set: setFacebook,   placeholder: 'https://facebook.com/artistname' },
              { label: 'YouTube (Social)', value: socialYt, set: setSocialYt,   placeholder: 'https://youtube.com/@artistname' },
            ].map(f => (
              <Field key={f.label} label={f.label}>
                <input value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.placeholder} style={inputStyle} type="url" />
              </Field>
            ))}
          </div>
        </section>

        {/* ── Save button ── */}
        {fieldError && (
          <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(252,129,129,0.08)', border: '1px solid rgba(252,129,129,0.2)', fontSize: 13, color: '#FC8181' }}>{fieldError}</div>
        )}
        <button onClick={handleSave} disabled={saving} style={{ padding: '13px 0', borderRadius: 12, background: `linear-gradient(135deg, ${C.cyan}, ${C.magenta})`, border: 'none', color: C.black, fontSize: 14, fontWeight: 800, cursor: saving ? 'wait' : 'pointer', fontFamily: 'inherit', opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Saving…' : 'Save Changes'}
        </button>

        {/* ── Gallery ── */}
        <section style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24 }}>
          <SectionHeader title="Photo Gallery" sub="Up to 12 images shown on the public profile. Landscape or square works best." />
          <input ref={galleryRef} type="file" accept="image/*" multiple onChange={handleGalleryUpload} style={{ display: 'none' }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10, marginBottom: gallery.length < 12 ? 14 : 0 }}>
            {gallery.map(url => (
              <div key={url} style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', aspectRatio: '4/3' }}>
                <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                <button onClick={() => handleRemoveGallery(url)} style={{ position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: 12, background: 'rgba(0,0,0,0.75)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}>
                  <X size={12} color="#FC8181" />
                </button>
              </div>
            ))}
          </div>
          {gallery.length < 12 && (
            <button onClick={() => galleryRef.current?.click()} disabled={uploadingGallery} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: C.muted, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: uploadingGallery ? 0.6 : 1 }}>
              <Image size={13} /> {uploadingGallery ? 'Uploading…' : `Add Photos (${gallery.length}/12)`}
            </button>
          )}
        </section>

        {/* ── Press kit ── */}
        <section style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24 }}>
          <SectionHeader title="Press Kit" sub="PDF only · Max 20 MB · Private — only visible to verified organisers via a time-limited link." />
          <input ref={kitRef} type="file" accept="application/pdf" onChange={handlePressKitUpload} style={{ display: 'none' }} />
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={() => kitRef.current?.click()} disabled={uploadingKit} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 10, background: `${C.cyan}08`, border: `1px solid ${C.cyan}20`, color: C.cyan, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: uploadingKit ? 0.6 : 1 }}>
              <Upload size={13} /> {uploadingKit ? 'Uploading…' : pressKitPath ? 'Replace PDF' : 'Upload Press Kit PDF'}
            </button>
            {pressKitPath && (
              <button onClick={handleViewPressKit} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: C.muted, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                <FileText size={13} /> View Current PDF <ExternalLink size={11} />
              </button>
            )}
          </div>
          {pressKitPath && <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', margin: '10px 0 0' }}>✓ Press kit uploaded</p>}
        </section>

      </div>
    </div>
  )
}
