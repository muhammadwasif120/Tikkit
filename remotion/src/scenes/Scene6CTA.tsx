import React from 'react'
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'

// Full-bleed CTA — left-anchored widescreen type
export const SceneCTA: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const endOp = interpolate(frame, [196, 219], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  // "Your night." — immediate, left
  const l1S = spring({ frame, fps, config: { damping: 9, stiffness: 320 }, durationInFrames: 20 })
  const l1Op = interpolate(frame, [0, 4], [0, 1], { extrapolateRight: 'clamp' })

  // "Your rules." — snaps in at frame 36
  const l2S = spring({ frame: Math.max(0, frame - 36), fps, config: { damping: 9, stiffness: 320 }, durationInFrames: 20 })
  const l2Op = interpolate(frame, [36, 40], [0, 1], { extrapolateRight: 'clamp' })

  // Horizontal rule
  const hrOp = interpolate(frame, [64, 72], [0, 1], { extrapolateRight: 'clamp' })
  const hrW = interpolate(frame, [64, 100], [0, 800], { extrapolateRight: 'clamp' })

  // URL — large, left-aligned
  const urlF = Math.max(0, frame - 80)
  const urlS = spring({ frame: urlF, fps, config: { damping: 11, stiffness: 260 }, durationInFrames: 22 })
  const urlOp = interpolate(frame, [80, 86], [0, 1], { extrapolateRight: 'clamp' })

  // Sub-line
  const subOp = interpolate(frame, [112, 122], [0, 1], { extrapolateRight: 'clamp' })

  // Feature pills
  const pillsOp = interpolate(frame, [132, 144], [0, 1], { extrapolateRight: 'clamp' })

  // Logo — bottom right
  const logoOp = interpolate(frame, [150, 164], [0, 1], { extrapolateRight: 'clamp' })

  // Subtle full-bleed glow — right side
  const glowOp = interpolate(frame, [24, 90], [0, 1], { extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill style={{ opacity: endOp, background: '#000' }}>
      {/* Full-bleed right glow */}
      <div style={{
        position: 'absolute', right: -100, top: '50%',
        width: 900, height: 900, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(30,94,255,0.12) 0%, transparent 65%)',
        transform: 'translateY(-50%)',
        opacity: glowOp, pointerEvents: 'none',
      }} />

      {/* All content — left-anchored */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        paddingLeft: 140,
      }}>
        {/* "Your night." */}
        <div style={{
          opacity: l1Op,
          transform: `translateY(${interpolate(l1S, [0, 1], [32, 0])}px)`,
          fontSize: 170, fontWeight: 900, color: '#fff',
          lineHeight: 0.88, letterSpacing: '-6px',
        }}>
          Your night.
        </div>

        {/* "Your rules." */}
        <div style={{
          opacity: l2Op,
          transform: `translateY(${interpolate(l2S, [0, 1], [32, 0])}px)`,
          fontSize: 170, fontWeight: 900, lineHeight: 0.88, letterSpacing: '-6px',
          background: 'linear-gradient(135deg, #1E5EFF 0%, #7C3AED 60%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: 52,
        }}>
          Your rules.
        </div>

        {/* Horizontal rule */}
        <div style={{
          opacity: hrOp, width: hrW, height: 1,
          background: 'rgba(255,255,255,0.12)', borderRadius: 1,
          marginBottom: 44,
        }} />

        {/* URL */}
        <div style={{
          opacity: urlOp,
          transform: `scale(${0.9 + urlS * 0.1}) translateX(${interpolate(urlS, [0, 1], [-16, 0])}px)`,
          transformOrigin: 'left center',
          fontSize: 64, fontWeight: 800, color: '#fff',
          letterSpacing: '-2px', marginBottom: 22,
        }}>
          tikkitx.com
        </div>

        {/* "Free to start." */}
        <p style={{
          opacity: subOp,
          fontSize: 24, color: 'rgba(255,255,255,0.3)',
          fontWeight: 500, letterSpacing: '-0.3px',
          marginBottom: 36,
        }}>
          Free to start · No card required · Built for Pakistan
        </p>

        {/* Pills */}
        <div style={{ opacity: pillsOp, display: 'flex', gap: 12 }}>
          {['Guest lists', 'QR check-in', 'JazzCash & EasyPaisa', 'Live analytics', 'Vendor management'].map(t => (
            <div key={t} style={{
              fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.28)',
              padding: '8px 18px', borderRadius: 100,
              border: '1px solid rgba(255,255,255,0.09)',
            }}>
              {t}
            </div>
          ))}
        </div>
      </div>

      {/* Logo — bottom right */}
      <div style={{
        opacity: logoOp,
        position: 'absolute', bottom: 52, right: 80,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{ fontSize: 22, fontWeight: 900, color: 'rgba(255,255,255,0.15)', letterSpacing: '-0.5px' }}>TIKKIT</span>
        <span style={{ fontSize: 22, fontWeight: 900, color: 'rgba(30,94,255,0.3)' }}>✕</span>
      </div>
    </AbsoluteFill>
  )
}
