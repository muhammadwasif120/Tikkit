'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Mic2, Info } from 'lucide-react'
import { createArtist } from '@/app/actions/artistActions'

const C = {
  black: '#050508', cyan: '#00E5FF', magenta: '#CC00FF',
  surface: '#0D1117', card: '#111820',
  border: 'rgba(0,229,255,0.08)', muted: 'rgba(255,255,255,0.4)', text: '#FFFFFF',
}

const CATEGORIES = [
  { value: 'dj',       label: 'DJ' },
  { value: 'musician', label: 'Musician / Band' },
  { value: 'comedian', label: 'Comedian' },
]

const inputStyle = {
  width: '100%', background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
  padding: '11px 14px', color: C.text, fontSize: 14,
  fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' as const,
}

function Field({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.muted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {label}{required && <span style={{ color: C.magenta, marginLeft: 2 }}>*</span>}
      </label>
      {children}
      {hint && <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: '5px 0 0' }}>{hint}</p>}
    </div>
  )
}

export default function AddArtistClient({ mgmtId }: { mgmtId: string }) {
  const router  = useRouter()
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [name, setName]       = useState('')
  const [category, setCategory] = useState('dj')
  const [subTags, setSubTags] = useState('')
  const [city, setCity]       = useState('')

  const slugPreview = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name || !category) return
    setSaving(true)
    setError(null)
    const fd = new FormData()
    fd.append('name',          name)
    fd.append('category',      category)
    fd.append('sub_tags',      subTags)
    fd.append('based_in_city', city)
    const res = await createArtist(fd)
    setSaving(false)
    if (res.error) { setError(res.error); return }
    router.push(`/artist-mgmt/os/roster/${res.artistId}/edit`)
  }

  return (
    <div style={{ padding: '24px', maxWidth: 560 }}>
      {/* Back */}
      <button onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: C.muted, background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 24, fontFamily: 'inherit' }}>
        <ChevronLeft size={14} /> Back to Roster
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${C.cyan}, ${C.magenta})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Mic2 size={16} color={C.black} strokeWidth={2.5} />
        </div>
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>New Artist</p>
          <p style={{ fontSize: 20, fontWeight: 900, margin: 0, letterSpacing: '-0.5px' }}>Add to Roster</p>
        </div>
      </div>

      {/* Info banner */}
      <div style={{ display: 'flex', gap: 10, padding: '12px 14px', borderRadius: 12, background: `${C.cyan}08`, border: `1px solid ${C.cyan}18`, marginBottom: 28 }}>
        <Info size={14} color={C.cyan} style={{ flexShrink: 0, marginTop: 1 }} />
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: 0, lineHeight: 1.6 }}>
          New artists are created as <strong style={{ color: 'rgba(255,255,255,0.7)' }}>drafts</strong>. The Tikkit X team will review and publish the profile. You can fill in bio, media, and photos now.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <Field label="Artist / Band Name" required hint={`Will appear as: /artists/${slugPreview || 'your-artist-name'}`}>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. DJ Camo" style={inputStyle} required />
        </Field>

        <Field label="Category" required>
          <div style={{ display: 'flex', gap: 8 }}>
            {CATEGORIES.map(cat => (
              <button key={cat.value} type="button" onClick={() => setCategory(cat.value)} style={{ flex: 1, padding: '10px 0', borderRadius: 10, fontSize: 13, fontWeight: category === cat.value ? 700 : 500, background: category === cat.value ? `${C.cyan}15` : 'rgba(255,255,255,0.04)', border: `1px solid ${category === cat.value ? C.cyan + '40' : 'rgba(255,255,255,0.08)'}`, color: category === cat.value ? C.cyan : C.muted, cursor: 'pointer', fontFamily: 'inherit' }}>
                {cat.label}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Genre / Style Tags" hint="Comma-separated: House, Techno, Deep House">
          <input value={subTags} onChange={e => setSubTags(e.target.value)} placeholder="e.g. House, Techno, Club" style={inputStyle} />
        </Field>

        <Field label="Based In (City)">
          <input value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. Karachi" style={inputStyle} />
        </Field>

        {error && (
          <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(252,129,129,0.08)', border: '1px solid rgba(252,129,129,0.2)', fontSize: 13, color: '#FC8181' }}>{error}</div>
        )}

        <button type="submit" disabled={!name || saving} style={{ padding: '13px 0', borderRadius: 12, background: name ? `linear-gradient(135deg, ${C.cyan}, ${C.magenta})` : 'rgba(255,255,255,0.05)', border: 'none', color: name ? C.black : C.muted, fontSize: 14, fontWeight: 800, cursor: name && !saving ? 'pointer' : 'not-allowed', fontFamily: 'inherit', marginTop: 8, opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Creating…' : 'Create Artist & Edit Profile →'}
        </button>
      </form>
    </div>
  )
}
