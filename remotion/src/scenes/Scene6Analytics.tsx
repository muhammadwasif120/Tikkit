// Full-bleed stats scene — real numbers from demo page analytics
// 4 panels spanning 1920px on pure black — same grammar as SceneProblem
import React from 'react'
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { BLUE, GREEN, YELLOW, PURPLE } from '../components/DashboardShell'

const PANELS = [
  { num: '₨280K',  label: 'Total\nrevenue',      color: YELLOW,  delay: 0  },
  { num: '94%',    label: 'Attendance\nrate',     color: GREEN,   delay: 16 },
  { num: '191',    label: 'Guests\nchecked in',   color: BLUE,    delay: 32 },
  { num: '₨3.5K', label: 'Avg.\nticket price',   color: PURPLE,  delay: 48 },
]

export const SceneAnalytics: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const exitOp = interpolate(frame, [76, 90], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  // Sub-label at bottom
  const subOp = interpolate(frame, [60, 70], [0, 1], { extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill style={{ opacity: exitOp, background: '#000', display: 'flex', alignItems: 'stretch' }}>
      {PANELS.map((p, i) => {
        const f  = Math.max(0, frame - p.delay)
        const sp = spring({ frame: f, fps, config: { damping: 12, stiffness: 260 }, durationInFrames: 30 })
        const op = interpolate(f, [0, 5], [0, 1], { extrapolateRight: 'clamp' })
        const y  = interpolate(sp, [0, 1], [28, 0])

        return (
          <div key={i} style={{
            flex: 1,
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
            paddingLeft:  i === 0 ? 140 : 72,
            paddingRight: i === PANELS.length - 1 ? 120 : 0,
            borderRight:  i < PANELS.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
            opacity: op,
          }}>
            {/* Coloured accent bar */}
            <div style={{
              width: 40, height: 4, borderRadius: 2,
              background: p.color, marginBottom: 24,
              opacity: op,
              boxShadow: `0 0 12px ${p.color}80`,
            }} />

            {/* Number */}
            <div style={{
              fontSize: 136, fontWeight: 900, color: '#fff',
              lineHeight: 0.85, letterSpacing: '-5px',
              fontVariantNumeric: 'tabular-nums' as const,
              transform: `translateY(${y}px)`,
            }}>
              {p.num}
            </div>

            {/* Label */}
            <div style={{
              fontSize: 17, fontWeight: 600,
              color: 'rgba(255,255,255,0.3)',
              letterSpacing: '0.06em', textTransform: 'uppercase' as const,
              marginTop: 22, whiteSpace: 'pre-line' as const, lineHeight: 1.45,
            }}>
              {p.label}
            </div>
          </div>
        )
      })}

      {/* Bottom label */}
      <div style={{
        position: 'absolute', bottom: 52, left: 140,
        opacity: subOp,
      }}>
        <p style={{
          fontSize: 14, color: 'rgba(255,255,255,0.18)',
          letterSpacing: '0.16em', textTransform: 'uppercase' as const,
          fontWeight: 600,
        }}>
          After every event · Auto-generated · Export as PDF
        </p>
      </div>
    </AbsoluteFill>
  )
}
