import React from 'react'
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'

const EVENT_NAME = 'Rooftop Night — DHA Karachi'

export const SceneCreate: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const exitOp = interpolate(frame, [150, 165], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  // Left text — immediate
  const textOp = interpolate(frame, [0, 4], [0, 1], { extrapolateRight: 'clamp' })
  const textY = interpolate(frame, [0, 6], [16, 0], { extrapolateRight: 'clamp' })

  // Right panel slides in from right edge
  const panelS = spring({ frame: Math.max(0, frame - 4), fps, config: { damping: 18, stiffness: 200 }, durationInFrames: 30 })
  const panelX = interpolate(panelS, [0, 1], [120, 0])
  const panelOp = interpolate(frame, [4, 10], [0, 1], { extrapolateRight: 'clamp' })

  // Fast typewriter — 3 chars/frame
  const charCount = Math.min(EVENT_NAME.length, Math.floor(Math.max(0, frame - 28) * 3))
  const typed = EVENT_NAME.slice(0, charCount)

  // Capacity types
  const cap = Math.min(120, Math.floor(Math.max(0, frame - 70) * 8))

  // Live badge
  const liveF = Math.max(0, frame - 118)
  const liveS = spring({ frame: liveF, fps, config: { damping: 7, stiffness: 400 }, durationInFrames: 16 })
  const liveOp = interpolate(liveF, [0, 4], [0, 1], { extrapolateRight: 'clamp' })
  const btnOp = interpolate(frame, [108, 118], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  // "In two minutes." text appears
  const capOp = interpolate(frame, [128, 136], [0, 1], { extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill style={{ opacity: exitOp, background: '#000', display: 'flex' }}>

      {/* LEFT — full left half, text anchored to vertical center */}
      <div style={{
        width: '42%', height: '100%',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        paddingLeft: 140,
      }}>
        <p style={{
          opacity: textOp,
          fontSize: 15, fontWeight: 700, letterSpacing: '0.2em',
          textTransform: 'uppercase' as const, color: '#1E5EFF', marginBottom: 24,
        }}>
          Create
        </p>
        <h2 style={{
          opacity: textOp, transform: `translateY(${textY}px)`,
          fontSize: 108, fontWeight: 900, color: '#fff',
          lineHeight: 0.92, letterSpacing: '-4px', marginBottom: 32,
        }}>
          Live in<br />two<br />minutes.
        </h2>
        <p style={{
          opacity: capOp,
          fontSize: 22, color: 'rgba(255,255,255,0.35)',
          lineHeight: 1.55, letterSpacing: '-0.3px',
        }}>
          Name it. Set capacity.<br />Go live. Share the link.
        </p>
      </div>

      {/* RIGHT — full right half, dashboard fills it */}
      <div style={{
        width: '58%', height: '100%',
        display: 'flex', alignItems: 'center',
        paddingRight: 80, paddingTop: 60, paddingBottom: 60,
        opacity: panelOp,
        transform: `translateX(${panelX}px)`,
      }}>
        <div style={{
          width: '100%', height: '100%',
          background: '#0A0A0A',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 20,
          overflow: 'hidden',
          boxShadow: '0 80px 160px rgba(0,0,0,0.8), -40px 0 80px rgba(0,0,0,0.4)',
          display: 'flex', flexDirection: 'column',
        }}>
          {/* Mac titlebar */}
          <div style={{
            background: '#080808', padding: '16px 22px',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0,
          }}>
            {['#FF5F57', '#FFBD2E', '#28C940'].map(c => (
              <div key={c} style={{ width: 12, height: 12, borderRadius: '50%', background: c }} />
            ))}
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.18)', marginLeft: 12 }}>New Event — Tikkit X</span>
          </div>

          {/* Form — fills remaining height */}
          <div style={{ flex: 1, padding: '40px 44px', display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Event name */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.14em', textTransform: 'uppercase' as const, marginBottom: 10 }}>Event name</div>
              <div style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(30,94,255,0.5)',
                borderRadius: 10, padding: '16px 20px',
                fontSize: 24, color: '#fff', fontWeight: 700,
                minHeight: 64, display: 'flex', alignItems: 'center',
              }}>
                {typed}
                {charCount < EVENT_NAME.length && (
                  <span style={{ width: 2, height: 24, background: '#1E5EFF', marginLeft: 3, opacity: Math.floor(frame / 4) % 2 }} />
                )}
              </div>
            </div>

            {/* Capacity + Access */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                ['Capacity', cap > 0 ? String(cap) : ''],
                ['Access', 'Invite only'],
              ].map(([label, val]) => (
                <div key={label}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.14em', textTransform: 'uppercase' as const, marginBottom: 10 }}>{label}</div>
                  <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '16px 20px', fontSize: 20, color: 'rgba(255,255,255,0.55)', minHeight: 64, display: 'flex', alignItems: 'center' }}>{val}</div>
                </div>
              ))}
            </div>

            {/* Date + Location */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                ['Date', 'Sat 22 Mar 2026'],
                ['Location', 'DHA Phase 5, Karachi'],
              ].map(([label, val]) => (
                <div key={label}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.14em', textTransform: 'uppercase' as const, marginBottom: 10 }}>{label}</div>
                  <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '16px 20px', fontSize: 18, color: 'rgba(255,255,255,0.45)', minHeight: 64, display: 'flex', alignItems: 'center' }}>{val}</div>
                </div>
              ))}
            </div>

            {/* Go Live / LIVE */}
            <div style={{ position: 'relative', flex: 1, minHeight: 64 }}>
              <div style={{
                position: 'absolute', inset: 0,
                background: '#1E5EFF', borderRadius: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, fontWeight: 800, color: '#fff', opacity: btnOp,
              }}>
                Go Live →
              </div>
              <div style={{
                position: 'absolute', inset: 0,
                background: 'rgba(34,197,94,0.08)',
                border: '1px solid rgba(34,197,94,0.5)',
                borderRadius: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
                opacity: liveOp,
                transform: `scale(${0.95 + liveS * 0.05})`,
              }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 12px rgba(34,197,94,1)' }} />
                <span style={{ fontSize: 18, fontWeight: 800, color: '#22C55E' }}>LIVE — Rooftop Night, Karachi</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  )
}
