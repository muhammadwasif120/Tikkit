import React from 'react'
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'

export const SceneCTA: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // "Your night." — snaps in at f10
  const line1S = spring({ frame: Math.max(0, frame - 10), fps, config: { damping: 11, stiffness: 260 }, durationInFrames: 22 })
  const line1Op = interpolate(frame, [10, 17], [0, 1], { extrapolateRight: 'clamp' })

  // "Your rules." — snaps in at f50
  const line2S = spring({ frame: Math.max(0, frame - 50), fps, config: { damping: 11, stiffness: 260 }, durationInFrames: 22 })
  const line2Op = interpolate(frame, [50, 57], [0, 1], { extrapolateRight: 'clamp' })

  // Divider
  const divOp = interpolate(frame, [82, 92], [0, 1], { extrapolateRight: 'clamp' })
  const divW = interpolate(frame, [82, 110], [0, 56], { extrapolateRight: 'clamp' })

  // URL
  const urlF = Math.max(0, frame - 100)
  const urlS = spring({ frame: urlF, fps, config: { damping: 12, stiffness: 220 }, durationInFrames: 25 })
  const urlOp = interpolate(frame, [100, 108], [0, 1], { extrapolateRight: 'clamp' })

  // "Free to start."
  const freeOp = interpolate(frame, [148, 158], [0, 1], { extrapolateRight: 'clamp' })
  const freeY = interpolate(frame, [148, 162], [10, 0], { extrapolateRight: 'clamp' })

  // Pills
  const pillsOp = interpolate(frame, [175, 188], [0, 1], { extrapolateRight: 'clamp' })

  // Logo watermark
  const logoOp = interpolate(frame, [230, 248], [0, 1], { extrapolateRight: 'clamp' })

  // Fade to black at end
  const endOp = interpolate(frame, [270, 300], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  // Glow
  const glowOp = interpolate(frame, [40, 120, 300], [0, 0.8, 0.5])

  return (
    <AbsoluteFill style={{ opacity: endOp, background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>

      {/* Blue glow */}
      <div style={{
        position: 'absolute', width: 900, height: 900, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(30,94,255,0.14) 0%, transparent 65%)',
        opacity: glowOp, pointerEvents: 'none',
      }} />

      {/* "Your night." */}
      <div style={{
        opacity: line1Op,
        transform: `translateY(${interpolate(line1S, [0, 1], [28, 0])}px)`,
        fontSize: 130, fontWeight: 900, color: '#fff',
        lineHeight: 1, letterSpacing: '-4px',
      }}>
        Your night.
      </div>

      {/* "Your rules." */}
      <div style={{
        opacity: line2Op,
        transform: `translateY(${interpolate(line2S, [0, 1], [28, 0])}px)`,
        fontSize: 130, fontWeight: 900, lineHeight: 1, letterSpacing: '-4px',
        background: 'linear-gradient(135deg, #1E5EFF 0%, #7C3AED 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        marginBottom: 40,
      }}>
        Your rules.
      </div>

      {/* Divider */}
      <div style={{
        opacity: divOp, width: divW, height: 1,
        background: 'rgba(255,255,255,0.15)', borderRadius: 1,
        marginBottom: 36,
      }} />

      {/* URL */}
      <div style={{
        opacity: urlOp,
        transform: `scale(${0.88 + urlS * 0.12})`,
        fontSize: 52, fontWeight: 800, color: '#fff',
        letterSpacing: '-1px', marginBottom: 24,
      }}>
        tikkitx.com
      </div>

      {/* "Free to start." */}
      <p style={{
        opacity: freeOp,
        transform: `translateY(${freeY}px)`,
        fontSize: 22, color: 'rgba(255,255,255,0.35)',
        fontWeight: 500, letterSpacing: '-0.3px',
        marginBottom: 32,
      }}>
        Free to start. No card required.
      </p>

      {/* Pills */}
      <div style={{ opacity: pillsOp, display: 'flex', gap: 12 }}>
        {['Guest lists', 'QR check-in', 'JazzCash & EasyPaisa', 'Live analytics'].map(t => (
          <div key={t} style={{
            fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.3)',
            padding: '7px 16px', borderRadius: 100,
            border: '1px solid rgba(255,255,255,0.1)',
          }}>
            {t}
          </div>
        ))}
      </div>

      {/* Logo watermark */}
      <div style={{
        opacity: logoOp,
        position: 'absolute', bottom: 52,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{ fontSize: 20, fontWeight: 900, color: 'rgba(255,255,255,0.18)', letterSpacing: '-0.5px' }}>TIKKIT</span>
        <span style={{ fontSize: 20, fontWeight: 900, color: 'rgba(30,94,255,0.35)' }}>✕</span>
      </div>
    </AbsoluteFill>
  )
}
