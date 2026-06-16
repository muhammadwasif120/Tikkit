'use client'

import { useState, useActionState } from 'react'
import { createVenue } from '@/app/actions/venueActions'
import { MapPin } from 'lucide-react'

const C = { emerald: '#00D4AA', violet: '#7C3AED', surface: '#0A0F14', border: 'rgba(0,212,170,0.12)', muted: 'rgba(255,255,255,0.4)' }

const CATEGORIES = [
  { value: 'studio',     label: 'Studio',        emoji: '🎵' },
  { value: 'court',      label: 'Court / Sports', emoji: '🏸' },
  { value: 'hall',       label: 'Hall / Ballroom',emoji: '🏛️' },
  { value: 'rooftop',    label: 'Rooftop',        emoji: '🌆' },
  { value: 'garden',     label: 'Garden',         emoji: '🌿' },
  { value: 'restaurant', label: 'Restaurant',     emoji: '🍽️' },
  { value: 'cafe',       label: 'Café',           emoji: '☕' },
  { value: 'coworking',  label: 'Co-working',     emoji: '💻' },
  { value: 'gym',        label: 'Gym / Fitness',  emoji: '🏋️' },
  { value: 'pool',       label: 'Pool',           emoji: '🏊' },
  { value: 'theatre',    label: 'Theatre / Stage', emoji: '🎭' },
  { value: 'gallery',    label: 'Gallery',        emoji: '🖼️' },
  { value: 'other',      label: 'Other',          emoji: '📍' },
]

const input: React.CSSProperties = {
  width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 12, padding: '12px 16px', color: '#fff', fontSize: 15,
  fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none',
}
const label: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 700, color: C.muted,
  textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8,
}

export default function VenueOnboardingClient() {
  const [selectedCats, setSelectedCats] = useState<string[]>([])
  const [state, action, pending] = useActionState(
    async (_: unknown, fd: FormData) => {
      selectedCats.forEach(c => fd.append('categories', c))
      const result = await createVenue(fd)
      return result
    },
    null
  )

  const toggleCat = (cat: string) => {
    setSelectedCats(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat])
  }

  return (
    <div style={{ minHeight: '100vh', background: '#050508', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', fontFamily: 'var(--font-body, "DM Sans", sans-serif)' }}>
      <div style={{ width: '100%', maxWidth: 560 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: `linear-gradient(135deg, ${C.emerald}, ${C.violet})`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <MapPin size={24} color="#050508" strokeWidth={2.5} />
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 900, margin: '0 0 10px', letterSpacing: '-0.5px', color: '#fff' }}>
            List your venue
          </h1>
          <p style={{ color: C.muted, fontSize: 15, margin: 0 }}>
            Create programmes & offer slot bookings on Tikkit X
          </p>
        </div>

        {/* Form card */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, padding: '36px 32px' }}>
          {state?.error && (
            <div style={{ background: 'rgba(252,129,129,0.1)', border: '1px solid rgba(252,129,129,0.25)', borderRadius: 10, padding: '10px 14px', marginBottom: 24, color: '#FC8181', fontSize: 13 }}>
              {state.error}
            </div>
          )}

          <form action={action}>
            <div style={{ marginBottom: 24 }}>
              <label style={label}>Venue Name *</label>
              <input name="name" required placeholder="e.g. The Karachi Sports Club" style={input} />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={label}>City *</label>
              <input name="city" required placeholder="Karachi, Lahore, Islamabad…" style={input} />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={label}>Venue Type (pick all that apply)</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.value} type="button" onClick={() => toggleCat(cat.value)}
                    style={{ padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: selectedCats.includes(cat.value) ? 700 : 500, background: selectedCats.includes(cat.value) ? 'rgba(0,212,170,0.12)' : 'rgba(255,255,255,0.04)', border: `1px solid ${selectedCats.includes(cat.value) ? 'rgba(0,212,170,0.3)' : 'rgba(255,255,255,0.08)'}`, color: selectedCats.includes(cat.value) ? C.emerald : C.muted, cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    {cat.emoji} {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={label}>Address</label>
              <input name="address" placeholder="Street address" style={input} />
            </div>

            <div style={{ marginBottom: 32 }}>
              <label style={label}>Phone (optional)</label>
              <input name="phone" placeholder="+92 3xx xxxxxxx" style={input} />
            </div>

            <button type="submit" disabled={pending} style={{ width: '100%', padding: '14px', borderRadius: 12, background: `linear-gradient(135deg, ${C.emerald}, ${C.violet})`, color: '#050508', fontSize: 15, fontWeight: 900, border: 'none', cursor: pending ? 'not-allowed' : 'pointer', opacity: pending ? 0.7 : 1, fontFamily: 'inherit', letterSpacing: '-0.2px' }}>
              {pending ? 'Setting up your venue…' : 'Create My Venue →'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', color: C.muted, fontSize: 12, marginTop: 20 }}>
          You can edit all details and add photos from your venue dashboard.
        </p>
      </div>
    </div>
  )
}
