// LEFT 44% — "One scan. Done." headline + counter + live feed
// RIGHT 56% — scanner card (vertically centred, no sidebar)
import React from 'react'
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { BG, SURF, BLUE, GREEN, BORDER, T_MUT } from '../components/DashboardShell'

const LOG = ['Ayesha Farooq', 'Bilal Mahmood', 'Sana Hussain', 'Omar Qureshi', 'Nadia Khan']

// 11×11 QR-like grid
const QR = 11
const qrCells = Array.from({ length: QR * QR }, (_, k) => {
  const r = Math.floor(k / QR), c = k % QR
  const corner = (r < 3 && c < 3) || (r < 3 && c >= QR - 3) || (r >= QR - 3 && c < 3)
  return corner || ((r * 17 + c * 11) % 4 !== 0)
})

export const SceneScanner: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const exitOp = interpolate(frame, [108, 120], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  // ── Left text ────────────────────────────────────────────────────
  const headOp = interpolate(frame, [0, 5], [0, 1], { extrapolateRight: 'clamp' })
  const headY  = interpolate(frame, [0, 6], [12, 0], { extrapolateRight: 'clamp' })

  const countOp  = interpolate(frame, [50, 58], [0, 1], { extrapolateRight: 'clamp' })
  const count    = Math.round(interpolate(frame, [52, 96], [61, 84], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }))

  const feedOp   = interpolate(frame, [62, 70], [0, 1], { extrapolateRight: 'clamp' })
  const visGuests = Math.min(LOG.length, Math.floor(
    interpolate(frame, [64, 102], [0, LOG.length], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  ))

  // ── Scanner card ─────────────────────────────────────────────────
  const cardSp = spring({ frame, fps, config: { damping: 18, stiffness: 200 }, durationInFrames: 24 })
  const cardX  = interpolate(cardSp, [0, 1], [60, 0])
  const cardOp = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: 'clamp' })

  // Laser sweep f18–36
  const laserF  = Math.max(0, frame - 18)
  const laserY  = interpolate(laserF, [0, 18], [0, 100], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const laserOp = interpolate(laserF, [0, 3, 18, 23], [0, 1, 1, 0])

  // Verified snap at f42
  const verF  = Math.max(0, frame - 42)
  const verSp = spring({ frame: verF, fps, config: { damping: 6, stiffness: 500 }, durationInFrames: 14 })
  const verOp = interpolate(verF, [0, 4], [0, 1], { extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill style={{ opacity: exitOp, background: BG, display: 'flex', alignItems: 'stretch' }}>

      {/* ── LEFT 44% ────────────────────────────────────────────── */}
      <div style={{
        width: '44%', flexShrink: 0,
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        paddingLeft: 140, paddingRight: 60,
      }}>
        {/* Eyebrow */}
        <p style={{
          fontSize: 13, fontWeight: 700, letterSpacing: '0.22em',
          textTransform: 'uppercase' as const, color: BLUE,
          marginBottom: 22, opacity: headOp,
        }}>Check-in</p>

        {/* Headline */}
        <h2 style={{
          fontSize: 104, fontWeight: 900, lineHeight: 0.88, letterSpacing: '-4px',
          marginBottom: 48,
          opacity: headOp, transform: `translateY(${headY}px)`,
        }}>
          <span style={{ color: '#fff' }}>One scan.</span><br />
          <span style={{ color: 'rgba(255,255,255,0.2)' }}>Done.</span>
        </h2>

        {/* Counter */}
        <div style={{ opacity: countOp, marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
            <span style={{
              fontSize: 68, fontWeight: 900, color: '#fff', lineHeight: 1,
              fontVariantNumeric: 'tabular-nums' as const,
            }}>{count}</span>
            <span style={{ fontSize: 24, color: 'rgba(255,255,255,0.2)', fontWeight: 700 }}>
              / 120 checked in
            </span>
          </div>
          {/* Progress bar */}
          <div style={{
            height: 4, background: 'rgba(255,255,255,0.07)',
            borderRadius: 2, overflow: 'hidden', marginTop: 14, maxWidth: 480,
          }}>
            <div style={{
              height: '100%', width: `${(count / 120) * 100}%`,
              background: `linear-gradient(90deg, ${BLUE}, #7C3AED)`,
              borderRadius: 2,
            }} />
          </div>
        </div>

        {/* Live feed */}
        <div style={{ opacity: feedOp }}>
          <p style={{
            fontSize: 11, fontWeight: 700, color: T_MUT,
            letterSpacing: '0.16em', textTransform: 'uppercase' as const,
            marginBottom: 14,
          }}>Live</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {LOG.slice(0, visGuests).map((name, i) => (
              <div key={name} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                opacity: interpolate(frame, [64 + i * 9, 72 + i * 9], [0, 1], { extrapolateRight: 'clamp' }),
              }}>
                <div style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: GREEN, boxShadow: '0 0 8px rgba(34,197,94,0.9)',
                  flexShrink: 0,
                }} />
                <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>{name}</span>
                <span style={{ fontSize: 12, color: T_MUT, marginLeft: 'auto' }}>✓</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT 56% — scanner card (centred) ──────────────────── */}
      <div style={{
        flex: 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        paddingTop: 80, paddingBottom: 80,
        paddingRight: 100, paddingLeft: 40,
        opacity: cardOp, transform: `translateX(${cardX}px)`,
      }}>
        <div style={{
          width: 460,
          background: SURF,
          border: `1px solid ${BORDER}`,
          borderRadius: 24,
          overflow: 'hidden',
          boxShadow: '-40px 0 120px rgba(0,0,0,0.5)',
          position: 'relative', // needed for verified overlay
        }}>
          {/* Event header */}
          <div style={{
            padding: '20px 26px',
            borderBottom: `1px solid ${BORDER}`,
            background: `rgba(30,94,255,0.04)`,
          }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>
              Rooftop Night — Karachi
            </div>
            <div style={{ fontSize: 13, color: T_MUT, marginTop: 4 }}>
              DHA Phase 5 · Karachi
            </div>
          </div>

          {/* QR code area */}
          <div style={{ padding: '28px 32px' }}>
            <div style={{
              background: '#fff', borderRadius: 16, padding: 18,
              position: 'relative',
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${QR}, 1fr)`,
                gap: 2.5, aspectRatio: '1',
              }}>
                {qrCells.map((on, k) => (
                  <div key={k} style={{
                    background: on ? '#000' : 'transparent',
                    borderRadius: 2,
                  }} />
                ))}
              </div>

              {/* Laser */}
              <div style={{
                position: 'absolute', left: 18, right: 18,
                top: `calc(18px + ${laserY * 0.82}%)`,
                height: 2.5,
                background: `linear-gradient(90deg, transparent, ${BLUE} 15%, ${BLUE} 85%, transparent)`,
                boxShadow: `0 0 16px ${BLUE}`,
                opacity: laserOp,
              }} />
            </div>

            {/* Guest label */}
            <div style={{ marginTop: 20, textAlign: 'center' as const }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Ayesha Farooq</p>
              <p style={{ fontSize: 12, color: T_MUT, marginTop: 4 }}>
                #TK-00187 · General Admission
              </p>
            </div>
          </div>

          {/* Check-in count footer */}
          <div style={{
            padding: '16px 26px',
            borderTop: `1px solid ${BORDER}`,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ fontSize: 13, color: T_MUT }}>Checked in</span>
            <span style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>
              {count} <span style={{ fontSize: 13, color: T_MUT }}>/ 120</span>
            </span>
          </div>

          {/* VERIFIED overlay */}
          <div style={{
            position: 'absolute', inset: 0, borderRadius: 24,
            background: 'rgba(34,197,94,0.06)',
            border: '2px solid rgba(34,197,94,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: verOp,
            transform: `scale(${0.94 + verSp * 0.06})`,
          }}>
            <div style={{ textAlign: 'center' as const }}>
              <div style={{ fontSize: 56 }}>✅</div>
              <div style={{
                fontSize: 28, fontWeight: 900, color: GREEN,
                letterSpacing: '-0.5px', marginTop: 10,
              }}>VERIFIED</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>
                Ayesha Farooq
              </div>
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  )
}
