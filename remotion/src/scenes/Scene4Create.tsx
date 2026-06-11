import React from 'react'
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { BG, SURF, BLUE, BLUE_DIM, GREEN, YELLOW, BORDER, TEXT_MUT, DashShell } from '../components/DashboardShell'

const EVENT_NAME = 'Rooftop Night — DHA Karachi'

export const SceneCreate: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const exitOp = interpolate(frame, [80, 90], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  // Dashboard fades in
  const dashOp = interpolate(frame, [0, 6], [0, 1], { extrapolateRight: 'clamp' })

  // Typewriter — fast
  const charCount = Math.min(EVENT_NAME.length, Math.floor(Math.max(0, frame - 6) * 3.5))
  const typed = EVENT_NAME.slice(0, charCount)

  // Capacity types
  const cap = Math.min(120, Math.floor(Math.max(0, frame - 28) * 9))

  // "Go Live" button opacity → "LIVE" state
  const btnOp = interpolate(frame, [54, 64], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const liveF  = Math.max(0, frame - 64)
  const liveS  = spring({ frame: liveF, fps, config: { damping: 7, stiffness: 480 }, durationInFrames: 14 })
  const liveOp = interpolate(liveF, [0, 4], [0, 1], { extrapolateRight: 'clamp' })

  // Left callout
  const textOp = interpolate(frame, [0, 5], [0, 1], { extrapolateRight: 'clamp' })
  const capOp  = interpolate(frame, [52, 60], [0, 1], { extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill style={{ opacity: exitOp, background: BG, display: 'flex' }}>

      {/* LEFT — large anchored callout */}
      <div style={{
        width: '38%', height: '100%',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        paddingLeft: 120, paddingRight: 40,
        flexShrink: 0, position: 'relative', zIndex: 2,
        background: `linear-gradient(to right, ${BG} 70%, transparent)`,
      }}>
        <p style={{
          opacity: textOp,
          fontSize: 13, fontWeight: 700, letterSpacing: '0.22em',
          textTransform: 'uppercase' as const, color: BLUE, marginBottom: 22,
        }}>Create</p>
        <h2 style={{
          opacity: textOp,
          fontSize: 96, fontWeight: 900, color: '#fff',
          lineHeight: 0.88, letterSpacing: '-4px', marginBottom: 28,
        }}>
          Live in<br />two<br />minutes.
        </h2>
        <p style={{
          opacity: capOp,
          fontSize: 19, color: 'rgba(255,255,255,0.28)',
          lineHeight: 1.55, letterSpacing: '-0.3px',
        }}>
          Name it. Set capacity.<br />Share the link. Done.
        </p>
      </div>

      {/* RIGHT — actual dashboard shell with create form */}
      <div style={{ flex: 1, height: '100%', opacity: dashOp, position: 'relative' }}>
        <DashShell active="events">
          {/* Create event form panel */}
          <div style={{
            maxWidth: 800,
            background: SURF,
            border: `1px solid ${BORDER}`,
            borderRadius: 20,
            padding: '36px 40px',
            display: 'flex', flexDirection: 'column', gap: 22,
          }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '-0.5px' }}>New Event</h2>

            {/* Event name */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: TEXT_MUT, letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginBottom: 8 }}>Event name</div>
              <div style={{
                background: 'rgba(255,255,255,0.03)',
                border: `1px solid ${BLUE}55`,
                borderRadius: 10, padding: '14px 18px',
                fontSize: 22, color: '#fff', fontWeight: 700,
                minHeight: 56, display: 'flex', alignItems: 'center',
              }}>
                {typed}
                {charCount < EVENT_NAME.length && (
                  <span style={{ width: 2, height: 22, background: BLUE, marginLeft: 3, opacity: Math.floor(frame / 4) % 2 }} />
                )}
              </div>
            </div>

            {/* Row — Capacity + Access */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                { label: 'Capacity', value: cap > 0 ? String(cap) : '' },
                { label: 'Access',   value: 'Invite only' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: TEXT_MUT, letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginBottom: 8 }}>{label}</div>
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}`, borderRadius: 10, padding: '14px 18px', fontSize: 18, color: 'rgba(255,255,255,0.45)', minHeight: 56, display: 'flex', alignItems: 'center' }}>{value}</div>
                </div>
              ))}
            </div>

            {/* Row — Date + Location */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                { label: 'Date',     value: 'Sat 22 Mar 2026' },
                { label: 'Location', value: 'DHA Phase 5, Karachi' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: TEXT_MUT, letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginBottom: 8 }}>{label}</div>
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}`, borderRadius: 10, padding: '14px 18px', fontSize: 16, color: 'rgba(255,255,255,0.35)', minHeight: 56, display: 'flex', alignItems: 'center' }}>{value}</div>
                </div>
              ))}
            </div>

            {/* Go Live / LIVE button */}
            <div style={{ position: 'relative', height: 60 }}>
              <div style={{
                position: 'absolute', inset: 0,
                background: BLUE, borderRadius: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 17, fontWeight: 800, color: '#fff',
                boxShadow: '0 0 24px rgba(30,94,255,0.35)',
                opacity: btnOp,
              }}>
                Go Live →
              </div>
              <div style={{
                position: 'absolute', inset: 0,
                background: 'rgba(34,197,94,0.08)',
                border: '1.5px solid rgba(34,197,94,0.5)',
                borderRadius: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
                opacity: liveOp,
                transform: `scale(${0.96 + liveS * 0.04})`,
              }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: GREEN, boxShadow: '0 0 12px rgba(34,197,94,1)' }} />
                <span style={{ fontSize: 17, fontWeight: 800, color: GREEN }}>LIVE — Rooftop Night, Karachi</span>
              </div>
            </div>
          </div>
        </DashShell>
      </div>
    </AbsoluteFill>
  )
}
