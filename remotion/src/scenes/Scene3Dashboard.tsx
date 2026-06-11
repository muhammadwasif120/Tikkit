import React from 'react'
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import {
  BG, SURF, BLUE, BLUE_D, GREEN, YELLOW, PURPLE,
  BORDER, T_SEC, T_MUT, Card, StatusPill, DashShell,
} from '../components/DashboardShell'

// Real data from the demo page
const STATS = [
  { label: 'Total Events',      value: '4',    icon: '◈', color: BLUE,    glow: 'rgba(30,94,255,0.15)'    },
  { label: 'Total Guests',      value: '225',  icon: '⬡', color: PURPLE,  glow: 'rgba(167,139,250,0.15)'  },
  { label: 'Pending Approvals', value: '3',    icon: '◉', color: YELLOW,  glow: 'rgba(255,199,69,0.15)'   },
  { label: 'Pending Invoices',  value: '2',    icon: '▣', color: '#EF4444', glow: 'rgba(239,68,68,0.12)' },
]

const EVENTS = [
  { name: 'Rooftop Night — Karachi',  status: 'published', cap: '120', sold: '120', highlight: true  },
  { name: 'Brand Launch — Lahore',    status: 'pending',   cap: '350', sold: '210', highlight: false },
  { name: 'Jazz Night — Islamabad',   status: 'published', cap: '75',  sold: '62',  highlight: false },
  { name: 'Art Bazaar — Karachi',     status: 'draft',     cap: '200', sold: '—',   highlight: false },
]

export const SceneDashboard: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const exitOp = interpolate(frame, [162, 180], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  // Whole dashboard fades in clean
  const dashIn = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: 'clamp' })

  // Stat cards — stagger bottom-up (scale + fade)
  const CARD_D = [8, 18, 28, 38]

  // Event rows — slide from left
  const ROW_D = [58, 72, 86, 100]

  // First row spotlight at f130
  const spotOp = interpolate(frame, [128, 140], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  // Bottom label at f140
  const lblOp = interpolate(frame, [140, 152], [0, 1], { extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill style={{ opacity: exitOp, background: BG }}>
      <div style={{ position: 'absolute', inset: 0, opacity: dashIn }}>
        <DashShell active="dash">
          {/* ── Stat cards row ─────────────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28, height: '100%' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 22 }}>
              {STATS.map((s, i) => {
                const f  = Math.max(0, frame - CARD_D[i])
                const sp = spring({ frame: f, fps, config: { damping: 14, stiffness: 260 }, durationInFrames: 20 })
                const op = interpolate(f, [0, 6], [0, 1], { extrapolateRight: 'clamp' })
                const y  = interpolate(sp, [0, 1], [20, 0])
                const sc = interpolate(sp, [0, 1], [0.94, 1])
                return (
                  <div key={i} style={{ opacity: op, transform: `translateY(${y}px) scale(${sc})` }}>
                    <Card style={{ padding: '26px 28px 22px' }}>
                      <div style={{
                        display: 'flex', alignItems: 'center',
                        justifyContent: 'space-between', marginBottom: 20,
                      }}>
                        <div style={{
                          width: 44, height: 44, borderRadius: 12,
                          background: s.glow,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 18, color: s.color,
                        }}>{s.icon}</div>
                        <span style={{
                          fontSize: 11, fontWeight: 600, color: T_MUT,
                          letterSpacing: '0.1em', textTransform: 'uppercase' as const,
                        }}>This month</span>
                      </div>
                      <div style={{
                        fontSize: 52, fontWeight: 800, color: '#fff',
                        letterSpacing: '-2px', lineHeight: 1, marginBottom: 6,
                      }}>{s.value}</div>
                      <div style={{ fontSize: 14, color: T_SEC, fontWeight: 500 }}>{s.label}</div>
                    </Card>
                  </div>
                )
              })}
            </div>

            {/* ── Events list ─────────────────────────────────────────── */}
            <Card style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              {/* Card header */}
              <div style={{
                padding: '20px 28px', borderBottom: `1px solid ${BORDER}`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                flexShrink: 0,
              }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Events</span>
                <div style={{
                  fontSize: 13, fontWeight: 700, color: BLUE_D,
                  background: `${BLUE}14`, border: `1px solid ${BLUE}30`,
                  padding: '6px 16px', borderRadius: 8,
                }}>+ New Event</div>
              </div>

              {/* Column headers */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 150px 110px 110px',
                padding: '12px 28px',
                borderBottom: `1px solid ${BORDER}`,
                fontSize: 11, fontWeight: 700, color: T_MUT,
                letterSpacing: '0.1em', textTransform: 'uppercase' as const,
                flexShrink: 0,
              }}>
                <span>Event</span>
                <span>Status</span>
                <span>Capacity</span>
                <span>Sold</span>
              </div>

              {/* Rows */}
              {EVENTS.map((ev, i) => {
                const f  = Math.max(0, frame - ROW_D[i])
                const sp = spring({ frame: f, fps, config: { damping: 16, stiffness: 220 }, durationInFrames: 18 })
                const op = interpolate(f, [0, 5], [0, 1], { extrapolateRight: 'clamp' })
                const x  = interpolate(sp, [0, 1], [-20, 0])
                // Spotlight effect on first row
                const isSpot = ev.highlight && spotOp > 0

                return (
                  <div key={i} style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 150px 110px 110px',
                    padding: '20px 28px',
                    borderBottom: i < EVENTS.length - 1 ? `1px solid ${BORDER}` : 'none',
                    alignItems: 'center',
                    opacity: op, transform: `translateX(${x}px)`,
                    background: isSpot ? `rgba(30,94,255,${0.06 * spotOp})` : 'transparent',
                    borderLeft: isSpot ? `3px solid rgba(30,94,255,${spotOp})` : '3px solid transparent',
                  }}>
                    <span style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>{ev.name}</span>
                    <div><StatusPill status={ev.status} /></div>
                    <span style={{ fontSize: 15, color: T_SEC }}>{ev.cap}</span>
                    <span style={{
                      fontSize: 15,
                      color: ev.sold === ev.cap ? GREEN : T_SEC,
                      fontWeight: ev.sold === ev.cap ? 700 : 400,
                    }}>{ev.sold}</span>
                  </div>
                )
              })}
            </Card>
          </div>
        </DashShell>
      </div>

      {/* Bottom-left label — minimal, unobtrusive */}
      <div style={{
        position: 'absolute', bottom: 48, left: 332, // 288 sidebar + 44 padding
        opacity: lblOp,
      }}>
        <p style={{
          fontSize: 13, fontWeight: 700, color: T_MUT,
          letterSpacing: '0.2em', textTransform: 'uppercase' as const,
        }}>
          Real-time · Every event · One place
        </p>
      </div>
    </AbsoluteFill>
  )
}
