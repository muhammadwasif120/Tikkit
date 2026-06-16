'use client'

import Link from 'next/link'
import { MapPin, ChevronRight, Users, CalendarDays, Clock3 } from 'lucide-react'

type Venue = {
  id: string
  name: string
  slug: string
  city: string
  categories: string[]
  photos: string[]
  capacity: number | null
  programme_count: number
  resource_count: number
}

const CATEGORY_LABELS: Record<string, string> = {
  studio:'Studio', court:'Court', hall:'Hall', rooftop:'Rooftop',
  garden:'Garden', restaurant:'Restaurant', cafe:'Café', coworking:'Co-work',
  gym:'Gym', pool:'Pool', theatre:'Theatre', gallery:'Gallery', other:'Other',
}

const CAT_COLOR: Record<string, string> = {
  studio:'#00D4AA', court:'#FC8181', hall:'#7C3AED', rooftop:'#F6C90E',
  garden:'#48BB78', restaurant:'#F97316', cafe:'#F97316', coworking:'#60A5FA',
  gym:'#FC8181', pool:'#60A5FA', theatre:'#A78BFA', gallery:'#F472B6', other:'rgba(255,255,255,0.4)',
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

export default function VenuesStrip({ venues }: { venues: Venue[] }) {
  if (!venues.length) return null

  return (
    <section style={{ marginBottom: 40 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, paddingRight: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <MapPin size={13} color="#A78BFA" strokeWidth={2.5} />
          </div>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--guest-text, #F0F4FF)', letterSpacing: '-0.3px' }}>
            Venues
          </h2>
        </div>
        <Link href="/venues" style={{
          display: 'flex', alignItems: 'center', gap: 4,
          fontSize: 12, fontWeight: 700, color: '#A78BFA', textDecoration: 'none',
        }}>
          All <ChevronRight size={13} />
        </Link>
      </div>

      {/* Horizontal scroll */}
      <div style={{
        display: 'flex', gap: 10,
        overflowX: 'auto', paddingBottom: 4,
        scrollbarWidth: 'none',
        WebkitOverflowScrolling: 'touch',
      }}>
        {venues.map(v => {
          const cat = v.categories[0] ?? 'other'
          const accentColor = CAT_COLOR[cat] ?? 'rgba(255,255,255,0.4)'
          const ini = initials(v.name)

          return (
            <Link
              key={v.id}
              href={`/venue/${v.slug}`}
              style={{ textDecoration: 'none', color: 'inherit', flexShrink: 0 }}
            >
              <div
                style={{
                  width: 190,
                  background: 'var(--guest-card, #101620)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 16, overflow: 'hidden',
                  transition: 'border-color 0.15s, transform 0.15s',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = `${accentColor}55`
                  ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.06)'
                  ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'
                }}
              >
                {/* Thumbnail / gradient header */}
                <div style={{
                  height: 90, position: 'relative', overflow: 'hidden',
                  background: v.photos[0]
                    ? 'none'
                    : `linear-gradient(135deg, ${accentColor}28, rgba(124,58,237,0.15))`,
                }}>
                  {v.photos[0] ? (
                    <img src={v.photos[0]} alt={v.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  ) : (
                    <div style={{
                      position: 'absolute', inset: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 12,
                        background: `linear-gradient(135deg, ${accentColor}, #7C3AED)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 15, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px',
                      }}>
                        {ini}
                      </div>
                    </div>
                  )}

                  {/* Gradient overlay on photo */}
                  {v.photos[0] && (
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(6,8,12,0.7), transparent 60%)' }} />
                  )}

                  {/* Category chip */}
                  {v.categories.length > 0 && (
                    <span style={{
                      position: 'absolute', top: 7, left: 8,
                      fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.4px',
                      color: accentColor,
                      background: `${accentColor}20`,
                      border: `1px solid ${accentColor}40`,
                      borderRadius: 20, padding: '2px 6px',
                      backdropFilter: 'blur(8px)',
                    }}>
                      {CATEGORY_LABELS[cat] ?? cat}
                    </span>
                  )}
                </div>

                {/* Body */}
                <div style={{ padding: '10px 12px 12px' }}>
                  <p style={{
                    margin: '0 0 4px', fontSize: 13, fontWeight: 800,
                    color: 'var(--guest-text, #F0F4FF)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {v.name}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
                    <MapPin size={10} color="rgba(255,255,255,0.3)" />
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {v.city}
                    </span>
                  </div>

                  {/* Stats row */}
                  <div style={{ display: 'flex', gap: 10 }}>
                    {v.programme_count > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <CalendarDays size={10} color={accentColor} />
                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
                          {v.programme_count} prog
                        </span>
                      </div>
                    )}
                    {v.resource_count > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock3 size={10} color="#A78BFA" />
                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
                          {v.resource_count} space{v.resource_count !== 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                    {v.capacity && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Users size={10} color="rgba(255,255,255,0.3)" />
                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
                          {v.capacity}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
