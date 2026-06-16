'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, Mic2, Music, Laugh, MapPin, CheckCircle2 } from 'lucide-react'

const C = {
  black:   '#050508',
  cyan:    '#00E5FF',
  magenta: '#CC00FF',
  surface: '#0D1117',
  border:  'rgba(0,229,255,0.08)',
  muted:   'rgba(255,255,255,0.4)',
  text:    '#FFFFFF',
}

const CATEGORIES = [
  { value: null,       label: 'All Artists', icon: Mic2   },
  { value: 'dj',       label: 'DJs',         icon: Music  },
  { value: 'musician', label: 'Musicians',   icon: Music  },
  { value: 'comedian', label: 'Comedians',   icon: Laugh  },
]

const AVAIL_COLORS: Record<string, string> = {
  accepting:     '#00E5FF',
  limited:       '#F6C90E',
  not_accepting: '#FC8181',
}
const AVAIL_LABELS: Record<string, string> = {
  accepting:     'Accepting Bookings',
  limited:       'Limited Availability',
  not_accepting: 'Not Accepting Bookings',
}

const CAT_ICON: Record<string, typeof Mic2> = {
  dj: Music, musician: Music, comedian: Laugh,
}
const CAT_LABEL: Record<string, string> = {
  dj: 'DJ', musician: 'Musician / Band', comedian: 'Comedian',
}

export default function ArtistDirectoryClient({
  artists, userId, isVerifiedOrganiser, category: initialCategory,
}: {
  artists: any[]
  userId: string | null
  isVerifiedOrganiser: boolean
  category: string | null
}) {
  const [search, setSearch]   = useState('')
  const [category, setCategory] = useState<string | null>(initialCategory)

  const filtered = artists.filter(a => {
    const matchCat = !category || a.category === category
    const matchSearch = !search || a.name.toLowerCase().includes(search.toLowerCase())
      || (a.sub_tags ?? []).some((t: string) => t.toLowerCase().includes(search.toLowerCase()))
      || (a.based_in_city ?? '').toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  return (
    <div style={{ minHeight: '100vh', background: C.black, color: C.text, fontFamily: 'var(--font-body, "DM Sans", sans-serif)' }}>

      {/* Header */}
      <div style={{ borderBottom: `1px solid ${C.border}`, background: C.surface }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: `linear-gradient(135deg, ${C.cyan}, ${C.magenta})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Mic2 size={14} color="#050508" strokeWidth={2.5} />
            </div>
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase', background: `linear-gradient(90deg, ${C.cyan}, ${C.magenta})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>TIKKIT X · ARTISTS</span>
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 900, margin: '0 0 8px', letterSpacing: '-1px' }}>
            {category === 'dj' ? 'DJs' : category === 'musician' ? 'Musicians & Bands' : category === 'comedian' ? 'Comedians' : 'Artist Roster'}
          </h1>
          <p style={{ color: C.muted, fontSize: 15, margin: '0 0 28px' }}>Every artist on Tikkit X is verified and actively accepting bookings.</p>

          {/* Search */}
          <div style={{ position: 'relative', maxWidth: 480, marginBottom: 20 }}>
            <Search size={15} color={C.muted} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, genre, or city…"
              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`, borderRadius: 12, padding: '11px 14px 11px 40px', color: C.text, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          {/* Category pills */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {CATEGORIES.map(cat => {
              const active = category === cat.value
              return (
                <Link
                  key={String(cat.value)}
                  href={cat.value ? `/artists/${cat.value === 'dj' ? 'djs' : cat.value === 'musician' ? 'musicians' : 'comedians'}` : '/artists'}
                  onClick={() => setCategory(cat.value)}
                  style={{ padding: '7px 16px', borderRadius: 20, fontSize: 13, fontWeight: active ? 700 : 500, textDecoration: 'none', background: active ? `linear-gradient(135deg, ${C.cyan}22, ${C.magenta}22)` : 'rgba(255,255,255,0.04)', border: `1px solid ${active ? C.cyan + '40' : 'rgba(255,255,255,0.08)'}`, color: active ? C.cyan : C.muted, transition: 'all 0.15s' }}
                >
                  {cat.label}
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px 64px' }}>
        <p style={{ fontSize: 13, color: C.muted, marginBottom: 24 }}>{filtered.length} artist{filtered.length !== 1 ? 's' : ''}</p>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <Mic2 size={40} color="rgba(255,255,255,0.06)" style={{ marginBottom: 12 }} />
            <p style={{ color: C.muted, fontSize: 14 }}>No artists found{search ? ` for "${search}"` : ''}.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
            {filtered.map(artist => {
              const CatIcon = CAT_ICON[artist.category] ?? Mic2
              const availColor = AVAIL_COLORS[artist.availability_status] ?? C.muted
              return (
                <Link key={artist.id} href={`/artists/${artist.slug}`} style={{ textDecoration: 'none', display: 'block', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden', transition: 'all 0.2s', color: C.text }}>
                  {/* Photo */}
                  <div style={{ height: 200, background: `linear-gradient(135deg, #0D1117, #1a0a2e)`, position: 'relative', overflow: 'hidden' }}>
                    {artist.profile_photo_url ? (
                      <img src={artist.profile_photo_url} alt={artist.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: 52, fontWeight: 900, opacity: 0.12 }}>{artist.name[0]}</span>
                      </div>
                    )}
                    {/* Availability dot */}
                    <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(5,5,8,0.85)', borderRadius: 20, padding: '4px 10px' }}>
                      <div style={{ width: 6, height: 6, borderRadius: 3, background: availColor }} />
                      <span style={{ fontSize: 10, fontWeight: 600, color: availColor }}>{AVAIL_LABELS[artist.availability_status]}</span>
                    </div>
                    {/* Verified badge */}
                    {artist.verified && (
                      <div style={{ position: 'absolute', bottom: 12, left: 12 }}>
                        <CheckCircle2 size={18} color={C.cyan} fill={`${C.cyan}22`} />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ padding: '16px 18px' }}>
                    <p style={{ fontSize: 17, fontWeight: 800, margin: '0 0 4px', letterSpacing: '-0.3px' }}>{artist.name}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: C.cyan, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{CAT_LABEL[artist.category]}</span>
                      {artist.based_in_city && (
                        <>
                          <span style={{ color: 'rgba(255,255,255,0.15)' }}>·</span>
                          <span style={{ fontSize: 12, color: C.muted, display: 'flex', alignItems: 'center', gap: 3 }}>
                            <MapPin size={10} /> {artist.based_in_city}
                          </span>
                        </>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {(artist.sub_tags ?? []).slice(0, 3).map((tag: string) => (
                        <span key={tag} style={{ padding: '3px 8px', borderRadius: 6, background: `${C.magenta}12`, border: `1px solid ${C.magenta}25`, fontSize: 11, color: `${C.magenta}cc` }}>{tag}</span>
                      ))}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ borderTop: `1px solid ${C.border}`, padding: '20px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', margin: 0 }}>
          Powered by <span style={{ background: `linear-gradient(90deg, ${C.cyan}, ${C.magenta})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 700 }}>Tikkit X</span>
        </p>
      </div>
    </div>
  )
}
