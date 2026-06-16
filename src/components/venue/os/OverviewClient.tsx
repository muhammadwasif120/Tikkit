'use client'

import Link from 'next/link'
import { CalendarDays, Clock3, CheckCircle, TrendingUp, MapPin, ExternalLink } from 'lucide-react'
import { format } from 'date-fns'

const C = {
  emerald: '#00D4AA', violet: '#7C3AED',
  surface: '#0A0F14', border: 'rgba(0,212,170,0.12)',
  muted: 'rgba(255,255,255,0.4)',
}

const card: React.CSSProperties = {
  background: C.surface, border: `1px solid ${C.border}`,
  borderRadius: 16, padding: 24, marginBottom: 20,
}

type Venue = {
  id: string; name: string; slug: string; city: string;
  categories: string[]; verified: boolean; capacity: number | null
}
type Programme = { id: string; title: string; active: boolean; capacity: number; price: number }
type Resource  = { id: string; name: string; active: boolean; price_per_slot: number; resource_type: string }
type Booking   = {
  id: string; date: string; start_time: string; end_time: string;
  status: string; total_price: number; guest_count: number;
  resources?: { name: string } | null
}

const STATUS_COLOR: Record<string, string> = {
  pending: '#F6C90E', confirmed: '#00D4AA', cancelled: '#FC8181', completed: '#48BB78', no_show: '#CC00FF',
}

export default function OverviewClient({
  venue, programmes, resources, recentBookings,
}: {
  venue: Venue
  programmes: Programme[]
  resources: Resource[]
  recentBookings: Booking[]
}) {
  const activeProgs = programmes.filter(p => p.active)
  const activeResources = resources.filter(r => r.active)
  const pendingBookings = recentBookings.filter(b => b.status === 'pending')
  const totalRevenue = recentBookings.filter(b => b.status === 'confirmed' || b.status === 'completed')
    .reduce((s, b) => s + b.total_price, 0)

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h1 style={{ fontSize: 24, fontWeight: 900, margin: 0, letterSpacing: '-0.5px' }}>{venue.name}</h1>
            {venue.verified && (
              <span style={{ fontSize: 10, fontWeight: 700, background: 'rgba(0,212,170,0.12)', border: '1px solid rgba(0,212,170,0.25)', borderRadius: 20, padding: '2px 8px', color: C.emerald }}>
                ✓ Verified
              </span>
            )}
          </div>
          <p style={{ color: C.muted, fontSize: 13, margin: 0 }}>
            <MapPin size={12} style={{ display: 'inline', marginRight: 4 }} />{venue.city}
          </p>
        </div>
        <Link href={`/venue/${venue.slug}`} target="_blank" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, background: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.2)', color: C.emerald, fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
          <ExternalLink size={13} /> View Public Page
        </Link>
      </div>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 28 }}>
        {[
          { label: 'Active Programmes', value: activeProgs.length, icon: CalendarDays, color: C.emerald, link: '/venue/os/programmes' },
          { label: 'Bookable Resources', value: activeResources.length, icon: Clock3, color: C.violet, link: '/venue/os/slots' },
          { label: 'Pending Bookings', value: pendingBookings.length, icon: CheckCircle, color: '#F6C90E', link: '/venue/os/slots' },
          { label: 'Revenue (recent)', value: `PKR ${totalRevenue.toLocaleString('en-PK')}`, icon: TrendingUp, color: '#48BB78', link: null },
        ].map(({ label, value, icon: Icon, color, link }) => (
          <div key={label} style={{ ...card, marginBottom: 0, position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ color: C.muted, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 8px' }}>{label}</p>
                <p style={{ fontSize: 22, fontWeight: 900, margin: 0, color, fontVariantNumeric: 'tabular-nums' }}>{value}</p>
              </div>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}15`, border: `1px solid ${color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={16} color={color} />
              </div>
            </div>
            {link && (
              <Link href={link} style={{ position: 'absolute', inset: 0, borderRadius: 16 }} />
            )}
          </div>
        ))}
      </div>

      {/* Quick access */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 }}>
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <p style={{ fontSize: 14, fontWeight: 800, margin: 0 }}>Programmes</p>
            <Link href="/venue/os/programmes/new" style={{ fontSize: 12, color: C.emerald, textDecoration: 'none', fontWeight: 700 }}>+ New</Link>
          </div>
          {activeProgs.length === 0 ? (
            <p style={{ color: C.muted, fontSize: 13 }}>No active programmes yet.</p>
          ) : (
            activeProgs.slice(0, 4).map(p => (
              <Link key={p.id} href={`/venue/os/programmes/${p.id}`} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', textDecoration: 'none', color: 'inherit' }}>
                <span style={{ fontSize: 13, color: '#fff' }}>{p.title}</span>
                <span style={{ fontSize: 12, color: C.emerald, fontWeight: 700 }}>PKR {p.price.toLocaleString('en-PK')}</span>
              </Link>
            ))
          )}
        </div>

        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <p style={{ fontSize: 14, fontWeight: 800, margin: 0 }}>Bookable Spaces</p>
            <Link href="/venue/os/slots/new" style={{ fontSize: 12, color: C.emerald, textDecoration: 'none', fontWeight: 700 }}>+ New</Link>
          </div>
          {activeResources.length === 0 ? (
            <p style={{ color: C.muted, fontSize: 13 }}>No resources yet.</p>
          ) : (
            activeResources.slice(0, 4).map(r => (
              <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize: 13, color: '#fff' }}>{r.name}</span>
                <span style={{ fontSize: 12, color: C.violet, fontWeight: 700 }}>PKR {r.price_per_slot.toLocaleString('en-PK')}/slot</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recent bookings */}
      <div style={card}>
        <p style={{ fontSize: 14, fontWeight: 800, margin: '0 0 16px' }}>Recent Slot Bookings</p>
        {recentBookings.length === 0 ? (
          <p style={{ color: C.muted, fontSize: 13 }}>No bookings yet.</p>
        ) : (
          recentBookings.map(b => (
            <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, margin: '0 0 2px', color: '#fff' }}>
                  {b.resources?.name ?? 'Unknown resource'}
                </p>
                <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>
                  {b.date ? format(new Date(b.date), 'MMM d') : ''} · {b.start_time?.slice(0,5)} – {b.end_time?.slice(0,5)} · {b.guest_count} guest{b.guest_count !== 1 ? 's' : ''}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 13, fontWeight: 700, margin: '0 0 3px', color: '#fff' }}>PKR {b.total_price.toLocaleString('en-PK')}</p>
                <span style={{ fontSize: 10, fontWeight: 700, color: STATUS_COLOR[b.status] ?? C.muted, background: `${STATUS_COLOR[b.status] ?? C.muted}15`, border: `1px solid ${STATUS_COLOR[b.status] ?? C.muted}30`, borderRadius: 20, padding: '1px 7px' }}>
                  {b.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
