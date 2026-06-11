import React from 'react'
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'

const EVENT_NAME = 'Rooftop Night — DHA Karachi'

export const SceneCreate: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const exitOpacity = interpolate(frame, [192, 210], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  // Left headline
  const headOpacity = interpolate(frame, [0, 7], [0, 1], { extrapolateRight: 'clamp' })
  const headY = interpolate(frame, [0, 10], [16, 0], { extrapolateRight: 'clamp' })

  // Panel
  const panelS = spring({ frame: Math.max(0, frame - 8), fps, config: { damping: 14, stiffness: 220 }, durationInFrames: 30 })
  const panelOpacity = interpolate(frame, [8, 16], [0, 1], { extrapolateRight: 'clamp' })

  // Fast typewriter — 2 chars per frame
  const charCount = Math.min(EVENT_NAME.length, Math.floor(Math.max(0, frame - 30) * 2))
  const typedName = EVENT_NAME.slice(0, charCount)

  // Live badge
  const liveFrame = Math.max(0, frame - 140)
  const liveS = spring({ frame: liveFrame, fps, config: { damping: 8, stiffness: 320 }, durationInFrames: 20 })
  const liveOpacity = interpolate(liveFrame, [0, 5], [0, 1], { extrapolateRight: 'clamp' })
  const btnOpacity = interpolate(frame, [128, 140], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  // Caption
  const capOpacity = interpolate(frame, [158, 168], [0, 1], { extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill style={{ opacity: exitOpacity, background: '#000', display: 'flex', alignItems: 'center', gap: 80, padding: '0 100px' }}>

      {/* Left */}
      <div style={{ flex: '0 0 380px' }}>
        <p style={{
          opacity: headOpacity, transform: `translateY(${headY}px)`,
          fontSize: 13, fontWeight: 700, letterSpacing: '0.18em',
          textTransform: 'uppercase' as const, color: '#1E5EFF', marginBottom: 22,
        }}>
          Create
        </p>
        <h2 style={{
          opacity: headOpacity, transform: `translateY(${headY}px)`,
          fontSize: 68, fontWeight: 900, color: '#fff',
          lineHeight: 1.05, letterSpacing: '-2px', marginBottom: 20,
        }}>
          Live in two<br />minutes.
        </h2>
        <p style={{
          opacity: capOpacity,
          fontSize: 22, color: 'rgba(255,255,255,0.4)', lineHeight: 1.55,
        }}>
          Name it.<br />Set capacity.<br />Go live.
        </p>
      </div>

      {/* Right — dashboard panel */}
      <div style={{
        flex: 1,
        opacity: panelOpacity,
        transform: `scale(${0.9 + panelS * 0.1})`,
        background: '#0D0D0D',
        border: '1px solid rgba(255,255,255,0.09)',
        borderRadius: 20,
        overflow: 'hidden',
        boxShadow: '0 60px 120px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)',
      }}>
        {/* Mac-style titlebar */}
        <div style={{ background: '#0A0A0A', padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 7 }}>
          {['#FF5F57', '#FFBD2E', '#28C940'].map(c => (
            <div key={c} style={{ width: 11, height: 11, borderRadius: '50%', background: c }} />
          ))}
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.22)', marginLeft: 10, fontWeight: 500 }}>New Event — Tikkit X</span>
        </div>

        <div style={{ padding: '30px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Event name */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginBottom: 8 }}>Event name</div>
            <div style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(30,94,255,0.45)',
              borderRadius: 10, padding: '13px 16px',
              fontSize: 22, color: '#fff', fontWeight: 700,
              minHeight: 54, display: 'flex', alignItems: 'center',
            }}>
              {typedName}
              {charCount < EVENT_NAME.length && (
                <span style={{ width: 2, height: 22, background: '#1E5EFF', marginLeft: 2, opacity: Math.floor(frame / 5) % 2 }} />
              )}
            </div>
          </div>

          {/* Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {[['Capacity', '120'], ['Access', 'Invite only']].map(([label, val]) => (
              <div key={label}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginBottom: 8 }}>{label}</div>
                <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '13px 16px', fontSize: 16, color: 'rgba(255,255,255,0.55)', minHeight: 54, display: 'flex', alignItems: 'center' }}>{val}</div>
              </div>
            ))}
          </div>

          {/* Date + location */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {[['Date', 'Sat, 22 Mar 2026'], ['Location', 'DHA Phase 5, Karachi']].map(([label, val]) => (
              <div key={label}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginBottom: 8 }}>{label}</div>
                <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '13px 16px', fontSize: 15, color: 'rgba(255,255,255,0.55)', minHeight: 54, display: 'flex', alignItems: 'center' }}>{val}</div>
              </div>
            ))}
          </div>

          {/* Go live / LIVE badge */}
          <div style={{ position: 'relative', height: 54 }}>
            <div style={{
              position: 'absolute', inset: 0,
              background: '#1E5EFF', borderRadius: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, fontWeight: 800, color: '#fff',
              opacity: btnOpacity,
            }}>
              Go Live →
            </div>
            <div style={{
              position: 'absolute', inset: 0,
              background: 'rgba(34,197,94,0.1)',
              border: '1px solid rgba(34,197,94,0.45)',
              borderRadius: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              opacity: liveOpacity,
              transform: `scale(${0.94 + liveS * 0.06})`,
            }}>
              <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 10px rgba(34,197,94,0.9)' }} />
              <span style={{ fontSize: 16, fontWeight: 800, color: '#22C55E' }}>LIVE — Rooftop Night, Karachi</span>
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  )
}
