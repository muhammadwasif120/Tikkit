import React from 'react'
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { BG, SURF, BLUE, GREEN, YELLOW, BORDER, TEXT_MUT, TEXT_SEC, DashShell } from '../components/DashboardShell'

const LOG = ['Ayesha Farooq', 'Bilal Mahmood', 'Sana Hussain', 'Omar Qureshi', 'Nadia Khan']

// QR code grid cells
const S = 9
const cells = Array.from({ length: S * S }, (_, i) => {
  const r = Math.floor(i / S), c = i % S
  const finder = (r < 2 && c < 2) || (r < 2 && c >= S - 2) || (r >= S - 2 && c < 2)
  return finder || ((r * 13 + c * 7) % 3 !== 0)
})

export const SceneScanner: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const exitOp = interpolate(frame, [108, 120], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const dashOp = interpolate(frame, [0, 6], [0, 1], { extrapolateRight: 'clamp' })

  // Laser sweep — 18 frames starting at f20
  const laserF = Math.max(0, frame - 20)
  const laserY = interpolate(laserF, [0, 18], [0, 100], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const laserOp = interpolate(laserF, [0, 3, 18, 22], [0, 1, 1, 0])

  // Verified — hard snap at f44
  const verF = Math.max(0, frame - 44)
  const verS = spring({ frame: verF, fps, config: { damping: 6, stiffness: 500 }, durationInFrames: 14 })
  const verOp = interpolate(verF, [0, 3], [0, 1], { extrapolateRight: 'clamp' })

  // Counter
  const count = Math.round(interpolate(frame, [52, 95], [61, 84], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }))
  const countOp = interpolate(frame, [50, 56], [0, 1], { extrapolateRight: 'clamp' })

  // Right callout
  const rightOp = interpolate(frame, [44, 52], [0, 1], { extrapolateRight: 'clamp' })
  const rightY  = interpolate(frame, [44, 54], [22, 0], { extrapolateRight: 'clamp' })

  // Feed
  const visGuests = Math.min(LOG.length, Math.floor(interpolate(frame, [62, 100], [0, LOG.length], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })))

  return (
    <AbsoluteFill style={{ opacity: exitOp, background: BG }}>
      <div style={{ position: 'absolute', inset: 0, opacity: dashOp }}>
        <DashShell active="scan">
          <div style={{ display: 'flex', gap: 40, height: '100%', alignItems: 'flex-start' }}>

            {/* LEFT — scanner card (matches actual demo scanner screen) */}
            <div style={{
              width: 400, flexShrink: 0,
              background: SURF, border: `1px solid ${BORDER}`,
              borderRadius: 20, overflow: 'hidden',
            }}>
              {/* Event header */}
              <div style={{
                padding: '20px 24px', borderBottom: `1px solid ${BORDER}`,
                background: `rgba(30,94,255,0.05)`,
              }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>Rooftop Night — Karachi</div>
                <div style={{ fontSize: 13, color: TEXT_MUT, marginTop: 4 }}>DHA Phase 5 · Karachi</div>
              </div>

              {/* Scanner window */}
              <div style={{ padding: 28 }}>
                <div style={{
                  background: '#fff', borderRadius: 14,
                  padding: 16, position: 'relative',
                }}>
                  {/* QR grid */}
                  <div style={{
                    display: 'grid', gridTemplateColumns: `repeat(${S}, 1fr)`,
                    gap: 2.5, width: '100%', aspectRatio: '1',
                  }}>
                    {cells.map((on, i) => (
                      <div key={i} style={{ background: on ? '#000' : 'transparent', borderRadius: 2 }} />
                    ))}
                  </div>

                  {/* Laser */}
                  <div style={{
                    position: 'absolute', left: 16, right: 16,
                    top: `calc(16px + ${laserY * 0.82}%)`,
                    height: 2.5,
                    background: 'linear-gradient(90deg, transparent, #1E5EFF 10%, #1E5EFF 90%, transparent)',
                    boxShadow: '0 0 18px rgba(30,94,255,1)',
                    opacity: laserOp,
                  }} />
                </div>

                {/* Guest name */}
                <div style={{ marginTop: 18, textAlign: 'center' as const }}>
                  <p style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Ayesha Farooq</p>
                  <p style={{ fontSize: 12, color: TEXT_MUT }}>#TK-00187 · General Admission</p>
                </div>

                {/* Verified overlay */}
                <div style={{
                  position: 'absolute', inset: 0, borderRadius: 20,
                  background: 'rgba(34,197,94,0.06)',
                  border: `2.5px solid rgba(34,197,94,0.55)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  opacity: verOp,
                  transform: `scale(${0.95 + verS * 0.05})`,
                }}>
                  <div style={{ textAlign: 'center' as const }}>
                    <div style={{ fontSize: 52 }}>✅</div>
                    <div style={{ fontSize: 24, fontWeight: 900, color: GREEN, marginTop: 8, letterSpacing: '-0.5px' }}>VERIFIED</div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>Ayesha Farooq</div>
                  </div>
                </div>
              </div>

              {/* Counter */}
              <div style={{
                padding: '16px 24px', borderTop: `1px solid ${BORDER}`,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                opacity: countOp,
              }}>
                <span style={{ fontSize: 13, color: TEXT_MUT }}>Checked in</span>
                <span style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>{count} <span style={{ color: TEXT_MUT, fontSize: 14 }}>/ 120</span></span>
              </div>
            </div>

            {/* RIGHT — callout + live feed */}
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
              paddingLeft: 40, paddingTop: 20,
              opacity: rightOp, transform: `translateY(${rightY}px)`,
            }}>
              <p style={{
                fontSize: 12, fontWeight: 700, letterSpacing: '0.2em',
                textTransform: 'uppercase' as const, color: BLUE, marginBottom: 18,
              }}>Check-in</p>
              <h2 style={{
                fontSize: 88, fontWeight: 900, color: '#fff',
                lineHeight: 0.88, letterSpacing: '-3.5px', marginBottom: 44,
              }}>
                One scan.<br />
                <span style={{ color: 'rgba(255,255,255,0.2)' }}>Done.</span>
              </h2>

              {/* Progress bar */}
              <div style={{ height: 5, background: 'rgba(255,255,255,0.07)', borderRadius: 3, overflow: 'hidden', marginBottom: 32, maxWidth: 480 }}>
                <div style={{ height: '100%', width: `${(count / 120) * 100}%`, background: 'linear-gradient(90deg, #1E5EFF, #7C3AED)', borderRadius: 3 }} />
              </div>

              {/* Live feed */}
              <p style={{ fontSize: 11, fontWeight: 700, color: TEXT_MUT, letterSpacing: '0.14em', textTransform: 'uppercase' as const, marginBottom: 16 }}>Live feed</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {LOG.slice(0, visGuests).map((name, i) => (
                  <div key={name} style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    opacity: interpolate(frame, [62 + i * 9, 70 + i * 9], [0, 1], { extrapolateRight: 'clamp' }),
                  }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: GREEN, boxShadow: '0 0 8px rgba(34,197,94,0.8)', flexShrink: 0 }} />
                    <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>{name}</span>
                    <span style={{ fontSize: 12, color: TEXT_MUT, marginLeft: 'auto' }}>Verified ✓</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DashShell>
      </div>
    </AbsoluteFill>
  )
}
