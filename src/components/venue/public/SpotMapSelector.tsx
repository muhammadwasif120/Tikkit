'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { bookSpot, cancelSpotBooking, type SpotItem } from '@/app/actions/venueActions'
import { MapPin, Users, CheckCircle2, X, Loader2 } from 'lucide-react'

const C = {
  emerald: '#00D4AA', violet: '#7C3AED',
  surface: '#0A0F14', border: 'rgba(0,212,170,0.12)',
  muted: 'rgba(255,255,255,0.4)', text: '#FFFFFF',
  bg: '#050508',
}

const TYPE_COLORS: Record<SpotItem['type'], string> = {
  table: '#00D4AA',
  booth: '#7C3AED',
  row:   '#F6C90E',
  bar:   '#FC8181',
  stage: '#CC00FF',
  zone:  'rgba(255,255,255,0.3)',
}

type Booking = { spot_id: string; user_id: string; party_size: number }

type SpotMap = {
  id: string
  name: string
  layout_json: SpotItem[]
  canvas_width: number
  canvas_height: number
}

type Venue      = { id: string; name: string; slug: string }
type Instance   = { id: string; date: string; status: string }
type Programme  = { id: string; title: string; start_time: string; capacity: number }

export default function SpotMapSelector({
  venue, instance, programme, spotMap,
  existingBookings, mySpot, userId,
}: {
  venue: Venue
  instance: Instance
  programme: Programme
  spotMap: SpotMap
  existingBookings: Booking[]
  mySpot: Booking | null
  userId: string | null
}) {
  const [bookings, setBookings] = useState<Booking[]>(existingBookings)
  const [myBooking, setMyBooking] = useState<Booking | null>(mySpot)
  const [hovered, setHovered]   = useState<string | null>(null)
  const [selected, setSelected] = useState<SpotItem | null>(null)
  const [partySize, setPartySize] = useState(1)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [success, setSuccess]   = useState(false)

  const svgRef = useRef<SVGSVGElement>(null)
  const spots  = (spotMap.layout_json ?? []) as SpotItem[]
  const W = spotMap.canvas_width  ?? 800
  const H = spotMap.canvas_height ?? 500

  // ── Supabase Realtime subscription ─────────────────────────────────────────
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`spot-map-${spotMap.id}-${instance.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'spot_bookings',
          filter: `spot_map_id=eq.${spotMap.id}`,
        },
        (payload: any) => {
          if (payload.eventType === 'INSERT') {
            const b = payload.new
            if (b.instance_id !== instance.id) return
            setBookings(prev => {
              if (prev.some(x => x.spot_id === b.spot_id)) return prev
              return [...prev, { spot_id: b.spot_id, user_id: b.user_id, party_size: b.party_size }]
            })
          } else if (payload.eventType === 'DELETE') {
            const b = payload.old
            setBookings(prev => prev.filter(x => !(x.spot_id === b.spot_id && x.user_id === b.user_id)))
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [spotMap.id, instance.id])

  // ── Spot status helpers ─────────────────────────────────────────────────────
  const isTaken = (spotId: string) =>
    bookings.some(b => b.spot_id === spotId && (userId ? b.user_id !== userId : true))
  const isMine  = (spotId: string) => myBooking?.spot_id === spotId

  // ── Book a spot ─────────────────────────────────────────────────────────────
  const handleBook = async () => {
    if (!selected || !userId) return
    setLoading(true)
    setError(null)
    const result = await bookSpot(spotMap.id, selected.id, instance.id, partySize, selected.surcharge)
    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }
    setMyBooking({ spot_id: selected.id, user_id: userId, party_size: partySize })
    setBookings(prev => {
      const filtered = prev.filter(b => b.user_id !== userId)
      return [...filtered, { spot_id: selected.id, user_id: userId, party_size: partySize }]
    })
    setSuccess(true)
    setSelected(null)
    setTimeout(() => setSuccess(false), 4000)
    setLoading(false)
  }

  // ── Cancel booking ──────────────────────────────────────────────────────────
  const handleCancel = async () => {
    if (!userId) return
    setLoading(true)
    const result = await cancelSpotBooking(spotMap.id, instance.id)
    if (!result.error) {
      setBookings(prev => prev.filter(b => b.user_id !== userId))
      setMyBooking(null)
    }
    setLoading(false)
  }

  // ── Format date ─────────────────────────────────────────────────────────────
  const dateStr = new Date(instance.date + 'T00:00:00').toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  const takenCount = bookings.length

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'var(--font-body, "DM Sans", sans-serif)', padding: '32px 20px 60px' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{ width: 22, height: 22, borderRadius: 6, background: `linear-gradient(135deg, ${C.emerald}, ${C.violet})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MapPin size={11} color="#050508" strokeWidth={2.5} />
            </div>
            <span style={{ fontSize: 12, color: C.emerald, fontWeight: 700 }}>{venue.name}</span>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 900, margin: '0 0 6px', letterSpacing: '-0.5px' }}>{programme.title}</h1>
          <p style={{ color: C.muted, fontSize: 14, margin: 0 }}>{dateStr} · {programme.start_time}</p>
          <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
            <span style={{ padding: '4px 10px', borderRadius: 20, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', fontSize: 12, color: C.muted }}>
              <Users size={10} style={{ marginRight: 4, verticalAlign: 'middle' }} />
              {takenCount}/{programme.capacity} reserved
            </span>
            {myBooking && (
              <span style={{ padding: '4px 10px', borderRadius: 20, background: 'rgba(0,212,170,0.1)', border: '1px solid rgba(0,212,170,0.3)', fontSize: 12, color: C.emerald, fontWeight: 600 }}>
                ✓ Your spot: {spots.find(s => s.id === myBooking.spot_id)?.label ?? 'selected'}
              </span>
            )}
          </div>
        </div>

        {/* Success banner */}
        {success && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(0,212,170,0.12)', border: '1px solid rgba(0,212,170,0.3)', borderRadius: 12, padding: '12px 16px', marginBottom: 20 }}>
            <CheckCircle2 size={16} color={C.emerald} />
            <span style={{ fontSize: 14, color: C.emerald, fontWeight: 600 }}>Spot reserved! See you there.</span>
          </div>
        )}

        {/* Not logged in warning */}
        {!userId && (
          <div style={{ background: 'rgba(246,201,14,0.08)', border: '1px solid rgba(246,201,14,0.2)', borderRadius: 12, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#F6C90E' }}>
            Sign in to reserve a spot for this session.
          </div>
        )}

        {/* Layout */}
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>

          {/* Canvas */}
          <div style={{ flex: 1, minWidth: 280, position: 'relative', borderRadius: 16, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
            <svg
              ref={svgRef}
              viewBox={`0 0 ${W} ${H}`}
              style={{ width: '100%', display: 'block', background: '#0D1117', userSelect: 'none' }}
            >
              {/* Grid */}
              <defs>
                <pattern id="sg-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width={W} height={H} fill="url(#sg-grid)" />

              {spots.map(spot => {
                const taken   = isTaken(spot.id)
                const mine    = isMine(spot.id)
                const hover   = hovered === spot.id
                const isStage = spot.type === 'stage'
                const isZone  = spot.type === 'zone'
                const isCircle = spot.type === 'table'
                const baseColor = TYPE_COLORS[spot.type]
                const cx = spot.x + spot.w / 2
                const cy = spot.y + spot.h / 2

                const fillOpacity = mine ? 0.4 : taken ? 0.06 : hover ? 0.2 : 0.1
                const strokeColor = mine ? C.emerald : taken ? 'rgba(255,255,255,0.15)' : hover ? baseColor : baseColor
                const strokeWidth = mine ? 2.5 : hover ? 2 : 1.5
                const strokeOpacity = mine ? 1 : taken ? 0.3 : hover ? 1 : 0.7
                const cursor = isStage || isZone ? 'default' : taken ? 'not-allowed' : userId ? 'pointer' : 'default'

                return (
                  <g
                    key={spot.id}
                    style={{ cursor }}
                    onMouseEnter={() => { if (!isStage && !isZone) setHovered(spot.id) }}
                    onMouseLeave={() => setHovered(null)}
                    onClick={() => {
                      if (isStage || isZone || !userId) return
                      if (taken && !mine) return
                      if (mine) return
                      setSelected(spot)
                      setPartySize(Math.min(1, spot.capacity))
                    }}
                  >
                    {isCircle ? (
                      <ellipse
                        cx={cx} cy={cy}
                        rx={spot.w / 2} ry={spot.h / 2}
                        fill={`${baseColor}`}
                        fillOpacity={fillOpacity}
                        stroke={strokeColor}
                        strokeWidth={strokeWidth}
                        strokeOpacity={strokeOpacity}
                      />
                    ) : (
                      <rect
                        x={spot.x} y={spot.y} width={spot.w} height={spot.h}
                        rx={isZone ? 8 : 6}
                        fill={`${baseColor}`}
                        fillOpacity={fillOpacity}
                        stroke={strokeColor}
                        strokeWidth={strokeWidth}
                        strokeOpacity={strokeOpacity}
                        strokeDasharray={isZone ? '6 4' : undefined}
                      />
                    )}

                    {/* Label */}
                    <text
                      x={cx} y={cy - (mine || taken ? 5 : 0)}
                      textAnchor="middle" dominantBaseline="middle"
                      fontSize={Math.min(11, Math.min(spot.w, spot.h) * 0.2)}
                      fill={mine ? C.emerald : taken ? 'rgba(255,255,255,0.2)' : baseColor}
                      fontFamily="DM Sans, sans-serif"
                      fontWeight="700"
                      style={{ pointerEvents: 'none' }}
                    >
                      {spot.label.length > 10 ? spot.label.slice(0, 9) + '…' : spot.label}
                    </text>

                    {/* Status sub-text */}
                    {mine && (
                      <text x={cx} y={cy + 9} textAnchor="middle" dominantBaseline="middle" fontSize={8} fill={C.emerald} fontFamily="DM Sans, sans-serif" style={{ pointerEvents: 'none' }}>
                        yours
                      </text>
                    )}
                    {taken && !mine && (
                      <text x={cx} y={cy + 9} textAnchor="middle" dominantBaseline="middle" fontSize={8} fill="rgba(255,255,255,0.2)" fontFamily="DM Sans, sans-serif" style={{ pointerEvents: 'none' }}>
                        taken
                      </text>
                    )}
                    {!taken && !mine && !isStage && !isZone && spot.surcharge > 0 && (
                      <text x={cx} y={cy + 9} textAnchor="middle" dominantBaseline="middle" fontSize={8} fill={`${baseColor}99`} fontFamily="DM Sans, sans-serif" style={{ pointerEvents: 'none' }}>
                        +{spot.surcharge.toLocaleString()}
                      </text>
                    )}
                  </g>
                )
              })}
            </svg>

            {/* Legend */}
            <div style={{ display: 'flex', gap: 16, padding: '10px 14px', borderTop: `1px solid ${C.border}`, background: 'rgba(0,0,0,0.3)', flexWrap: 'wrap' }}>
              {[
                { color: C.emerald, label: 'Your spot',  fill: 0.4 },
                { color: TYPE_COLORS.table, label: 'Available', fill: 0.12 },
                { color: 'rgba(255,255,255,0.2)', label: 'Taken', fill: 0.06 },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 12, height: 12, borderRadius: 3, background: item.color, opacity: 0.8 }} />
                  <span style={{ fontSize: 11, color: C.muted }}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Side panel */}
          <div style={{ width: 220, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* My booking */}
            {myBooking && (
              <div style={{ background: 'rgba(0,212,170,0.06)', border: '1px solid rgba(0,212,170,0.2)', borderRadius: 14, padding: 16 }}>
                <p style={{ fontSize: 12, fontWeight: 800, color: C.emerald, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Your reservation</p>
                <p style={{ fontSize: 15, fontWeight: 700, margin: '0 0 4px' }}>
                  {spots.find(s => s.id === myBooking.spot_id)?.label ?? 'Spot'}
                </p>
                <p style={{ fontSize: 12, color: C.muted, margin: '0 0 12px' }}>Party of {myBooking.party_size}</p>
                <button onClick={handleCancel} disabled={loading} style={{ width: '100%', padding: '8px 0', borderRadius: 8, background: 'none', border: '1px solid rgba(252,129,129,0.3)', color: 'rgba(252,129,129,0.7)', fontSize: 12, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                  {loading ? 'Cancelling…' : 'Cancel reservation'}
                </button>
              </div>
            )}

            {/* Selection prompt */}
            {!myBooking && !selected && (
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 18, textAlign: 'center' }}>
                <MapPin size={24} color="rgba(255,255,255,0.1)" style={{ marginBottom: 8 }} />
                <p style={{ color: C.muted, fontSize: 13, margin: 0 }}>
                  {userId ? 'Click a spot on the map to reserve it' : 'Sign in to reserve a spot'}
                </p>
              </div>
            )}

            {/* Booking panel */}
            {selected && !myBooking && (
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 800, margin: '0 0 3px', color: TYPE_COLORS[selected.type] }}>{selected.label}</p>
                    <p style={{ fontSize: 11, color: C.muted, margin: 0, textTransform: 'capitalize' }}>{selected.type}</p>
                  </div>
                  <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, padding: 2 }}>
                    <X size={14} />
                  </button>
                </div>

                {selected.capacity > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Party size</label>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {Array.from({ length: Math.min(selected.capacity, 8) }, (_, i) => i + 1).map(n => (
                        <button key={n} onClick={() => setPartySize(n)}
                          style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${partySize === n ? TYPE_COLORS[selected.type] + '60' : 'rgba(255,255,255,0.08)'}`, background: partySize === n ? `${TYPE_COLORS[selected.type]}18` : 'transparent', color: partySize === n ? TYPE_COLORS[selected.type] : C.muted, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {selected.surcharge > 0 && (
                  <div style={{ marginBottom: 14, padding: '8px 10px', background: 'rgba(246,201,14,0.06)', border: '1px solid rgba(246,201,14,0.15)', borderRadius: 8 }}>
                    <p style={{ fontSize: 12, color: '#F6C90E', margin: 0 }}>+PKR {selected.surcharge.toLocaleString()} surcharge applies</p>
                  </div>
                )}

                {error && (
                  <div style={{ marginBottom: 10, padding: '8px 10px', background: 'rgba(252,129,129,0.08)', border: '1px solid rgba(252,129,129,0.2)', borderRadius: 8 }}>
                    <p style={{ fontSize: 12, color: '#FC8181', margin: 0 }}>{error}</p>
                  </div>
                )}

                <button onClick={handleBook} disabled={loading}
                  style={{ width: '100%', padding: '10px 0', borderRadius: 10, background: TYPE_COLORS[selected.type], color: '#050508', fontSize: 13, fontWeight: 800, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'inherit' }}>
                  {loading ? <Loader2 size={14} className="animate-spin" /> : null}
                  {loading ? 'Reserving…' : 'Reserve this spot'}
                </button>
              </div>
            )}

            {/* Spot list summary */}
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 16 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 10px' }}>Available</p>
              {spots.filter(s => s.type !== 'stage' && s.type !== 'zone' && !isTaken(s.id) && !isMine(s.id)).slice(0, 8).map(s => (
                <div key={s.id} onClick={() => { if (userId && !myBooking) { setSelected(s); setPartySize(1) } }}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: userId && !myBooking ? 'pointer' : 'default' }}>
                  <span style={{ fontSize: 12, color: TYPE_COLORS[s.type] }}>{s.label}</span>
                  <span style={{ fontSize: 11, color: C.muted }}>{s.capacity > 0 ? `${s.capacity} pax` : '—'}</span>
                </div>
              ))}
              {spots.filter(s => s.type !== 'stage' && s.type !== 'zone' && !isTaken(s.id) && !isMine(s.id)).length === 0 && (
                <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>All spots taken</p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', marginTop: 32, textAlign: 'center' }}>
          Spot availability updates in real time · Powered by <span style={{ color: C.emerald }}>Venues</span>
        </p>
      </div>
    </div>
  )
}
