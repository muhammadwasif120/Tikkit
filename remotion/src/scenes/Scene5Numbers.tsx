import React from 'react'
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'

// 3 stats span the FULL 1920px — no centering, pure widescreen
const STATS = [
  { value: 94,  suffix: '%',  label: 'Attendance\nrate',      delay: 0  },
  { value: 120, suffix: '',   label: 'Guests\nchecked in',    delay: 18 },
  { value: 240, suffix: 'K', label: 'Revenue\nin PKR',       delay: 36, prefix: '₨' },
]

export const SceneNumbers: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const exitOp = interpolate(frame, [76, 90], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill style={{ opacity: exitOp, background: '#000', display: 'flex', alignItems: 'stretch' }}>
      {STATS.map((stat, i) => {
        const lF = Math.max(0, frame - stat.delay)
        const s = spring({ frame: lF, fps, config: { damping: 12, stiffness: 280 }, durationInFrames: 36 })
        const op = interpolate(lF, [0, 5], [0, 1], { extrapolateRight: 'clamp' })
        const count = Math.round(s * stat.value)

        return (
          <div key={i} style={{
            flex: 1,
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
            paddingLeft: i === 0 ? 140 : 80,
            paddingRight: i === 2 ? 140 : 80,
            borderRight: i < 2 ? '1px solid rgba(255,255,255,0.06)' : 'none',
            opacity: op,
          }}>
            <div style={{
              fontSize: 160, fontWeight: 900, color: '#fff', lineHeight: 0.85,
              letterSpacing: '-6px', fontVariantNumeric: 'tabular-nums' as const,
            }}>
              {stat.prefix}{count}{stat.suffix}
            </div>
            <div style={{
              fontSize: 18, fontWeight: 600,
              color: 'rgba(255,255,255,0.28)',
              letterSpacing: '0.08em', textTransform: 'uppercase' as const,
              marginTop: 24, whiteSpace: 'pre-line' as const, lineHeight: 1.4,
            }}>
              {stat.label}
            </div>
          </div>
        )
      })}

      {/* Bottom label */}
      <div style={{
        position: 'absolute', bottom: 52, left: 140,
        opacity: interpolate(frame, [50, 62], [0, 1], { extrapolateRight: 'clamp' }),
      }}>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.14em', textTransform: 'uppercase' as const, fontWeight: 600 }}>
          After every event · Auto-generated · Export as PDF
        </p>
      </div>
    </AbsoluteFill>
  )
}
