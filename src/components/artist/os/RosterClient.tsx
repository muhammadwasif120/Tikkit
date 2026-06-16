'use client'

import Link from 'next/link'
import { CheckCircle2, Mic2, MapPin, Music, Laugh, ChevronRight, Inbox } from 'lucide-react'

const C = {
  black:   '#050508',
  cyan:    '#00E5FF',
  magenta: '#CC00FF',
  surface: '#0D1117',
  card:    '#111820',
  border:  'rgba(0,229,255,0.08)',
  muted:   'rgba(255,255,255,0.35)',
  text:    '#FFFFFF',
}

const CAT_LABEL: Record<string, string>  = { dj: 'DJ', musician: 'Musician / Band', comedian: 'Comedian' }
const CAT_ICON:  Record<string, typeof Mic2> = { dj: Music, musician: Music, comedian: Laugh }
const AVAIL_COLORS: Record<string, string> = { accepting: C.cyan, limited: '#F6C90E', not_accepting: '#FC8181' }
const AVAIL_LABELS: Record<string, string> = { accepting: 'Accepting', limited: 'Limited', not_accepting: 'Closed' }
const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  draft:     { bg: 'rgba(255,255,255,0.05)', color: C.muted,    label: 'Draft'     },
  published: { bg: `${C.cyan}12`,            color: C.cyan,     label: 'Published' },
  suspended: { bg: 'rgba(252,129,129,0.1)',   color: '#FC8181',  label: 'Suspended' },
}

export default function RosterClient({
  artists, enquiryCounts,
}: {
  artists: any[]
  enquiryCounts: Record<string, number>
}) {
  if (artists.length === 0) {
    return (
      <div style={{ padding: '48px 24px', textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: 32, background: `${C.cyan}10`, border: `1px solid ${C.cyan}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <Mic2 size={28} color={`${C.cyan}60`} />
        </div>
        <p style={{ fontSize: 18, fontWeight: 800, color: C.text, margin: '0 0 8px' }}>No Artists Yet</p>
        <p style={{ fontSize: 14, color: C.muted, margin: '0 0 24px' }}>Your roster is empty. Add your first artist to get started.</p>
        <Link href="/artist-mgmt/os/roster/new" style={{ display: 'inline-block', padding: '12px 24px', borderRadius: 12, background: `linear-gradient(135deg, ${C.cyan}, ${C.magenta})`, color: C.black, fontWeight: 800, fontSize: 14, textDecoration: 'none' }}>
          + Add Artist
        </Link>
      </div>
    )
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 4px' }}>Roster</p>
          <p style={{ fontSize: 22, fontWeight: 900, margin: 0, letterSpacing: '-0.5px' }}>{artists.length} Artist{artists.length !== 1 ? 's' : ''}</p>
        </div>
        <Link href="/artist-mgmt/os/roster/new" style={{ padding: '10px 18px', borderRadius: 12, background: `linear-gradient(135deg, ${C.cyan}18, ${C.magenta}18)`, border: `1px solid ${C.cyan}30`, color: C.cyan, fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>
          + Add Artist
        </Link>
      </div>

      {/* Artist cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {artists.map(artist => {
          const openEnquiries = enquiryCounts[artist.id] ?? 0
          const CatIcon       = CAT_ICON[artist.category] ?? Mic2
          const availColor    = AVAIL_COLORS[artist.availability_status] ?? C.muted
          const statusStyle   = STATUS_STYLES[artist.profile_status] ?? STATUS_STYLES.draft

          return (
            <div key={artist.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden' }}>
              {/* Photo strip */}
              <div style={{ height: 120, background: `linear-gradient(135deg, #0D1117, #1a0a2e)`, position: 'relative' }}>
                {artist.profile_photo_url ? (
                  <img src={artist.profile_photo_url} alt={artist.name} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 40, fontWeight: 900, opacity: 0.08 }}>{artist.name[0]}</span>
                  </div>
                )}
                {/* Status badge */}
                <div style={{ position: 'absolute', top: 10, left: 10, padding: '3px 9px', borderRadius: 6, background: statusStyle.bg, fontSize: 10, fontWeight: 800, color: statusStyle.color, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  {statusStyle.label}
                </div>
                {/* Open enquiries badge */}
                {openEnquiries > 0 && (
                  <div style={{ position: 'absolute', top: 10, right: 10, minWidth: 22, height: 22, borderRadius: 11, background: C.magenta, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 7px', boxSizing: 'border-box' }}>
                    <span style={{ fontSize: 10, fontWeight: 800, color: C.black }}>{openEnquiries}</span>
                  </div>
                )}
                {/* Verified */}
                {artist.verified && (
                  <div style={{ position: 'absolute', bottom: 10, right: 10 }}>
                    <CheckCircle2 size={16} color={C.cyan} fill={`${C.cyan}20`} />
                  </div>
                )}
              </div>

              {/* Info */}
              <div style={{ padding: '14px 16px 12px' }}>
                <p style={{ fontSize: 16, fontWeight: 800, margin: '0 0 4px', letterSpacing: '-0.3px' }}>{artist.name}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: C.cyan, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{CAT_LABEL[artist.category]}</span>
                  {artist.based_in_city && (
                    <>
                      <span style={{ color: 'rgba(255,255,255,0.15)' }}>·</span>
                      <span style={{ fontSize: 11, color: C.muted, display: 'flex', alignItems: 'center', gap: 3 }}>
                        <MapPin size={10} /> {artist.based_in_city}
                      </span>
                    </>
                  )}
                </div>

                {/* Availability */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 14 }}>
                  <div style={{ width: 6, height: 6, borderRadius: 3, background: availColor }} />
                  <span style={{ fontSize: 11, color: availColor, fontWeight: 600 }}>{AVAIL_LABELS[artist.availability_status]}</span>
                </div>

                {/* Action buttons */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  <Link href={`/artist-mgmt/os/roster/${artist.id}/edit`} style={{ padding: '8px 0', borderRadius: 10, background: `${C.cyan}10`, border: `1px solid ${C.cyan}25`, color: C.cyan, fontSize: 12, fontWeight: 700, textAlign: 'center', textDecoration: 'none' }}>
                    Edit
                  </Link>
                  <Link href={`/artists/${artist.slug}`} target="_blank" style={{ padding: '8px 0', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: C.muted, fontSize: 12, fontWeight: 600, textAlign: 'center', textDecoration: 'none' }}>
                    Profile ↗
                  </Link>
                  <Link href={`/artist-mgmt/os/enquiries?artist=${artist.id}`} style={{ padding: '8px 0', borderRadius: 10, background: openEnquiries > 0 ? `${C.magenta}12` : 'rgba(255,255,255,0.04)', border: `1px solid ${openEnquiries > 0 ? C.magenta + '30' : 'rgba(255,255,255,0.08)'}`, color: openEnquiries > 0 ? C.magenta : C.muted, fontSize: 12, fontWeight: 600, textAlign: 'center', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                    <Inbox size={11} />
                    {openEnquiries > 0 ? `${openEnquiries} Enquir${openEnquiries === 1 ? 'y' : 'ies'}` : 'Enquiries'}
                  </Link>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
