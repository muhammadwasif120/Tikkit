import React from 'react'
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'

const GUESTS = ['Ahmed Raza', 'Sara Khan', 'Bilal Qureshi', 'Nadia Malik']

export const SceneCheckin: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const exitOp = interpolate(frame, [108, 120], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  // Left — phone panel snaps in
  const phoneS = spring({ frame, fps, config: { damping: 14, stiffness: 260 }, durationInFrames: 24 })
  const phoneOp = interpolate(frame, [0, 4], [0, 1], { extrapolateRight: 'clamp' })

  // Laser — quick 18-frame sweep
  const laserF = Math.max(0, frame - 22)
  const laserY = interpolate(laserF, [0, 18], [0, 100], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const laserOp = interpolate(laserF, [0, 3, 18, 22], [0, 1, 1, 0])

  // Verified — hard pop at frame 46
  const verifiedF = Math.max(0, frame - 46)
  const verifiedS = spring({ frame: verifiedF, fps, config: { damping: 6, stiffness: 500 }, durationInFrames: 14 })
  const verifiedOp = interpolate(verifiedF, [0, 3], [0, 1], { extrapolateRight: 'clamp' })

  // Right side — "VERIFIED" massive text
  const rightOp = interpolate(frame, [46, 52], [0, 1], { extrapolateRight: 'clamp' })
  const rightY = interpolate(frame, [46, 54], [24, 0], { extrapolateRight: 'clamp' })

  // Counter
  const count = Math.round(interpolate(frame, [54, 95], [0, 47], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }))
  const countOp = interpolate(frame, [52, 58], [0, 1], { extrapolateRight: 'clamp' })

  // Feed
  const feedOp = interpolate(frame, [60, 68], [0, 1], { extrapolateRight: 'clamp' })
  const visibleGuests = Math.min(GUESTS.length, Math.floor(interpolate(frame, [64, 100], [0, GUESTS.length], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })))

  // QR pattern
  const S = 9
  const cells = Array.from({ length: S * S }, (_, i) => {
    const r = Math.floor(i / S), c = i % S
    const finder = (r < 2 && c < 2) || (r < 2 && c >= S - 2) || (r >= S - 2 && c < 2)
    return finder || ((r * 13 + c * 7) % 3 !== 0)
  })

  return (
    <AbsoluteFill style={{ opacity: exitOp, background: '#000', display: 'flex' }}>

      {/* LEFT — phone takes 40% of screen width, full height */}
      <div style={{
        width: '40%', height: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        paddingLeft: 100, paddingRight: 40, paddingTop: 60, paddingBottom: 60,
        opacity: phoneOp,
        transform: `scale(${0.9 + phoneS * 0.1})`,
      }}>
        <div style={{
          width: '100%', maxWidth: 340,
          background: '#0A0A0A',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 28, padding: '32px 28px 40px',
          boxShadow: '40px 0 80px rgba(0,0,0,0.5)',
          position: 'relative', overflow: 'hidden',
        }}>
          <p style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 4 }}>Rooftop Night</p>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)', marginBottom: 24 }}>DHA Phase 5 · Karachi</p>

          {/* QR */}
          <div style={{ background: '#fff', borderRadius: 14, padding: 14, position: 'relative' }}>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${S}, 1fr)`, gap: 2, width: '100%', aspectRatio: '1' }}>
              {cells.map((on, i) => (
                <div key={i} style={{ background: on ? '#000' : 'transparent', borderRadius: 1.5 }} />
              ))}
            </div>
            {/* Laser */}
            <div style={{
              position: 'absolute', left: 14, right: 14,
              top: `calc(14px + ${laserY * 0.85}%)`,
              height: 2.5,
              background: 'linear-gradient(90deg, transparent, #1E5EFF 15%, #1E5EFF 85%, transparent)',
              boxShadow: '0 0 16px rgba(30,94,255,1)',
              opacity: laserOp,
            }} />
          </div>

          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.2)', textAlign: 'center' as const, marginTop: 18 }}>Ahmed Raza · #TK-00124</p>

          {/* Verified overlay */}
          <div style={{
            position: 'absolute', inset: 0, borderRadius: 28,
            background: 'rgba(34,197,94,0.07)',
            border: '2.5px solid rgba(34,197,94,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: verifiedOp,
            transform: `scale(${0.94 + verifiedS * 0.06})`,
          }}>
            <div style={{ textAlign: 'center' as const }}>
              <div style={{ fontSize: 64 }}>✅</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#22C55E', marginTop: 10, letterSpacing: '-0.5px' }}>VERIFIED</div>
              <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', marginTop: 6 }}>Ahmed Raza</div>
            </div>
          </div>
        </div>
      </div>

      {/* Vertical divider */}
      <div style={{
        width: 1, height: '60%', alignSelf: 'center',
        background: 'rgba(255,255,255,0.06)',
      }} />

      {/* RIGHT — 60% width: massive VERIFIED text + counter + feed */}
      <div style={{
        width: '60%', height: '100%',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        paddingLeft: 80, paddingRight: 120,
        opacity: rightOp, transform: `translateY(${rightY}px)`,
      }}>
        {/* Massive "One scan." */}
        <p style={{
          fontSize: 13, fontWeight: 700, letterSpacing: '0.2em',
          textTransform: 'uppercase' as const, color: '#1E5EFF', marginBottom: 20,
        }}>
          Check-in
        </p>
        <h2 style={{
          fontSize: 120, fontWeight: 900, color: '#fff',
          lineHeight: 0.9, letterSpacing: '-4px', marginBottom: 48,
        }}>
          One scan.<br />
          <span style={{ color: 'rgba(255,255,255,0.2)' }}>Done.</span>
        </h2>

        {/* Counter */}
        <div style={{ opacity: countOp, display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 28 }}>
          <span style={{ fontSize: 72, fontWeight: 900, color: '#fff', lineHeight: 1, fontVariantNumeric: 'tabular-nums' as const }}>{count}</span>
          <span style={{ fontSize: 28, color: 'rgba(255,255,255,0.2)', fontWeight: 700 }}>/ 120 guests</span>
        </div>

        {/* Progress */}
        <div style={{ opacity: countOp, height: 5, background: 'rgba(255,255,255,0.07)', borderRadius: 3, overflow: 'hidden', marginBottom: 36, maxWidth: 500 }}>
          <div style={{ height: '100%', width: `${(count / 120) * 100}%`, background: 'linear-gradient(90deg, #1E5EFF, #7C3AED)', borderRadius: 3 }} />
        </div>

        {/* Live feed */}
        <div style={{ opacity: feedOp, display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 440 }}>
          {GUESTS.slice(0, visibleGuests).map((name, i) => (
            <div key={name} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              opacity: interpolate(frame, [64 + i * 10, 74 + i * 10], [0, 1], { extrapolateRight: 'clamp' }),
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 8px rgba(34,197,94,0.8)', flexShrink: 0 }} />
              <span style={{ fontSize: 17, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>{name}</span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', marginLeft: 'auto' }}>Verified ✓</span>
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  )
}
