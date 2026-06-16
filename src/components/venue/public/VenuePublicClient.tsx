'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { MapPin, Calendar, Clock3, Users, Phone, Globe, Instagram, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'

const C = { emerald: '#00D4AA', violet: '#7C3AED', surface: '#0A0F14', border: 'rgba(0,212,170,0.12)', muted: 'rgba(255,255,255,0.4)' }

const CATEGORY_LABELS: Record<string, string> = {
  studio:'Studio', court:'Court', hall:'Hall', rooftop:'Rooftop',
  garden:'Garden', restaurant:'Restaurant', cafe:'Café', coworking:'Co-work',
  gym:'Gym', pool:'Pool', theatre:'Theatre', gallery:'Gallery', other:'Other',
}

const RRULE_LABEL: Record<string, string> = {
  'FREQ=WEEKLY;BYDAY=MO': 'Every Monday',
  'FREQ=WEEKLY;BYDAY=TU': 'Every Tuesday',
  'FREQ=WEEKLY;BYDAY=WE': 'Every Wednesday',
  'FREQ=WEEKLY;BYDAY=TH': 'Every Thursday',
  'FREQ=WEEKLY;BYDAY=FR': 'Every Friday',
  'FREQ=WEEKLY;BYDAY=SA': 'Every Saturday',
  'FREQ=WEEKLY;BYDAY=SU': 'Every Sunday',
  'FREQ=WEEKLY;BYDAY=SA,SU': 'Every Weekend',
  'FREQ=WEEKLY;BYDAY=MO,WE,FR': 'Mon / Wed / Fri',
  'FREQ=MONTHLY;BYDAY=1SA': 'First Saturday',
  'FREQ=MONTHLY;BYDAY=1SU': 'First Sunday',
}

type Venue = {
  id: string; name: string; slug: string; city: string; address: string | null
  categories: string[]; description: string | null; photos: string[]
  instagram: string | null; website: string | null; phone: string | null
  capacity: number | null; verified: boolean; created_at: string
}
type Programme = {
  id: string; title: string; description: string | null; category: string
  rrule: string | null; start_time: string; duration_mins: number
  capacity: number; price: number; tags: string[]
}
type Resource = {
  id: string; name: string; description: string | null; resource_type: string
  duration_unit_mins: number; price_per_slot: number
  open_time: string; close_time: string; capacity: number
}
type Instance = { id: string; programme_id: string; date: string; status: string }

