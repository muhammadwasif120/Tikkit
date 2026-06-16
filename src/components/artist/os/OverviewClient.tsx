'use client'

import Link from 'next/link'
import { Mic2, Inbox, CheckCircle2, Clock, TrendingUp, Users } from 'lucide-react'

const C = {
  black: '#050508', cyan: '#00E5FF', magenta: '#CC00FF',
  surface: '#0D1117', card: '#111820',
  border: 'rgba(0,229,255,0.08)', muted: 'rgba(255,255,255,0.35)', text: '#FFFFFF',
}

function StatCard({ icon: Icon, label, value, sub, color, href }: {
  icon: typeof Mic2; label: string; value: number | string; sub?: string; color: string; href?: string
}) {
  const inner = (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: '20px 24px', display: 'flex', alignItems: 'flex-start', gap: 16, transition: 'border-color 0.2s', cursor: href ? 'pointer' : 'default' }}>
      <div style={{ width: 42, height: 42, borderRadius: 12, background: `${color}12`, border: `1px solid ${color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={18} color={color} />
      </div>
      <div>
        <p style={{ fontSize: 28, fontWeight: 900, margin: '0 0 2px', letterSpacing: '-1px', color: C.text }}>{value}</p>
        <p style={{ fontSize: 13, fontWeight: 600, margin: '0 0 2px', color: C.text }}>{label}</p>
        {sub && <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>{sub}</p>}
      </div>
    </div>
  )
  return href ? <Link href={href} style={{ textDecoration: 'none', display: 'block' }}>{inner}</Link> : inner
}

export default function OverviewClient({ stats, recentEnquiries, artists }: {
  stats: {
    totalArtists: number
    publishedArtists: number
    openEnquiries: number
    respondedEnquiries: number
    bookedEnquiries: number
    totalEnquiries: number
  }
  recentEnquiries: any[]
  artists: any[]
}) {
  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 4px' }}>Overview</p>
        <p style={{ fontSize: 22, fontWeight: 900, margin: 0, letterSpacing: '-0.5px' }}>Management Dashboard</p>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 36 }}>
        <StatCard icon={Mic2}       label="Artists on Roster"  value={stats.totalArtists}        sub={`${stats.publishedArtists} published`} color={C.cyan}    href="/artist-mgmt/os" />
        <StatCard icon={Inbox}      label="Open Enquiries"     value={stats.openEnquiries}       sub="Awaiting response"   color={C.magenta} href="/artist-mgmt/os/enquiries?tab=submitted" />
        <StatCard icon={TrendingUp} label="In Negotiation"     value={stats.respondedEnquiries}  sub="Responded + negotiating" color="#FB923C" href="/artist-mgmt/os/enquiries?tab=negotiating" />
        <StatCard icon={CheckCircle2} label="Booked"           value={stats.bookedEnquiries}     sub={`of ${stats.totalEnquiries} total`}  color="#4ADE80" href="/artist-mgmt/os/enquiries?tab=booked" />
      </div>

      {/* Two-column: recent enquiries + roster quick-view */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>

        {/* Recent enquiries */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <p style={{ fontSize: 14, fontWeight: 800, margin: 0 }}>Recent Enquiries</p>
            <Link href="/artist-mgmt/os/enquiries" style={{ fontSize: 12, color: C.cyan, textDecoration: 'none', fontWeight: 600 }}>View all →</Link>
          </div>
          {recentEnquiries.length === 0 ? (
            <div style={{ padding: '32px 0', textAlign: 'center', background: C.card, border: `1px solid ${C.border}`, borderRadius: 12 }}>
              <Inbox size={24} color="rgba(255,255,255,0.06)" style={{ marginBottom: 8 }} />
              <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>No enquiries yet</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recentEnquiries.map(enq => {
                const isNew = enq.status === 'submitted'
                return (
                  <Link key={enq.id} href="/artist-mgmt/os/enquiries" style={{ textDecoration: 'none', display: 'block', padding: '14px 16px', background: C.card, border: `1px solid ${isNew ? C.cyan + '20' : C.border}`, borderRadius: 12, color: C.text }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{enq.event_name}</p>
                        <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>
                          {enq.artists?.name} · {new Date(enq.event_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                      {isNew && <span style={{ padding: '2px 7px', borderRadius: 5, background: `${C.cyan}15`, fontSize: 10, fontWeight: 800, color: C.cyan, whiteSpace: 'nowrap' }}>New</span>}
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Roster quick view */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <p style={{ fontSize: 14, fontWeight: 800, margin: 0 }}>Roster</p>
            <Link href="/artist-mgmt/os" style={{ fontSize: 12, color: C.cyan, textDecoration: 'none', fontWeight: 600 }}>Manage →</Link>
          </div>
          {artists.length === 0 ? (
            <div style={{ padding: '32px 0', textAlign: 'center', background: C.card, border: `1px solid ${C.border}`, borderRadius: 12 }}>
              <Mic2 size={24} color="rgba(255,255,255,0.06)" style={{ marginBottom: 8 }} />
              <p style={{ fontSize: 13, color: C.muted, margin: '0 0 12px' }}>No artists yet</p>
              <Link href="/artist-mgmt/os/roster/new" style={{ fontSize: 12, color: C.cyan, fontWeight: 700, textDecoration: 'none' }}>+ Add Artist</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {artists.slice(0, 6).map(a => (
                <Link key={a.id} href={`/artist-mgmt/os/roster/${a.id}/edit`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, color: C.text }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, overflow: 'hidden', background: `linear-gradient(135deg, ${C.cyan}15, ${C.magenta}15)`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: C.muted }}>
                    {a.profile_photo_url ? <img src={a.profile_photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : a.name[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</p>
                    <p style={{ fontSize: 11, color: C.muted, margin: 0, textTransform: 'capitalize' }}>{a.category} · {a.based_in_city ?? '—'}</p>
                  </div>
                  <span style={{ padding: '2px 7px', borderRadius: 5, fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.3px', background: a.profile_status === 'published' ? `${C.cyan}10` : 'rgba(246,201,14,0.1)', color: a.profile_status === 'published' ? C.cyan : '#F6C90E' }}>
                    {a.profile_status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
