'use client'

import Link from 'next/link'
import { MapPin, Clock3, ChevronRight, Zap } from 'lucide-react'
import { format } from 'date-fns'

type Experience = {
  id: string
  title: string
  description: string | null
  category: string
  start_time: string
  duration_mins: number
  price: number
  cover_image: string | null
  tags: string[]
  next_dates: string[]
  venue: {
    name: string
    slug: string
    city: string
    categories: string[]
  } | null
}

const CATEGORY_COLOR: Record<string, string> = {
  fitness: '#00D4AA', wellness: '#00D4AA', yoga: '#00D4AA',
  music: '#7C3AED', arts: '#7C3AED', performance: '#7C3AED',
  food: '#F6C90E', dining: '#F6C90E',
  sports: '#FC8181', court: '#FC8181',
  education: '#60A5FA', workshop: '#60A5FA',
}
function catColor(cat: string) {
  return CATEGORY_COLOR[cat.toLowerCase()] ?? 'rgba(255,255,255,0.4)'
}

function fmt(n: number) {
  return n === 0 ? 'Free' : `PKR ${n.toLocaleString('en-PK')}`
}

export default function ExperiencesStrip({ experiences }: { experiences: Experience[] }) {
  if (!experiences.length) return null

  return (
    <section style={{ marginBottom: 40 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingRight: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: 'linear-gradient(135deg, #00D4AA, #7C3AED)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Zap size={13} color="#fff" strokeWidth={2.5} />
          </div>
          <h2 style={{
            margin: 0, fontSize: 16, fontWeight: 800,
            color: 'var(--guest-text, #F0F4FF)', letterSpacing: '-0.3px',
          }}>
            Experiences
          </h2>
        </div>
        <Link href="/venues" style={{
          display: 'flex', alignItems: 'center', gap: 4,
          fontSize: 12, fontWeight: 700, color: '#00D4AA', textDecoration: 'none',
        }}>
          All venues <ChevronRight size={13} />
        </Link>
      </div>

      {/* Horizontal scroll strip */}
      <div style={{
        display: 'flex', gap: 12,
        overflowX: 'auto', paddingBottom: 4,
        scrollbarWidth: 'none',
        WebkitOverflowScrolling: 'touch',
      }}>
        <style>{`.exp-strip::-webkit-scrollbar { display: none; }`}</style>
        {experiences.map(exp => {
          const venueHref = exp.venue ? `/venue/${exp.venue.slug}#prog-${exp.id}` : '/venues'
          const col = catColor(exp.category)

          return (
            <Link
              key={exp.id}
              href={venueHref}
              style={{ textDecoration: 'none', color: 'inherit', flexShrink: 0 }}
            >
              <div style={{
                width: 220,
                background: 'var(--guest-card, #101620)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 18, overflow: 'hidden',
                transition: 'border-color 0.15s, transform 0.15s',
                cursor: 'pointer',
              }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(0,212,170,0.25)'
                  ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.06)'
                  ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'
                }}
              >
                {/* Thumbnail */}
                <div style={{
                  height: 120, position: 'relative', overflow: 'hidden',
                  background: exp.cover_image
                    ? 'none'
                    : `linear-gradient(135deg, ${col}22, rgba(124,58,237,0.15))`,
                }}>
                  {exp.cover_image ? (
                    <img src={exp.cover_image} alt={exp.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  ) : (
                    <div style={{
                      position: 'absolute', inset: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Zap size={28} color={`${col}66`} />
                    </div>
                  )}
                  {/* Category pill */}
                  <span style={{
                    position: 'absolute', top: 8, left: 8,
                    fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px',
                    color: col, background: `${col}20`,
                    border: `1px solid ${col}40`,
                    borderRadius: 20, padding: '2px 7px',
                    backdropFilter: 'blur(8px)',
                  }}>
                    {exp.category}
                  </span>
                </div>

                {/* Body */}
                <div style={{ padding: '12px 14px 14px' }}>
                  <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 800, color: 'var(--guest-text, #F0F4FF)', lineHeight: 1.2, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {exp.title}
                  </p>

                  {exp.venue && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
                      <MapPin size={10} color="rgba(255,255,255,0.35)" />
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {exp.venue.name} · {exp.venue.city}
                      </span>
                    </div>
                  )}

                  {/* Time + duration */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 10 }}>
                    <Clock3 size={10} color="rgba(255,255,255,0.35)" />
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
                      {exp.start_time.slice(0, 5)} · {exp.duration_mins} min
                    </span>
                  </div>

                  {/* Next dates */}
                  {exp.next_dates.length > 0 && (
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 10 }}>
                      {exp.next_dates.slice(0, 2).map(d => (
                        <span key={d} style={{
                          fontSize: 10, fontWeight: 700, color: '#7C3AED',
                          background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)',
                          borderRadius: 20, padding: '1px 6px',
                        }}>
                          {format(new Date(d), 'MMM d')}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Price + CTA */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 14, fontWeight: 900, color: '#00D4AA' }}>{fmt(exp.price)}</span>
                    <span style={{
                      fontSize: 10, fontWeight: 800, color: '#06080C',
                      background: '#00D4AA', borderRadius: 20, padding: '3px 9px',
                    }}>
                      Register →
                    </span>
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