export default function VenuePublicClient({
  venue, programmes, resources, upcomingInstances,
}: {
  venue: Venue
  programmes: Programme[]
  resources: Resource[]
  upcomingInstances: Instance[]
}) {
  // Group instances by programme
  const instancesByProg = useMemo(() => {
    const m: Record<string, Instance[]> = {}
    for (const inst of upcomingInstances) {
      ;(m[inst.programme_id] ??= []).push(inst)
    }
    return m
  }, [upcomingInstances])

  const memberSince = new Date(venue.created_at).getFullYear()

  return (
    <div style={{ minHeight: '100vh', background: '#050508', fontFamily: 'var(--font-body, "DM Sans", sans-serif)', color: '#fff' }}>

      {/* Hero banner */}
      <div style={{ position: 'relative', height: 280, background: `linear-gradient(135deg, rgba(0,212,170,0.15), rgba(124,58,237,0.15))`, borderBottom: `1px solid ${C.border}`, overflow: 'hidden' }}>
        {venue.photos.length > 0 && (
          <img src={venue.photos[0]} alt={venue.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.4 }} />
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(5,5,8,0.9) 0%, transparent 60%)' }} />

        {/* Back link */}
        <div style={{ position: 'absolute', top: 20, left: 24 }}>
          <Link href="/venues" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', borderRadius: 20, color: C.muted, fontSize: 12, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.1)' }}>
            ← Browse Venues
          </Link>
        </div>

        {/* Initials avatar */}
        <div style={{ position: 'absolute', bottom: -32, left: 32 }}>
          <div style={{ width: 72, height: 72, borderRadius: 18, background: `linear-gradient(135deg, ${C.emerald}, ${C.violet})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 900, border: '3px solid #050508' }}>
            {venue.name.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 24px 80px' }}>

        {/* Identity */}
        <div style={{ paddingTop: 52, marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <h1 style={{ fontSize: 26, fontWeight: 900, margin: 0, letterSpacing: '-0.5px' }}>{venue.name}</h1>
                {venue.verified && (
                  <span style={{ fontSize: 10, fontWeight: 700, background: 'rgba(0,212,170,0.12)', border: '1px solid rgba(0,212,170,0.25)', borderRadius: 20, padding: '3px 8px', color: C.emerald }}>✓ Verified</span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <MapPin size={13} color={C.muted} />
                <span style={{ fontSize: 13, color: C.muted }}>{venue.city}{venue.address && ` · ${venue.address}`}</span>
              </div>
              {venue.categories.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {venue.categories.map(cat => (
                    <span key={cat} style={{ fontSize: 11, fontWeight: 600, color: C.emerald, background: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.15)', borderRadius: 20, padding: '2px 8px' }}>
                      {CATEGORY_LABELS[cat] ?? cat}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Contact */}
            <div style={{ display: 'flex', gap: 8 }}>
              {venue.phone && (
                <a href={`tel:${venue.phone}`} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, background: C.surface, border: `1px solid ${C.border}`, color: '#fff', fontSize: 13, textDecoration: 'none' }}>
                  <Phone size={13} /> Call
                </a>
              )}
              {venue.instagram && (
                <a href={`https://instagram.com/${venue.instagram.replace('@','')}`} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, background: C.surface, border: `1px solid ${C.border}`, color: '#fff', fontSize: 13, textDecoration: 'none' }}>
                  <Instagram size={13} />
                </a>
              )}
              {venue.website && (
                <a href={venue.website} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, background: C.surface, border: `1px solid ${C.border}`, color: '#fff', fontSize: 13, textDecoration: 'none' }}>
                  <Globe size={13} />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 24, padding: '16px 0', borderTop: `1px solid rgba(255,255,255,0.06)`, borderBottom: `1px solid rgba(255,255,255,0.06)`, marginBottom: 36, flexWrap: 'wrap' }}>
          {[
            { label: 'Programmes', value: programmes.length, icon: Calendar },
            { label: 'Bookable Spaces', value: resources.length, icon: Clock3 },
            { label: 'Capacity', value: venue.capacity ? `${venue.capacity} pax` : '—', icon: Users },
            { label: 'On Tikkit X since', value: memberSince, icon: MapPin },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon size={14} color={C.muted} />
              <span style={{ fontSize: 13, color: C.muted }}>{label}:</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Description */}
        {venue.description && (
          <div style={{ marginBottom: 40 }}>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, margin: 0 }}>{venue.description}</p>
          </div>
        )}

        {/* Programmes (What's On) */}
        {programmes.length > 0 && (
          <div style={{ marginBottom: 48 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 20px', letterSpacing: '-0.3px' }}>
              <Calendar size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
              What&rsquo;s On
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {programmes.map(p => {
                const instances = instancesByProg[p.id] ?? []
                const nextDates = instances.slice(0, 3).map(i => i.date)
                return (
                  <div key={p.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: '20px 22px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 6px', color: '#fff' }}>{p.title}</h3>
                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: p.description ? 10 : 0 }}>
                          <span style={{ fontSize: 12, color: C.muted }}>
                            {p.rrule ? (RRULE_LABEL[p.rrule] ?? 'Recurring') : 'Manual'} · {p.start_time.slice(0,5)}
                          </span>
                          <span style={{ fontSize: 12, color: C.muted }}>{p.duration_mins}min</span>
                          <span style={{ fontSize: 12, color: C.muted }}>Cap {p.capacity} pax</span>
                        </div>
                        {p.description && (
                          <p style={{ fontSize: 13, color: C.muted, margin: '0 0 10px', lineHeight: 1.5 }}>{p.description}</p>
                        )}
                        {nextDates.length > 0 && (
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 11, color: C.muted }}>Next:</span>
                            {nextDates.map(d => (
                              <span key={d} style={{ fontSize: 11, fontWeight: 600, color: C.violet, background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 20, padding: '1px 8px' }}>
                                {format(new Date(d), 'MMM d')}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <p style={{ fontSize: 18, fontWeight: 900, margin: '0 0 8px', color: C.emerald }}>
                          {p.price === 0 ? 'Free' : `PKR ${p.price.toLocaleString('en-PK')}`}
                        </p>
                        <a href={`mailto:?subject=Booking enquiry — ${p.title}&body=Hi, I'm interested in booking ${p.title} at ${venue.name}.`} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 10, background: C.emerald, color: '#050508', fontSize: 12, fontWeight: 800, textDecoration: 'none' }}>
                          Enquire <ChevronRight size={12} />
                        </a>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Bookable Spaces */}
        {resources.length > 0 && (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 20px', letterSpacing: '-0.3px' }}>
              <Clock3 size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
              Book a Space
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
              {resources.map(r => (
                <div key={r.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: '18px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: '#fff' }}>{r.name}</h3>
                    <span style={{ fontSize: 10, fontWeight: 700, color: C.violet, background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 20, padding: '2px 8px', textTransform: 'capitalize' }}>{r.resource_type}</span>
                  </div>
                  {r.description && (
                    <p style={{ fontSize: 12, color: C.muted, margin: '0 0 12px', lineHeight: 1.4 }}>{r.description}</p>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12, color: C.muted }}>Rate</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: C.emerald }}>PKR {r.price_per_slot.toLocaleString('en-PK')} / {r.duration_unit_mins}min</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12, color: C.muted }}>Hours</span>
                      <span style={{ fontSize: 12, color: '#fff' }}>{r.open_time.slice(0,5)} – {r.close_time.slice(0,5)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12, color: C.muted }}>Capacity</span>
                      <span style={{ fontSize: 12, color: '#fff' }}>{r.capacity} pax</span>
                    </div>
                  </div>
                  <a href={`mailto:?subject=Slot booking — ${r.name}&body=Hi, I'd like to book ${r.name} at ${venue.name}.`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 14px', borderRadius: 10, background: 'rgba(0,212,170,0.1)', border: '1px solid rgba(0,212,170,0.2)', color: C.emerald, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                    Request Booking
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ borderTop: `1px solid ${C.border}`, padding: '20px 24px', textAlign: 'center' }}>
        <p style={{ color: C.muted, fontSize: 12, margin: 0 }}>
          Powered by <a href="https://tikkitx.com" style={{ color: C.emerald, textDecoration: 'none', fontWeight: 700 }}>Tikkit X</a>
        </p>
      </div>
    </div>
  )
}
