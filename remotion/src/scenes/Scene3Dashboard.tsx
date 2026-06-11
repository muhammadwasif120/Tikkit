import React from 'react'
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { BG, SURF, BLUE, BLUE_DIM, GREEN, YELLOW, PURPLE, BORDER, TEXT_MUT, TEXT_SEC, Card, StatusPill, DashShell } from '../components/DashboardShell'

const EVENTS = [
  { name: 'Rooftop Night — Karachi',  status: 'published', cap: '120', sold: '120' },
  { name: 'Brand Launch — Lahore',    status: 'pending',   cap: '350', sold: '210' },
  { name: 'Jazz Night — Islamabad',   status: 'published', cap: '75',  sold: '62'  },
  { name: 'Art Bazaar — Karachi',     status: 'draft',     cap: '200', sold: '—'   },
]

const STAT_CARDS = [
  { label: 'Total Events',       value: '4',   icon: '◈', color: BLUE,   glow: 'rgba(30,94,255,0.15)'   },
  { label: 'Total Guests',       value: '225', icon: '⬡', color: PURPLE, glow: 'rgba(167,139,250,0.15)' },
  { label: 'Pending Approvals',  value: '3',   icon: '◉', color: YELLOW, glow: 'rgba(255,199,69,0.15)'  },
  { label: 'Pending Invoices',   value: '2',   icon: '▣', color: '#EF4444', glow: 'rgba(239,68,68,0.12)' },
]

export const SceneDashboard: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const exitOp = interpolate(frame, [160, 180], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  // Dashboard fades in whole
  const dashOp = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: 'clamp' })
  const dashS  = spring({ frame, fps, config: { damping: 18, stiffness: 160 }, durationInFrames: 28 })
  const dashX  = interpolate(dashS, [0, 1], [-24, 0])

  // Stat cards stagger in
  const statDelay = [14, 22, 30, 38]

  // Events list rows stagger
  const rowDelay = [60, 72, 84, 96]

  // Big overlay callout
  const callOp = interpolate(frame, [108, 116], [0, 1], { extrapolateRight: 'clamp' })
  const callY  = interpolate(frame, [108, 118], [20, 0], { extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill style={{ opacity: exitOp, background: BG }}>
      {/* Full-screen dashboard */}
      <div style={{
        position: 'absolute', inset: 0,
        opacity: dashOp, transform: `translateX(${dashX}px)`,
      }}>
        <DashShell active="dash">
          {/* Content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32, height: '100%' }}>

            {/* Stats row — 4 cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 20 }}>
              {STAT_CARDS.map((card, i) => {
                const f = Math.max(0, frame - statDelay[i])
                const s = spring({ frame: f, fps, config: { damping: 14, stiffness: 240 }, durationInFrames: 22 })
                const op = interpolate(f, [0, 5], [0, 1], { extrapolateRight: 'clamp' })
                const y  = interpolate(s, [0, 1], [18, 0])
                return (
                  <div key={i} style={{ opacity: op, transform: `translateY(${y}px)` }}>
                    <Card style={{ padding: '28px 28px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                        <div style={{
                          width: 44, height: 44, borderRadius: 12,
                          background: card.glow,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 18, color: card.color,
                        }}>{card.icon}</div>
                        <span style={{ fontSize: 11, color: TEXT_MUT, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>
                          This month
                        </span>
                      </div>
                      <div style={{ fontSize: 48, fontWeight: 800, color: '#fff', letterSpacing: '-2px', lineHeight: 1, marginBottom: 6 }}>
                        {card.value}
                      </div>
                      <div style={{ fontSize: 14, color: TEXT_SEC, fontWeight: 500 }}>{card.label}</div>
                    </Card>
                  </div>
                )
              })}
            </div>

            {/* Events list */}
            <Card style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{
                padding: '20px 28px', borderBottom: `1px solid ${BORDER}`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Events</span>
                <div style={{
                  fontSize: 12, fontWeight: 700, color: BLUE_DIM,
                  background: `${BLUE}12`, border: `1px solid ${BLUE}30`,
                  padding: '5px 14px', borderRadius: 8,
                }}>
                  + New Event
                </div>
              </div>

              {/* Header */}
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 120px 100px 100px',
                padding: '12px 28px', borderBottom: `1px solid ${BORDER}`,
                fontSize: 11, fontWeight: 700, color: TEXT_MUT,
                letterSpacing: '0.1em', textTransform: 'uppercase' as const,
              }}>
                <span>Event name</span>
                <span>Status</span>
                <span>Capacity</span>
                <span>Sold</span>
              </div>

              {/* Rows */}
              {EVENTS.map((ev, i) => {
                const f = Math.max(0, frame - rowDelay[i])
                const s = spring({ frame: f, fps, config: { damping: 16, stiffness: 220 }, durationInFrames: 20 })
                const op = interpolate(f, [0, 4], [0, 1], { extrapolateRight: 'clamp' })
                const x  = interpolate(s, [0, 1], [-16, 0])
                return (
                  <div key={i} style={{
                    display: 'grid', gridTemplateColumns: '1fr 120px 100px 100px',
                    padding: '18px 28px', borderBottom: i < EVENTS.length - 1 ? `1px solid ${BORDER}` : 'none',
                    alignItems: 'center',
                    opacity: op, transform: `translateX(${x}px)`,
                  }}>
                    <span style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>{ev.name}</span>
                    <StatusPill status={ev.status} />
                    <span style={{ fontSize: 15, color: TEXT_SEC }}>{ev.cap}</span>
                    <span style={{ fontSize: 15, color: ev.sold === ev.cap ? GREEN : TEXT_SEC, fontWeight: ev.sold === ev.cap ? 700 : 400 }}>{ev.sold}</span>
                  </div>
                )
              })}
            </Card>
          </div>
        </DashShell>
      </div>

      {/* Overlay callout — right side */}
      <div style={{
        position: 'absolute', right: 0, top: 0, bottom: 0,
        width: '38%',
        background: 'linear-gradient(to right, transparent, rgba(0,0,0,0.92) 30%)',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        paddingLeft: 60, paddingRight: 100,
        opacity: callOp, transform: `translateY(${callY}px)`,
        pointerEvents: 'none',
      }}>
        <p style={{
          fontSize: 13, fontWeight: 700, letterSpacing: '0.22em',
          textTransform: 'uppercase' as const, color: BLUE, marginBottom: 20,
        }}>Dashboard</p>
        <h2 style={{
          fontSize: 72, fontWeight: 900, color: '#fff',
          lineHeight: 0.9, letterSpacing: '-3px', marginBottom: 28,
        }}>
          Every event.<br />
          <span style={{ color: 'rgba(255,255,255,0.22)' }}>All in one</span><br />
          <span style={{ color: 'rgba(255,255,255,0.22)' }}>place.</span>
        </h2>
        <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.3)', fontWeight: 500, lineHeight: 1.6 }}>
          Guests, check-ins,<br />vendors, analytics —<br />live as it happens.
        </p>
      </div>
    </AbsoluteFill>
  )
}
