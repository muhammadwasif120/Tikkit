import React from 'react'
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'

export const SceneCheckin: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const exitOpacity = interpolate(frame, [164, 180], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  // Left text
  const textOpacity = interpolate(frame, [0, 7], [0, 1], { extrapolateRight: 'clamp' })
  const textY = interpolate(frame, [0, 10], [14, 0], { extrapolateRight: 'clamp' })

  // Phone card
  const phoneS = spring({ frame: Math.max(0, frame - 6), fps, config: { damping: 12, stiffness: 240 }, durationInFrames: 28 })
  const phoneOpacity = interpolate(frame, [6, 14], [0, 1], { extrapolateRight: 'clamp' })

  // Laser scan — 22 frames, fast
  const laserF = Math.max(0, frame - 48)
  const laserY = interpolate(laserF, [0, 22], [0, 100], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const laserOpacity = interpolate(laserF, [0, 4, 22, 26], [0, 1, 1, 0])

  // Verified — hard pop
  const verifiedF = Math.max(0, frame - 80)
  const verifiedS = spring({ frame: verifiedF, fps, config: { damping: 8, stiffness: 380 }, durationInFrames: 18 })
  const verifiedOpacity = interpolate(verifiedF, [0, 5], [0, 1], { extrapolateRight: 'clamp' })

  // Counter
  const count = Math.round(interpolate(frame, [90, 140], [0, 47], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }))
  const countOpacity = interpolate(frame, [88, 98], [0, 1], { extrapolateRight: 'clamp' })

  // Caption
  const capOpacity = interpolate(frame, [145, 155], [0, 1], { extrapolateRight: 'clamp' })

  // QR pattern — simple grid
  const QR_SIZE = 8
  const cells = Array.from({ length: QR_SIZE * QR_SIZE }, (_, i) => {
    const r = Math.floor(i / QR_SIZE), c = i % QR_SIZE
    const finder = (r < 2 && c < 2) || (r < 2 && c >= QR_SIZE - 2) || (r >= QR_SIZE - 2 && c < 2)
    return finder || ((r * 11 + c * 7) % 3 !== 0)
  })

  return (
    <AbsoluteFill style={{ opacity: exitOpacity, background: '#000', display: 'flex', alignItems: 'center', gap: 100, padding: '0 100px' }}>

      {/* Left */}
      <div style={{ flex: '0 0 340px' }}>
        <p style={{ opacity: textOpacity, transform: `translateY(${textY}px)`, fontSize: 13, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase' as const, color: '#1E5EFF', marginBottom: 22 }}>
          Check-in
        </p>
        <h2 style={{ opacity: textOpacity, transform: `translateY(${textY}px)`, fontSize: 68, fontWeight: 900, color: '#fff', lineHeight: 1.05, letterSpacing: '-2px', marginBottom: 20 }}>
          One scan.<br />Done.
        </h2>
        <p style={{ opacity: capOpacity, fontSize: 22, color: 'rgba(255,255,255,0.4)', lineHeight: 1.55 }}>
          No clipboard.<br />No guessing.<br />No gatecrashers.
        </p>
      </div>

      {/* Right — phone + counter */}
      <div style={{ flex: 1, display: 'flex', gap: 32, alignItems: 'center' }}>

        {/* Phone */}
        <div style={{
          opacity: phoneOpacity,
          transform: `scale(${0.88 + phoneS * 0.12})`,
          width: 260,
          background: '#0D0D0D',
          border: '1px solid rgba(255,255,255,0.09)',
          borderRadius: 28, padding: '24px 22px 30px',
          boxShadow: '0 40px 80px rgba(0,0,0,0.6)',
          position: 'relative', overflow: 'hidden', flexShrink: 0,
        }}>
          <p style={{ fontSize: 15, fontWeight: 800, color: '#fff', marginBottom: 2 }}>Rooftop Night</p>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 18 }}>DHA Phase 5 · Karachi</p>

          {/* QR */}
          <div style={{ background: '#fff', borderRadius: 10, padding: 10, position: 'relative' }}>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${QR_SIZE}, 1fr)`, gap: 1.5, width: 170, height: 170 }}>
              {cells.map((on, i) => (
                <div key={i} style={{ background: on ? '#000' : 'transparent', borderRadius: 1 }} />
              ))}
            </div>
            {/* Laser */}
            <div style={{
              position: 'absolute', left: 10, right: 10,
              top: `calc(10px + ${laserY}%)`,
              height: 2,
              background: 'linear-gradient(90deg, transparent, #1E5EFF 20%, #1E5EFF 80%, transparent)',
              boxShadow: '0 0 14px rgba(30,94,255,0.9)',
              opacity: laserOpacity,
            }} />
          </div>

          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', textAlign: 'center' as const, marginTop: 12 }}>Ahmed Raza · #TK-00124</p>

          {/* Verified overlay */}
          <div style={{
            position: 'absolute', inset: 0, borderRadius: 28,
            background: 'rgba(34,197,94,0.08)',
            border: '2px solid rgba(34,197,94,0.55)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: verifiedOpacity,
            transform: `scale(${0.92 + verifiedS * 0.08})`,
          }}>
            <div style={{ textAlign: 'center' as const }}>
              <div style={{ fontSize: 52 }}>✅</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#22C55E', marginTop: 6, letterSpacing: '-0.5px' }}>VERIFIED</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>Ahmed Raza</div>
            </div>
          </div>
        </div>

        {/* Counter */}
        <div style={{
          opacity: countOpacity,
          display: 'flex', flexDirection: 'column', gap: 6,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.12em', textTransform: 'uppercase' as const }}>Checked in</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 86, fontWeight: 900, color: '#fff', lineHeight: 1, fontVariantNumeric: 'tabular-nums' as const }}>{count}</span>
            <span style={{ fontSize: 36, color: 'rgba(255,255,255,0.2)', fontWeight: 700 }}>/120</span>
          </div>
          <div style={{ height: 5, width: 220, background: 'rgba(255,255,255,0.07)', borderRadius: 3, overflow: 'hidden', marginTop: 8 }}>
            <div style={{ height: '100%', width: `${(count / 120) * 100}%`, background: 'linear-gradient(90deg, #1E5EFF, #7C3AED)', borderRadius: 3 }} />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  )
}
