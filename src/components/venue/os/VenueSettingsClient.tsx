'use client'

import { useState } from 'react'
import { updateVenue } from '@/app/actions/venueActions'
import Link from 'next/link'
import { ExternalLink } from 'lucide-react'

const C = { emerald: '#00D4AA', surface: '#0A0F14', border: 'rgba(0,212,170,0.12)', muted: 'rgba(255,255,255,0.4)' }

const CATEGORIES = [
  'studio','court','hall','rooftop','garden','restaurant',
  'cafe','coworking','gym','pool','theatre','gallery','other',
] as const

const CATEGORY_LABELS: Record<string, string> = {
  studio:'Studio', court:'Court / Sports', hall:'Hall', rooftop:'Rooftop',
  garden:'Garden', restaurant:'Restaurant', cafe:'Café', coworking:'Co-working',
  gym:'Gym', pool:'Pool', theatre:'Theatre / Stage', gallery:'Gallery', other:'Other',
}

const input: React.CSSProperties = {
  width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 10, padding: '10px 14px', color: '#fff', fontSize: 14,
  fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none',
}
const label: React.CSSProperties = {
  display: 'block', fontSize: 10, fontWeight: 700, color: C.muted,
  textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6,
}
const row: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }
const card: React.CSSProperties = { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 28, marginBottom: 20 }

type Venue = {
  id: string; name: string; slug: string; city: string; address: string | null
  categories: string[]; description: string | null; phone: string | null
  instagram: string | null; website: string | null; capacity: number | null; verified: boolean
}

export default function VenueSettingsClient({ venue }: { venue: Venue }) {
  const [selectedCats, setSelectedCats] = useState<string[]>(venue.categories ?? [])
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const toggleCat = (cat: string) => {
    setSelectedCats(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat])
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setPending(true)
    setSaved(false)
    setError(null)
    const fd = new FormData(e.currentTarget)
    selectedCats.forEach(c => fd.append('categories', c))
    const result = await updateVenue(fd)
    if (result?.error) {
      setError(result.error)
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
    setPending(false)
  }

  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, margin: '0 0 4px', letterSpacing: '-0.5px' }}>Settings</h1>
          <p style={{ color: C.muted, fontSize: 13, margin: 0 }}>Manage your venue profile and public listing.</p>
        </div>
        <Link href={`/venue/${venue.slug}`} target="_blank" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, background: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.2)', color: C.emerald, fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
          <ExternalLink size={13} /> View Public Page
        </Link>
      </div>

      {venue.verified && (
        <div style={{ background: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.2)', borderRadius: 12, padding: '10px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>✓</span>
          <p style={{ fontSize: 13, color: C.emerald, margin: 0, fontWeight: 600 }}>Verified venue — your public listing shows a verification badge.</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {error && (
          <div style={{ background: 'rgba(252,129,129,0.1)', border: '1px solid rgba(252,129,129,0.25)', borderRadius: 10, padding: '10px 14px', marginBottom: 20, color: '#FC8181', fontSize: 13 }}>{error}</div>
        )}

        <div style={card}>
          <p style={{ fontSize: 14, fontWeight: 800, margin: '0 0 20px' }}>Venue Profile</p>

          <div style={row}>
            <div>
              <label style={label}>Venue Name *</label>
              <input name="name" required defaultValue={venue.name} style={input} />
            </div>
            <div>
              <label style={label}>City *</label>
              <input name="city" required defaultValue={venue.city} style={input} />
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={label}>Address</label>
            <input name="address" defaultValue={venue.address ?? ''} placeholder="Full street address" style={input} />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={label}>Categories</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {CATEGORIES.map(cat => (
                <button
                  key={cat} type="button" onClick={() => toggleCat(cat)}
                  style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: selectedCats.includes(cat) ? 700 : 500, background: selectedCats.includes(cat) ? 'rgba(0,212,170,0.12)' : 'rgba(255,255,255,0.04)', border: `1px solid ${selectedCats.includes(cat) ? 'rgba(0,212,170,0.3)' : 'rgba(255,255,255,0.08)'}`, color: selectedCats.includes(cat) ? C.emerald : C.muted, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  {CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={label}>Description</label>
            <textarea name="description" rows={4} defaultValue={venue.description ?? ''} placeholder="Tell guests what makes your venue special..." style={{ ...input, resize: 'vertical' }} />
          </div>

          <div style={row}>
            <div>
              <label style={label}>Phone</label>
              <input name="phone" defaultValue={venue.phone ?? ''} placeholder="+92 3xx xxxxxxx" style={input} />
            </div>
            <div>
              <label style={label}>Capacity</label>
              <input name="capacity" type="number" min="1" defaultValue={venue.capacity?.toString() ?? ''} placeholder="Max guests" style={input} />
            </div>
          </div>
        </div>

        <div style={card}>
          <p style={{ fontSize: 14, fontWeight: 800, margin: '0 0 20px' }}>Links</p>
          <div style={row}>
            <div>
              <label style={label}>Website</label>
              <input name="website" defaultValue={venue.website ?? ''} placeholder="https://yourvenue.com" style={input} />
            </div>
            <div>
              <label style={label}>Instagram</label>
              <input name="instagram" defaultValue={venue.instagram ?? ''} placeholder="@yourvenue" style={input} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button type="submit" disabled={pending} style={{ flex: 1, padding: '13px 20px', borderRadius: 12, background: C.emerald, color: '#050508', fontSize: 14, fontWeight: 800, border: 'none', cursor: pending ? 'not-allowed' : 'pointer', opacity: pending ? 0.7 : 1, fontFamily: 'inherit' }}>
            {pending ? 'Saving…' : 'Save Changes'}
          </button>
          {saved && <span style={{ fontSize: 13, color: C.emerald, fontWeight: 600 }}>✓ Saved</span>}
        </div>
      </form>
    </div>
  )
}
