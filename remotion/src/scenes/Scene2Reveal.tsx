import React from 'react'
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'

// 54 frames = 1.8s — pure typography, full-bleed
export const SceneReveal: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // Instant snap — 3 frame spring
  const s = spring({ frame, fps, config: { damping: 8, stiffness: 400 }, durationInFrames: 18 })
  const op = interpolate(frame, [0, 3], [0, 1], { extrapolateRight: 'clamp' })
  const subOp = interpolate(frame, [22, 28], [0, 1], { extrapolateRight: 'clamp' })
  const exitOp = interpolate(frame, [44, 54], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  // Full-width glow
  const glowOp = interpolate(frame, [6, 30, 54], [0, 1, 0])

  return (
    <AbsoluteFill style={{ opacity: exitOp, background: '#000' }}>
      {/* Full-bleed horizontal glow — widescreen */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 60% 80% at 50% 50%, rgba(30,94,255,0.18) 0%, transparent 70%)',
        opacity: glowOp,
      }} />

      {/* TIKKIT X — edge to edge typography */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'flex-start', justifyContent: 'center',
        paddingLeft: 140,
      }}>
        <div style={{
          opacity: op,
          transform: `scale(${0.9 + s * 0.1})`,
          display: 'flex', alignItems: 'center', gap: 0,
          lineHeight: 0.85,
        }}>
          <span style={{
            fontSize: 220, fontWeight: 900,
            letterSpacing: '-10px', color: '#fff',
          }}>
            TIKKIT
          </span>
          <span style={{
            fontSize: 220, fontWeight: 900,
            color: '#1E5EFF',
            textShadow: '0 0 80px rgba(30,94,255,0.5)',
            marginLeft: 16,
          }}>
            ✕
          </span>
        </div>

        <p style={{
          opacity: subOp,
          fontSize: 26, fontWeight: 500,
          color: 'rgba(255,255,255,0.35)',
          letterSpacing: '0.22em',
          textTransform: 'uppercase' as const,
          marginTop: 28, marginLeft: 6,
        }}>
          Event Management · Built for Pakistan · Free to start
        </p>
      </div>
    </AbsoluteFill>
  )
}
