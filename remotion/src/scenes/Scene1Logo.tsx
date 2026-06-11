import React from 'react'
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'

export const Scene1Logo: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const logoScale = spring({ frame, fps, config: { damping: 18, stiffness: 80 }, durationInFrames: 50 })
  const logoOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' })
  const taglineOpacity = interpolate(frame, [35, 60], [0, 1], { extrapolateRight: 'clamp' })
  const taglineY = interpolate(frame, [35, 60], [12, 0], { extrapolateRight: 'clamp' })
  const glowOpacity = interpolate(frame, [20, 50, 80], [0, 0.6, 0.3], { extrapolateRight: 'clamp' })
  const exitOpacity = interpolate(frame, [70, 90], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill style={{ opacity: exitOpacity, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#050505' }}>
      {/* Glow orb */}
      <div style={{
        position: 'absolute',
        width: 600, height: 600,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(30,94,255,0.18) 0%, transparent 70%)',
        opacity: glowOpacity,
        pointerEvents: 'none',
      }} />

      {/* Logo */}
      <div style={{
        opacity: logoOpacity,
        transform: `scale(${logoScale})`,
        display: 'flex', alignItems: 'center', gap: 16,
        marginBottom: 28,
      }}>
        {/* Wordmark */}
        <span style={{
          fontSize: 96,
          fontWeight: 900,
          letterSpacing: '-3px',
          color: '#fff',
          fontFamily: 'DM Sans, sans-serif',
          lineHeight: 1,
        }}>
          TIKKIT
        </span>
        {/* X mark */}
        <span style={{
          fontSize: 96,
          fontWeight: 900,
          color: '#1E5EFF',
          lineHeight: 1,
          textShadow: '0 0 40px rgba(30,94,255,0.7)',
        }}>
          ✕
        </span>
      </div>

      {/* Tagline */}
      <p style={{
        opacity: taglineOpacity,
        transform: `translateY(${taglineY}px)`,
        fontSize: 26,
        color: 'rgba(255,255,255,0.45)',
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        fontWeight: 500,
      }}>
        Event Management · Built for Pakistan
      </p>
    </AbsoluteFill>
  )
}
