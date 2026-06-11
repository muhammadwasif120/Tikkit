// LEFT 44% — headline text (paddingLeft 140, vertically centred)
// RIGHT 56% — create-event form panel (no sidebar, clean card)
import React from 'react'
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { BG, SURF, BLUE, BLUE_D, GREEN, BORDER, T_MUT } from '../components/DashboardShell'

const NAME = 'Rooftop Night — DHA Karachi'

// Label + input field pair
function Field({
  label, children, borderColor = BORDER,
}: { label: string; children: React.ReactNode; borderColor?: string }) {
  return (
    <div>
      <div style={{
        fontSize: 11, fontWeight: 700, color: T_MUT,
        letterSpacing: '0.14em', textTransform: 'uppercase' as const,
        marginBottom: 9,
      }}>{label}</div>
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        border: `1px solid ${borderColor}`,
        borderRadius: 11, padding: '14px 20px',
        fontSize: 17, color: 'rgba(255,255,255,0.5)',
        display: 'flex', alignItems: 'center', minHeight: 54,
      }}>{children}</div>
    </div>
  )
}

export const SceneCreate: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const exitOp = interpolate(frame, [80, 90], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  // ── Left text ────────────────────────────────────────────────────
  const headOp = interpolate(frame, [0, 5], [0, 1], { extrapolateRight: 'clamp' })
  const headY  = interpolate(frame, [0, 6], [14, 0], { extrapolateRight: 'clamp' })
  const subOp  = interpolate(frame, [44, 54], [0, 1], { extrapolateRight: 'clamp' })

  // ── Right panel ──────────────────────────────────────────────────
  const panelSp = spring({ frame: Math.max(0, frame - 4), fps, config: { damping: 20, stiffness: 180 }, durationInFrames: 28 })
  const panelX  = interpolate(panelSp, [0, 1], [80, 0])
  const panelOp = interpolate(frame, [4, 12], [0, 1], { extrapolateRight: 'clamp' })

  // Typewriter — starts at f10, 3 chars/frame
  const chars = Math.min(NAME.length, Math.floor(Math.max(0, frame - 10) * 3))
  const typed = NAME.slice(0, chars)
  const cursor = chars < NAME.length && Math.floor(frame / 5) % 2 === 0

  // Capacity counts up
  const cap = Math.min(120, Math.floor(Math.max(0, frame - 28) * 8))

  // Go Live → LIVE transition
  const btnOp  = interpolate(frame, [52, 62], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const liveF  = Math.max(0, frame - 62)
  const liveSp = spring({ frame: liveF, fps, config: { damping: 7, stiffness: 500 }, durationInFrames: 14 })
  const liveOp = interpolate(liveF, [0, 4], [0, 1], { extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill style={{ opacity: exitOp, background: BG, display: 'flex', alignItems: 'stretch' }}>

      {/* ── LEFT 44% — headline ─────────────────────────────────── */}
      <div style={{
        width: '44%', flexShrink: 0,
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        paddingLeft: 140, paddingRight: 60,
      }}>
        <p style={{
          fontSize: 13, fontWeight: 700, letterSpacing: '0.22em',
          textTransform: 'uppercase' as const, color: BLUE,
          marginBottom: 22, opacity: headOp,
        }}>Create</p>

        <h2 style={{
          fontSize: 100, fontWeight: 900, color: '#fff',
          lineHeight: 0.88, letterSpacing: '-4px',
          marginBottom: 32,
          opacity: headOp, transform: `translateY(${headY}px)`,
        }}>
          Live in<br />two<br />minutes.
        </h2>

        <p style={{
          fontSize: 20, color: 'rgba(255,255,255,0.28)',
          lineHeight: 1.6, letterSpacing: '-0.3px',
          opacity: subOp,
        }}>
          Name it. Set capacity.<br />
          Share the link. Go live.
        </p>
      </div>

      {/* ── RIGHT 56% — form card ───────────────────────────────── */}
      <div style={{
        flex: 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        paddingTop: 64, paddingBottom: 64, paddingRight: 80, paddingLeft: 40,
        opacity: panelOp, transform: `translateX(${panelX}px)`,
      }}>
        <div style={{
          width: '100%', maxWidth: 740,
          background: SURF,
          border: `1px solid ${BORDER}`,
          borderRadius: 22,
          padding: '36px 40px',
          display: 'flex', flexDirection: 'column', gap: 20,
          boxShadow: '-40px 0 120px rgba(0,0,0,0.5)',
        }}>
          {/* Card header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            paddingBottom: 20, borderBottom: `1px solid ${BORDER}`,
          }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>New Event</span>
            <span style={{
              fontSize: 11, fontWeight: 700, color: BLUE_D,
              background: `${BLUE}14`, border: `1px solid ${BLUE}30`,
              padding: '4px 12px', borderRadius: 8, letterSpacing: '0.08em',
            }}>DRAFT</span>
          </div>

          {/* Event name — with typewriter */}
          <div>
            <div style={{
              fontSize: 11, fontWeight: 700, color: T_MUT,
              letterSpacing: '0.14em', textTransform: 'uppercase' as const,
              marginBottom: 9,
            }}>Event name</div>
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: `1.5px solid ${BLUE}60`,
              borderRadius: 11, padding: '14px 20px',
              fontSize: 20, color: '#fff', fontWeight: 700,
              display: 'flex', alignItems: 'center', minHeight: 56,
            }}>
              {typed}
              {cursor && (
                <span style={{ width: 2, height: 20, background: BLUE, marginLeft: 3, display: 'inline-block' }} />
              )}
            </div>
          </div>

          {/* Capacity + Access */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Field label="Capacity" borderColor={cap > 0 ? `${BORDER}` : BORDER}>
              <span style={{ color: cap > 0 ? '#fff' : 'transparent', fontWeight: 700 }}>
                {cap > 0 ? cap : '—'}
              </span>
            </Field>
            <Field label="Access">Invite only</Field>
          </div>

          {/* Date + Location */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Field label="Date">Sat 22 Mar 2026</Field>
            <Field label="Location">DHA Phase 5, Karachi</Field>
          </div>

          {/* Go Live / LIVE button */}
          <div style={{ position: 'relative', height: 58, marginTop: 4 }}>
            {/* Go Live */}
            <div style={{
              position: 'absolute', inset: 0, borderRadius: 13,
              background: BLUE, boxShadow: `0 0 28px ${BLUE}50`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, fontWeight: 800, color: '#fff',
              opacity: btnOp,
            }}>
              Go Live →
            </div>
            {/* LIVE */}
            <div style={{
              position: 'absolute', inset: 0, borderRadius: 13,
              background: 'rgba(34,197,94,0.07)',
              border: '1.5px solid rgba(34,197,94,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
              opacity: liveOp,
              transform: `scale(${0.96 + liveSp * 0.04})`,
            }}>
              <div style={{
                width: 10, height: 10, borderRadius: '50%',
                background: GREEN, boxShadow: '0 0 10px rgba(34,197,94,1)',
              }} />
              <span style={{ fontSize: 16, fontWeight: 800, color: GREEN }}>
                LIVE — Rooftop Night, Karachi
              </span>
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  )
}
