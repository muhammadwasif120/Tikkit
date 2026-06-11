import React from 'react'
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'

export const Scene6CTA: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const line1Opacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' })
  const line1Y = interpolate(frame, [0, 30], [24, 0], { extrapolateRight: 'clamp' })
  const line2Opacity = interpolate(frame, [30, 65], [0, 1], { extrapolateRight: 'clamp' })
  const line2Y = interpolate(frame, [30, 65], [24, 0], { extrapolateRight: 'clamp' })

  const divOpacity = interpolate(frame, [80, 110], [0, 1], { extrapolateRight: 'clamp' })

  const urlScale = spring({ frame: Math.max(0, frame - 110), fps, config: { damping: 18, stiffness: 100 }, durationInFrames: 40 })
  const urlOpacity = interpolate(frame, [110, 140], [0, 1], { extrapolateRight: 'clamp' })

  const freeOpacity = interpolate(frame, [160, 190], [0, 1], { extrapolateRight: 'clamp' })
  const freeY = interpolate(frame, [160, 190], [12, 0], { extrapolateRight: 'clamp' })

  const glowOpacity = interpolate(frame, [60, 150], [0, 0.7], { extrapolateRight: 'clamp' })

  const logoOpacity = interpolate(frame, [220, 260], [0, 1], { extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill style={{ background: '#050505', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>

      {/* Blue glow */}
      <div style={{
        position: 'absolute', width: 700, height: 700, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(30,94,255,0.15) 0%, transparent 70%)',
        opacity: glowOpacity, pointerEvents: 'none',
      }} />

      {/* Headline */}
      <div style={{ textAlign: 'center' as const, marginBottom: 48 }}>
        <div style={{
          opacity: line1Opacity, transform: `translateY(${line1Y}px)`,
          fontSize: 88, fontWeight: 900, color: '#fff', lineHeight: 1.05, letterSpacing: '-3px',
        }}>
          Your night.
        </div>
        <div style={{
          opacity: line2Opacity, transform: `translateY(${line2Y}px)`,
          fontSize: 88, fontWeight: 900, lineHeight: 1.05, letterSpacing: '-3px',
          background: 'linear-gradient(135deg, #1E5EFF, #7C3AED)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          Your rules.
        </div>
      </div>

      {/* Divider */}
      <div style={{
        opacity: divOpacity,
        width: 60, height: 2, background: 'rgba(255,255,255,0.15)', borderRadius: 1, marginBottom: 40,
      }} />

      {/* URL */}
      <div style={{
        opacity: urlOpacity, transform: `scale(${urlScale})`,
        fontSize: 44, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px', marginBottom: 20,
      }}>
        tikkitx.com
      </div>

      {/* Free badge */}
      <div style={{
        opacity: freeOpacity, transform: `translateY(${freeY}px)`,
        display: 'inline-flex', alignItems: 'center', gap: 10,
        padding: '12px 28px', borderRadius: 100,
        background: 'rgba(30,94,255,0.1)', border: '1px solid rgba(30,94,255,0.3)',
        fontSize: 18, fontWeight: 700, color: '#60A5FA',
        marginBottom: 60,
      }}>
        Free to start · No card required · Built for Pakistan
      </div>

      {/* Logo watermark */}
      <div style={{
        opacity: logoOpacity,
        position: 'absolute', bottom: 48,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{ fontSize: 22, fontWeight: 900, color: 'rgba(255,255,255,0.25)', letterSpacing: '-0.5px' }}>TIKKIT</span>
        <span style={{ fontSize: 22, fontWeight: 900, color: 'rgba(30,94,255,0.5)' }}>✕</span>
      </div>
    </AbsoluteFill>
  )
}
