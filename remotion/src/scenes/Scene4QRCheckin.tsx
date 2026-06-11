import React from 'react'
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'

const QR_CELLS = 10

function QRGrid() {
  const seed = 42
  const cells = Array.from({ length: QR_CELLS * QR_CELLS }, (_, i) => {
    const row = Math.floor(i / QR_CELLS)
    const col = i % QR_CELLS
    // Simple deterministic pattern
    const isFinder = (row < 3 && col < 3) || (row < 3 && col >= QR_CELLS - 3) || (row >= QR_CELLS - 3 && col < 3)
    const isFinderBorder = (row === 3 && col < 4) || (col === 3 && row < 4) || (row === 3 && col >= QR_CELLS - 4) || (col === QR_CELLS - 4 && row < 4) || (row >= QR_CELLS - 4 && col === 3) || (row === QR_CELLS - 4 && col < 4)
    const val = ((row * 13 + col * 7 + seed) % 3 !== 0) && !isFinderBorder
    return isFinder || val
  })
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${QR_CELLS}, 1fr)`, gap: 2, width: 180, height: 180 }}>
      {cells.map((filled, i) => (
        <div key={i} style={{ background: filled ? '#fff' : 'transparent', borderRadius: 1 }} />
      ))}
    </div>
  )
}

const GUESTS = ['Ahmed Raza', 'Sara Khan', 'Bilal Qureshi', 'Nadia Malik', 'Usman Ali']

export const Scene4QRCheckin: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const exitOpacity = interpolate(frame, [370, 420], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  // Phone card
  const phoneScale = spring({ frame, fps, config: { damping: 20, stiffness: 80 }, durationInFrames: 40 })
  const phoneOpacity = interpolate(frame, [0, 25], [0, 1], { extrapolateRight: 'clamp' })

  // Scan laser
  const laserY = interpolate(frame, [60, 140], [0, 100], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const laserOpacity = interpolate(frame, [50, 70, 140, 160], [0, 1, 1, 0])

  // Verified badge
  const verifiedOpacity = interpolate(frame, [165, 185], [0, 1], { extrapolateRight: 'clamp' })
  const verifiedScale = spring({ frame: Math.max(0, frame - 160), fps, config: { damping: 14, stiffness: 140 }, durationInFrames: 25 })

  // Counter
  const checkinCount = Math.min(47, Math.floor(interpolate(frame, [180, 320], [0, 47], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })))

  // Feed entries
  const feedOpacity = interpolate(frame, [180, 210], [0, 1], { extrapolateRight: 'clamp' })
  const visibleGuests = Math.min(GUESTS.length, Math.floor(interpolate(frame, [200, 340], [0, GUESTS.length], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })))

  const labelOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill style={{ opacity: exitOpacity, background: '#050505', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 80, padding: '0 80px' }}>

      {/* Left — phone + QR */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32 }}>
        <div style={{ opacity: labelOpacity, fontSize: 13, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: '#1E5EFF' }}>
          Guest ticket
        </div>

        {/* Phone frame */}
        <div style={{
          opacity: phoneOpacity, transform: `scale(${phoneScale})`,
          width: 280, background: '#111827',
          border: '1px solid rgba(255,255,255,0.1)', borderRadius: 24,
          padding: '24px 24px 32px',
          boxShadow: '0 40px 80px rgba(0,0,0,0.5)',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 4 }}>Rooftop Night</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 20 }}>DHA Phase 5 · Karachi</div>

          {/* QR code */}
          <div style={{ background: '#fff', borderRadius: 12, padding: 12, display: 'inline-block', position: 'relative' }}>
            <QRGrid />
            {/* Scan laser */}
            <div style={{
              position: 'absolute', left: 12, right: 12,
              top: `calc(12px + ${laserY}%)`,
              height: 2,
              background: 'linear-gradient(90deg, transparent, #1E5EFF, #1E5EFF, transparent)',
              boxShadow: '0 0 12px rgba(30,94,255,0.8)',
              opacity: laserOpacity,
            }} />
          </div>

          <div style={{ marginTop: 16, fontSize: 12, color: 'rgba(255,255,255,0.3)', textAlign: 'center' as const }}>
            Ahmed Raza · #TK-00124
          </div>

          {/* Verified overlay */}
          <div style={{
            position: 'absolute', inset: 0, borderRadius: 24,
            background: 'rgba(34,197,94,0.1)',
            border: '2px solid rgba(34,197,94,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: verifiedOpacity,
            transform: `scale(${verifiedScale})`,
          }}>
            <div style={{ textAlign: 'center' as const }}>
              <div style={{ fontSize: 48, lineHeight: 1 }}>✅</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#22C55E', marginTop: 8 }}>VERIFIED</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>Ahmed Raza</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right — live counter + feed */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 28 }}>
        {/* Counter */}
        <div style={{
          background: '#111827', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 20, padding: '32px 36px',
          opacity: interpolate(frame, [20, 50], [0, 1], { extrapolateRight: 'clamp' }),
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: 12 }}>Checked in</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
            <span style={{ fontSize: 80, fontWeight: 900, color: '#fff', lineHeight: 1, fontVariantNumeric: 'tabular-nums' as const }}>
              {checkinCount}
            </span>
            <span style={{ fontSize: 32, color: 'rgba(255,255,255,0.25)', fontWeight: 700 }}>/ 120</span>
          </div>
          {/* Progress bar */}
          <div style={{ marginTop: 16, height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 3,
              width: `${(checkinCount / 120) * 100}%`,
              background: 'linear-gradient(90deg, #1E5EFF, #7C3AED)',
              transition: 'width 0.1s linear',
            }} />
          </div>
        </div>

        {/* Live feed */}
        <div style={{
          background: '#111827', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 20, padding: '24px 28px', opacity: feedOpacity,
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: 16 }}>Live check-ins</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {GUESTS.slice(0, visibleGuests).map((name, i) => (
              <div key={name} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                opacity: interpolate(frame, [200 + i * 28, 200 + i * 28 + 20], [0, 1], { extrapolateRight: 'clamp' }),
              }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 8px rgba(34,197,94,0.7)', flexShrink: 0 }} />
                <span style={{ fontSize: 15, color: '#fff', fontWeight: 600 }}>{name}</span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginLeft: 'auto' }}>Verified ✓</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  )
}
