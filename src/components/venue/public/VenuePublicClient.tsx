'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { MapPin, Calendar, Clock3, Users, Phone, Globe, Instagram, ChevronRight, Zap } from 'lucide-react'
import { format } from 'date-fns'

const C = {
  bg:       '#06080C',
  surface:  '#0C1018',
  card:     '#101620',
  border:   'rgba(0,212,170,0.1)',
  emerald:  '#00D4AA',
  violet:   '#7C3AED',
  muted:    'rgba(255,255,255,0.38)',
  text:     '#F0F4FF',
}

const CATEGORY_LABELS: Record<string, string> = {
  studio:'Studio', court:'Court', hall:'Hall', rooftop:'Rooftop',
  garden:'Garden', restaurant:'Restaurant', cafe:'Café', coworking:'Co-working',
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
  const [activePhoto, setActivePhoto] = useState(0)

  const instancesByProg = useMemo(() => {
    const m: Record<string, Instance[]> = {}
    for (const inst of upcomingInstances) {
      ;(m[inst.programme_id] ??= []).push(inst)
    }
    return m
  }, [upcomingInstances])

  const initials = venue.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  const hasPhotos = venue.photos.length > 0

  return (
    <>
      <style>{`
        @import url('https://api.fontshare.com/v2/css?f[]=clash-display@700,800,900&display=swap');

        * { box-sizing: border-box; }

        .vp-root {
          min-height: 100vh;
          background: ${C.bg};
          font-family: var(--font-body, 'DM Sans', sans-serif);
          color: ${C.text};
        }

        /* ── Hero ── */
        .vp-hero {
          position: relative;
          height: ${hasPhotos ? '440px' : '320px'};
          overflow: hidden;
        }
        .vp-hero-img {
          position: absolute; inset: 0;
          width: 100%; height: 100%;
          object-fit: cover;
          transition: opacity 0.5s;
        }
        .vp-hero-gradient {
          position: absolute; inset: 0;
          background: linear-gradient(
            to bottom,
            rgba(6,8,12,0.2) 0%,
            rgba(6,8,12,0.1) 30%,
            rgba(6,8,12,0.85) 75%,
            ${C.bg} 100%
          );
        }
        .vp-hero-noise {
          position: absolute; inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
          opacity: 0.35;
          pointer-events: none;
        }
        /* Coloured glow if no photo */
        .vp-hero-glow {
          position: absolute; inset: 0;
          background:
            radial-gradient(ellipse 70% 80% at 20% 60%, rgba(0,212,170,0.32) 0%, transparent 60%),
            radial-gradient(ellipse 55% 70% at 85% 25%, rgba(124,58,237,0.3) 0%, transparent 55%),
            radial-gradient(ellipse 40% 50% at 55% 80%, rgba(0,212,170,0.12) 0%, transparent 50%),
            linear-gradient(135deg, #080E14 0%, #0A0C16 50%, #080E14 100%);
        }
        .vp-hero-grid {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(0,212,170,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,212,170,0.04) 1px, transparent 1px);
          background-size: 40px 40px;
          mask-image: radial-gradient(ellipse 90% 80% at 50% 50%, black 30%, transparent 80%);
        }

        .vp-hero-content {
          position: absolute;
          bottom: 0; left: 0; right: 0;
          padding: 0 40px 36px;
          display: flex;
          align-items: flex-end;
          gap: 24px;
        }

        /* Nav pill */
        .vp-back {
          position: absolute; top: 24px; left: 28px;
          display: inline-flex; align-items: center; gap: 6px;
          padding: 7px 14px;
          background: rgba(6,8,12,0.6);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 24px;
          color: rgba(255,255,255,0.7);
          font-size: 12px; font-weight: 600;
          text-decoration: none;
          transition: color 0.15s;
          z-index: 10;
        }
        .vp-back:hover { color: #fff; }

        /* Photo thumbnails */
        .vp-thumbs {
          position: absolute; bottom: 24px; right: 28px;
          display: flex; gap: 6px; z-index: 10;
        }
        .vp-thumb {
          width: 36px; height: 36px; border-radius: 8px;
          overflow: hidden; cursor: pointer;
          border: 2px solid transparent;
          transition: border-color 0.15s;
          flex-shrink: 0;
        }
        .vp-thumb.active { border-color: ${C.emerald}; }
        .vp-thumb img { width: 100%; height: 100%; object-fit: cover; }

        /* Avatar */
        .vp-avatar {
          width: 80px; height: 80px;
          border-radius: 22px;
          background: linear-gradient(135deg, ${C.emerald}, ${C.violet});
          display: flex; align-items: center; justify-content: center;
          font-size: 30px; font-weight: 900;
          color: #fff;
          flex-shrink: 0;
          box-shadow: 0 8px 32px rgba(0,0,0,0.5), 0 0 0 3px rgba(6,8,12,0.9);
          letter-spacing: -1px;
        }

        .vp-hero-title {
          flex: 1;
        }
        .vp-hero-title h1 {
          font-family: 'Clash Display', var(--font-display, sans-serif);
          font-size: 34px; font-weight: 800;
          margin: 0 0 6px;
          letter-spacing: -0.8px;
          line-height: 1.1;
          text-shadow: 0 2px 16px rgba(0,0,0,0.5);
        }
        .vp-hero-meta {
          display: flex; align-items: center; gap: 12px;
          flex-wrap: wrap;
        }
        .vp-verified {
          display: inline-flex; align-items: center; gap: 4px;
          font-size: 10px; font-weight: 800;
          color: ${C.emerald};
          background: rgba(0,212,170,0.12);
          border: 1px solid rgba(0,212,170,0.25);
          border-radius: 20px; padding: 3px 9px;
          letter-spacing: 0.3px;
        }
        .vp-loc {
          display: flex; align-items: center; gap: 5px;
          font-size: 13px; color: ${C.muted};
        }

        /* ── Body ── */
        .vp-body {
          max-width: 900px;
          margin: 0 auto;
          padding: 0 32px 80px;
        }

        /* Category chips */
        .vp-cats {
          display: flex; gap: 6px; flex-wrap: wrap;
          padding: 20px 0;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          margin-bottom: 28px;
        }
        .vp-cat {
          font-size: 11px; font-weight: 700;
          color: ${C.emerald};
          background: rgba(0,212,170,0.07);
          border: 1px solid rgba(0,212,170,0.18);
          border-radius: 20px; padding: 4px 12px;
          text-transform: uppercase; letter-spacing: 0.5px;
        }

        /* Stats row */
        .vp-stats {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: 10px;
          margin-bottom: 32px;
        }
        .vp-stat {
          background: ${C.card};
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 14px;
          padding: 14px 16px;
        }
        .vp-stat-label {
          font-size: 10px; font-weight: 700;
          color: ${C.muted};
          text-transform: uppercase; letter-spacing: 0.5px;
          margin-bottom: 5px;
        }
        .vp-stat-value {
          font-size: 20px; font-weight: 900;
          color: ${C.text};
          line-height: 1;
        }

        /* Contact strip */
        .vp-contact {
          display: flex; gap: 8px; flex-wrap: wrap;
          margin-bottom: 32px;
        }
        .vp-contact-btn {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 9px 16px; border-radius: 11px;
          font-size: 13px; font-weight: 700;
          text-decoration: none; cursor: pointer;
          transition: all 0.15s;
          border: 1px solid rgba(0,212,170,0.2);
          background: rgba(0,212,170,0.06);
          color: ${C.emerald};
        }
        .vp-contact-btn:hover {
          background: rgba(0,212,170,0.12);
          border-color: rgba(0,212,170,0.35);
        }
        .vp-contact-icon {
          padding: 9px; border-radius: 11px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.04);
          color: rgba(255,255,255,0.6);
          transition: all 0.15s;
          text-decoration: none; display: inline-flex;
        }
        .vp-contact-icon:hover { background: rgba(255,255,255,0.08); color: #fff; }

        /* Description */
        .vp-desc {
          font-size: 15px; color: rgba(255,255,255,0.7);
          line-height: 1.75; margin-bottom: 44px;
          padding: 20px 24px;
          background: ${C.surface};
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 16px;
          border-left: 3px solid ${C.emerald};
        }

        /* Section header */
        .vp-section-head {
          display: flex; align-items: center; gap: 10px;
          margin-bottom: 20px;
        }
        .vp-section-icon {
          width: 32px; height: 32px; border-radius: 9px;
          background: rgba(0,212,170,0.1);
          border: 1px solid rgba(0,212,170,0.2);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .vp-section-title {
          font-size: 20px; font-weight: 800;
          margin: 0; letter-spacing: -0.4px;
        }

        /* Programme cards */
        .vp-prog-card {
          background: ${C.card};
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 18px;
          padding: 22px 24px;
          margin-bottom: 12px;
          transition: border-color 0.2s;
          display: flex; gap: 20px; align-items: flex-start;
        }
        .vp-prog-card:hover { border-color: rgba(0,212,170,0.2); }

        .vp-prog-dot {
          width: 10px; height: 10px; border-radius: 50%;
          background: ${C.emerald};
          flex-shrink: 0; margin-top: 6px;
          box-shadow: 0 0 8px ${C.emerald};
        }
        .vp-prog-body { flex: 1; min-width: 0; }
        .vp-prog-title {
          font-size: 16px; font-weight: 800;
          margin: 0 0 6px; color: ${C.text};
        }
        .vp-prog-meta {
          display: flex; gap: 10px; flex-wrap: wrap;
          margin-bottom: 8px;
        }
        .vp-prog-meta-item {
          font-size: 12px; color: ${C.muted};
          display: flex; align-items: center; gap: 4px;
        }
        .vp-prog-desc {
          font-size: 13px; color: ${C.muted};
          margin: 0 0 10px; line-height: 1.5;
        }
        .vp-prog-dates {
          display: flex; gap: 6px; flex-wrap: wrap;
          align-items: center;
        }
        .vp-date-chip {
          font-size: 11px; font-weight: 700;
          color: ${C.violet}; background: rgba(124,58,237,0.1);
          border: 1px solid rgba(124,58,237,0.22);
          border-radius: 20px; padding: 2px 8px;
        }
        .vp-prog-right {
          text-align: right; flex-shrink: 0;
        }
        .vp-prog-price {
          font-size: 22px; font-weight: 900;
          color: ${C.emerald}; margin: 0 0 10px;
        }
        .vp-enquire-btn {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 9px 16px; border-radius: 11px;
          background: ${C.emerald}; color: #06080C;
          font-size: 12px; font-weight: 800;
          text-decoration: none; white-space: nowrap;
          transition: opacity 0.15s;
        }
        .vp-enquire-btn:hover { opacity: 0.88; }

        /* Resource cards */
        .vp-resource-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 12px;
          margin-bottom: 48px;
        }
        .vp-resource-card {
          background: ${C.card};
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 18px;
          padding: 20px 22px;
          display: flex; flex-direction: column;
          transition: border-color 0.2s;
        }
        .vp-resource-card:hover { border-color: rgba(124,58,237,0.25); }
        .vp-resource-header {
          display: flex; align-items: flex-start;
          justify-content: space-between; gap: 10px;
          margin-bottom: 12px;
        }
        .vp-resource-name {
          font-size: 15px; font-weight: 800; margin: 0; color: ${C.text};
        }
        .vp-resource-type {
          font-size: 10px; font-weight: 700;
          color: ${C.violet}; background: rgba(124,58,237,0.1);
          border: 1px solid rgba(124,58,237,0.22);
          border-radius: 20px; padding: 3px 8px;
          text-transform: capitalize; white-space: nowrap; flex-shrink: 0;
        }
        .vp-resource-desc {
          font-size: 12px; color: ${C.muted};
          margin: 0 0 14px; line-height: 1.5;
        }
        .vp-resource-rows { margin-bottom: 16px; flex: 1; }
        .vp-resource-row {
          display: flex; justify-content: space-between;
          padding: 5px 0;
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        .vp-resource-row:last-child { border-bottom: none; }
        .vp-resource-row-label { font-size: 12px; color: ${C.muted}; }
        .vp-resource-row-val { font-size: 12px; font-weight: 700; color: ${C.text}; }
        .vp-resource-price {
          font-size: 18px; font-weight: 900; color: ${C.emerald};
          margin-bottom: 14px;
        }
        .vp-book-btn {
          display: flex; align-items: center; justify-content: center; gap: 6px;
          padding: 11px 16px; border-radius: 12px;
          background: rgba(0,212,170,0.08);
          border: 1px solid rgba(0,212,170,0.22);
          color: ${C.emerald}; font-size: 13px; font-weight: 700;
          text-decoration: none;
          transition: all 0.15s;
        }
        .vp-book-btn:hover { background: rgba(0,212,170,0.14); border-color: rgba(0,212,170,0.4); }

        /* Empty state */
        .vp-empty {
          text-align: center; padding: 48px 24px;
          background: ${C.surface}; border: 1px dashed rgba(255,255,255,0.08);
          border-radius: 18px; color: ${C.muted};
          font-size: 14px; margin-bottom: 32px;
        }

        /* Footer */
        .vp-footer {
          border-top: 1px solid rgba(255,255,255,0.05);
          padding: 24px 32px;
          display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 12px;
          max-width: 900px; margin: 0 auto;
        }
        .vp-footer-brand {
          display: flex; align-items: center; gap: 7px;
          font-size: 12px; font-weight: 800; color: rgba(255,255,255,0.3);
          text-decoration: none;
        }
        .vp-footer-brand:hover { color: rgba(255,255,255,0.6); }
        .vp-footer-zap {
          width: 20px; height: 20px; border-radius: 6px;
          background: linear-gradient(135deg, ${C.emerald}, ${C.violet});
          display: flex; align-items: center; justify-content: center;
        }

        @media (max-width: 640px) {
          .vp-hero { height: 320px; }
          .vp-hero-content { padding: 0 20px 28px; gap: 16px; }
          .vp-hero-title h1 { font-size: 24px; }
          .vp-avatar { width: 60px; height: 60px; font-size: 22px; border-radius: 16px; }
          .vp-body { padding: 0 16px 64px; }
          .vp-prog-card { flex-direction: column; gap: 14px; }
          .vp-prog-right { text-align: left; }
          .vp-thumbs { display: none; }
        }
      `}</style>

      <div className="vp-root">

        {/* ── Hero ── */}
        <div className="vp-hero">
          {hasPhotos ? (
            <img
              src={venue.photos[activePhoto]}
              alt={venue.name}
              className="vp-hero-img"
            />
          ) : (
            <>
              <div className="vp-hero-glow" />
              <div className="vp-hero-grid" />
            </>
          )}
          <div className="vp-hero-noise" />
          <div className="vp-hero-gradient" />

          <Link href="/venues" className="vp-back">← Venues</Link>

          {/* Photo thumbnails */}
          {venue.photos.length > 1 && (
            <div className="vp-thumbs">
              {venue.photos.slice(0, 5).map((p, i) => (
                <div key={i} className={`vp-thumb${i === activePhoto ? ' active' : ''}`} onClick={() => setActivePhoto(i)}>
                  <img src={p} alt="" />
                </div>
              ))}
            </div>
          )}

          <div className="vp-hero-content">
            <div className="vp-avatar">{initials}</div>
            <div className="vp-hero-title">
              <h1>{venue.name}</h1>
              <div className="vp-hero-meta">
                {venue.verified && <span className="vp-verified">✓ Verified</span>}
                <span className="vp-loc">
                  <MapPin size={12} />
                  {venue.city}{venue.address && ` · ${venue.address}`}
                </span>
                {venue.capacity && (
                  <span className="vp-loc"><Users size={12} />{venue.capacity} pax</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="vp-body">

          {/* Category chips */}
          {venue.categories.length > 0 && (
            <div className="vp-cats">
              {venue.categories.map(cat => (
                <span key={cat} className="vp-cat">{CATEGORY_LABELS[cat] ?? cat}</span>
              ))}
            </div>
          )}

          {/* Stats */}
          <div className="vp-stats">
            {[
              { label: 'Programmes',      value: programmes.length     },
              { label: 'Bookable Spaces', value: resources.length      },
              { label: 'Capacity',        value: venue.capacity ? `${venue.capacity}` : '—' },
              { label: 'On TIKKIT X',     value: new Date(venue.created_at).getFullYear() },
            ].map(({ label, value }) => (
              <div key={label} className="vp-stat">
                <div className="vp-stat-label">{label}</div>
                <div className="vp-stat-value">{value}</div>
              </div>
            ))}
          </div>

          {/* Contact */}
          {(venue.phone || venue.instagram || venue.website) && (
            <div className="vp-contact">
              {venue.phone && (
                <a href={`tel:${venue.phone}`} className="vp-contact-btn">
                  <Phone size={14} /> {venue.phone}
                </a>
              )}
              {venue.instagram && (
                <a href={`https://instagram.com/${venue.instagram.replace('@','')}`} target="_blank" rel="noreferrer" className="vp-contact-icon">
                  <Instagram size={15} />
                </a>
              )}
              {venue.website && (
                <a href={venue.website} target="_blank" rel="noreferrer" className="vp-contact-icon">
                  <Globe size={15} />
                </a>
              )}
            </div>
          )}

          {/* Description */}
          {venue.description && (
            <p className="vp-desc">{venue.description}</p>
          )}

          {/* Programmes */}
          <div style={{ marginBottom: 48 }}>
            <div className="vp-section-head">
              <div className="vp-section-icon"><Calendar size={15} color={C.emerald} /></div>
              <h2 className="vp-section-title">What&rsquo;s On</h2>
            </div>

            {programmes.length === 0 ? (
              <div className="vp-empty">No programmes scheduled yet.</div>
            ) : (
              programmes.map(p => {
                const instances = instancesByProg[p.id] ?? []
                const nextDates = instances.slice(0, 3).map(i => i.date)
                return (
                  <div key={p.id} className="vp-prog-card">
                    <div className="vp-prog-dot" />
                    <div className="vp-prog-body">
                      <h3 className="vp-prog-title">{p.title}</h3>
                      <div className="vp-prog-meta">
                        <span className="vp-prog-meta-item">
                          <Clock3 size={11} />
                          {p.rrule ? (RRULE_LABEL[p.rrule] ?? 'Recurring') : 'Manual'} · {p.start_time.slice(0,5)}
                        </span>
                        <span className="vp-prog-meta-item">{p.duration_mins} min</span>
                        <span className="vp-prog-meta-item"><Users size={11} />{p.capacity} pax</span>
                      </div>
                      {p.description && <p className="vp-prog-desc">{p.description}</p>}
                      {nextDates.length > 0 && (
                        <div className="vp-prog-dates">
                          <span style={{ fontSize: 11, color: C.muted }}>Next:</span>
                          {nextDates.map(d => (
                            <span key={d} className="vp-date-chip">{format(new Date(d), 'MMM d')}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="vp-prog-right">
                      <p className="vp-prog-price">
                        {p.price === 0 ? 'Free' : `PKR ${p.price.toLocaleString('en-PK')}`}
                      </p>
                      <a
                        href={`mailto:?subject=Enquiry — ${p.title}&body=Hi, I'm interested in ${p.title} at ${venue.name}.`}
                        className="vp-enquire-btn"
                      >
                        Enquire <ChevronRight size={12} />
                      </a>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Bookable Spaces */}
          <div style={{ marginBottom: 48 }}>
            <div className="vp-section-head">
              <div className="vp-section-icon" style={{ background: 'rgba(124,58,237,0.1)', borderColor: 'rgba(124,58,237,0.2)' }}>
                <Clock3 size={15} color={C.violet} />
              </div>
              <h2 className="vp-section-title">Book a Space</h2>
            </div>

            {resources.length === 0 ? (
              <div className="vp-empty">No bookable spaces listed yet.</div>
            ) : (
              <div className="vp-resource-grid">
                {resources.map(r => (
                  <div key={r.id} className="vp-resource-card">
                    <div className="vp-resource-header">
                      <h3 className="vp-resource-name">{r.name}</h3>
                      <span className="vp-resource-type">{r.resource_type}</span>
                    </div>
                    {r.description && <p className="vp-resource-desc">{r.description}</p>}
                    <p className="vp-resource-price">
                      PKR {r.price_per_slot.toLocaleString('en-PK')}
                      <span style={{ fontSize: 13, fontWeight: 500, color: C.muted }}> / {r.duration_unit_mins}min</span>
                    </p>
                    <div className="vp-resource-rows">
                      <div className="vp-resource-row">
                        <span className="vp-resource-row-label">Hours</span>
                        <span className="vp-resource-row-val">{r.open_time.slice(0,5)} – {r.close_time.slice(0,5)}</span>
                      </div>
                      <div className="vp-resource-row">
                        <span className="vp-resource-row-label">Capacity</span>
                        <span className="vp-resource-row-val">{r.capacity} pax</span>
                      </div>
                    </div>
                    <a
                      href={`mailto:?subject=Slot booking — ${r.name}&body=Hi, I'd like to book ${r.name} at ${venue.name}.`}
                      className="vp-book-btn"
                    >
                      Request Booking <ChevronRight size={13} />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* ── Footer ── */}
        <footer className="vp-footer">
          <a href="https://tikkitx.com" className="vp-footer-brand">
            <div className="vp-footer-zap"><Zap size={11} color="#06080C" strokeWidth={2.5} /></div>
            Powered by TIKKIT X
          </a>
          <span style={{ fontSize: 12, color: C.muted }}>
            © {new Date().getFullYear()} {venue.name}
          </span>
        </footer>
      </div>
    </>
  )
}
