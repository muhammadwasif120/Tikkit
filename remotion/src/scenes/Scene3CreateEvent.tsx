import React from 'react'
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'

const EVENT_NAME = 'Rooftop Night — DHA Karachi'
const CAPACITY = '120'

function useTypewriter(text: string, startFrame: number, charsPerFrame = 1.5, frame: number) {
  const localFrame = Math.max(0, frame - startFrame)
  const chars = Math.min(text.length, Math.floor(localFrame * charsPerFrame))
  return text.slice(0, chars)
}

export const Scene3CreateEvent: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const panelOpacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' })
  const panelScale = spring({ frame, fps, config: { damping: 22, stiffness: 80 }, durationInFrames: 40 })
  const exitOpacity = interpolate(frame, [340, 390], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  const typedName = useTypewriter(EVENT_NAME, 40, 1.4, frame)
  const typedCapacity = useTypewriter(CAPACITY, 100, 2, frame)

  const liveScale = spring({ frame: Math.max(0, frame - 200), fps, config: { damping: 14, stiffness: 120 }, durationInFrames: 30 })
  const liveOpacity = interpolate(frame, [200, 225], [0, 1], { extrapolateRight: 'clamp' })
  const glowOpacity = interpolate(frame, [200, 280, 390], [0, 1, 0.7])

  const labelOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill style={{ opacity: exitOpacity, background: '#050505', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 80px' }}>

      {/* Left — headline */}
      <div style={{ flex: 1, paddingRight: 60 }}>
        <div style={{
          opacity: labelOpacity,
          display: 'inline-flex', alignItems: 'center', gap: 8,
          fontSize: 13, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase' as const,
          color: '#1E5EFF', padding: '6px 16px', borderRadius: 100,
          background: 'rgba(30,94,255,0.1)', border: '1px solid rgba(30,94,255,0.25)',
          marginBottom: 28,
        }}>
          Create an event
        </div>
        <h2 style={{
          opacity: labelOpacity,
          fontSize: 56, fontWeight: 900, color: '#fff', lineHeight: 1.1,
          letterSpacing: '-1.5px', marginBottom: 20,
        }}>
          Live in under<br />
          <span style={{ color: '#1E5EFF' }}>two minutes.</span>
        </h2>
        <p style={{ opacity: labelOpacity, fontSize: 20, color: 'rgba(255,255,255,0.4)', lineHeight: 1.65 }}>
          Name it. Set capacity.<br />Go live. Share the link.
        </p>
      </div>

      {/* Right — dashboard mockup */}
      <div style={{
        flex: 1,
        opacity: panelOpacity,
        transform: `scale(${panelScale})`,
        background: '#111827',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 24,
        overflow: 'hidden',
        boxShadow: '0 40px 120px rgba(0,0,0,0.6)',
      }}>
        {/* Titlebar */}
        <div style={{ background: '#0D1117', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 8 }}>
          {['#FF5F57','#FFBD2E','#28C940'].map(c => (
            <div key={c} style={{ width: 12, height: 12, borderRadius: '50%', background: c }} />
          ))}
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginLeft: 12 }}>Tikkit X — New Event</span>
        </div>

        {/* Form */}
        <div style={{ padding: '32px 36px', display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Event name field */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: 10 }}>Event name</div>
            <div style={{
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(30,94,255,0.4)',
              borderRadius: 10, padding: '14px 18px', fontSize: 20, color: '#fff', fontWeight: 600,
              minHeight: 52, display: 'flex', alignItems: 'center',
            }}>
              {typedName}
              {typedName.length < EVENT_NAME.length && (
                <span style={{ display: 'inline-block', width: 2, height: 22, background: '#1E5EFF', marginLeft: 2, animation: 'none', opacity: Math.floor(frame / 6) % 2 === 0 ? 1 : 0 }} />
              )}
            </div>
          </div>

          {/* Two cols */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: 10 }}>Capacity</div>
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '14px 18px', fontSize: 20, color: '#fff', fontWeight: 600, minHeight: 52, display: 'flex', alignItems: 'center' }}>
                {typedCapacity}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: 10 }}>Access</div>
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '14px 18px', fontSize: 16, color: 'rgba(255,255,255,0.5)', minHeight: 52, display: 'flex', alignItems: 'center' }}>
                Invite only
              </div>
            </div>
          </div>

          {/* Location */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: 10 }}>Location</div>
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '14px 18px', fontSize: 16, color: 'rgba(255,255,255,0.5)', minHeight: 52, display: 'flex', alignItems: 'center' }}>
              DHA Phase 5, Karachi
            </div>
          </div>

          {/* Go Live button / Live badge */}
          <div style={{ position: 'relative', height: 56 }}>
            {/* Button — fades out when live */}
            <div style={{
              opacity: interpolate(frame, [185, 210], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
              position: 'absolute', inset: 0,
              background: '#1E5EFF', borderRadius: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 17, fontWeight: 800, color: '#fff',
            }}>
              Go Live →
            </div>
            {/* Live badge */}
            <div style={{
              opacity: liveOpacity,
              transform: `scale(${liveScale})`,
              position: 'absolute', inset: 0,
              background: 'rgba(34,197,94,0.12)',
              border: `1px solid rgba(34,197,94,${glowOpacity * 0.6})`,
              boxShadow: `0 0 ${glowOpacity * 40}px rgba(34,197,94,0.25)`,
              borderRadius: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
            }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 12px rgba(34,197,94,0.8)' }} />
              <span style={{ fontSize: 17, fontWeight: 800, color: '#22C55E' }}>LIVE — Rooftop Night, Karachi</span>
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  )
}
