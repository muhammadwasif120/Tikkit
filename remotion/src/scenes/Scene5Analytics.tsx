import React from 'react'
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, spring } from 'remotion'

const BAR_HEIGHTS = [45, 62, 55, 78, 88, 72, 94]
const BAR_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function AnimatedStat({ label, value, prefix = '', suffix = '', startFrame, frame, fps }: {
  label: string; value: number; prefix?: string; suffix?: string
  startFrame: number; frame: number; fps: number
}) {
  const localFrame = Math.max(0, frame - startFrame)
  const progress = spring({ frame: localFrame, fps, config: { damping: 28, stiffness: 60 }, durationInFrames: 80 })
  const count = Math.round(progress * value)
  const opacity = interpolate(localFrame, [0, 20], [0, 1], { extrapolateRight: 'clamp' })
  const y = interpolate(localFrame, [0, 20], [16, 0], { extrapolateRight: 'clamp' })

  return (
    <div style={{ opacity, transform: `translateY(${y}px)`, textAlign: 'center' as const }}>
      <div style={{ fontSize: 56, fontWeight: 900, color: '#fff', lineHeight: 1, fontVariantNumeric: 'tabular-nums' as const }}>
        {prefix}{count.toLocaleString()}{suffix}
      </div>
      <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)', marginTop: 8, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>{label}</div>
    </div>
  )
}

export const Scene5Analytics: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const exitOpacity = interpolate(frame, [310, 360], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const panelOpacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' })
  const labelOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' })

  // Bar chart
  const barProgress = interpolate(frame, [30, 160], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill style={{ opacity: exitOpacity, background: '#050505', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 80px' }}>

      {/* Header */}
      <div style={{ opacity: labelOpacity, display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 48 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          fontSize: 13, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase' as const,
          color: '#1E5EFF', padding: '6px 16px', borderRadius: 100,
          background: 'rgba(30,94,255,0.1)', border: '1px solid rgba(30,94,255,0.25)',
          marginBottom: 20,
        }}>
          Live Dashboard
        </div>
        <h2 style={{
          fontSize: 52, fontWeight: 900, color: '#fff', textAlign: 'center' as const,
          lineHeight: 1.1, letterSpacing: '-1px',
        }}>
          Every metric. <span style={{ color: '#1E5EFF' }}>One screen.</span>
        </h2>
      </div>

      <div style={{ display: 'flex', gap: 24, width: '100%', opacity: panelOpacity }}>

        {/* Stats column */}
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 20, width: 300, flexShrink: 0,
        }}>
          {[
            { label: 'Attendance rate', value: 94, suffix: '%', startFrame: 40 },
            { label: 'Guests checked in', value: 113, startFrame: 70 },
            { label: 'Revenue (PKR)', value: 240000, prefix: '₨', startFrame: 100 },
          ].map(s => (
            <div key={s.label} style={{
              background: '#111827', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 16, padding: '24px 28px',
            }}>
              <AnimatedStat {...s} frame={frame} fps={fps} />
            </div>
          ))}
        </div>

        {/* Chart + feed column */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Bar chart */}
          <div style={{
            background: '#111827', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 16, padding: '28px 28px 20px', flex: 1,
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: 24 }}>
              Attendance — Last 7 events
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, height: 140 }}>
              {BAR_HEIGHTS.map((h, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: '100%',
                    height: `${h * barProgress}%`,
                    borderRadius: '6px 6px 0 0',
                    background: i === 6
                      ? 'linear-gradient(180deg, #1E5EFF, #7C3AED)'
                      : `rgba(30,94,255,${0.2 + (h / 100) * 0.5})`,
                    boxShadow: i === 6 ? '0 0 20px rgba(30,94,255,0.4)' : 'none',
                    transition: 'height 0.05s linear',
                  }} />
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>{BAR_LABELS[i]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Report ready badge */}
          <div style={{
            background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.25)',
            borderRadius: 14, padding: '18px 24px',
            display: 'flex', alignItems: 'center', gap: 16,
            opacity: interpolate(frame, [200, 230], [0, 1], { extrapolateRight: 'clamp' }),
            transform: `translateY(${interpolate(frame, [200, 230], [12, 0], { extrapolateRight: 'clamp' })}px)`,
          }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(34,197,94,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
              📄
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#22C55E' }}>Post-event report ready</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Attendance · Revenue · Check-in breakdown · Export as PDF</div>
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  )
}
