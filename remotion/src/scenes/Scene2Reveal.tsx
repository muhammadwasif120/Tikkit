import React from 'react'
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'

export const SceneReveal: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // Snappy spring — Apple-style
  const s = spring({ frame, fps, config: { damping: 10, stiffness: 300 }, durationInFrames: 25 })
  const logoOpacity = interpolate(frame, [0, 6], [0, 1], { extrapolateRight: 'clamp' })

  const tagOpacity = interpolate(frame, [28, 36], [0, 1], { extrapolateRight: 'clamp' })
  const tagY = interpolate(frame, [28, 40], [10, 0], { extrapolateRight: 'clamp' })

  const exitOpacity = interpolate(frame, [76, 90], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  const glow = interpolate(frame, [10, 50, 90], [0, 1, 0], { extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill style={{ opacity: exitOpacity, background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      {/* Glow orb */}
      <div style={{
        position: 'absolute', width: 800, height: 800, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(30,94,255,0.2) 0%, transparent 65%)',
        opacity: glow, pointerEvents: 'none',
      }} />

      {/* TIKKIT X */}
      <div style={{
        opacity: logoOpacity,
        transform: `scale(${0.85 + s * 0.15})`,
        display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24,
      }}>
        <span style={{ fontSize: 120, fontWeight: 900, letterSpacing: '-4px', color: '#fff', lineHeight: 1 }}>
          TIKKIT
        </span>
        <span style={{
          fontSize: 120, fontWeight: 900, color: '#1E5EFF', lineHeight: 1,
          textShadow: '0 0 60px rgba(30,94,255,0.6)',
        }}>
          ✕
        </span>
      </div>

      {/* Tagline */}
      <p style={{
        opacity: tagOpacity,
        transform: `translateY(${tagY}px)`,
        fontSize: 24, fontWeight: 500, color: 'rgba(255,255,255,0.4)',
        letterSpacing: '0.22em', textTransform: 'uppercase' as const,
      }}>
        Event Management · Finally.
      </p>
    </AbsoluteFill>
  )
}
