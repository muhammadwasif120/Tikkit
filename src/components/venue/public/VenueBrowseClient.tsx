'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { MapPin, Search, Calendar, Clock3 } from 'lucide-react'

const C = { emerald: '#00D4AA', violet: '#7C3AED', surface: '#0A0F14', border: 'rgba(0,212,170,0.12)', muted: 'rgba(255,255,255,0.4)' }

const CATEGORY_LABELS: Record<string, string> = {
  studio:'Studio', court:'Court', hall:'Hall', rooftop:'Rooftop',
  garden:'Garden', restaurant:'Restaurant', cafe:'Café', coworking:'Co-work',
  gym:'Gym', pool:'Pool', theatre:'Theatre', gallery:'Gallery', other:'Other',
}

type Venue = {
  id: string; name: string; slug: string; city: string; categories: string[]
  description: string | null; photos: string[]; capacity: number | null
  programmes?: { id: string; title: string; price: number; active: boolean }[]
  resources?:  { id: string; name: string; active: boolean }[]
}

export default function VenueBrowseClient({ venues }: { venues: Venue[] }) {
  const [search, setSearch]   = useState('')
  const [cityFilter, setCity] = useState('All')
  const [catFilter,  setCat]  = useState('All')

  const cities = useMemo(() => {
    const s = new Set(venues.map(v => v.city))
    return ['All', ...Array.from(s).sort()]
  }, [venues])

  const allCats = useMemo(() => {
    const s = new Set(venues.flatMap(v => v.categories))
    return ['All', ...Array.from(s).sort()]
  }, [venues])

  const filtered = useMemo(() => venues.filter(v => {
    const q = search.toLowerCase()
    const matchSearch = !q || v.name.toLowerCase().includes(q) || v.city.toLowerCase().includes(q) || v.description?.toLowerCase().includes(q)
    const matchCity = cityFilter === 'All' || v.city === cityFilter
    const matchCat  = catFilter === 'All'  || v.categories.includes(catFilter)
    return matchSearch && matchCity && matchCat
  }), [venues, search, cityFilter, catFilter])

  return (
    <div style={{ minHeight: '100vh', background: '#050508', fontFamily: 'var(--font-body, "DM Sans", sans-serif)', color: '#fff' }}>
      {/* Hero */}
      <div style={{ background: `linear-gradient(180deg, rgba(0,212,170,0.08) 0%, transparent 100%)`, borderBottom: `1px solid ${C.border}`, padding: '60px 24px 40px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: `linear-gradient(135deg, ${C.emerald}, ${C.violet})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MapPin size={16} color="#050508" strokeWidth={2.5} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 800, color: C.emerald, textTransform: 'uppercase', letterSpacing: '1px' }}>Tikkit X · Venues</span>
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 900, margin: '0 0 12px', letterSpacing: '-1px' }}>
            Find a venue
          </h1>
          <p style={{ color: C.muted, fontSize: 16, margin: '0 0 28px' }}>
            Book programmes, classes, and spaces across Pakistan
          </p>

          {/* Search */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
              <Search size={15} color={C.muted} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search venues…"
                style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: `1px solid ${C.border}`, borderRadius: 12, padding: '11px 14px 11px 38px', color: '#fff', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <select value={cityFilter} onChange={e => setCity(e.target.value)} style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${C.border}`, borderRadius: 12, padding: '11px 14px', color: '#fff', fontSize: 14, fontFamily: 'inherit', outline: 'none', cursor: 'pointer' }}>
              {cities.map(c => <option key={c} value={c}>{c === 'All' ? 'All Cities' : c}</option>)}
            </select>
            <select value={catFilter} onChange={e => setCat(e.target.value)} style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${C.border}`, borderRadius: 12, padding: '11px 14px', color: '#fff', fontSize: 14, fontFamily: 'inherit', outline: 'none', cursor: 'pointer' }}>
              {allCats.map(c => <option key={c} value={c}>{c === 'All' ? 'All Types' : CATEGORY_LABELS[c] ?? c}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Listings */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '36px 24px 64px' }}>
        <p style={{ color: C.muted, fontSize: 13, marginBottom: 24 }}>
          {filtered.length} venue{filtered.length !== 1 ? 's' : ''} found
        </p>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <MapPin size={40} color="rgba(255,255,255,0.08)" style={{ marginBottom: 16 }} />
            <p style={{ color: C.muted, fontSize: 14 }}>No venues match your search.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, alignItems: 'stretch' }}>
            {filtered.map(v => {
              const activeProgs = (v.programmes ?? []).filter(p => p.active)
              const activeRes   = (v.resources  ?? []).filter(r => r.active)
              return (
                <Link key={v.id} href={`/venue/${v.slug}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex' }}>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 18, overflow: 'hidden', transition: 'border-color 0.15s, transform 0.15s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(0,212,170,0.3)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = C.border; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)' }}
                  >
                    {/* Thumbnail — fixed height, always rendered */}
                    <div style={{ height: 168, flexShrink: 0, background: `linear-gradient(135deg, rgba(0,212,170,0.12), rgba(124,58,237,0.12))`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      {v.photos.length > 0
                        ? <img src={v.photos[0]} alt={v.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <MapPin size={32} color="rgba(0,212,170,0.3)" />
                      }
                    </div>

                    {/* Body — grows to fill remaining height */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '18px 20px 20px' }}>
                      <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 6px', color: '#fff', letterSpacing: '-0.2px' }}>{v.name}</h3>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                        <MapPin size={11} color={C.muted} />
                        <span style={{ fontSize: 12, color: C.muted }}>{v.city}</span>
                      </div>

                      {/* Category pills — fixed row, always same height */}
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 12, minHeight: 22 }}>
                        {v.categories.slice(0, 3).map(cat => (
                          <span key={cat} style={{ fontSize: 10, fontWeight: 600, color: C.emerald, background: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.15)', borderRadius: 20, padding: '2px 8px' }}>
                            {CATEGORY_LABELS[cat] ?? cat}
                          </span>
                        ))}
                      </div>

                      {/* Description — always 2-line reserved block */}
                      <p style={{ fontSize: 12, color: C.muted, margin: '0 0 0', lineHeight: 1.55, flex: 1,
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                        minHeight: '2.4em',
                      }}>
                        {v.description ?? ''}
                      </p>

                      {/* Stats — always pinned to bottom */}
                      {(activeProgs.length > 0 || activeRes.length > 0) && (
                        <div style={{ display: 'flex', gap: 12, marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                          {activeProgs.length > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                              <Calendar size={12} color={C.violet} />
                              <span style={{ fontSize: 11, color: C.muted }}>{activeProgs.length} programme{activeProgs.length !== 1 ? 's' : ''}</span>
                            </div>
                          )}
                          {activeRes.length > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                              <Clock3 size={12} color={C.emerald} />
                              <span style={{ fontSize: 11, color: C.muted }}>{activeRes.length} space{activeRes.length !== 1 ? 's' : ''}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
