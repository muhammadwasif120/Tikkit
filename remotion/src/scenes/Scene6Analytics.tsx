import React from 'react'
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { BG, SURF, BLUE, BLUE_DIM, GREEN, YELLOW, PURPLE, BORDER, TEXT_MUT, TEXT_SEC, Card, DashShell } from '../components/DashboardShell'

// Actual bar data from MOCK_ANALYTICS.checkInTimeline in demo page
const BAR_DATA = [
  { time: '8pm',  val: 12 },
  { time: '9pm',  val: 28 },
  { time: '10pm', val: 45 },
  { time: '11pm', val: 38 },
  { time: '12am', val: 31 },
  { time: '1am',  val: 24 },
  { time: '2am',  val: 13 },
]
const MAX_BAR = 45

const STATS = [
  { label: 'Total Revenue',    value: '₨280,000', icon: '₨', color: YELLOW,  glow: 'rgba(255,199,69,0.15)' },
  { label: 'Attendance Rate',  value: '94%',       icon: '⬡', color: GREEN,   glow: 'rgba(34,197,94,0.15)'  },
  { label: 'Avg. Ticket',      value: '₨3,500',    icon: '◈', color: BLUE,    glow: 'rgba(30,94,255,0.15)'  },
  { label: 'Waitlisted',       value: '23',        icon: '◉', color: PURPLE,  glow: 'rgba(167,139,250,0.15)' },
]

export const SceneAnalytics: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const exitOp = interpolate(frame, [76, 90], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const dashOp = interpolate(frame, [0, 6], [0, 1], { extrapolateRight: 'clamp' })

  // Bars grow up from 0
  const barProgress = interpolate(frame, [8, 48], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  // Stat cards stagger
  const cardDelay = [14, 24, 34, 44]

  // Right callout
  const callOp = interpolate(frame, [50, 58], [0, 1], { extrapolateRight: 'clamp' })
  const callY  = interpolate(frame, [50, 60], [18, 0], { extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill style={{ opacity: exitOp, background: BG }}>
      <div style={{ position: 'absolute', inset: 0, opacity: dashOp }}>
        <DashShell active="anal">
          <div style={{ display: 'flex', gap: 32, height: '100%' }}>

            {/* LEFT — bar chart + mini stats */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 24, minWidth: 0 }}>
              {/* Bar chart */}
              <Card style={{ flex: 1, padding: '28px 32px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 6 }}>Check-in Timeline</div>
                <div style={{ fontSize: 12, color: TEXT_MUT, marginBottom: 24 }}>Rooftop Night — Karachi · Sat 22 Mar 2026</div>

                {/* Bars */}
                <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: 14 }}>
                  {BAR_DATA.map((bar, i) => {
                    const h = (bar.val / MAX_BAR) * 100 * barProgress
                    return (
                      <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, height: '100%', justifyContent: 'flex-end' }}>
                        <div style={{
                          width: '100%', background: `${BLUE}22`,
                          borderRadius: 6, overflow: 'hidden',
                          height: '100%', display: 'flex', alignItems: 'flex-end',
                        }}>
                          <div style={{
                            width: '100%', borderRadius: 6,
                            height: `${h}%`,
                            background: bar.val === MAX_BAR
                              ? `linear-gradient(to top, ${BLUE}, #7C3AED)`
                              : `linear-gradient(to top, ${BLUE}99, ${BLUE}44)`,
                            transition: 'height 0.05s',
                          }} />
                        </div>
                        <span style={{ fontSize: 11, color: TEXT_MUT, fontWeight: 600, flexShrink: 0 }}>{bar.time}</span>
                      </div>
                    )
                  })}
                </div>
              </Card>

              {/* 4 mini stat cards in 2×2 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, flexShrink: 0 }}>
                {STATS.map((stat, i) => {
                  const f  = Math.max(0, frame - cardDelay[i])
                  const s  = spring({ frame: f, fps, config: { damping: 14, stiffness: 240 }, durationInFrames: 22 })
                  const op = interpolate(f, [0, 5], [0, 1], { extrapolateRight: 'clamp' })
                  const y  = interpolate(s, [0, 1], [14, 0])
                  return (
                    <div key={i} style={{ opacity: op, transform: `translateY(${y}px)` }}>
                      <Card style={{ padding: '20px 22px', display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{
                          width: 40, height: 40, borderRadius: 11,
                          background: stat.glow,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 16, color: stat.color, flexShrink: 0,
                        }}>{stat.icon}</div>
                        <div>
                          <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>{stat.value}</div>
                          <div style={{ fontSize: 12, color: TEXT_MUT, fontWeight: 500 }}>{stat.label}</div>
                        </div>
                      </Card>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* RIGHT — callout text */}
            <div style={{
              width: 460, flexShrink: 0,
              display: 'flex', flexDirection: 'column', justifyContent: 'center',
              opacity: callOp, transform: `translateY(${callY}px)`,
              paddingLeft: 40,
            }}>
              <p style={{
                fontSize: 12, fontWeight: 700, letterSpacing: '0.22em',
                textTransform: 'uppercase' as const, color: BLUE, marginBottom: 20,
              }}>Analytics</p>
              <h2 style={{
                fontSize: 80, fontWeight: 900, color: '#fff',
                lineHeight: 0.88, letterSpacing: '-3.5px', marginBottom: 28,
              }}>
                See it all<br />
                <span style={{ color: 'rgba(255,255,255,0.2)' }}>after.</span>
              </h2>
              <p style={{
                fontSize: 17, color: 'rgba(255,255,255,0.28)',
                fontWeight: 500, lineHeight: 1.65, letterSpacing: '-0.3px',
              }}>
                Revenue, attendance,<br />
                check-in timeline —<br />
                auto-generated.<br />
                Export as PDF.
              </p>
            </div>
          </div>
        </DashShell>
      </div>
    </AbsoluteFill>
  )
}
