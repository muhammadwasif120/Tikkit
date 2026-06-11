import React from 'react'
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'

// Apple-style: big numbers, fast reveal, minimal layout
const stats = [
  { value: 94, suffix: '%', label: 'Attendance rate', delay: 0 },
  { value: 120, suffix: '', label: 'Guests checked in', delay: 30 },
  { value: 240, suffix: 'K', label: 'Revenue in PKR', prefix: '₨', delay: 60 },
]

export const SceneNumbers: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const exitOpacity = interpolate(frame, [132, 150], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  const headOpacity = interpolate(frame, [0, 7], [0, 1], { extrapolateRight: 'clamp' })
  const headY = interpolate(frame, [0, 10], [14, 0], { extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill style={{ opacity: exitOpacity, background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 120px' }}>

      {/* Label */}
      <p style={{
        opacity: headOpacity, transform: `translateY(${headY}px)`,
        fontSize: 13, fontWeight: 700, letterSpacing: '0.18em',
        textTransform: 'uppercase' as const, color: '#1E5EFF',
        marginBottom: 56,
      }}>
        After every event
      </p>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 0, width: '100%', maxWidth: 1100 }}>
        {stats.map((stat, i) => {
          const localF = Math.max(0, frame - stat.delay)
          const s = spring({ frame: localF, fps, config: { damping: 14, stiffness: 200 }, durationInFrames: 40 })
          const opacity = interpolate(localF, [0, 8], [0, 1], { extrapolateRight: 'clamp' })
          const count = Math.round(s * stat.value)

          return (
            <div key={i} style={{
              flex: 1,
              opacity,
              textAlign: 'center' as const,
              borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.07)' : 'none',
              padding: '0 40px',
            }}>
              <div style={{
                fontSize: 100, fontWeight: 900, color: '#fff', lineHeight: 1,
                fontVariantNumeric: 'tabular-nums' as const, letterSpacing: '-3px',
              }}>
                {stat.prefix}{count}{stat.suffix}
              </div>
              <div style={{
                fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,0.3)',
                letterSpacing: '0.06em', textTransform: 'uppercase' as const,
                marginTop: 16,
              }}>
                {stat.label}
              </div>
            </div>
          )
        })}
      </div>

      {/* Divider + caption */}
      <div style={{
        opacity: interpolate(frame, [90, 102], [0, 1], { extrapolateRight: 'clamp' }),
        marginTop: 64, textAlign: 'center' as const,
      }}>
        <div style={{ width: 40, height: 1, background: 'rgba(255,255,255,0.15)', margin: '0 auto 24px' }} />
        <p style={{ fontSize: 22, color: 'rgba(255,255,255,0.35)', letterSpacing: '-0.3px' }}>
          One dashboard. Export as PDF in seconds.
        </p>
      </div>
    </AbsoluteFill>
  )
}
